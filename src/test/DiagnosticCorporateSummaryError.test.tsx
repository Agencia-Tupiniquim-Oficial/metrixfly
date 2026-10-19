import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import DiagnosticPage from "@/features/diagnostics/pages/DiagnosticPage";
import type { DiagnosticPageProps } from "@/features/diagnostics/model/page-props";

const mocks = vi.hoisted(() => ({
  invoke: vi.fn(),
  toast: vi.fn(),
  diagnostic: {
    summary: {
      mobile: { scores: {}, metrics: {} },
      desktop: { scores: {}, metrics: {} },
    },
    improvements: [],
  },
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: mocks.invoke,
    },
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: mocks.toast }),
}));

vi.mock("@/features/diagnostics/state/DiagnosisContext", () => ({
  useDiagnosis: () => ({
    diagnostic: mocks.diagnostic,
    setDiagnostic: vi.fn(),
  }),
}));

vi.mock("@/features/diagnostics/components/DiagnosticExperience", () => ({
  DiagnosticExperience: ({
    fetchBusinessSummary,
  }: Pick<DiagnosticPageProps, "fetchBusinessSummary">) => (
    <button onClick={() => void fetchBusinessSummary()}>
      Gerar versão corporativa
    </button>
  ),
}));

describe("corporate report generation errors", () => {
  beforeEach(() => {
    mocks.invoke.mockReset();
    mocks.toast.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a friendly message when the summary Edge Function fails", async () => {
    mocks.invoke.mockRejectedValueOnce(
      new Error("Edge Function returned a non-2xx status code"),
    );
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const queryClient = new QueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/"]}>
          <DiagnosticPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Gerar versão corporativa" }));

    await waitFor(() => {
      expect(mocks.toast).toHaveBeenCalledWith({
        title: "Não foi possível gerar o relatório",
        description:
          "Ocorreu um erro interno no servidor ao gerar a versão corporativa do relatório. Tente novamente em alguns instantes.",
        variant: "destructive",
      });
    });

    expect(consoleError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Edge Function returned a non-2xx status code",
      }),
    );
  });
});
