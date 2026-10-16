import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import logoColored from "@/assets/logo-colored.png";
import FinancialCalculator from "@/features/financial-calculator/pages/FinancialCalculator";

function renderCalculator(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <FinancialCalculator />
    </MemoryRouter>,
  );
}

describe("FinancialCalculator page", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses diagnostic values and calculates a disclosed monthly estimate", () => {
    renderCalculator(
      "/calculadora-financeira?mobileScore=43&traffic=15000&ticket=250",
    );

    expect(screen.getByRole("img", { name: "Tupiniquim" })).toHaveAttribute(
      "src",
      logoColored,
    );
    expect(
      screen.getByRole("heading", {
        name: "Descubra oportunidades de melhoria para seu site",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("slider", { name: "Visitantes mensais" }),
    ).toHaveAttribute("aria-valuenow", "15000");
    expect(
      screen.getByRole("slider", { name: "Valor médio por conversão" }),
    ).toHaveAttribute("aria-valuenow", "250");
    expect(screen.getByText(/28\.500/)).toBeInTheDocument();
    expect(screen.getByText("~5.700 acessos")).toBeInTheDocument();
    expect(screen.getByText("38%")).toBeInTheDocument();
    expect(
      screen.getByText(/Estimativa baseada em estudos do Google/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Nota mobile PageSpeed: 43\/100\./).tagName).toBe(
      "STRONG",
    );
    expect(
      screen.getByText(
        /não como uma medição real de abandono ou perda financeira/i,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/custo estimado/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        /projeção para 12 meses|prazo estimado para compensar/i,
      ),
    ).not.toBeInTheDocument();
  });

  it("does not show a financial estimate when the diagnostic score is missing", () => {
    renderCalculator("/calculadora-financeira?traffic=15000&ticket=250");

    expect(
      screen.getByText(
        "Execute um diagnóstico PageSpeed para calcular a estimativa.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\/ mês/)).not.toBeInTheDocument();
    expect(
      screen.getByRole("slider", { name: "Visitantes mensais" }),
    ).toHaveAttribute("aria-valuenow", "15000");
    expect(
      screen.getByRole("slider", { name: "Valor médio por conversão" }),
    ).toHaveAttribute("aria-valuenow", "250");
  });

  it("does not use an invalid diagnostic score to calculate an estimate", () => {
    renderCalculator("/calculadora-financeira?mobileScore=invalid");

    expect(
      screen.getByText(
        "Execute um diagnóstico PageSpeed para calcular a estimativa.",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\/ mês/)).not.toBeInTheDocument();
  });
});
