import { fireEvent, render, screen } from "@testing-library/react";
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

describe("DiagnosticPreview report frame", () => {
  const result = {
    scoreAvailability: { mobile: true, desktop: true },
    summary: {
      mobile: {
        scores: { performance: 40, accessibility: 92, bestPractices: 93, seo: 94 },
        metrics: { lcp: "3 s" },
      },
      desktop: {
        scores: { performance: 60, accessibility: 96, bestPractices: 97, seo: 98 },
        metrics: { lcp: "1 s" },
      },
    },
    improvements: [{ title: "Reduzir scripts" }, { title: "Otimizar imagens" }],
  } as unknown as DiagnoseResult;

  function renderFrame(extra: Partial<Parameters<typeof DiagnosticPreview>[0]> = {}) {
    const handlers = {
      setPreviewMode: vi.fn(),
      downloadTechnicalPdf: vi.fn(),
      downloadBusinessPdf: vi.fn(),
      onLoadBusinessSummary: vi.fn().mockResolvedValue(null),
    };
    render(
      <DiagnosticPreview
        url="https://site.test"
        result={result}
        previewMode="view"
        updateImprovement={vi.fn()}
        updateUiuxOverview={vi.fn()}
        downloading={false}
        businessDownloading={false}
        {...handlers}
        {...extra}
      />,
    );
    return handlers;
  }

  it("shows the title, the suggestion count and the technical actions", () => {
    const handlers = renderFrame();

    expect(screen.getByRole("heading", { name: "Relatório do diagnóstico" })).toBeTruthy();
    expect(screen.getByText(/2 sugestões de melhoria/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Baixar PDF técnico" }));
    expect(handlers.downloadTechnicalPdf).toHaveBeenCalledTimes(1);
  });

  it("switches between view and edit with the pressed state", () => {
    const handlers = renderFrame({ previewMode: "edit" });

    expect(screen.getByRole("button", { name: "Editar" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Visualizar" }).getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Visualizar" }));
    expect(handlers.setPreviewMode).toHaveBeenCalledWith("view");
  });

  it("opens the corporate version, loads its summary and downloads it from there", () => {
    const handlers = renderFrame();

    fireEvent.click(screen.getByRole("button", { name: "Versão corporativa" }));
    expect(handlers.onLoadBusinessSummary).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: "Baixar PDF corporativo" }));
    expect(handlers.downloadBusinessPdf).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Voltar ao relatório técnico" }));
    expect(screen.getByRole("button", { name: "Baixar PDF técnico" })).toBeTruthy();
  });
});

describe("DiagnosticPreview closing area", () => {
  const result = {
    scoreAvailability: { mobile: true, desktop: true },
    summary: {
      mobile: {
        scores: { performance: 40, accessibility: 92, bestPractices: 93, seo: 94 },
        metrics: { lcp: "3 s" },
      },
      desktop: {
        scores: { performance: 60, accessibility: 96, bestPractices: 97, seo: 98 },
        metrics: { lcp: "1 s" },
      },
    },
    improvements: [{ title: "Reduzir scripts" }],
  } as unknown as DiagnoseResult;

  it("shows the footer before the quote band and keeps the quote button readable", () => {
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
        footer={<p>Relatório salvo (rodapé)</p>}
      />,
    );

    const footer = screen.getByText("Relatório salvo (rodapé)");
    const band = screen.getByRole("heading", { name: "Quer ajuda para aplicar essas melhorias?" });
    expect(footer.compareDocumentPosition(band) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // On the green band the trigger must not inherit the band's white text.
    const trigger = screen.getByRole("button", { name: "Solicitar orçamento" });
    expect(trigger.className).toContain("text-primary");
    expect(trigger.className).toContain("bg-background");
  });
});
