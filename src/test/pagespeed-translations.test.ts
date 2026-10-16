import { describe, expect, it, vi } from "vitest";
import {
  getPageSpeedAuditTitle,
  isValidPageSpeedTranslation,
  normalizePageSpeedDisplayValue,
  normalizePageSpeedAuditId,
  normalizePageSpeedDescription,
  pageSpeedAuditIdCandidates,
  partitionPageSpeedTranslationRequests,
  resolvePageSpeedAuditTranslations,
  splitPageSpeedTitleSavings,
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
    expect(pageSpeedAuditIdCandidates(["frame-title"])).toEqual(
      expect.arrayContaining(["frame-title", "frame_title", "frame-title-insight"]),
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
    expect(
      normalizePageSpeedAuditId(
        "redirects_audit",
        "Avoid multiple page redirects — Economia estimada de 1,150 ms",
      ),
    ).toBe("redirects");
    expect(
      normalizePageSpeedAuditId(
        "frame-title-insight",
        "<frame> or <iframe> elements do not have a title",
      ),
    ).toBe("frame-title");
    expect(
      normalizePageSpeedAuditId(
        "list-audit",
        "List items (<li>) are not contained within <ul>, <ol> or <menu> parent elements.",
      ),
    ).toBe("list");
    expect(
      normalizePageSpeedAuditId(
        "aria-required-children-insight",
        "[role]s are not contained by their required parent element",
      ),
    ).toBe("aria-required-children");
    expect(
      normalizePageSpeedAuditId("is-on-https-audit", "Does not use HTTPS"),
    ).toBe("is-on-https");
    expect(
      normalizePageSpeedAuditId(
        "autocomplete-audit",
        "`autocomplete` attributes are not used correctly",
      ),
    ).toBe("autocomplete");
    expect(
      normalizePageSpeedAuditId(
        "label-insight",
        "Form elements do not have associated labels",
      ),
    ).toBe("label");
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

  it("reuses translated title and description from the shared audit cache", async () => {
    const translate = vi.fn();
    const result = await resolvePageSpeedAuditTranslations(
      [
        {
          audit_id: "redirects",
          title: "Avoid multiple page redirects",
          description: "Avoid multiple page redirects.",
        },
      ],
      {
        redirects: {
          translated_title: "Evitar vários redirecionamentos de página",
          translated_description:
            "Redirecionamentos múltiplos aumentam o tempo até o carregamento da página.",
        },
        "redirects-audit": {
          translated_title: "Evitar o título de tradução antigo",
        },
      },
      translate,
    );

    expect(translate).not.toHaveBeenCalled();
    expect(result.resolved.redirects).toEqual({
      title: "Evitar vários redirecionamentos de página",
      description:
        "Redirecionamentos múltiplos aumentam o tempo até o carregamento da página.",
    });
  });

  it("requests only missing audit fields and normalizes cache identifiers", async () => {
    const translate = vi.fn(async (requests) => ({
      "frame-title": {
        translated_title: "Adicionar título aos quadros e iframes",
      },
      list: {
        translated_title: "Organizar corretamente os itens de lista",
        translated_description:
          "Itens de lista precisam estar dentro de uma lista ordenada ou não ordenada.",
      },
    }));
    const result = await resolvePageSpeedAuditTranslations(
      [
        {
          audit_id: "frame_title",
          title: "<frame> or <iframe> elements do not have a title",
          description: "Frames must have a title.",
        },
        {
          audit_id: "list",
          title:
            "List items (<li>) are not contained within <ul>, <ol> or <menu> parent elements.",
          description: "List items must have a valid list parent.",
        },
      ],
      {
        "frame-title": {
          translated_description:
            "Quadros incorporados devem ter um título que descreva seu conteúdo.",
        },
      },
      translate,
    );

    expect(translate).toHaveBeenCalledWith(
      expect.arrayContaining([
        {
          audit_id: "frame-title",
          field: "title",
          text: "<frame> or <iframe> elements do not have a title",
        },
        {
          audit_id: "list",
          field: "title",
          text:
            "List items (<li>) are not contained within <ul>, <ol> or <menu> parent elements.",
        },
        {
          audit_id: "list",
          field: "description",
          text: "List items must have a valid list parent.",
        },
      ]),
    );
    expect(result.resolved["frame-title"]).toEqual({
      title: "Adicionar título aos quadros e iframes",
      description:
        "Quadros incorporados devem ter um título que descreva seu conteúdo.",
    });
    expect(result.resolved.list).toEqual({
      title: "Organizar corretamente os itens de lista",
      description:
        "Itens de lista precisam estar dentro de uma lista ordenada ou não ordenada.",
    });
  });

  it("strips dynamic estimated savings before translating and preserves each value", async () => {
    const first = splitPageSpeedTitleSavings(
      "Avoid multiple page redirects — Economia estimada de 380 ms",
    );
    const second = splitPageSpeedTitleSavings(
      "Avoid multiple page redirects — Economia estimada de 1,150 ms",
    );
    const translate = vi.fn(async () => ({
      redirects: {
        translated_title: "Evitar vários redirecionamentos de página",
        translated_description:
          "Redirecionamentos múltiplos aumentam o tempo de carregamento.",
      },
    }));
    const result = await resolvePageSpeedAuditTranslations(
      [
        {
          audit_id: "redirects",
          title: "Avoid multiple page redirects — Economia estimada de 380 ms",
          description: "Avoid multiple page redirects.",
        },
        {
          audit_id: "redirects",
          title: "Avoid multiple page redirects — Economia estimada de 1,150 ms",
          description: "Avoid multiple page redirects.",
        },
      ],
      {},
      translate,
    );

    expect(first.displayValue).toBe("Economia estimada de 380 ms");
    expect(second.displayValue).toBe("Economia estimada de 1,150 ms");
    expect(translate).toHaveBeenCalledTimes(1);
    expect(translate).toHaveBeenCalledWith([
      {
        audit_id: "redirects",
        field: "title",
        text: "Avoid multiple page redirects",
      },
      {
        audit_id: "redirects",
        field: "description",
        text: "Avoid multiple page redirects.",
      },
    ]);
    expect(result.resolved.redirects.title).toBe(
      "Evitar vários redirecionamentos de página",
    );
  });

  it("never returns the source English when OpenRouter fails or returns invalid text", async () => {
    const onError = vi.fn();
    const result = await resolvePageSpeedAuditTranslations(
      [
        {
          audit_id: "autocomplete",
          title: "`autocomplete` attributes are not used correctly",
          description:
            "Autocomplete attributes should be set correctly on form fields.",
        },
      ],
      {},
      async () => {
        throw new Error("OpenRouter unavailable");
      },
      onError,
    );

    expect(onError).toHaveBeenCalledTimes(2);
    expect(result.resolved.autocomplete.title).not.toContain("autocomplete");
    expect(result.resolved.autocomplete.title).toBe(
      "Auditoria do PageSpeed sem tradução disponível",
    );
    expect(result.resolved.autocomplete.description).toBe(
      "A descrição desta auditoria não está disponível em português no momento. Consulte os detalhes técnicos do PageSpeed.",
    );
  });
});
