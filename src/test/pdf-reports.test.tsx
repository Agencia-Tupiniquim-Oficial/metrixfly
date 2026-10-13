// @vitest-environment node

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { describe, expect, it, vi } from "vitest";
import {
  createBusinessReportPdf,
  createDiagnosticReportPdf,
  createGeoAeoReportPdf,
  downloadPdf,
  type GeoReportData,
} from "@/features/diagnostics/services/pdf-reports";
import type { DiagnoseResult } from "@/features/diagnostics/model/diagnose";
import type { BusinessSummary } from "@/features/diagnostics/model/business-report";

vi.mock("@/assets/logo-colored.png", () => ({
  default:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/vV8AAAAASUVORK5CYII=",
}));

const diagnostic: DiagnoseResult = {
  summary: {
    mobile: {
      scores: { performance: 72, accessibility: 91, bestPractices: 88, seo: 96 },
      metrics: { lcp: "2.4 s", cls: "0.02" },
      opportunities: [{ title: "Otimizar imagens", displayValue: "Economize 1 s" }],
    },
    desktop: {
      scores: { performance: 94, accessibility: 98, bestPractices: 95, seo: 99 },
      metrics: { lcp: "1.1 s", cls: "0.01" },
    },
  },
  improvements: [
    {
      title: "Reduzir imagens pesadas",
      description: "As imagens atrasam o carregamento inicial.",
      recommendations: ["Converter imagens para WebP."],
    },
  ],
};

const businessSummary: BusinessSummary = {
  resumo: "Resumo executivo de teste.",
  contexto: "O site pode converter melhor.",
  impactoNegocio: ["Melhor experiência para clientes."],
  prioridades: [
    {
      titulo: "Otimizar imagens",
      porQueImporta: "Imagens pesadas atrasam a página.",
      acao: "Converter imagens para WebP.",
    },
  ],
  proximoPasso: "Começar pelas imagens principais.",
};

const geo: GeoReportData = {
  domain: "exemplo.com.br",
  crawledAt: "2026-10-13T12:00:00.000Z",
  scores: { geo: 81, aeo: 76, technical: 90, authority: 65 },
  stats: { pages: 12, indexedPages: 10, schemaPages: 5, answerPages: 4, words: 1800 },
  visibility: { chatgpt: 62, gemini: null, perplexity: 44 },
  pages: [{ url: "https://exemplo.com.br/", title: "Início", score: 90, issues: [] }],
  findings: [
    {
      severity: "warning",
      title: "Adicionar dados estruturados",
      description: "Há poucas páginas com schema.",
      recommendation: "Incluir schema Organization.",
    },
  ],
  prompts: ["Qual é o melhor fornecedor de exemplo?"],
};

async function readPdfPageItems(
  blob: Blob,
): Promise<{ text: string; y: number }[][]> {
  const document = await getDocument({
    data: new Uint8Array(await blob.arrayBuffer()),
    standardFontDataUrl: new URL(
      "../../node_modules/pdfjs-dist/standard_fonts/",
      import.meta.url,
    ).href,
  }).promise;
  const pages = await Promise.all(
    Array.from({ length: document.numPages }, async (_, index) => {
      const page = await document.getPage(index + 1);
      const content = await page.getTextContent();
      return content.items
        .flatMap((item) =>
          "str" in item ? [{ text: item.str, y: item.transform[5] }] : [],
        );
    }),
  );
  return pages;
}

async function readPdfText(blob: Blob): Promise<string> {
  const pages = await readPdfPageItems(blob);
  return pages
    .flat()
    .map((item) => item.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleUpperCase("pt-BR");
}

describe("PDF reports", () => {
  it("generates a readable technical PDF with diagnostic content", async () => {
    const blob = await createDiagnosticReportPdf("https://www.site.test", diagnostic);

    expect(blob.type).toBe("application/pdf");
    expect(new TextDecoder().decode(await blob.slice(0, 5).arrayBuffer())).toBe("%PDF-");
    const text = await readPdfText(blob);
    expect(text).toContain("SITE.TEST - DIAGNÓSTICO DE SITE");
    expect(text).toContain("REDUZIR IMAGENS PESADAS");
    expect(text).toContain("OTIMIZAR IMAGENS");
    expect(text).toContain("72");
    expect(text).toContain("2.4 S");
  });

  it("does not repeat numbering already present in improvement titles", async () => {
    const numberedDiagnostic: DiagnoseResult = {
      ...diagnostic,
      improvements: [
        { title: "1. Reduzir JavaScript não utilizado" },
        { title: "7. Otimizar imagens pesadas" },
      ],
    };
    const blob = await createDiagnosticReportPdf(
      "https://site.test",
      numberedDiagnostic,
    );
    const text = await readPdfText(blob);

    expect(text).toContain("1. REDUZIR JAVASCRIPT NÃO UTILIZADO");
    expect(text).toContain("2. OTIMIZAR IMAGENS PESADAS");
    expect(text).not.toMatch(/1\.\s+1\./);
    expect(text).not.toMatch(/2\.\s+7\./);
  });

  it("shows the logo header only on the first page of a long report", async () => {
    const longDiagnostic: DiagnoseResult = {
      ...diagnostic,
      improvements: Array.from({ length: 24 }, (_, index) => ({
        title: `Recomendação ${index + 1}`,
        description:
          "Revise a implementação e otimize os recursos da página para melhorar a experiência de navegação em dispositivos móveis e computadores.",
      })),
    };
    const blob = await createDiagnosticReportPdf(
      "https://kalashimarcas.com.br",
      longDiagnostic,
    );
    const pages = await readPdfPageItems(blob);
    const text = pages.flat().map((item) => item.text).join(" ").toLocaleUpperCase("pt-BR");
    const firstPageItems = pages[0];
    const sectionY = firstPageItems.find((item) =>
      item.text.includes("Sugestões de melhoria"),
    )?.y;
    const titleY = Math.min(
      ...firstPageItems
        .filter((item) =>
          /KALASHIMARCAS\.COM\.BR|DIAGNÓSTICO DE|^SITE$/.test(item.text.trim()),
        )
        .map((item) => item.y),
    );

    expect(pages.length).toBeGreaterThan(1);
    expect(text.split("DIAGNÓSTICO E ESTRATÉGIA DIGITAL")).toHaveLength(2);
    expect(sectionY).toBeDefined();
    expect(titleY - sectionY!).toBeGreaterThan(55);
  });

  it("generates a readable executive PDF with the business summary", async () => {
    const blob = await createBusinessReportPdf("https://site.test", businessSummary);

    expect(blob.type).toBe("application/pdf");
    const text = await readPdfText(blob);
    expect(text).toContain("SITE.TEST - RELATÓRIO EXECUTIVO");
    expect(text).toContain("RESUMO EXECUTIVO DE TESTE.");
    expect(text).toContain("PRIORIDADES RECOMENDADAS");
    expect(text).toContain("COMEÇAR PELAS IMAGENS PRINCIPAIS.");
  });

  it("includes GEO/AEO crawl data in the full report PDF", async () => {
    const blob = await createGeoAeoReportPdf("https://exemplo.com.br", diagnostic, geo);

    expect(blob.type).toBe("application/pdf");
    const text = await readPdfText(blob);
    expect(text).toContain("VISIBILIDADE EM BUSCA E IA");
    expect(text).toContain("ADICIONAR DADOS ESTRUTURADOS");
    expect(text).toContain("QUAL É O MELHOR FORNECEDOR DE EXEMPLO?");
    expect(text).toContain("81 /100");
    expect(text).toContain("REDUZIR IMAGENS PESADAS");
  });

  it("downloads a PDF with its supplied .pdf filename", () => {
    const createObjectUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:test");
    const revokeObjectUrl = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    const anchor = {
      href: "",
      download: "",
      style: {},
      click: vi.fn(),
      remove: vi.fn(),
    };
    const documentMock = {
      createElement: vi.fn().mockReturnValue(anchor),
      body: { appendChild: vi.fn() },
    };
    const windowMock = { setTimeout: vi.fn((callback: () => void) => callback()) };
    vi.stubGlobal("document", documentMock);
    vi.stubGlobal("window", windowMock);
    const blob = new Blob(["%PDF-1.7"], { type: "application/pdf" });

    downloadPdf(blob, "site_relatorio.pdf");

    expect(createObjectUrl).toHaveBeenCalledWith(blob);
    expect(anchor.download).toBe("site_relatorio.pdf");
    expect(anchor.href).toBe("blob:test");
    expect(anchor.click).toHaveBeenCalled();
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:test");
    expect(documentMock.body.appendChild).toHaveBeenCalledWith(anchor);
    expect(anchor.remove).toHaveBeenCalled();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });
});
