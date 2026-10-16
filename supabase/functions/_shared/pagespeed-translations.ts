const AUDIT_ID_ALIASES: Record<string, string> = {
  "forced-reflow": "forced-reflow-insight",
  "main-thread-work": "main-thread-work-breakdown",
  "maximum-scale": "meta-viewport",
  "user-scalable": "meta-viewport",
  viewport: "meta-viewport",
  "image-aspect-ratio-audit": "image-aspect-ratio",
  "image-aspect-ratio-insight": "image-aspect-ratio",
  "image-aspect-ratios": "image-aspect-ratio",
  "color-contrast-audit": "color-contrast",
  "color-contrast-insight": "color-contrast",
  "background-foreground-contrast": "color-contrast",
  "target-size-audit": "target-size",
  "target-size-insight": "target-size",
  "touch-target-size": "target-size",
  "tap-targets": "target-size",
  "browser-errors": "errors-in-console",
  "errors-in-console-insight": "errors-in-console",
  "sourcemaps-insight": "sourcemaps",
  "source-maps": "sourcemaps",
  "source-maps-insight": "sourcemaps",
  "missing-source-maps-for-large-first-party-javascript": "sourcemaps",
  "legacy-javascript-insight": "legacy-javascript",
  "definition-list-audit": "definition-list",
  "definition-list-insight": "definition-list",
  "dl-order": "definition-list",
};

const AUDIT_ID_VARIANTS: Record<string, string[]> = {
  "forced-reflow-insight": ["forced-reflow"],
  "meta-viewport": ["maximum-scale", "user-scalable", "viewport"],
  "image-aspect-ratio": [
    "image-aspect-ratio-audit",
    "image-aspect-ratio-insight",
    "image-aspect-ratios",
  ],
  "color-contrast": [
    "color-contrast-audit",
    "color-contrast-insight",
    "background-foreground-contrast",
  ],
  "target-size": [
    "target-size-audit",
    "target-size-insight",
    "touch-target-size",
    "tap-targets",
  ],
  "errors-in-console": ["browser-errors", "errors-in-console-insight"],
  sourcemaps: [
    "source-maps",
    "sourcemaps-insight",
    "source-maps-insight",
    "missing-source-maps-for-large-first-party-javascript",
  ],
  "legacy-javascript": ["legacy-javascript-insight"],
  "definition-list": [
    "definition-list-audit",
    "definition-list-insight",
    "dl-order",
  ],
};

const AUDIT_TITLE_TRANSLATIONS: Record<string, string> = {
  "buttons do not have an accessible name": "Dar um nome acessível aos botões",
  "forced reflow": "Reduzir recálculos forçados do layout",
  "heading elements are not in a sequentially descending order":
    "Organizar os títulos em ordem hierárquica",
  "lcp breakdown": "Detalhamento do LCP",
  "minimize main-thread work":
    "Minimizar o trabalho da linha de execução principal",
  "displays images with incorrect aspect ratio":
    "Exibir imagens com a proporção correta",
  "background and foreground colors do not have a sufficient contrast ratio":
    "Melhorar o contraste entre o texto e o fundo",
  "touch targets do not have sufficient size or spacing":
    "Aumentar o tamanho ou o espaçamento dos alvos de toque",
  "browser errors were logged to the console":
    "Corrigir erros registrados no console do navegador",
  "add source maps to your own javascript":
    "Adicionar mapas de origem ao JavaScript próprio",
  "legacy javascript": "Reduzir JavaScript legado",
  "links do not have a discernible name":
    "Nomear os links de forma compreensível",
  "links do not have discernible names":
    "Nomear os links de forma compreensível",
  "dl s do not contain only properly ordered dt and dd groups script template or div elements":
    "Organizar corretamente as listas de definições",
};

const AUDIT_TRANSLATIONS: Record<
  string,
  { title: string; description: string }
> = {
  "image-aspect-ratio": {
    title: "Exibir imagens com a proporção correta",
    description:
      "Uma ou mais imagens estão sendo exibidas com proporção diferente da proporção original, o que pode distorcer o conteúdo visual.",
  },
  "color-contrast": {
    title: "Melhorar o contraste entre o texto e o fundo",
    description:
      "A combinação de cores do texto e do fundo não oferece contraste suficiente para facilitar a leitura, especialmente para pessoas com baixa visão.",
  },
  "target-size": {
    title: "Aumentar o tamanho ou o espaçamento dos alvos de toque",
    description:
      "Um ou mais elementos interativos são pequenos ou próximos demais, dificultando a seleção precisa em telas sensíveis ao toque.",
  },
  "errors-in-console": {
    title: "Corrigir erros registrados no console do navegador",
    description:
      "O navegador registrou erros durante o carregamento ou a execução da página; investigue as mensagens do console para identificar os recursos afetados.",
  },
  sourcemaps: {
    title: "Adicionar mapas de origem ao JavaScript próprio",
    description:
      "Os arquivos JavaScript próprios não incluem mapas de origem, o que dificulta localizar e corrigir problemas no código publicado.",
  },
  "legacy-javascript": {
    title: "Reduzir JavaScript legado",
    description:
      "Parte do JavaScript entregue foi compilada para navegadores antigos e inclui código que navegadores modernos não precisam, aumentando o download e o processamento.",
  },
  "link-name": {
    title: "Nomear os links de forma compreensível",
    description:
      "Um ou mais links não têm um nome acessível que descreva seu destino para leitores de tela e outras tecnologias assistivas.",
  },
  "definition-list": {
    title: "Organizar corretamente as listas de definições",
    description:
      "Uma ou mais listas de definições contêm elementos fora da ordem esperada. Use grupos de termos e definições em sequência, sem elementos não permitidos entre eles.",
  },
  "button-name": {
    title: "Dar um nome acessível aos botões",
    description:
      "Um ou mais botões não têm um nome acessível que possa ser identificado por leitores de tela e outras tecnologias assistivas.",
  },
  "forced-reflow-insight": {
    title: "Reduzir recálculos forçados do layout",
    description:
      "O JavaScript consulta posições ou dimensões de elementos após mudanças na página, forçando o navegador a recalcular o layout e podendo atrasar a renderização.",
  },
  "main-thread-work-breakdown": {
    title: "Minimizar o trabalho da linha de execução principal",
    description:
      "O navegador gasta tempo excessivo executando JavaScript, recalculando estilos e atualizando o layout da página.",
  },
  "heading-order": {
    title: "Organizar os títulos em ordem hierárquica",
    description:
      "Os títulos da página pulam níveis hierárquicos, dificultando a navegação e a compreensão da estrutura por tecnologias assistivas.",
  },
  "lcp-breakdown": {
    title: "Detalhamento do LCP",
    description:
      "O detalhamento do LCP mostra quanto tempo cada etapa leva até a exibição do maior elemento de conteúdo da página.",
  },
  "meta-viewport": {
    title: "Permitir a ampliação da página em dispositivos móveis",
    description:
      "A configuração da página limita a ampliação em dispositivos móveis por meio de user-scalable=no ou de um maximum-scale restritivo. Remova essa restrição para que as pessoas possam ampliar o conteúdo.",
  },
};

const SAFE_UNAVAILABLE_DESCRIPTION =
  "A descrição desta auditoria não está disponível em português no momento. Consulte os detalhes técnicos do PageSpeed.";

export function normalizePageSpeedAuditId(
  auditId: unknown,
  title?: unknown,
  description?: unknown,
): string {
  const titleText = String(title ?? "");
  if (
    /<dl>['’]?s?\s+do not contain only properly-ordered <dt> and <dd> groups/i.test(
      titleText,
    )
  ) {
    return "definition-list";
  }
  const normalizedTitle = normalizePageSpeedTitle(titleText);
  if (/^displays images with incorrect aspect ratio$/i.test(normalizedTitle)) {
    return "image-aspect-ratio";
  }
  if (
    /^background and foreground colors do not have a sufficient contrast ratio$/i.test(
      normalizedTitle,
    )
  ) {
    return "color-contrast";
  }
  if (
    /^touch targets do not have sufficient size or spacing$/i.test(
      normalizedTitle,
    )
  ) {
    return "target-size";
  }
  if (/^browser errors were logged to the console$/i.test(normalizedTitle)) {
    return "errors-in-console";
  }
  if (
    /^(?:add source maps to your own javascript|missing source maps for large first-party javascript)$/i.test(
      normalizedTitle,
    )
  ) {
    return "sourcemaps";
  }
  if (/^legacy javascript$/i.test(normalizedTitle)) {
    return "legacy-javascript";
  }
  if (/buttons? do not have an accessible name/i.test(titleText)) {
    return "button-name";
  }
  if (/forced reflow/i.test(titleText)) {
    return "forced-reflow-insight";
  }
  if (/heading elements are not in a sequentially-descending order/i.test(titleText)) {
    return "heading-order";
  }
  if (/lcp breakdown/i.test(titleText)) {
    return "lcp-breakdown";
  }
  if (/minimize main-thread work/i.test(titleText)) {
    return "main-thread-work-breakdown";
  }
  if (
    /\b(user-scalable|maximum-scale)\b/i.test(
      `${String(title ?? "")} ${String(description ?? "")}`,
    )
  ) {
    return "meta-viewport";
  }
  const normalized = String(auditId ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
  return AUDIT_ID_ALIASES[normalized] ?? normalized;
}

function normalizePageSpeedTitle(title: string): string {
  return title
    .split(/\s+[—–]\s+/)[0]
    .replace(/\s*-\s*Est(?:imated)?\.?\s+savings\b.*$/i, "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

export function pageSpeedAuditIdCandidates(auditIds: string[]): string[] {
  return [...new Set(
    auditIds.flatMap((auditId) => {
      const normalized = normalizePageSpeedAuditId(auditId);
      return [
        auditId.trim(),
        normalized,
        ...(AUDIT_ID_VARIANTS[normalized] ?? []),
      ].filter(Boolean);
    }),
  )];
}

export function getPageSpeedAuditTitle(
  auditId: unknown,
  title?: unknown,
  description?: unknown,
): string | undefined {
  const normalizedId = normalizePageSpeedAuditId(
    auditId,
    title,
    description,
  );
  const normalizedTitle = normalizePageSpeedTitle(String(title ?? ""));
  return (
    AUDIT_TRANSLATIONS[normalizedId]?.title ??
    AUDIT_TITLE_TRANSLATIONS[normalizedTitle]
  );
}

export function normalizePageSpeedDisplayValue(
  displayValue: string | undefined,
): string | undefined {
  return displayValue
    ?.replace(/\b(?:Est|Estimated)\s+savings\s+of\b/gi, "Economia estimada de")
    .replace(/\bPotential savings of\b/gi, "Economia potencial de");
}

export function isLikelyEnglishPageSpeedText(
  auditId: unknown,
  text: string | undefined,
): boolean {
  if (!text?.trim()) return false;

  const normalizedId = normalizePageSpeedAuditId(auditId);
  if (
    normalizedId === "button-name" &&
    /\b(buttons?|accessible name|discernible name)\b/i.test(text)
  ) {
    return true;
  }
  if (normalizedId === "forced-reflow-insight" && /\bforced reflow\b/i.test(text)) {
    return true;
  }
  if (normalizedId === "meta-viewport") {
    const hasEnglishPhrase =
      /\b(the viewport|users? (?:cannot|can't|are unable)|maximum-scale is|user-scalable is|prevent users from zooming)\b/i.test(
        text,
      );
    if (hasEnglishPhrase) return true;
  }
  if (
    /\b(?:displays images with incorrect aspect ratio|incorrect aspect ratio|sufficient contrast ratio|touch targets|sufficient size or spacing|browser errors|logged to the console|add source maps|missing source maps|your own javascript|legacy javascript|(?:estimated|est)\s+savings of)\b/i.test(
      text,
    )
  ) {
    return true;
  }

  const hasEnglishWords =
    /\b(the|and|to|for|use|using|with|in|on|of|is|are|you|your|this|that|will|can|should|does|do not|when|occurs|does not|prevents|prevent|allow|allows)\b/i.test(
      text,
    );
  const hasPortugueseWords =
    /\b(para|com|dos|das|no|na|por|pelo|pela|uma|um|não|se|que|uma|este|esta|página|botão|descrição|ampliação|recalcular)\b/i.test(
      text,
    );
  return hasEnglishWords && !hasPortugueseWords;
}

function isLikelyPortuguesePageSpeedText(text: string): boolean {
  return (
    /[áàâãéêíóôõúç]/i.test(text) ||
    /\b(para|com|dos|das|não|uma|está|são|página|botão|descrição|carregamento|conteúdo|recursos|navegador|reduzir|melhorar|evitar|remover|legado|acessível|dispositivos|usuários|tecnologias|permitir|ampliar)\b/i.test(
      text,
    )
  );
}

export function isValidPageSpeedTranslation(
  auditId: unknown,
  sourceText: string,
  translatedText: unknown,
): translatedText is string {
  if (typeof translatedText !== "string" || !translatedText.trim()) {
    return false;
  }
  return (
    !isLikelyEnglishPageSpeedText(auditId, translatedText) &&
    isLikelyPortuguesePageSpeedText(translatedText)
  );
}

export function partitionPageSpeedTranslationRequests(
  items: Array<{ audit_id: string; text: string }>,
  cachedTranslations: Record<string, string>,
): {
  translations: Record<string, string>;
  missing: Array<{ audit_id: string; text: string }>;
} {
  const normalizedCache = new Map(
    Object.entries(cachedTranslations).map(([auditId, translation]) => [
      normalizePageSpeedAuditId(auditId),
      translation,
    ]),
  );
  const translations: Record<string, string> = {};
  const missing: Array<{ audit_id: string; text: string }> = [];
  const visitedAuditIds = new Set<string>();

  for (const item of items) {
    const auditId = normalizePageSpeedAuditId(item.audit_id);
    if (!auditId || !item.text || visitedAuditIds.has(auditId)) continue;
    visitedAuditIds.add(auditId);

    const cachedTranslation = normalizedCache.get(auditId);
    if (
      cachedTranslation &&
      isValidPageSpeedTranslation(auditId, item.text, cachedTranslation)
    ) {
      translations[auditId] = cachedTranslation.trim();
    } else {
      missing.push({ audit_id: auditId, text: item.text });
    }
  }

  return { translations, missing };
}

export function normalizePageSpeedDescription(
  auditId: unknown,
  sourceText: string | undefined,
  translatedText: unknown,
): string {
  const normalizedId = normalizePageSpeedAuditId(auditId);
  const candidate =
    typeof translatedText === "string" ? translatedText.trim() : "";

  if (isValidPageSpeedTranslation(normalizedId, sourceText ?? "", candidate)) {
    return candidate;
  }

  const knownTranslation = AUDIT_TRANSLATIONS[normalizedId]?.description;
  if (knownTranslation) return knownTranslation;

  if (
    sourceText?.trim() &&
    isLikelyPortuguesePageSpeedText(sourceText) &&
    !isLikelyEnglishPageSpeedText(normalizedId, sourceText)
  ) {
    return sourceText.trim();
  }

  return SAFE_UNAVAILABLE_DESCRIPTION;
}

export function isPageSpeedTranslationPriorityAudit(
  auditId: unknown,
  title: unknown,
  description: unknown,
): boolean {
  const normalizedId = normalizePageSpeedAuditId(auditId);
  if (
    normalizedId === "button-name" ||
    normalizedId === "forced-reflow-insight" ||
    normalizedId === "meta-viewport"
  ) {
    return true;
  }
  return /\b(user-scalable|maximum-scale)\b/i.test(
    `${String(title ?? "")} ${String(description ?? "")}`,
  );
}
