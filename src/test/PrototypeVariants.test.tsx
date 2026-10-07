import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DiagnosisProvider } from "@/context/DiagnosisContext";
import Index from "@/pages/Index";

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
          <Index />
        </MemoryRouter>
      </DiagnosisProvider>
    </QueryClientProvider>
  );
}

describe("UI Prototype Variants for Diagnostic / Landing", () => {
  it("renders Variant A by default on root route with clean spacious layout", () => {
    renderWithProviders(["/"]);
    expect(screen.getByText(/Variante A: Foco em Decisão Executiva/)).toBeDefined();
    expect(screen.getByText("Cole o link.")).toBeDefined();
    expect(screen.getByText("Diagnosticar")).toBeDefined();
    expect(screen.getByText("Geo/AEO")).toBeDefined();
  });

  it("renders Variant B when variant=B param is set with clean tabbed layout", () => {
    renderWithProviders(["/?variant=B"]);
    expect(
      screen.getByText(/Variante B: Abas Espaçosas & Foco Organizado/)
    ).toBeDefined();
    expect(screen.getByText("Auditoria em")).toBeDefined();
  });

  it("renders Variant C when variant=C param is set with storyline layout", () => {
    renderWithProviders(["/?variant=C"]);
    expect(
      screen.getByText(/Variante C: Storyboard com Calculadora de Negócio/)
    ).toBeDefined();
    expect(screen.getByText("Diagnóstico &")).toBeDefined();
  });

  it("allows switching variants and toggling demo data via PrototypeSwitcher", () => {
    renderWithProviders(["/"]);

    const demoButton = screen.getByTitle(
      "Alternar dados de exemplo para avaliar o design populado"
    );
    expect(demoButton).toBeDefined();
    fireEvent.click(demoButton);

    // After loading demo data, executive panel, mobile score, and preview should appear
    expect(screen.getByText("Painel de Decisão Comercial")).toBeDefined();
    expect(screen.getByText("📱 Desempenho Mobile")).toBeDefined();
    expect(screen.getByText("Preview do relatório técnico  (.docx)")).toBeDefined();
  });
});
