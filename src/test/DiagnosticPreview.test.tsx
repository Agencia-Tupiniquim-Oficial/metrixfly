import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DiagnosticPreview from "@/features/diagnostics/components/DiagnosticPreview";
import type { DiagnoseResult } from "@/features/diagnostics/model/diagnose";

const optimizedResult: DiagnoseResult = {
  scoreAvailability: { mobile: true, desktop: true },
  summary: {
    mobile: {
      scores: { performance: 91, accessibility: 92, bestPractices: 93, seo: 94 },
      metrics: { lcp: "1.2 s" },
      opportunities: [{ title: "Otimizar imagem abaixo da dobra" }],
    },
    desktop: {
      scores: { performance: 95, accessibility: 96, bestPractices: 97, seo: 98 },
      metrics: { lcp: "0.8 s" },
    },
  },
  improvements: [{ title: "Reduzir scripts" }],
  uiux: { recommendations: ["Simplificar a navegação"] },
};

describe("DiagnosticPreview", () => {
  it("shows the optimized status and hides detailed report recommendations", () => {
    render(
      <DiagnosticPreview
        url="https://site.test"
        result={optimizedResult}
        previewMode="view"
        setPreviewMode={vi.fn()}
        updateImprovement={vi.fn()}
        updateUiuxOverview={vi.fn()}
        downloadTechnicalPdf={vi.fn()}
        downloading={false}
        onSubmitQuoteRequest={vi.fn().mockResolvedValue(undefined)}
        downloadBusinessPdf={vi.fn()}
        businessDownloading={false}
      />,
    );

    expect(screen.getByRole("heading", { name: "Seu site está otimizado!" })).toBeTruthy();
    expect(screen.getByText(/Todas as notas de desempenho estão acima de 90/)).toBeTruthy();
    expect(screen.getByRole("button", { name: /Baixar resultado do diagnóstico em PDF/ })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Solicitar orçamento" })).toBeTruthy();
    expect(screen.queryByText("Relatório técnico")).toBeNull();
    expect(screen.queryByText("Reduzir scripts")).toBeNull();
    expect(screen.queryByText("Otimizar imagem abaixo da dobra")).toBeNull();
    expect(screen.queryByText("Simplificar a navegação")).toBeNull();
  });
});
