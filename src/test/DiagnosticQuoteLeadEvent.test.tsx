import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DiagnosticPage from "@/features/diagnostics/pages/DiagnosticPage";
import type { DiagnosticPageProps } from "@/features/diagnostics/model/page-props";

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
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
  }: Pick<DiagnosticPageProps, "sendQuoteRequest">) => (
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
  });

  it("does not fire when the function does not confirm success", async () => {
    mocks.invoke.mockResolvedValueOnce({ data: { success: false }, error: null });

    renderPage();

    await waitFor(() => expect(mocks.invoke).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expect(testWindow.dataLayer).toEqual([]);
  });
});
