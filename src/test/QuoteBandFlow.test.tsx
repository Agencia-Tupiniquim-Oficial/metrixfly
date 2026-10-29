import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { sampleDiagnosticResult } from "@/features/diagnostics/demo/diagnosticMock";
import { DiagnosisProvider } from "@/features/diagnostics/state/DiagnosisContext";
import DiagnosticPage from "@/features/diagnostics/pages/DiagnosticPage";
import QuoteBandAction from "@/features/diagnostics/components/QuoteBandAction";

const mocks = vi.hoisted(() => ({
  sendQuoteRequest: vi.fn((..._args: unknown[]) => Promise.resolve()),
  recordQuoteDialogOpen: vi.fn(),
  submitReportLead: vi.fn((..._args: unknown[]) => Promise.resolve()),
  runDiagnosticWithProgress: vi.fn((..._args: unknown[]) => new Promise(() => {})),
}));

vi.mock("@/lib/geo-crawl-cache", () => ({
  startGeoCrawl: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/features/diagnostics/hooks/use-quote-request", () => ({
  useQuoteRequest: () => ({
    sendQuoteRequest: mocks.sendQuoteRequest,
    recordQuoteDialogOpen: mocks.recordQuoteDialogOpen,
    quoteSending: false,
  }),
}));

vi.mock("@/features/diagnostics/services/report-lead", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/diagnostics/services/report-lead")>()),
  submitReportLead: mocks.submitReportLead,
}));

vi.mock("@/features/diagnostics/services/diagnose-site", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/diagnostics/services/diagnose-site")>()),
  runDiagnosticWithProgress: mocks.runDiagnosticWithProgress,
}));

function Destination() {
  const location = useLocation();
  const state = location.state as { openQuote?: boolean } | null;
  return <p>{`destino:${location.pathname}:${state?.openQuote ? "abre-orcamento" : "normal"}`}</p>;
}

function renderBand() {
  return render(
    <DiagnosisProvider>
      <MemoryRouter initialEntries={["/"]}>
        <Routes>
          <Route path="/" element={<QuoteBandAction location="home" />} />
          <Route path="/diagnostico" element={<Destination />} />
        </Routes>
      </MemoryRouter>
    </DiagnosisProvider>,
  );
}

function fillQuoteForm() {
  fireEvent.change(screen.getByRole("textbox", { name: "Nome" }), { target: { value: "Ana" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Empresa" }), { target: { value: "Loja" } });
  fireEvent.change(screen.getByRole("textbox", { name: "E-mail" }), {
    target: { value: "Ana@Loja.com.br" },
  });
  fireEvent.change(screen.getByRole("textbox", { name: "Telefone" }), {
    target: { value: "11999990000" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Enviar solicitação de orçamento/ }));
}

describe("quote band button", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockClear();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("leads to the diagnostic page, asking for the quote form, when no diagnostic was run", () => {
    renderBand();

    fireEvent.click(screen.getByRole("link", { name: "Solicitar orçamento" }));

    expect(screen.getByText("destino:/diagnostico:abre-orcamento")).toBeInTheDocument();
  });

  it("opens the quote form in place when a diagnostic was already run", async () => {
    sessionStorage.setItem(
      "diagnosis:result",
      JSON.stringify({ ...sampleDiagnosticResult, geo: { domain: "https://loja-exemplo.com.br/" } }),
    );
    renderBand();

    fireEvent.click(await screen.findByRole("button", { name: "Solicitar orçamento" }));

    expect(await screen.findByRole("dialog", { name: "Solicitar orçamento" })).toBeInTheDocument();
    expect(mocks.recordQuoteDialogOpen).toHaveBeenCalledWith("general");

    fillQuoteForm();
    await waitFor(() => expect(mocks.sendQuoteRequest).toHaveBeenCalledTimes(1));
    expect(mocks.sendQuoteRequest.mock.calls[0][0]).toMatchObject({
      name: "Ana",
      company: "Loja",
      email: "Ana@Loja.com.br",
      phone: "11999990000",
    });
  });
});

function renderDiagnosticAskedFromTheBand() {
  mocks.runDiagnosticWithProgress.mockResolvedValue({
    diagnosis: { ...sampleDiagnosticResult, geo: { domain: "loja-exemplo.com.br" } },
    reportId: null,
    persistenceError: null,
  });
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <DiagnosisProvider>
        <MemoryRouter
          initialEntries={[
            { pathname: "/diagnostico", search: "?url=loja-exemplo.com.br", state: { openQuote: true } },
          ]}
        >
          <Routes>
            <Route path="/diagnostico" element={<DiagnosticPage />} />
          </Routes>
        </MemoryRouter>
      </DiagnosisProvider>
    </QueryClientProvider>,
  );
}

describe("quote asked for before the diagnostic", () => {
  beforeEach(() => {
    for (const mock of Object.values(mocks)) mock.mockClear();
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("opens the quote form, not the e-mail popup, as soon as the report is ready", async () => {
    renderDiagnosticAskedFromTheBand();

    expect(await screen.findByRole("dialog", { name: "Solicitar orçamento" })).toBeInTheDocument();
    expect(screen.queryByRole("dialog", { name: "Seu relatório está pronto" })).not.toBeInTheDocument();
    // The report behind the quote form stays blurred and out of reach.
    const report = document.querySelector(".motion-stagger");
    expect(report).toHaveClass("blur-md");
    expect(report).toHaveAttribute("inert");
  });

  it("releases the report with the e-mail of the quote form", async () => {
    renderDiagnosticAskedFromTheBand();
    await screen.findByRole("dialog", { name: "Solicitar orçamento" });

    fillQuoteForm();

    await waitFor(() => expect(mocks.sendQuoteRequest).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mocks.submitReportLead).toHaveBeenCalledTimes(1));
    expect(mocks.submitReportLead.mock.calls[0][0]).toMatchObject({
      email: "ana@loja.com.br",
      domain: "https://loja-exemplo.com.br",
    });
    await waitFor(() =>
      expect(screen.queryByRole("dialog", { name: "Seu relatório está pronto" })).not.toBeInTheDocument(),
    );
    expect(document.querySelector(".motion-stagger")).not.toHaveClass("blur-md");
  });

  it("falls back to the e-mail popup when the quote form is closed without sending", async () => {
    renderDiagnosticAskedFromTheBand();
    await screen.findByRole("dialog", { name: "Solicitar orçamento" });

    fireEvent.keyDown(screen.getByRole("dialog", { name: "Solicitar orçamento" }), {
      key: "Escape",
      code: "Escape",
    });

    expect(
      await screen.findByRole("dialog", { name: "Seu relatório está pronto" }),
    ).toBeInTheDocument();
    expect(mocks.sendQuoteRequest).not.toHaveBeenCalled();
  });
});
