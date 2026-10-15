const AUDIT_ID_ALIASES: Record<string, string> = {
  "forced-reflow": "forced-reflow-insight",
  "main-thread-work": "main-thread-work-breakdown",
  "maximum-scale": "meta-viewport",
  "user-scalable": "meta-viewport",
  viewport: "meta-viewport",
};

const AUDIT_ID_VARIANTS: Record<string, string[]> = {
  "forced-reflow-insight": ["forced-reflow"],
  "meta-viewport": ["maximum-scale", "user-scalable", "viewport"],
};

const AUDIT_TITLE_TRANSLATIONS: Record<string, string> = {
  "buttons do not have an accessible name": "Dar um nome acessível aos botões",
  "forced reflow": "Reduzir recálculos forçados do layout",
  "heading elements are not in a sequentially descending order":
    "Organizar os títulos em ordem hierárquica",
  "lcp breakdown": "Detalhamento do LCP",
  "minimize main-thread work":
    "Minimizar o trabalho da linha de execução principal",
};

const AUDIT_TRANSLATIONS: Record<
  string,
  { title: string; description: string }
> = {
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
  const normalizedTitle = String(title ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
  return (
    AUDIT_TRANSLATIONS[normalizedId]?.title ??
    AUDIT_TITLE_TRANSLATIONS[normalizedTitle]
  );
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
