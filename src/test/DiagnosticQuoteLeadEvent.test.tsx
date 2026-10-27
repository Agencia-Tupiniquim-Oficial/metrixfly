import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DiagnosticPage from "@/features/diagnostics/pages/DiagnosticPage";
import type { DiagnosticPageProps } from "@/features/diagnostics/model/page-props";

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  recordQuoteInterest: vi.fn().mockResolvedValue(undefined),
  diagnostic: {
    summary: {
      mobile: { scores: {}, metrics: {} },
      desktop: { scores: {}, metrics: {} },
    },
    improvements: [],
    geo: { domain: "https://www.exemplo.com.br" },
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: mocks.invoke } },
}));

vi.mock("@/features/diagnostics/services/quote-interest", () => ({
  recordQuoteInterest: mocks.recordQuoteInterest,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

vi.mock("@/features/diagnostics/state/DiagnosisContext", () => ({
  useDiagnosis: () => ({
    diagnostic: mocks.diagnostic,
    setDiagnostic: vi.fn(),
    diagnosticReportId: null,
    setDiagnosticReportId: vi.fn(),
  }),
}));

vi.mock("@/lib/dynamic-import", () => ({
  importPdfReports: async () => ({
    createDiagnosticReportPdf: async () =>
      new Blob(["%PDF-1.4 test"], { type: "application/pdf" }),
  }),
}));

vi.mock("@/features/diagnostics/components/DiagnosticExperience", () => ({
  DiagnosticExperience: ({
    sendQuoteRequest,
    onQuoteDialogOpen,
  }: Pick<DiagnosticPageProps, "sendQuoteRequest" | "onQuoteDialogOpen">) => (
    <>
      <button onClick={() => onQuoteDialogOpen?.("analytics")}>Abrir orçamento</button>
      <button
        onClick={() =>
          void sendQuoteRequest?.({
            "form-name": "form-contato",
            name: "Ana Silva",
            company: "Exemplo Ltda.",
            email: "ana@example.com",
            phone: "+55 41 99999-0000",
          }).catch(() => undefined)
        }
      >
        Enviar orçamento
      </button>
    </>
  ),
}));

type TestWindow = Window & { dataLayer?: Record<string, unknown>[] };
const testWindow = window as TestWindow;

function renderPage() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={["/"]}>
        <DiagnosticPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  fireEvent.click(screen.getByRole("button", { name: "Enviar orçamento" }));
}

describe("generate_lead event for quote requests", () => {
  beforeEach(() => {
    mocks.invoke.mockReset();
    mocks.recordQuoteInterest.mockClear();
    testWindow.dataLayer = [];
  });

  afterEach(() => {
    delete testWindow.dataLayer;
  });

  it("fires exactly once after the Edge Function confirms the delivery", async () => {
    mocks.invoke.mockResolvedValueOnce({ data: { success: true }, error: null });

    renderPage();

    await waitFor(() => expect(testWindow.dataLayer).toHaveLength(1));
    expect(testWindow.dataLayer?.[0]).toMatchObject({
      event: "generate_lead",
      site_domain: "exemplo.com.br",
    });
    expect(JSON.stringify(testWindow.dataLayer)).not.toContain("ana@example.com");
    expect(mocks.recordQuoteInterest).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "request_submitted",
        domain: "https://www.exemplo.com.br",
      }),
    );
  });

  it("records the dialog opening for the analyzed company", () => {
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "Abrir orçamento" }));

    expect(mocks.recordQuoteInterest).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: "dialog_opened",
        domain: "https://www.exemplo.com.br",
        serviceInterest: "analytics",
      }),
    );
  });

  it("does not fire when the function returns an error", async () => {
    mocks.invoke.mockResolvedValueOnce({
      data: null,
      error: new Error("Edge Function returned a non-2xx status code"),
    });

    renderPage();

    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expect(testWindow.dataLayer).toEqual([]);
    expect(mocks.recordQuoteInterest).not.toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "request_submitted" }),
    );
  });

  it("does not fire when the function does not confirm success", async () => {
    mocks.invoke.mockResolvedValueOnce({ data: { success: false }, error: null });

    renderPage();

    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expect(testWindow.dataLayer).toEqual([]);
  });
});
