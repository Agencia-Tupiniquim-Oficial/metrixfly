import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import BusinessDocxPreview from "@/components/BusinessDocxPreview";
import DiagnosticPreview from "@/components/DiagnosticPreview";
import type { BusinessSummary } from "@/lib/business-report";

const mockSummary: BusinessSummary = {
  resumo: "Resumo executivo do site de teste.",
  contexto: "O site possui boa navegação mas pode melhorar velocidade.",
  impactoNegocio: ["Perda potencial de 10% nas conversões", "Experiência mobile lenta"],
  prioridades: [
    {
      titulo: "Otimizar imagens",
      porQueImporta: "Imagens pesadas atrasam o carregamento.",
      acao: "Comprimir em formato WebP.",
    },
  ],
  proximoPasso: "Iniciar pela compressão das imagens principais.",
};

describe("BusinessDocxPreview", () => {
  it("renders corporate summary sections correctly", () => {
    render(<BusinessDocxPreview url="https://exemplo.com.br" summary={mockSummary} />);

    expect(screen.getByText("EXEMPLO.COM.BR - RELATÓRIO EXECUTIVO")).toBeDefined();
    expect(screen.getByText("Visão geral")).toBeDefined();
    expect(screen.getByText("Resumo executivo do site de teste.")).toBeDefined();
    expect(screen.getByText("O que isso significa para o negócio")).toBeDefined();
    expect(screen.getByText("Perda potencial de 10% nas conversões")).toBeDefined();
    expect(screen.getByText("Otimizar imagens")).toBeDefined();
    expect(screen.getByText("Iniciar pela compressão das imagens principais.")).toBeDefined();
    expect(screen.getByText("Relatório preparado pela Tupiniquim")).toBeDefined();
  });
});

describe("DiagnosticPreview with Corporate Option", () => {
  it("switches to corporate preview and calls onLoadBusinessSummary", () => {
    const onLoad = vi.fn().mockResolvedValue(mockSummary);
    const mockResult = {
      summary: {
        mobile: {
          scores: { performance: 80, accessibility: 90, bestPractices: 85, seo: 95 },
          metrics: { fcp: "1.2s", lcp: "2.5s", tbt: "150ms", cls: "0.01", si: "1.8s" },
        },
        desktop: {
          scores: { performance: 95, accessibility: 95, bestPractices: 90, seo: 95 },
          metrics: { fcp: "0.8s", lcp: "1.2s", tbt: "50ms", cls: "0", si: "1.0s" },
        },
        screenshot: null,
      },
      improvements: [],
    };

    render(
      <DiagnosticPreview
        url="https://exemplo.com.br"
        result={mockResult}
        previewMode="view"
        setPreviewMode={vi.fn()}
        updateImprovement={vi.fn()}
        updateUiuxOverview={vi.fn()}
        downloadDocx={vi.fn()}
        downloading={false}
        downloadBusinessReport={vi.fn()}
        businessDownloading={false}
        businessSummary={null}
        businessLoading={false}
        onLoadBusinessSummary={onLoad}
      />
    );

    // Initial state: full report preview
    expect(screen.getByText("Relatório completo")).toBeDefined();
    expect(screen.getByText("Versão corporativa")).toBeDefined();

    // Click corporate version
    fireEvent.click(screen.getByText("Versão corporativa"));

    expect(onLoad).toHaveBeenCalled();
    expect(screen.getByText("Preview da versão corporativa (.docx)")).toBeDefined();
  });
});
