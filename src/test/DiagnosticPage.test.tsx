import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import logoColored from "@/assets/logo-colored.png";
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
    expect(screen.getByRole("img", { name: "Logo" })).toHaveAttribute(
      "src",
      logoColored,
    );
    expect(
      screen.getByRole("heading", { name: "Diagnóstico & Desempenho" }),
    ).toBeDefined();
    expect(
      screen.getByText(/Analise as notas e métricas do PageSpeed Insights/),
    ).toBeDefined();
    expect(screen.getByText("Cenários de otimização")).toBeDefined();
    expect(
      screen.getByText("Cenários de otimização").closest(".motion-card"),
    ).not.toBeNull();
    expect(screen.getByText("Diagnosticar")).toBeDefined();
    expect(screen.getByText("Geo/AEO")).toBeDefined();
  });

  it("prefills the site address received from the home page", () => {
    renderWithProviders(["/diagnostico?url=exemplo.com.br%2Floja"]);

    expect(screen.getByPlaceholderText("exemplo.com.br")).toHaveValue(
      "exemplo.com.br/loja",
    );
  });

  it("renders a populated diagnostic when demo mode is enabled", () => {
    renderWithProviders(["/?demo=1"]);
    expect(screen.getByText("Boletim de Saúde Digital")).toBeDefined();
    expect(screen.getByText("Pontuação Mobile (Celular)")).toBeDefined();
    expect(screen.getByText("Versão corporativa")).toBeDefined();
    expect(
      screen.getByText("📱 Desempenho Mobile").closest(".motion-card"),
    ).not.toBeNull();
  });

  it("exposes the optimization estimate as a link with its diagnostic parameters", () => {
    renderWithProviders(["/?demo=1"]);
    const estimateLink = screen.getByRole("link", {
      name: "Abrir estimativa de otimização",
    });

    expect(estimateLink).toHaveAttribute(
      "href",
      "/calculadora-financeira?mobileScore=43&traffic=15000&ticket=250",
    );
  });
});
