import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { sampleDiagnosticResult } from "@/features/diagnostics/demo/diagnosticMock";
import { DiagnosisProvider } from "@/features/diagnostics/state/DiagnosisContext";
import DiagnosticPage from "@/features/diagnostics/pages/DiagnosticPage";
import { normalizeLeadEmail } from "@/features/diagnostics/model/report-lead";

const { submitReportLead } = vi.hoisted(() => ({
  submitReportLead: vi.fn((..._args: unknown[]) => Promise.resolve()),
}));

vi.mock("@/lib/geo-crawl-cache", () => ({
  startGeoCrawl: vi.fn(() => Promise.resolve(null)),
}));

vi.mock("@/features/diagnostics/services/report-lead", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/diagnostics/services/report-lead")>()),
  submitReportLead,
}));


function renderSavedReport() {
  sessionStorage.setItem(
    "diagnosis:result",
    JSON.stringify({ ...sampleDiagnosticResult, geo: { domain: "https://loja-exemplo.com.br/" } }),
  );
  return render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <DiagnosisProvider>
        <MemoryRouter initialEntries={["/diagnostico"]}>
          <Routes>
            <Route path="/diagnostico" element={<DiagnosticPage />} />
          </Routes>
        </MemoryRouter>
        <Toaster />
      </DiagnosisProvider>
    </QueryClientProvider>,
  );
}

describe("report e-mail gate", () => {
  beforeEach(() => {
    submitReportLead.mockClear();
    submitReportLead.mockResolvedValue(undefined);
  });

  afterEach(() => {
    sessionStorage.clear();
    localStorage.clear();
  });

  it("blurs the finished report behind a popup that asks for the e-mail", async () => {
    renderSavedReport();

    expect(
      await screen.findByRole("dialog", { name: "Seu relatório está pronto" }),
    ).toBeInTheDocument();
    const report = document.querySelector(".motion-stagger");
    expect(report).toHaveClass("blur-md");
    expect(report).toHaveAttribute("inert");
    expect(report).toHaveAttribute("aria-hidden", "true");
  });

  it("rejects an invalid e-mail without releasing the report", async () => {
    renderSavedReport();
    const input = await screen.findByRole("textbox", { name: "Seu e-mail" });

    fireEvent.change(input, { target: { value: "sem-arroba" } });
    fireEvent.click(screen.getByRole("button", { name: "Ver meu relatório" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Informe um e-mail válido");
    expect(submitReportLead).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("releases the report, records the e-mail with the site", async () => {
    renderSavedReport();
    const input = await screen.findByRole("textbox", { name: "Seu e-mail" });

    fireEvent.change(input, { target: { value: "  Visitante@Exemplo.com.br " } });
    fireEvent.click(screen.getByRole("button", { name: "Ver meu relatório" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(submitReportLead).toHaveBeenCalledWith({
      email: "visitante@exemplo.com.br",
      domain: "https://loja-exemplo.com.br/",
      reportId: null,
    });
    expect(localStorage.length).toBe(0);
    const report = document.querySelector(".motion-stagger");
    expect(report).not.toHaveClass("blur-md");
    expect(report).not.toHaveAttribute("inert");
  });

  it("still releases the report when the e-mail cannot be saved", async () => {
    submitReportLead.mockRejectedValue(new Error("offline"));
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    renderSavedReport();
    const input = await screen.findByRole("textbox", { name: "Seu e-mail" });

    fireEvent.change(input, { target: { value: "visitante@exemplo.com.br" } });
    fireEvent.click(screen.getByRole("button", { name: "Ver meu relatório" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(await screen.findByText(/Não conseguimos registrar o seu e-mail/)).toBeInTheDocument();
  });

  it("asks again on every report, even after an e-mail was given before", async () => {
    localStorage.setItem("metrixfly:report-lead-email", "visitante@exemplo.com.br");
    renderSavedReport();

    expect(await screen.findByRole("dialog", { name: "Seu relatório está pronto" })).toBeInTheDocument();
    expect(document.querySelector(".motion-stagger")).toHaveClass("blur-md");
  });

  it("never asks for an e-mail in demo mode", () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <DiagnosisProvider>
          <MemoryRouter initialEntries={["/diagnostico?demo=1"]}>
            <Routes>
              <Route path="/diagnostico" element={<DiagnosticPage />} />
            </Routes>
          </MemoryRouter>
        </DiagnosisProvider>
      </QueryClientProvider>,
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("Boletim de Saúde Digital")).toBeInTheDocument();
  });
});

describe("normalizeLeadEmail", () => {
  it("trims, lower-cases and rejects malformed addresses", () => {
    expect(normalizeLeadEmail("  Ana@Empresa.com.br ")).toBe("ana@empresa.com.br");
    for (const invalid of ["", "ana", "ana@", "@empresa.com", "ana@empresa", "a na@x.com"]) {
      expect(normalizeLeadEmail(invalid)).toBeNull();
    }
  });
});
