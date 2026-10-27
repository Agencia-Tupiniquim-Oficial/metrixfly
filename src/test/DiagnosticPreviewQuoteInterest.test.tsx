import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import DiagnosticPreview from "@/features/diagnostics/components/DiagnosticPreview";
import type { DiagnoseResult } from "@/features/diagnostics/model/diagnose";

function resultWith(performance: number): DiagnoseResult {
  return {
    scoreAvailability: { mobile: true, desktop: true },
    summary: {
      mobile: {
        scores: { performance, accessibility: 92, bestPractices: 93, seo: 94 },
        metrics: { lcp: "1.2 s" },
      },
      desktop: {
        scores: { performance, accessibility: 96, bestPractices: 97, seo: 98 },
        metrics: { lcp: "0.8 s" },
      },
    },
    improvements: [{ title: "Reduzir scripts" }],
  };
}

function renderPreview(result: DiagnoseResult, onQuoteDialogOpen: () => void) {
  render(
    <DiagnosticPreview
      url="https://site.test"
      result={result}
      previewMode="view"
      setPreviewMode={vi.fn()}
      updateImprovement={vi.fn()}
      updateUiuxOverview={vi.fn()}
      downloadTechnicalPdf={vi.fn()}
      downloading={false}
      downloadBusinessPdf={vi.fn()}
      businessDownloading={false}
      onSubmitQuoteRequest={vi.fn().mockResolvedValue(undefined)}
      onQuoteDialogOpen={onQuoteDialogOpen}
    />,
  );
}

describe("DiagnosticPreview quote interest signal", () => {
  it.each([
    ["optimized diagnostic", 95],
    ["diagnostic with improvements", 40],
  ])("reports the dialog opening for the %s", (_name, performance) => {
    const onQuoteDialogOpen = vi.fn();
    renderPreview(resultWith(performance), onQuoteDialogOpen);

    fireEvent.click(screen.getByRole("button", { name: "Solicitar orçamento" }));

    expect(onQuoteDialogOpen).toHaveBeenCalledTimes(1);
    expect(onQuoteDialogOpen).toHaveBeenCalledWith("general");
  });
});
