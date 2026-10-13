import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DiagnosisProvider } from "@/features/diagnostics/state/DiagnosisContext";
import DiagnosticPage from "@/features/diagnostics/pages/DiagnosticPage";

function renderWithProviders(initialEntries: string[] = ["/"]) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <DiagnosisProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <DiagnosticPage />
        </MemoryRouter>
      </DiagnosisProvider>
    </QueryClientProvider>
  );
}

describe("Diagnostic experience", () => {
  it("renders the diagnostic landing page on the root route", () => {
    renderWithProviders(["/"]);
    expect(screen.getByText(/Impacto Financeiro/)).toBeDefined();
    expect(screen.getByText("Diagnosticar")).toBeDefined();
    expect(screen.getByText("Geo/AEO")).toBeDefined();
  });

  it("renders a populated diagnostic when demo mode is enabled", () => {
    renderWithProviders(["/?demo=1"]);
    expect(screen.getByText("Boletim de Saúde Digital")).toBeDefined();
    expect(screen.getByText("Pontuação Mobile (Celular)")).toBeDefined();
    expect(screen.getByText("Versão corporativa")).toBeDefined();
  });
});
