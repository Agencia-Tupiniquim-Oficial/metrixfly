import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DiagnosticProgress } from "@/features/diagnostics/components/DiagnosticProgress";
import { initialDiagnosticProgress } from "@/features/diagnostics/model/diagnostic-progress";

describe("DiagnosticProgress", () => {
  it("shows pending labels and indeterminate progress before receiving stage updates", () => {
    render(<DiagnosticProgress progress={initialDiagnosticProgress} />);

    expect(screen.getByText("Iniciando a análise do site")).toBeTruthy();
    expect(
      screen.getByText("PageSpeed para dispositivos móveis"),
    ).toBeTruthy();
    expect(screen.getAllByText("Pendente")).toHaveLength(5);
    expect(screen.queryByText(/Decorrido/)).toBeNull();
    expect(screen.queryByLabelText(/Tempo decorrido/)).toBeNull();
    const progressbar = screen.getByRole("progressbar", {
      name: "Progresso indeterminado",
    });
    expect(progressbar).not.toHaveAttribute("aria-valuenow");
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it("reflects confirmed stage progress and keeps in-flight and pending states distinct", () => {
    render(
      <DiagnosticProgress
        progress={{
          ...initialDiagnosticProgress,
          starting: "completed",
          mobile: "running",
        }}
      />,
    );

    const steps = screen.getAllByRole("listitem");
    expect(steps[0]).toHaveTextContent("Concluído");
    expect(steps[1]).toHaveTextContent("Em andamento");
    expect(steps[1]).toHaveAttribute("aria-current", "step");
    expect(steps[1]).toHaveClass("bg-primary/[0.06]");
    expect(steps[0]).not.toHaveAttribute("aria-current");
    expect(steps[2]).toHaveTextContent("Pendente");
    expect(
      screen.getByText(
        "Executando a auditoria de performance para dispositivos móveis.",
      ),
    ).toBeTruthy();

    const progressbar = screen.getByRole("progressbar", {
      name: "Progresso das etapas do diagnóstico",
    });
    expect(progressbar).toHaveAttribute("aria-valuenow", "1");
    expect(progressbar).toHaveAttribute(
      "aria-valuetext",
      "1 de 5 etapas processadas",
    );
    expect(screen.getByText("1 de 5 etapas processadas")).toBeTruthy();
    expect(progressbar.firstElementChild).toHaveStyle({ width: "20%" });
  });

  it("reports failed and fallback stages without labeling them as successful completions", () => {
    render(
      <DiagnosticProgress
        progress={{
          ...initialDiagnosticProgress,
          starting: "completed",
          mobile: "failed",
          desktop: "completed",
          ai: "fallback",
          finalizing: "running",
        }}
      />,
    );

    const steps = screen.getAllByRole("listitem");
    expect(steps[1]).toHaveTextContent("Não concluída");
    expect(steps[2]).toHaveTextContent("Concluído");
    expect(steps[3]).toHaveTextContent("Concluído com alternativa");
    expect(steps[4]).toHaveTextContent("Em andamento");
    expect(steps[1]).not.toHaveTextContent("Concluído");
    expect(
      screen.getByText(
        "Uma das consultas não foi concluída. O diagnóstico continuará com os dados disponíveis.",
      ),
    ).toBeTruthy();
  });
});
