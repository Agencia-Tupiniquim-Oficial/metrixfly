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
  "redirects-audit": "redirects",
  "redirects-insight": "redirects",
  "frame-title-audit": "frame-title",
  "frame-title-insight": "frame-title",
  "list-audit": "list",
  "list-insight": "list",
  "aria-required-children-insight": "aria-required-children",
  "is-on-https-audit": "is-on-https",
  "autocomplete-audit": "autocomplete",
  "autocomplete-insight": "autocomplete",
  "label-audit": "label",
  "label-insight": "label",
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
  redirects: ["redirects-audit", "redirects-insight"],
  "frame-title": ["frame-title-audit", "frame-title-insight", "frame_title"],
  list: ["list-audit", "list-insight"],
  "aria-required-children": [
    "aria-required-children-insight",
    "aria_required_children",
  ],
  "is-on-https": ["is-on-https-audit", "is_on_https"],
  autocomplete: ["autocomplete-audit", "autocomplete-insight"],
  label: ["label-audit", "label-insight"],
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
const SAFE_UNAVAILABLE_TITLE = "Auditoria do PageSpeed sem tradução disponível";

export type PageSpeedTranslationField = "title" | "description";

export type PageSpeedTranslationRequest = {
  audit_id: string;
  field: PageSpeedTranslationField;
  text: string;
};

export type PageSpeedAuditTranslation = {
  translated_title?: unknown;
  translated_description?: unknown;
};

export type ResolvedPageSpeedAuditTranslation = {
  title: string;
  description: string;
};

export function splitPageSpeedTitleSavings(title: string): {
  title: string;
  displayValue?: string;
} {
  const match = title.match(
    /^(.*?)\s*[—–-]\s*((?:estimated|est\.?)\s+savings\s+of|economia\s+(?:estimada|potencial)\s+de)\s+(.+)$/i,
  );
  if (!match) return { title };

  const [, baseTitle, savingsLabel, savingsValue] = match;
  const label = /^economia/i.test(savingsLabel)
    ? savingsLabel
    : "Economia estimada de";
  return {
    title: baseTitle.trim(),
    displayValue: `${label} ${savingsValue.trim()}`,
  };
}

export async function resolvePageSpeedAuditTranslations(
  audits: Array<{
    audit_id: string;
    title: string;
    description: string;
  }>,
  cachedTranslations: Record<
    string,
    PageSpeedAuditTranslation | string | null | undefined
  >,
  translate: (
    requests: PageSpeedTranslationRequest[],
  ) => Promise<Record<string, PageSpeedAuditTranslation>>,
  onError: (
    auditId: string,
    field: PageSpeedTranslationField,
    error: unknown,
  ) => void = (auditId, field, error) => {
    console.warn(
      `PageSpeed translation failed for ${auditId} (${field}):`,
      error,
    );
  },
): Promise<{
  resolved: Record<string, ResolvedPageSpeedAuditTranslation>;
  updates: Record<string, PageSpeedAuditTranslation>;
}> {
  const cache = new Map<string, PageSpeedAuditTranslation>();
  for (const [auditId, entry] of Object.entries(cachedTranslations)) {
    const normalizedId = normalizePageSpeedAuditId(auditId);
    if (!normalizedId) continue;
    if (cache.has(normalizedId) && auditId !== normalizedId) continue;
    cache.set(
      normalizedId,
      typeof entry === "string" ? { translated_description: entry } : entry ?? {},
    );
  }

  const auditSources = new Map<
    string,
    { title: string; description: string }
  >();
  for (const audit of audits) {
    const auditId = normalizePageSpeedAuditId(audit.audit_id, audit.title, audit.description);
    if (!auditId || auditSources.has(auditId)) continue;
    const title = splitPageSpeedTitleSavings(audit.title).title;
    auditSources.set(auditId, { title, description: audit.description });
  }

  const resolved: Record<string, ResolvedPageSpeedAuditTranslation> = {};
  const updates: Record<string, PageSpeedAuditTranslation> = {};
  const requests: PageSpeedTranslationRequest[] = [];

  for (const [auditId, source] of auditSources) {
    const cached = cache.get(auditId) ?? {};
    const localTitle = getPageSpeedAuditTitle(auditId, source.title);
    const cachedTitle =
      typeof cached.translated_title === "string" ? cached.translated_title : "";
    const cachedDescription =
      typeof cached.translated_description === "string"
        ? cached.translated_description
        : "";
    const sourceTitleIsPortuguese =
      isValidPageSpeedTranslation(auditId, source.title, source.title);
    const sourceDescriptionIsPortuguese =
      isValidPageSpeedTranslation(auditId, source.description, source.description);
    const title =
      (cachedTitle &&
      isValidPageSpeedTranslation(auditId, source.title, cachedTitle)
        ? cachedTitle.trim()
        : undefined) ??
      localTitle ??
      (sourceTitleIsPortuguese ? source.title.trim() : undefined);
    const description =
      (cachedDescription &&
      isValidPageSpeedTranslation(auditId, source.description, cachedDescription)
        ? cachedDescription.trim()
        : undefined) ??
      (sourceDescriptionIsPortuguese
        ? source.description.trim()
        : undefined) ??
      (AUDIT_TRANSLATIONS[auditId]?.description
        ? normalizePageSpeedDescription(auditId, source.description, undefined)
        : undefined);

    resolved[auditId] = {
      title: title ?? SAFE_UNAVAILABLE_TITLE,
      description:
        description ?? SAFE_UNAVAILABLE_DESCRIPTION,
    };

    if (!title && source.title.trim()) {
      requests.push({ audit_id: auditId, field: "title", text: source.title });
    }
    if (!description && source.description.trim()) {
      requests.push({
        audit_id: auditId,
        field: "description",
        text: source.description,
      });
    }
  }

  if (requests.length === 0) return { resolved, updates };

  let translations: Record<string, PageSpeedAuditTranslation> = {};
  try {
    translations = await translate(requests);
  } catch (error) {
    for (const request of requests) {
      onError(request.audit_id, request.field, error);
    }
    return { resolved, updates };
  }

  for (const request of requests) {
    const translation = translations[request.audit_id];
    const value =
      request.field === "title"
        ? translation?.translated_title
        : translation?.translated_description;
    if (
      !isValidPageSpeedTranslation(request.audit_id, request.text, value)
    ) {
      onError(
        request.audit_id,
        request.field,
        new Error("OpenRouter did not return a valid Portuguese translation"),
      );
      continue;
    }

    const normalizedTranslation = String(value).trim();
    if (request.field === "title") {
      resolved[request.audit_id].title = normalizedTranslation;
      updates[request.audit_id] = {
        ...updates[request.audit_id],
        translated_title: normalizedTranslation,
      };
    } else {
      resolved[request.audit_id].description = normalizedTranslation;
      updates[request.audit_id] = {
        ...updates[request.audit_id],
        translated_description: normalizedTranslation,
      };
    }
  }

  return { resolved, updates };
}

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
  if (/^avoid multiple page redirects$/i.test(normalizedTitle)) {
    return "redirects";
  }
  if (
    /^frame or iframe elements do not have a title$/i.test(normalizedTitle)
  ) {
    return "frame-title";
  }
  if (
    /^list items li are not contained within ul ol or menu parent elements$/i.test(
      normalizedTitle,
    )
  ) {
    return "list";
  }
  if (
    /^role s are not contained by their required parent element$/i.test(
      normalizedTitle,
    )
  ) {
    return "aria-required-children";
  }
  if (/^does not use https$/i.test(normalizedTitle)) return "is-on-https";
  if (
    /^autocomplete attributes are not used correctly$/i.test(normalizedTitle)
  ) {
    return "autocomplete";
  }
  if (
    /^form elements do not have associated labels$/i.test(normalizedTitle)
  ) {
    return "label";
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
    .replace(/<([^>]*)>/g, " $1 ")
    .replace(/\[([^\]]*)\]/g, " $1 ")
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
        normalized.replace(/-/g, "_"),
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
    /\b(para|com|dos|das|não|uma|está|são|página|botão|descrição|carregamento|conteúdo|recursos|navegador|reduzir|melhorar|evitar|remover|legado|acessível|dispositivos|usuários|tecnologias|permitir|ampliar|organizar|corretamente|ordem|lista|listas|tamanho|rótulo|atributos|elementos|título|títulos|redirecionamentos|página|quadro|quadros|contraste|formulário|campos|seguro|segura)\b/i.test(
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
