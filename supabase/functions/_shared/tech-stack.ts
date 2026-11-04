// Integracao com o Stackfly (deteccao de tecnologias do site).
// Modulo puro, sem imports por URL, para ser usado pela Edge Function e pelo Vitest.
// Contrato da API: docs/research/2026-11-04-stackfly-api.md

export const STACKFLY_DEFAULT_ENDPOINT =
  "https://stackfly.vercel.app/api/v1/stack";
export const STACKFLY_DEFAULT_TIMEOUT_MS = 50_000;

const MAX_TECHNOLOGIES = 60;
const MAX_CATEGORIES_PER_ITEM = 5;
const MAX_TEXT_LENGTH = 80;
const LOW_MOBILE_PERFORMANCE = 50;

export type TechStackItem = {
  name: string;
  categories: string[];
  version: string | null;
  implied: boolean;
};

export type TechStackInsight = {
  title: string;
  description: string;
};

export type TechStack = {
  source: "stackfly";
  analyzedAt: string | null;
  technologies: TechStackItem[];
  insights: TechStackInsight[];
};

export type TechStackFetchResult =
  | { ok: true; stack: DetectedTechStack }
  | { ok: false; error: string };

/** Tecnologias detectadas, antes das recomendacoes (que dependem do PageSpeed). */
export type DetectedTechStack = Omit<TechStack, "insights">;

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const cleanText = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const text = value.replace(/\s+/g, " ").trim();
  if (!text) return null;
  return text.slice(0, MAX_TEXT_LENGTH);
};

const normalizeItem = (value: unknown): TechStackItem | null => {
  if (!isRecord(value)) return null;
  const name = cleanText(value.name);
  if (!name) return null;
  const categories = Array.isArray(value.categories)
    ? value.categories
        .map(cleanText)
        .filter((category): category is string => Boolean(category))
        .slice(0, MAX_CATEGORIES_PER_ITEM)
    : [];
  return {
    name,
    categories,
    version: cleanText(value.version),
    implied: value.implied === true,
  };
};

/** Converte a resposta do Stackfly no formato salvo no relatorio (sem insights). */
export function normalizeStackflyResponse(
  json: unknown,
): DetectedTechStack | null {
  if (!isRecord(json) || !Array.isArray(json.technologies)) return null;

  const seen = new Set<string>();
  const technologies: TechStackItem[] = [];
  for (const raw of json.technologies) {
    const item = normalizeItem(raw);
    if (!item) continue;
    const key = item.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    technologies.push(item);
    if (technologies.length >= MAX_TECHNOLOGIES) break;
  }

  return {
    source: "stackfly",
    analyzedAt: cleanText(json.analyzedAt),
    technologies,
  };
}

const hasCategory = (item: TechStackItem, category: string) =>
  item.categories.some(
    (current) => current.toLowerCase() === category.toLowerCase(),
  );

const isNamed = (item: TechStackItem, name: string) =>
  item.name.toLowerCase() === name.toLowerCase();

const formatList = (items: string[]) =>
  items.length <= 1
    ? items.join("")
    : `${items.slice(0, -1).join(", ")} e ${items[items.length - 1]}`;

const VERSION_SENSITIVE_CATEGORIES = [
  "CMS",
  "WordPress plugins",
  "WordPress themes",
  "Ecommerce",
  "Page builders",
];

/** Recomendacoes por regras fixas a partir das tecnologias detectadas. */
export function buildTechStackInsights(
  technologies: TechStackItem[],
  context: { mobilePerformance?: number | null } = {},
): TechStackInsight[] {
  if (technologies.length === 0) return [];

  const insights: TechStackInsight[] = [];
  const isWordPress = technologies.some((item) => isNamed(item, "WordPress"));

  if (
    isWordPress &&
    !technologies.some((item) => hasCategory(item, "Caching"))
  ) {
    insights.push({
      title: "Cache de páginas não identificado",
      description:
        "O site usa WordPress e não foi detectado um plugin de cache. Um plugin de cache de páginas (como WP Rocket, LiteSpeed Cache ou W3 Total Cache) reduz o tempo de resposta do servidor e acelera o carregamento.",
    });
  }

  if (!technologies.some((item) => hasCategory(item, "CDN"))) {
    insights.push({
      title: "Rede de distribuição de conteúdo (CDN) não identificada",
      description:
        "Não foi detectada uma CDN. Distribuir imagens, scripts e estilos por uma CDN (como Cloudflare) aproxima os arquivos dos visitantes e reduz o tempo de carregamento, principalmente no celular.",
    });
  }

  const builders = technologies
    .filter((item) => hasCategory(item, "Page builders"))
    .map((item) => item.name);
  const mobilePerformance = context.mobilePerformance;
  if (
    builders.length > 0 &&
    typeof mobilePerformance === "number" &&
    Number.isFinite(mobilePerformance) &&
    mobilePerformance < LOW_MOBILE_PERFORMANCE
  ) {
    insights.push({
      title: "Construtor visual pode estar pesando no celular",
      description: `O site usa ${formatList(builders)} e o desempenho no celular está abaixo de ${LOW_MOBILE_PERFORMANCE}. Construtores visuais costumam carregar estilos e scripts extras em todas as páginas; vale revisar widgets não usados, ativar os recursos de otimização do construtor e carregar apenas o necessário.`,
    });
  }

  const exposed = technologies
    .filter(
      (item) =>
        !item.implied &&
        item.version &&
        VERSION_SENSITIVE_CATEGORIES.some((category) =>
          hasCategory(item, category),
        ),
    )
    .map((item) => `${item.name} ${item.version}`);
  if (exposed.length > 0) {
    insights.push({
      title: "Versões de componentes expostas publicamente",
      description: `Foi possível identificar a versão de ${formatList(exposed)} pelo código público do site. Manter esses componentes sempre atualizados e ocultar a versão reduz o risco de ataques direcionados a falhas conhecidas.`,
    });
  }

  return insights;
}

/** Lista curta para os prompts de IA, ex.: "WP Rocket 3.23.3.3 (Caching, WordPress plugins)". */
export function summarizeTechStackForPrompt(
  stack: Pick<TechStack, "technologies"> | null | undefined,
): string[] {
  if (!stack) return [];
  return stack.technologies.map((item) => {
    const name = item.version ? `${item.name} ${item.version}` : item.name;
    return item.categories.length > 0
      ? `${name} (${item.categories.join(", ")})`
      : name;
  });
}

/** Consulta o Stackfly. Nunca lanca: falhas viram `{ ok: false }`. */
export async function fetchTechStack(
  siteUrl: string,
  options: {
    fetch: FetchLike;
    endpoint?: string;
    timeoutMs?: number;
  },
): Promise<TechStackFetchResult> {
  const endpoint = options.endpoint || STACKFLY_DEFAULT_ENDPOINT;
  const timeoutMs =
    options.timeoutMs && options.timeoutMs > 0
      ? options.timeoutMs
      : STACKFLY_DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const separator = endpoint.includes("?") ? "&" : "?";
    const response = await options.fetch(
      `${endpoint}${separator}url=${encodeURIComponent(siteUrl)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      },
    );
    const body: unknown = await response.json().catch(() => null);

    if (!response.ok) {
      const code =
        isRecord(body) && typeof body.code === "string" ? body.code : null;
      return {
        ok: false,
        error: `Stackfly respondeu ${response.status}${code ? ` (${code})` : ""}`,
      };
    }

    const normalized = normalizeStackflyResponse(body);
    if (!normalized) {
      return { ok: false, error: "Stackfly retornou um formato inesperado" };
    }

    return { ok: true, stack: normalized };
  } catch (error) {
    if (controller.signal.aborted) {
      return {
        ok: false,
        error: `Stackfly não respondeu em ${Math.round(timeoutMs / 1000)} s`,
      };
    }
    return {
      ok: false,
      error: `Falha ao consultar o Stackfly: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  } finally {
    clearTimeout(timer);
  }
}
