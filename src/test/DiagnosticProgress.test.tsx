import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DiagnosticProgress } from "@/features/diagnostics/components/DiagnosticProgress";
import { initialDiagnosticProgress } from "@/features/diagnostics/model/diagnostic-progress";

describe("DiagnosticProgress", () => {
  it("shows real stage labels and an indeterminate progress indicator without a percentage", () => {
    render(<DiagnosticProgress progress={initialDiagnosticProgress} />);

    expect(screen.getByText("Iniciando a análise do site")).toBeTruthy();
    expect(
      screen.getByText(
        "Consultando o PageSpeed para dispositivos móveis",
      ),
    ).toBeTruthy();
    expect(
      screen.getByRole("progressbar", { name: "Progresso indeterminado" }),
    ).not.toHaveAttribute("aria-valuenow");
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("shows confirmed completions and does not mark failed requests as complete", () => {
    render(
      <DiagnosticProgress
        progress={{
          ...initialDiagnosticProgress,
          starting: "completed",
          mobile: "completed",
          desktop: "failed",
          ai: "running",
        }}
      />,
    );

    const steps = screen.getAllByRole("listitem");
    expect(steps[1]).toHaveTextContent("Concluída");
    expect(steps[2]).toHaveTextContent("Não concluída");
    expect(steps[2]).not.toHaveTextContent("Concluída");
    expect(
      screen.getByText(
        "Uma das consultas não foi concluída. O diagnóstico continuará com os dados disponíveis.",
      ),
    ).toBeTruthy();
  });
});
