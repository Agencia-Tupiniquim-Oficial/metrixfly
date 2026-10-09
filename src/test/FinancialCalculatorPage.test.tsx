import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import FinancialCalculator from "@/pages/FinancialCalculator";

describe("FinancialCalculator page", () => {
  it("uses diagnostic values as defaults and shows detailed financial estimates", () => {
    render(
      <MemoryRouter
        initialEntries={[
          "/calculadora-financeira?mobileScore=43&traffic=15000&ticket=250",
        ]}
      >
        <FinancialCalculator />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        name: "Calculadora de retorno da otimização",
      }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Taxa de abandono estimada (%)")).toHaveValue(
      38,
    );
    expect(screen.getByLabelText("Visitantes mensais")).toHaveValue(15000);
    expect(screen.getByLabelText("Ticket médio ou valor do lead")).toHaveValue(
      250,
    );
    expect(screen.getByText(/14\.250/)).toBeInTheDocument();
    expect(screen.getByText("ROI estimado em 12 meses")).toBeInTheDocument();
    expect(screen.getByText("Prazo estimado de retorno")).toBeInTheDocument();
  });
});
