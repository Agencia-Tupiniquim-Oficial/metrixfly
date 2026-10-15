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
import {
  isDiagnosticOptimized,
  type DiagnoseResult,
} from "@/features/diagnostics/model/diagnose";
import type { BusinessSummary } from "@/features/diagnostics/model/business-report";
import {
  getPageSpeedAuditTitle,
  normalizePageSpeedDescription,
} from "../../supabase/functions/_shared/pagespeed-translations.ts";

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
): Promise<{ text: string; x: number; y: number; width: number }[][]> {
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
          "str" in item
            ? [{
                text: item.str,
                x: item.transform[4],
                y: item.transform[5],
                width: item.width,
              }]
            : [],
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
  it("requires complete desktop and mobile scores strictly above 90", () => {
    const healthyDiagnostic: DiagnoseResult = {
      ...diagnostic,
      scoreAvailability: { mobile: true, desktop: true },
      summary: {
        mobile: {
          ...diagnostic.summary.mobile,
          scores: { performance: 91, accessibility: 92, bestPractices: 93, seo: 94 },
        },
        desktop: {
          ...diagnostic.summary.desktop,
          scores: { performance: 95, accessibility: 96, bestPractices: 97, seo: 98 },
        },
      },
    };

    expect(isDiagnosticOptimized(healthyDiagnostic)).toBe(true);
    expect(
      isDiagnosticOptimized({
        ...healthyDiagnostic,
        summary: {
          ...healthyDiagnostic.summary,
          desktop: {
            ...healthyDiagnostic.summary.desktop,
            scores: { ...healthyDiagnostic.summary.desktop.scores, seo: 90 },
          },
        },
      }),
    ).toBe(false);
    expect(
      isDiagnosticOptimized({
        ...healthyDiagnostic,
        summary: {
          ...healthyDiagnostic.summary,
          mobile: {
            ...healthyDiagnostic.summary.mobile,
            scores: { ...healthyDiagnostic.summary.mobile.scores, performance: 90 },
          },
        },
      }),
    ).toBe(false);
    expect(
      isDiagnosticOptimized({
        ...healthyDiagnostic,
        scoreAvailability: { mobile: true, desktop: false },
      }),
    ).toBe(false);
    expect(
      isDiagnosticOptimized({
        ...healthyDiagnostic,
        scoreAvailability: undefined,
      }),
    ).toBe(false);
    const incompleteDiagnostic = structuredClone(healthyDiagnostic);
    Reflect.deleteProperty(incompleteDiagnostic.summary.desktop.scores, "accessibility");
    expect(isDiagnosticOptimized(incompleteDiagnostic)).toBe(false);
    expect(
      isDiagnosticOptimized({
        ...healthyDiagnostic,
        summary: {
          ...healthyDiagnostic.summary,
          mobile: {
            ...healthyDiagnostic.summary.mobile,
            scores: {
              ...healthyDiagnostic.summary.mobile.scores,
              performance: Number.NaN,
            },
          },
        },
      }),
    ).toBe(false);
  });

  it("exports an optimized result without technical suggestions", async () => {
    const optimizedDiagnostic: DiagnoseResult = {
      ...diagnostic,
      scoreAvailability: { mobile: true, desktop: true },
      summary: {
        mobile: {
          ...diagnostic.summary.mobile,
          scores: { performance: 91, accessibility: 92, bestPractices: 93, seo: 94 },
        },
        desktop: {
          ...diagnostic.summary.desktop,
          scores: { performance: 95, accessibility: 96, bestPractices: 97, seo: 98 },
        },
      },
      improvements: [{ title: "Recomendação que não deve aparecer" }],
      uiux: { overview: "Análise desnecessária", recommendations: ["Recomendação UI"] },
      extras: [{ title: "Sugestão extra", description: "Conteúdo não aplicável." }],
    };
    const blob = await createDiagnosticReportPdf(
      "https://site.test",
      optimizedDiagnostic,
    );
    const text = await readPdfText(blob);

    expect(text).toContain(
      "SEU SITE ESTÁ OTIMIZADO! TODAS AS NOTAS DE DESEMPENHO ESTÃO ACIMA DE 90.",
    );
    expect(text).toContain("DESKTOP");
    expect(text).toContain("MOBILE");
    expect(text).toContain("91");
    expect(text).toContain("95");
    expect(text).not.toContain("SUGESTÕES DE MELHORIA");
    expect(text).not.toContain("RECOMENDAÇÃO QUE NÃO DEVE APARECER");
    expect(text).not.toContain("ANÁLISE DESNECESSÁRIA");
    expect(text).not.toContain("SUGESTÃO EXTRA");
    expect(text).not.toContain("OTIMIZAR IMAGENS");
  });

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

  it("exports the same normalized Portuguese PageSpeed descriptions", async () => {
    const findings = [
      {
        id: "button-name",
        source: "Buttons do not have an accessible name.",
      },
      {
        id: "forced-reflow-insight",
        source: "Forced reflow occurs when JavaScript queries layout properties.",
      },
      {
        id: "meta-viewport",
        source:
          "The user-scalable setting and maximum-scale can prevent users from zooming.",
      },
    ];
    const normalizedDescriptions = findings.map(({ id, source }) =>
      normalizePageSpeedDescription(id, source, undefined),
    );
    const translatedDiagnostic: DiagnoseResult = {
      ...diagnostic,
      improvements: findings.map(({ id }, index) => ({
        title: getPageSpeedAuditTitle(id) ?? "Melhoria técnica",
        description: normalizedDescriptions[index],
      })),
    };

    const blob = await createDiagnosticReportPdf(
      "https://site.test",
      translatedDiagnostic,
    );
    const text = await readPdfText(blob);

    for (const description of normalizedDescriptions) {
      expect(text).toContain(description.toLocaleUpperCase("pt-BR"));
    }
    expect(text).not.toContain("BUTTONS DO NOT HAVE AN ACCESSIBLE NAME");
    expect(text).not.toContain("FORCED REFLOW OCCURS");
  });

  it("exports the same normalized Portuguese PageSpeed opportunity titles", async () => {
    const sourceTitles = [
      "Forced reflow",
      "Heading elements are not in a sequentially-descending order",
      "Minimize main-thread work",
      "LCP breakdown",
      "Buttons do not have an accessible name",
      '`[user-scalable="no"]` is used in the `<meta name="viewport">` element or the `[maximum-scale]` attribute is less than 5.',
    ];
    const translatedTitles = sourceTitles.map(
      (title) => getPageSpeedAuditTitle("", title) ?? title,
    );
    const translatedDiagnostic: DiagnoseResult = {
      ...diagnostic,
      summary: {
        ...diagnostic.summary,
        mobile: {
          ...diagnostic.summary.mobile,
          opportunities: translatedTitles.map((title) => ({ title })),
        },
      },
    };

    const blob = await createDiagnosticReportPdf(
      "https://site.test",
      translatedDiagnostic,
    );
    const text = await readPdfText(blob);

    for (const title of translatedTitles) {
      expect(text).toContain(title.toLocaleUpperCase("pt-BR"));
    }
    for (const sourceTitle of sourceTitles) {
      expect(text).not.toContain(sourceTitle.toLocaleUpperCase("pt-BR"));
    }
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
    const firstPageItems = pages[0];
    const pageTexts = pages.map((page) =>
      page
        .map((item) => item.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .toLocaleUpperCase("pt-BR"),
    );
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
    expect(pageTexts[0]).toMatch(
      /KALASHIMARCAS\.COM\.BR\s*-\s*DIAGNÓSTICO DE SITE/,
    );
    expect(
      pageTexts.slice(1).some((pageText) =>
        /KALASHIMARCAS\.COM\.BR\s*-\s*DIAGNÓSTICO DE SITE/.test(pageText),
      ),
    ).toBe(false);
    expect(pageTexts[0]).toContain("1. RECOMENDAÇÃO 1");
    expect(pageTexts[0]).toContain("2. RECOMENDAÇÃO 2");
    expect(pageTexts[0]).not.toContain("3. RECOMENDAÇÃO 3");
    expect(pageTexts[1]).toContain("3. RECOMENDAÇÃO 3");
    expect(pageTexts.at(-1)).toContain("PERFORMANCE");
    expect(
      pages.every((page) =>
        page.every(
          (item) =>
            item.x >= 0 &&
            item.x + item.width <= 596 &&
            item.y >= 0 &&
            item.y <= 842,
        ),
      ),
    ).toBe(true);
    expect(sectionY).toBeDefined();
    expect(titleY - sectionY!).toBeGreaterThan(50);
  });

  it("matches the preview's cover, content, and performance page grouping", async () => {
    const report: DiagnoseResult = {
      ...diagnostic,
      improvements: [
        { title: "Primeira melhoria" },
        { title: "Segunda melhoria" },
        { title: "Terceira melhoria" },
        { title: "Quarta melhoria" },
      ],
      uiux: { overview: "Resumo de UI/UX" },
      extras: [{ title: "Sugestão extra", description: "Descrição extra" }],
    };
    const blob = await createDiagnosticReportPdf("https://site.test", report);
    const pages = await readPdfPageItems(blob);
    const pageTexts = pages.map((page) =>
      page
        .map((item) => item.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .toLocaleUpperCase("pt-BR"),
    );

    expect(pageTexts).toHaveLength(3);
    expect(pageTexts[0]).toContain("1. PRIMEIRA MELHORIA");
    expect(pageTexts[0]).toContain("2. SEGUNDA MELHORIA");
    expect(pageTexts[0]).not.toContain("TERCEIRA MELHORIA");
    expect(pageTexts[1]).toContain("3. TERCEIRA MELHORIA");
    expect(pageTexts[1]).toContain("4. QUARTA MELHORIA");
    expect(pageTexts[1]).toContain("RESUMO DE UI/UX");
    expect(pageTexts[1]).toContain("SUGESTÃO EXTRA");
    expect(pageTexts[1]).not.toContain("PERFORMANCE");
    expect(pageTexts[2]).toContain("PERFORMANCE");
    expect(pageTexts[2]).toContain("DESKTOP");
    expect(pageTexts[2]).toContain("MOBILE");

    const desktopScoreXs = ["94", "98", "95", "99"].map((score) => {
      const scoreItem = pages[2].find((item) => item.text === score);
      expect(scoreItem).toBeDefined();
      return scoreItem!.x;
    });
    expect(desktopScoreXs.slice(1).map((x, index) => x - desktopScoreXs[index]))
      .toEqual([
        expect.closeTo(60, 0),
        expect.closeTo(60, 0),
        expect.closeTo(60, 0),
      ]);

    const pdfSource = await blob.text();
    expect(pdfSource).toContain("/Helvetica-Bold");
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
