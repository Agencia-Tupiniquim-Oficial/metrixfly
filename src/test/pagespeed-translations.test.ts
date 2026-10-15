import { describe, expect, it } from "vitest";
import {
  getPageSpeedAuditTitle,
  isValidPageSpeedTranslation,
  normalizePageSpeedAuditId,
  normalizePageSpeedDescription,
  pageSpeedAuditIdCandidates,
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
