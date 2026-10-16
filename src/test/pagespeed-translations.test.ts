import { describe, expect, it } from "vitest";
import {
  getPageSpeedAuditTitle,
  isValidPageSpeedTranslation,
  normalizePageSpeedDisplayValue,
  normalizePageSpeedAuditId,
  normalizePageSpeedDescription,
  pageSpeedAuditIdCandidates,
  partitionPageSpeedTranslationRequests,
} from "../../supabase/functions/_shared/pagespeed-translations.ts";

describe("PageSpeed translations", () => {
  it("translates English Lighthouse titles and partial-translation regressions", () => {
    const examples = [
      ["forced-reflow-insight", "Forced reflow"],
      [
        "heading-order",
        "Heading elements are not in a sequentially-descending order",
      ],
      ["mainthread-work-breakdown", "Minimize main-thread work"],
      ["lcp-breakdown-insight", "LCP breakdown"],
      ["button-name", "Buttons do not have an accessible name"],
      [
        "viewport-audit",
        '`[user-scalable="no"]` is used in the `<meta name="viewport">` element or the `[maximum-scale]` attribute is less than 5.',
      ],
    ] as const;

    for (const [auditId, sourceTitle] of examples) {
      const translatedTitle = getPageSpeedAuditTitle(auditId, sourceTitle);
      expect(translatedTitle, sourceTitle).toBeTruthy();
      expect(translatedTitle).not.toContain(sourceTitle);
    }
    expect(
      getPageSpeedAuditTitle("mainthread-work-breakdown", "Minimize main-thread work"),
    ).toBe("Minimizar o trabalho da linha de execução principal");
  });

  it("normalizes audit identifiers and resolves Lighthouse/cache aliases", () => {
    expect(normalizePageSpeedAuditId(" forced_reflow ")).toBe(
      "forced-reflow-insight",
    );
    expect(
      normalizePageSpeedAuditId(
        "viewport-audit",
        "Viewport configuration",
        "maximum-scale prevents zooming",
      ),
    ).toBe("meta-viewport");
    expect(pageSpeedAuditIdCandidates(["forced-reflow-insight"])).toContain(
      "forced-reflow",
    );
    expect(pageSpeedAuditIdCandidates(["meta-viewport"])).toEqual(
      expect.arrayContaining(["meta-viewport", "maximum-scale", "user-scalable", "viewport"]),
    );
    expect(normalizePageSpeedAuditId("image-aspect-ratio-insight")).toBe(
      "image-aspect-ratio",
    );
    expect(normalizePageSpeedAuditId("color-contrast-audit")).toBe(
      "color-contrast",
    );
    expect(normalizePageSpeedAuditId("target-size-insight")).toBe("target-size");
    expect(normalizePageSpeedAuditId("browser-errors")).toBe("errors-in-console");
    expect(normalizePageSpeedAuditId("source-maps-insight")).toBe("sourcemaps");
    expect(normalizePageSpeedAuditId("legacy-javascript-insight")).toBe(
      "legacy-javascript",
    );
    expect(
      normalizePageSpeedAuditId(
        "definition-list-audit",
        "<dl>'s do not contain only properly-ordered <dt> and <dd> groups, <script>, <template> or <div> elements.",
      ),
    ).toBe("definition-list");
    expect(pageSpeedAuditIdCandidates(["sourcemaps"])).toEqual(
      expect.arrayContaining(["sourcemaps", "source-maps", "source-maps-insight"]),
    );
  });

  it("localizes the reported PageSpeed titles and savings display values", () => {
    const examples = [
      [
        "image-aspect-ratio-insight",
        "Displays images with incorrect aspect ratio",
        "Exibir imagens com a proporção correta",
      ],
      [
        "color-contrast-audit",
        "Background and foreground colors do not have a sufficient contrast ratio.",
        "Melhorar o contraste entre o texto e o fundo",
      ],
      [
        "target-size-insight",
        "Touch targets do not have sufficient size or spacing.",
        "Aumentar o tamanho ou o espaçamento dos alvos de toque",
      ],
      [
        "browser-errors",
        "Browser errors were logged to the console.",
        "Corrigir erros registrados no console do navegador",
      ],
      [
        "source-maps-insight",
        "Add source maps to your own JavaScript",
        "Adicionar mapas de origem ao JavaScript próprio",
      ],
      [
        "legacy-javascript-insight",
        "Legacy JavaScript — Estimativa de economia de 8 KiB",
        "Reduzir JavaScript legado",
      ],
      [
        "user-scalable",
        "Allow users to zoom",
        "Permitir a ampliação da página em dispositivos móveis",
      ],
      [
        "forced-reflow",
        "Forced reflow",
        "Reduzir recálculos forçados do layout",
      ],
      [
        "link-name",
        "Links do not have a discernible name",
        "Nomear os links de forma compreensível",
      ],
      [
        "heading-order",
        "Heading elements are not in a sequentially-descending order",
        "Organizar os títulos em ordem hierárquica",
      ],
      [
        "definition-list-insight",
        "<dl>'s do not contain only properly-ordered <dt> and <dd> groups, <script>, <template> or <div> elements.",
        "Organizar corretamente as listas de definições",
      ],
    ] as const;

    for (const [auditId, sourceTitle, expectedTitle] of examples) {
      expect(getPageSpeedAuditTitle(auditId, sourceTitle)).toBe(expectedTitle);
    }
    expect(normalizePageSpeedDisplayValue("Est savings of 8 KiB")).toBe(
      "Economia estimada de 8 KiB",
    );
  });

  it("uses localized descriptions for missing or invalid cached translations", () => {
    const examples = [
      [
        "image-aspect-ratio",
        "Displays images with incorrect aspect ratio.",
        "proporção original",
      ],
      [
        "color-contrast",
        "Background and foreground colors do not have a sufficient contrast ratio.",
        "contraste suficiente",
      ],
      [
        "target-size",
        "Touch targets do not have sufficient size or spacing.",
        "elementos interativos",
      ],
      [
        "errors-in-console",
        "Browser errors were logged to the console.",
        "O navegador registrou erros",
      ],
      [
        "source-maps",
        "Add source maps to your own JavaScript.",
        "mapas de origem",
      ],
      [
        "legacy-javascript",
        "Avoid serving legacy JavaScript to modern browsers.",
        "JavaScript entregue",
      ],
    ] as const;

    for (const [auditId, sourceDescription, expectedPortuguese] of examples) {
      expect(
        normalizePageSpeedDescription(auditId, sourceDescription, sourceDescription),
      ).toContain(expectedPortuguese);
      expect(
        isValidPageSpeedTranslation(auditId, sourceDescription, sourceDescription),
      ).toBe(false);
    }
  });

  it("reuses valid cached descriptions and requests only missing or invalid entries", () => {
    const result = partitionPageSpeedTranslationRequests(
      [
        {
          audit_id: "color-contrast-audit",
          text: "Background and foreground colors do not have a sufficient contrast ratio.",
        },
        {
          audit_id: "sourcemaps",
          text: "Add source maps to your own JavaScript.",
        },
        {
          audit_id: "legacy-javascript",
          text: "Avoid serving legacy JavaScript to modern browsers.",
        },
      ],
      {
        "color-contrast":
          "A combinação de cores não oferece contraste suficiente para a leitura.",
        sourcemaps: "Add source maps to your own JavaScript.",
      },
    );

    expect(result.translations).toEqual({
      "color-contrast":
        "A combinação de cores não oferece contraste suficiente para a leitura.",
    });
    expect(result.missing).toEqual([
      {
        audit_id: "sourcemaps",
        text: "Add source maps to your own JavaScript.",
      },
      {
        audit_id: "legacy-javascript",
        text: "Avoid serving legacy JavaScript to modern browsers.",
      },
    ]);
  });

  it("uses Portuguese audit-specific fallbacks when translation is missing or English", () => {
    expect(
      normalizePageSpeedDescription(
        "button-name",
        "Buttons do not have an accessible name.",
        null,
      ),
    ).toBe(
      "Um ou mais botões não têm um nome acessível que possa ser identificado por leitores de tela e outras tecnologias assistivas.",
    );
    expect(
      normalizePageSpeedDescription(
        "forced-reflow-insight",
        "Forced reflow occurs when JavaScript queries layout properties.",
        "Forced reflow occurs when JavaScript queries layout properties.",
      ),
    ).toContain("O JavaScript consulta posições ou dimensões");
    expect(
      normalizePageSpeedDescription(
        "meta-viewport",
        "The user-scalable setting and maximum-scale can prevent users from zooming.",
        undefined,
      ),
    ).toContain("A configuração da página limita a ampliação");
  });

  it("replaces untranslatable English with an explicit localized fallback", () => {
    const fallback = normalizePageSpeedDescription(
      "unknown-audit",
      "Fast layout fix",
      "Fast layout fix",
    );

    expect(fallback).toBe(
      "A descrição desta auditoria não está disponível em português no momento. Consulte os detalhes técnicos do PageSpeed.",
    );
    expect(isValidPageSpeedTranslation("unknown-audit", "Source", fallback)).toBe(
      true,
    );
    expect(
      isValidPageSpeedTranslation("unknown-audit", "Source", "Fast layout fix"),
    ).toBe(false);
  });
});
