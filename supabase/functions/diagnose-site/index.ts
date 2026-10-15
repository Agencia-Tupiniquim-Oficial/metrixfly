// @ts-nocheck
import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";
import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import {
  getPageSpeedAuditTitle,
  isLikelyEnglishPageSpeedText,
  isPageSpeedTranslationPriorityAudit,
  isValidPageSpeedTranslation,
  normalizePageSpeedAuditId,
  normalizePageSpeedDescription,
  pageSpeedAuditIdCandidates,
} from "../_shared/pagespeed-translations.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
  Deno.env.get("SUPABASE_ANON_KEY") ??
  "";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// OpenRouter defaults
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const OPENROUTER_API_BASE =
  Deno.env.get("OPENROUTER_API_BASE") ?? "https://openrouter.ai/api";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PAGESPEED = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

async function runPageSpeed(url: string, strategy: "mobile" | "desktop") {
  const params = new URLSearchParams({ url, strategy });
  ["performance", "accessibility", "best-practices", "seo"].forEach((c) =>
    params.append("category", c),
  );
  const apiKey = Deno.env.get("PAGESPEED_API_KEY");
  if (apiKey) params.append("key", apiKey);

  async function safeFetchWithRetries(
    fullUrl: string,
    options: any = {},
    retries = 1,
    backoff = 800,
    perRequestTimeout = Number(
      Deno.env.get("AUDIT_REQUEST_TIMEOUT_MS") || 45000,
    ),
  ) {
    // O PageSpeed Insights costuma levar 15-45s por estratégia (mobile/desktop).
    // Uma única nova tentativa evita transformar uma falha transitória em vários minutos de espera.
    // Erros 429 (rate limit) e 5xx (ex.: "Lighthouse returned error: Something went wrong",
    // que costuma ser transitório) são re-tentados antes de desistir.
    for (let i = 0; i <= retries; i++) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), perRequestTimeout);
      try {
        const res = await fetch(fullUrl, {
          ...options,
          signal: controller.signal,
        });
        clearTimeout(id);
        const isRetryable = res.status === 429 || res.status >= 500;
        if (!isRetryable) return res;
        if (i < retries) {
          console.warn(
            `PageSpeed respondeu ${res.status}, tentando de novo (${i + 1}/${retries})...`,
          );
          await new Promise((r) => setTimeout(r, backoff * (i + 1)));
        } else {
          return res;
        }
      } catch (e) {
        clearTimeout(id);
        // Trata abort/timeout como erro transitório e re-tenta se ainda houver tentativas
        if (i === retries) throw e;
        console.warn(
          `PageSpeed falhou (${e?.message ?? e}), tentando de novo (${i + 1}/${retries})...`,
        );
        await new Promise((r) => setTimeout(r, backoff * (i + 1)));
      }
    }
  }

  let res: Response;
  try {
    res = await safeFetchWithRetries(`${PAGESPEED}?${params}`);
  } catch (e: any) {
    if (e?.name === "AbortError" || /abort/i.test(String(e?.message ?? ""))) {
      throw new Error(
        `PageSpeed Insights (${strategy}) demorou demais para responder e a requisição foi cancelada. Tente novamente ou aumente a secret AUDIT_REQUEST_TIMEOUT_MS.`,
      );
    }
    throw e;
  }
  if (!res.ok) {
    const errBody = await res.json().catch(() => null);
    const googleMsg = errBody?.error?.message as string | undefined;
    if (res.status === 429) {
      throw new Error(
        "Cota diária do PageSpeed Insights esgotada. Adicione a secret PAGESPEED_API_KEY no Supabase (Google Cloud → PageSpeed Insights API).",
      );
    }
    if (res.status === 403) {
      throw new Error(
        googleMsg ??
          "PageSpeed API recusou a requisição. Verifique se a API está ativada e se PAGESPEED_API_KEY é válida.",
      );
    }
    throw new Error(googleMsg ?? `PageSpeed ${strategy} falhou: ${res.status}`);
  }
  const data = await res.json().catch(() => ({}));
  const lr = data?.lighthouseResult ?? data ?? {};
  const cats = lr?.categories ?? {};
  const audits = lr?.audits ?? {};

  const excludedAuditIds = new Set([
    "first-contentful-paint",
    "largest-contentful-paint",
    "speed-index",
    "interactive",
    "total-blocking-time",
    "cumulative-layout-shift",
    "server-response-time",
  ]);
  const opportunities = Object.entries(audits)
    .map(([auditId, audit]: [string, any]) => ({ ...audit, id: auditId }))
    .filter((a: any) => {
      const auditId = normalizePageSpeedAuditId(
        a.id,
        a.title,
        a.description,
      );
      const t = a.details?.type;
      const scoreMode = a.scoreDisplayMode;
      const actionableScore =
        typeof a.score === "number" &&
        a.score < 0.9 &&
        scoreMode !== "notApplicable" &&
        scoreMode !== "manual";
      const hasSavings =
        (a.details?.overallSavingsMs ?? 0) > 0 ||
        (a.details?.overallSavingsBytes ?? 0) > 0;
      const hasDiagnosticDetails =
        t === "diagnostic" && (a.details?.items?.length || a.displayValue);
      const isPriorityAudit = isPageSpeedTranslationPriorityAudit(
        auditId,
        a.title,
        a.description,
      );
      const priorityAuditFailed =
        isPriorityAudit &&
        (typeof a.score !== "number" ||
          a.score < 1 ||
          /\b(user-scalable|maximum-scale)\b/i.test(
            `${a.title ?? ""} ${a.description ?? ""}`,
          ));

      return (
        !excludedAuditIds.has(auditId) &&
        !/(screenshot|thumbnail|trace|filmstrip)/i.test(auditId) &&
        (t === "opportunity" ||
          actionableScore ||
          hasSavings ||
          hasDiagnosticDetails ||
          priorityAuditFailed)
      );
    })
    .sort((a: any, b: any) => {
      const aImpact =
        (a.details?.overallSavingsBytes ?? 0) / 1000 +
        (a.details?.overallSavingsMs ?? 0) +
        (1 - (a.score ?? 1)) * 100;
      const bImpact =
        (b.details?.overallSavingsBytes ?? 0) / 1000 +
        (b.details?.overallSavingsMs ?? 0) +
        (1 - (b.score ?? 1)) * 100;
      return bImpact - aImpact;
    });
  const priorityOpportunities = opportunities.filter((audit: any) =>
    isPageSpeedTranslationPriorityAudit(
      audit.id,
      audit.title,
      audit.description,
    ),
  );
  const selectedOpportunities = [
    ...priorityOpportunities,
    ...opportunities
      .filter(
        (audit: any) =>
          !isPageSpeedTranslationPriorityAudit(
            audit.id,
            audit.title,
            audit.description,
          ),
      )
      .slice(0, 8),
  ].filter(
    (audit: any, index: number, list: any[]) =>
      list.findIndex(
        (candidate) =>
          normalizePageSpeedAuditId(
            candidate.id,
            candidate.title,
            candidate.description,
          ) ===
          normalizePageSpeedAuditId(
            audit.id,
            audit.title,
            audit.description,
          ),
      ) === index,
  );
  const localizedOpportunities = selectedOpportunities
    .map((a: any) => {
      const auditId = normalizePageSpeedAuditId(
        a.id,
        a.title,
        a.description,
      );
      return {
        id: auditId,
        title: translatePageSpeedTitle(
          PAGE_SPEED_LABELS[auditId]?.title ?? a.title,
          auditId,
        ),
        rawDescription: a.description,
        displayValue: translatePageSpeedDisplayValue(a.displayValue),
        score: a.score,
      };
    });
  return {
    strategy,
    scores: {
      performance: Math.round((cats.performance?.score ?? 0) * 100),
      accessibility: Math.round((cats.accessibility?.score ?? 0) * 100),
      bestPractices: Math.round((cats["best-practices"]?.score ?? 0) * 100),
      seo: Math.round((cats.seo?.score ?? 0) * 100),
    },
    metrics: {
      fcp: audits["first-contentful-paint"]?.displayValue ?? "—",
      lcp: audits["largest-contentful-paint"]?.displayValue ?? "—",
      tbt: audits["total-blocking-time"]?.displayValue ?? "—",
      cls: audits["cumulative-layout-shift"]?.displayValue ?? "—",
      si: audits["speed-index"]?.displayValue ?? "—",
      tti: audits["interactive"]?.displayValue ?? "—",
      ttfb: audits["server-response-time"]?.displayValue ?? "—",
      pageSize: audits["total-byte-weight"]?.displayValue ?? "—",
      requests: audits["network-requests"]?.displayValue ?? "—",
    },
    screenshot: audits["final-screenshot"]?.details?.data ?? null,
    opportunities: localizedOpportunities,
    finalUrl: lr.finalUrl,
  };
}

const PAGE_SPEED_LABELS: Record<
  string,
  { title: string; recommendation: string }
> = {
  "button-name": {
    title: "Dar um nome acessível aos botões",
    recommendation:
      "Definir um nome acessível e descritivo para cada botão, usando texto visível ou um rótulo acessível associado.",
  },
  "forced-reflow-insight": {
    title: "Reduzir recálculos forçados do layout",
    recommendation:
      "Agrupar leituras de dimensões e alterações no DOM, evitando consultar posições ou tamanhos após modificar o layout.",
  },
  "meta-viewport": {
    title: "Permitir a ampliação da página em dispositivos móveis",
    recommendation:
      "Remover restrições de zoom da configuração viewport para permitir que visitantes ampliem o conteúdo em dispositivos móveis.",
  },
  "render-blocking-resources": {
    title: "Eliminar recursos que bloqueiam a renderização",
    recommendation:
      "Inserir o CSS essencial diretamente na página e adiar o carregamento de CSS não crítico. Aplicar defer ou async aos scripts que não são necessários para a primeira renderização.",
  },
  "unused-javascript": {
    title: "Reduzir JavaScript não utilizado",
    recommendation:
      "Remover dependências e códigos que não são usados nesta página e carregar scripts apenas quando o recurso correspondente for utilizado.",
  },
  "unused-css-rules": {
    title: "Reduzir CSS não utilizado",
    recommendation:
      "Remover regras de estilo não utilizadas e dividir o CSS por página ou componente para entregar somente o necessário ao visitante.",
  },
  "uses-long-cache-ttl": {
    title: "Usar políticas de cache eficientes",
    recommendation:
      "Configurar cache longo para arquivos estáticos próprios, como CSS, JavaScript, fontes e imagens, usando versionamento quando houver alterações.",
  },
  "uses-optimized-images": {
    title: "Otimizar imagens",
    recommendation:
      "Converter imagens para WebP ou AVIF, reduzir suas dimensões e aplicar compressão adequada sem comprometer a qualidade visual.",
  },
  "offscreen-images": {
    title: "Adiar o carregamento de imagens fora da tela",
    recommendation:
      "Ativar lazy loading para imagens que aparecem abaixo da primeira dobra e manter o carregamento prioritário apenas para o conteúdo inicial.",
  },
  "uses-responsive-images": {
    title: "Entregar imagens responsivas",
    recommendation:
      "Disponibilizar versões adequadas para cada tamanho de tela usando srcset e sizes, evitando baixar arquivos maiores do que o necessário.",
  },
  "largest-contentful-paint-element": {
    title: "Melhorar o Largest Contentful Paint (LCP)",
    recommendation:
      "Identificar o maior elemento visível, priorizar seu carregamento e reduzir o tempo de resposta do servidor, o peso da imagem ou do conteúdo que o compõe.",
  },
  "server-response-time": {
    title: "Reduzir o tempo de resposta do servidor (TTFB)",
    recommendation:
      "Avaliar hospedagem, cache de página, consultas e scripts do servidor para diminuir o tempo até o primeiro byte.",
  },
  "font-display": {
    title: "Configurar a exibição das fontes",
    recommendation:
      "Usar font-display: swap ou opcional e pré-carregar somente as fontes realmente necessárias para evitar texto invisível durante o carregamento.",
  },
  "modern-image-formats": {
    title: "Usar formatos de imagem de última geração",
    recommendation:
      "Formatos como WebP e AVIF geralmente oferecem melhor compressão do que PNG ou JPEG, o que resulta em downloads mais rápidos e menor consumo de dados.",
  },
  "dom-size": {
    title: "Evitar um tamanho excessivo do DOM",
    recommendation:
      "Reduzir a complexidade da página simplificando a estrutura HTML e removendo elementos desnecessários, o que melhora o tempo de processamento do navegador.",
  },
  "unminified-javascript": {
    title: "Minificar JavaScript",
    recommendation:
      "Remover espaços em branco, comentários e outros caracteres irrelevantes dos arquivos de script para reduzir seu tamanho total.",
  },
  "unminified-css": {
    title: "Minificar CSS",
    recommendation:
      "Compactar os arquivos de estilo para reduzir o peso da página e acelerar o download dos recursos visuais.",
  },
  "efficient-animated-content": {
    title: "Usar formatos de vídeo para conteúdo animado",
    recommendation:
      "Substituir GIFs grandes por vídeos MP4/WebM ou animações CSS/Lottie para reduzir drasticamente o peso dos elementos em movimento.",
  },
  "network-dependency-tree": {
    title: "Reduzir a cadeia de solicitações críticas",
    recommendation:
      "Reduzir dependências em sequência, eliminar recursos desnecessários e priorizar apenas os arquivos necessários para o conteúdo inicial.",
  },
  "legacy-javascript": {
    title: "Reduzir JavaScript legado",
    recommendation:
      "Entregar JavaScript moderno para navegadores atuais e evitar polyfills e transformações que não são necessários para o público-alvo.",
  },
  "long-tasks": {
    title: "Evitar tarefas longas na linha de execução principal",
    recommendation:
      "Dividir tarefas JavaScript longas, adiar scripts não essenciais e reduzir o trabalho executado durante o carregamento inicial.",
  },
  "third-parties": {
    title: "Reduzir o impacto de scripts de terceiros",
    recommendation:
      "Adiar analytics, anúncios, chats e pixels até que sejam necessários ou após a interação do usuário, preservando o carregamento do conteúdo principal.",
  },
  "unsized-images": {
    title: "Definir dimensões das imagens",
    recommendation:
      "Informar width e height ou aspect-ratio para todas as imagens, reservando espaço antes do download e evitando mudanças de layout.",
  },
  "uses-text-compression": {
    title: "Ativar compressão dos recursos",
    recommendation:
      "Configurar Brotli ou GZIP para HTML, CSS e JavaScript e verificar se a compressão está ativa no servidor e no CDN.",
  },
  "total-byte-weight": {
    title: "Reduzir o tamanho total dos recursos",
    recommendation:
      "Remover recursos desnecessários, comprimir imagens e adiar scripts e estilos que não participam da renderização inicial.",
  },
};

const PAGE_SPEED_SHORT_DESCRIPTIONS: Record<string, string> = {};

const PAGE_SPEED_TITLE_TRANSLATIONS: Record<string, string> = {
  "render-blocking resources": "Recursos que bloqueiam a renderização",
  "render-blocking resources (render-blocking resources)":
    "Recursos que bloqueiam a renderização",
  "legacy javascript": "JavaScript legado",
  "unused javascript": "JavaScript não utilizado",
  "unused css": "CSS não utilizado",
  "reduce javascript execution time":
    "Reduzir o tempo de execução de JavaScript",
  "main-thread work": "Minimizar o trabalho da linha de execução principal",
  "efficient cache lifetimes": "Usar ciclos de vida eficientes de cache",
  "properly size images": "Dimensionar as imagens corretamente",
  "modern image formats": "Usar formatos modernos de imagem",
  "image elements do not have explicit width and height":
    "Definir dimensões explícitas para as imagens",
  "largest contentful paint":
    "Detalhamento do maior elemento de conteúdo (LCP)",
  "network dependency tree": "Reduzir a cadeia de solicitações críticas",
  "long tasks": "Evitar tarefas longas na linha de execução principal",
  "third parties": "Reduzir o impacto de scripts de terceiros",
  "total byte weight": "Reduzir o peso total da página",
  "uses text compression": "Ativar a compressão de recursos",
  "unused css rules": "Reduzir CSS não utilizado",
  "server response time": "Reduzir o tempo de resposta do servidor",
  "missing source maps for large first-party javascript":
    "Adicionar mapas de origem ao JavaScript próprio",
  "links do not have a discernible name":
    "Nomear os links de forma compreensível",
  "links do not have discernible names":
    "Nomear os links de forma compreensível",
  "improve image delivery": "Melhorar a entrega de imagens",
  "document does not have a main landmark":
    "Definir uma região principal no documento",
  "render-blocking requests":
    "Eliminar solicitações que bloqueiam a renderização",
  "critical request chains": "Reduzir as cadeias de solicitações críticas",
  "use efficient cache lifetimes": "Usar ciclos de vida eficientes de cache",
};

function translatePageSpeedTitle(
  title: string,
  auditId?: string,
): string {
  const auditTitle = getPageSpeedAuditTitle(auditId, title);
  if (auditTitle) return auditTitle;

  const normalized = String(title ?? "")
    .trim()
    .toLowerCase();
  return (
    PAGE_SPEED_TITLE_TRANSLATIONS[normalized] ??
    title
      .replace(
        /\bRender-blocking resources\b/gi,
        "Recursos que bloqueiam a renderização",
      )
      .replace(/\bLegacy JavaScript\b/gi, "JavaScript legado")
      .replace(/\bUnused JavaScript\b/gi, "JavaScript não utilizado")
      .replace(/\bUnused CSS\b/gi, "CSS não utilizado")
      .replace(
        /\bMain-thread work\b/gi,
        "Trabalho da linha de execução principal",
      )
      .replace(/\bLargest Contentful Paint\b/gi, "Maior elemento de conteúdo")
      .replace(
        /\bFirst Contentful Paint\b/gi,
        "Primeira renderização de conteúdo",
      )
      .replace(/\bTotal Blocking Time\b/gi, "Tempo total de bloqueio")
      .replace(/\bCumulative Layout Shift\b/gi, "Mudança cumulativa de layout")
      .replace(/\bSpeed Index\b/gi, "Índice de velocidade")
      .replace(
        /\bMissing source maps for large first-party JavaScript\b/gi,
        "Adicionar mapas de origem ao JavaScript próprio",
      )
      .replace(
        /\bLinks do not have a discernible name\b/gi,
        "Nomear os links de forma compreensível",
      )
      .replace(/\bImprove image delivery\b/gi, "Melhorar a entrega de imagens")
      .replace(
        /\bNetwork dependency tree\b/gi,
        "Reduzir a árvore de dependências de rede",
      )
      .replace(
        /\bDocument does not have a main landmark\b/gi,
        "Definir uma região principal no documento",
      )
      .replace(
        /\bRender-blocking requests\b/gi,
        "Eliminar solicitações que bloqueiam a renderização",
      )
      .replace(/\bEst savings of\b/gi, "Economia estimada de")
  );
}

function translatePageSpeedDisplayValue(
  displayValue: string | undefined,
): string | undefined {
  return displayValue?.replace(/\bEst savings of\b/gi, "Economia estimada de");
}

function translateReportText(value: unknown): string {
  return String(value ?? "")
    .replace(
      /\bRender-blocking resources\b/gi,
      "recursos que bloqueiam a renderização",
    )
    .replace(
      /\bRender-blocking requests\b/gi,
      "solicitações que bloqueiam a renderização",
    )
    .replace(/\bUnused JavaScript\b/gi, "JavaScript não utilizado")
    .replace(/\bUnused CSS\b/gi, "CSS não utilizado")
    .replace(/\bLegacy JavaScript\b/gi, "JavaScript legado")
    .replace(
      /\bMain-thread work\b/gi,
      "trabalho da linha de execução principal",
    )
    .replace(/\bLargest Contentful Paint\b/gi, "maior elemento de conteúdo")
    .replace(
      /\bFirst Contentful Paint\b/gi,
      "primeira renderização de conteúdo",
    )
    .replace(/\bTotal Blocking Time\b/gi, "tempo total de bloqueio")
    .replace(/\bCumulative Layout Shift\b/gi, "mudança cumulativa de layout")
    .replace(/\bSpeed Index\b/gi, "índice de velocidade")
    .replace(/\bNetwork dependency tree\b/gi, "árvore de dependências de rede")
    .replace(/\bMissing source maps\b/gi, "mapas de origem ausentes")
    .replace(/\bsource maps\b/gi, "mapas de origem")
    .replace(/\bfirst-party\b/gi, "próprio")
    .replace(/\bImprove image delivery\b/gi, "melhorar a entrega de imagens")
    .replace(
      /\bDocument does not have a main landmark\b/gi,
      "o documento não possui uma região principal",
    )
    .replace(
      /\bLinks do not have a discernible name\b/gi,
      "há links sem nome compreensível",
    )
    .replace(
      /\bEfficient cache lifetimes\b/gi,
      "ciclos de vida eficientes de cache",
    )
    .replace(/\bThird-party code\b/gi, "código de terceiros")
    .replace(/\bthird-party\b/gi, "de terceiros")
    .replace(
      /\bJavaScript execution time\b/gi,
      "tempo de execução do JavaScript",
    )
    .replace(/\bEst savings of\b/gi, "economia estimada de")
    .replace(/\bImprove\b/gi, "melhorar")
    .replace(/\bReduce\b/gi, "reduzir")
    .replace(/\bAvoid\b/gi, "evitar")
    .replace(/\bUse\b/gi, "usar");
}

function translatePageSpeedDescription(
  description: string | undefined,
  auditId?: string,
): string {
  const translated = description
    ? description
        .replace(
          /^Eliminate render-blocking resources by inlining critical resources and deferring non-critical resources\./i,
          "Recursos de CSS e JavaScript estão bloqueando a renderização inicial. O conteúdo crítico deve ser carregado primeiro e os recursos não essenciais devem ser adiados.",
        )
        .replace(
          /^Reduce unused JavaScript and defer loading scripts until they are needed to reduce bytes consumed by network activity\./i,
          "Há JavaScript carregado que não é utilizado durante o carregamento inicial. Esses scripts devem ser adiados até que sejam necessários.",
        )
        .replace(
          /^Reduce unused rules from stylesheets and defer CSS not used for above-the-fold content to reduce unnecessary bytes consumed by network activity\./i,
          "As folhas de estilo contêm regras que não são utilizadas no conteúdo inicial. O CSS não crítico deve ser removido, dividido ou adiado.",
        )
        .replace(
          /^Serve images that are appropriately-sized to save cellular data and improve load time\./i,
          "Há imagens maiores do que as dimensões em que são exibidas. Entregar arquivos dimensionados corretamente reduz o download e melhora o carregamento.",
        )
        .replace(
          /^Serve images in next-gen formats to reduce the download size of images and improve page load time\./i,
          "As imagens podem ser entregues em formatos modernos, como WebP ou AVIF, para reduzir o tamanho do download.",
        )
        .replace(
          /^Avoid serving legacy JavaScript to modern browsers\./i,
          "Parte do JavaScript atende navegadores antigos e pode ser substituída por código moderno para reduzir o processamento.",
        )
        .replace(
          /^Reduce the impact of third-party code\./i,
          "Scripts de terceiros estão consumindo rede e processamento durante o carregamento. Eles devem ser reduzidos ou adiados.",
        )
        .replace(
          /^Serve static assets with an efficient cache policy\./i,
          "Os recursos estáticos não estão utilizando uma política de cache suficientemente eficiente para visitas recorrentes.",
        )
        .replace(
          /^Avoid chaining critical requests\./i,
          "A página depende de várias solicitações críticas em sequência, aumentando o tempo até que os recursos principais sejam carregados.",
        )
        .replace(
          /^Reduce JavaScript execution time\./i,
          "O navegador está gastando tempo elevado para interpretar, compilar e executar JavaScript.",
        )
        .replace(
          /^Minimize main-thread work\./i,
          "A linha de execução principal está sobrecarregada com tarefas de JavaScript, estilo, layout e renderização.",
        )
        .replace(
          /^Image elements do not have explicit width and height\./i,
          "Há imagens sem dimensões explícitas, o que pode fazer o layout mudar durante o carregamento.",
        )
        .replace(
          /^Document does not have a main landmark\./i,
          "O documento não define uma região principal, dificultando a navegação por tecnologias assistivas.",
        )
        .replace(
          /^Links do not have discernible names\./i,
          "Há links sem um nome compreensível para leitores de tela e outros recursos de tecnologia assistiva.",
        )
        .replace(
          /^Missing source maps for large first-party JavaScript\./i,
          "Os arquivos JavaScript próprios de maior tamanho não possuem mapas de origem para facilitar a investigação e manutenção.",
        )
        .replace(
          /^Render-blocking requests\./i,
          "Há solicitações de rede bloqueando a renderização inicial e atrasando a exibição do conteúdo visível.",
        )
    : "";

  return normalizePageSpeedDescription(auditId, description, translated);
}

// Supabase helpers (pagespeed_translations table)
// Busca em lote: uma única query pra todos os audit_ids, em vez de N chamadas sequenciais.
async function getPagespeedTranslationsBatch(
  auditIds: string[],
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  if (auditIds.length === 0) return result;
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn(
      "Cache pagespeed_translations indisponível: configure SUPABASE_URL e uma chave Supabase para ler e salvar traduções.",
    );
    return result;
  }
  try {
    const candidates = pageSpeedAuditIdCandidates(auditIds);
    const { data, error } = await supabase
      .from("pagespeed_translations")
      .select("audit_id, translated_description")
      .in("audit_id", candidates);
    if (error) {
      console.warn(
        "supabase getPagespeedTranslationsBatch error",
        error.message ?? error,
      );
      return result;
    }
    for (const row of data ?? []) {
      if (row?.audit_id && row?.translated_description) {
        result[normalizePageSpeedAuditId(row.audit_id)] =
          row.translated_description;
      }
    }
    console.log(
      `Cache pagespeed_translations: ${Object.keys(result).length}/${new Set(auditIds.map(normalizePageSpeedAuditId)).size} audit_ids encontrados no cache.`,
    );
    return result;
  } catch (e) {
    console.warn("getPagespeedTranslationsBatch failed", e?.message ?? e);
    return result;
  }
}

async function upsertPagespeedTranslation(
  audit_id: string,
  translated: string,
) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    const { error } = await supabase.from("pagespeed_translations").upsert(
      {
        audit_id: normalizePageSpeedAuditId(audit_id),
        translated_description: translated,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "audit_id" },
    );
    if (error) {
      console.warn(
        "supabase upsertPagespeedTranslation error",
        error.message ?? error,
      );
    }
  } catch (e) {
    console.warn("upsertPagespeedTranslation failed", e?.message ?? e);
  }
}

// Batch-translate summary items using OpenRouter (single call)
async function translateSummaryFields(
  items: Array<{ audit_id: string; text: string }>,
) {
  if (!OPENROUTER_API_KEY)
    throw new Error("OPENROUTER_API_KEY não configurada");

  // Build the prompt instructing the model to return strict JSON
  const system =
    "Você é um tradutor técnico para pt-BR. Preserve siglas (LCP, CLS, TBT, FCP, TTFB) e termos técnicos. Retorne apenas JSON válido. Não adicione prefixos como 'PT-BR:' ou similares — 'translated_text' deve conter apenas o texto em português brasileiro.";
  const userPrompt = `Receba um array JSON com objetos { "audit_id", "text" } e retorne um objeto JSON { "translations": [ { "audit_id", "translated_text" }, ... ] } onde translated_text é a tradução/adaptação técnica em português brasileiro. Não misture inglês e português na mesma frase. Preserve siglas técnicas entre parênteses apenas se necessário.

Entrada:
${JSON.stringify(items, null, 2)}

Resposta: retorne somente o objeto JSON, exemplo:
{ "translations": [
  { "audit_id": "unused-javascript", "translated_text": "Texto em português..." }
] }`;

  const res = await fetch(`${OPENROUTER_API_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.0,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(
      `OpenRouter translation request falhou: ${res.status} ${txt}`,
    );
  }

  const json = await res.json();
  const content: string = json.choices?.[0]?.message?.content ?? "{}";

  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    console.warn(
      "translateSummaryFields: conteúdo bruto recebido:",
      content.slice(0, 500),
    );
    throw new Error("Resposta da OpenRouter não continha JSON válido");
  }

  const list = Array.isArray(parsed) ? parsed : parsed?.translations;
  if (!Array.isArray(list))
    throw new Error("Formato inesperado da tradução (esperado array)");

  // Upsert no supabase e retornar mapa
  const requested = new Map(
    items.map((item) => [
      normalizePageSpeedAuditId(item.audit_id),
      item.text,
    ]),
  );
  const map: Record<string, string> = {};
  const translationsToPersist: Array<{ audit_id: string; text: string }> = [];
  for (const it of list) {
    const auditId = normalizePageSpeedAuditId(it?.audit_id);
    const sourceText = requested.get(auditId);
    if (
      !auditId ||
      !sourceText ||
      !isValidPageSpeedTranslation(auditId, sourceText, it?.translated_text)
    ) {
      continue;
    }
    map[auditId] = it.translated_text.trim();
    translationsToPersist.push({ audit_id: auditId, text: map[auditId] });
  }
  await Promise.all(
    translationsToPersist.map(({ audit_id, text }) =>
      upsertPagespeedTranslation(audit_id, text),
    ),
  );
  return map;
}

function localizedPageSpeedOpportunity(
  opportunity: any,
  translatedDescriptions: Record<string, string> = {},
) {
  const auditId = normalizePageSpeedAuditId(opportunity.id);
  const localized = PAGE_SPEED_LABELS[auditId];
  const title = translatePageSpeedTitle(
    localized?.title ??
      opportunity.title
        .replace(
          /^Properly size images$/i,
          "Dimensionar as imagens corretamente",
        )
        .replace(
          /^Efficiently encode images$/i,
          "Codificar as imagens com eficiência",
        )
        .replace(/^Minify JavaScript$/i, "Minificar JavaScript")
        .replace(/^Minify CSS$/i, "Minificar CSS"),
    auditId,
  );
  const localizedDescription = normalizePageSpeedDescription(
    auditId,
    opportunity.rawDescription,
    translatedDescriptions[auditId] ??
      translatePageSpeedDescription(opportunity.rawDescription, auditId),
  );
  const description =
    PAGE_SPEED_SHORT_DESCRIPTIONS[auditId] ??
    `${localizedDescription.split(/[.!?](?:\s|$)/)[0]}.`;

  return {
    id: auditId,
    title,
    description: `${description}${opportunity.displayValue ? ` (${translatePageSpeedDisplayValue(opportunity.displayValue)})` : ""}`,
    impact: [
      "Pode atrasar a exibição do conteúdo principal.",
      "Pode aumentar o tempo de carregamento no primeiro acesso.",
    ],
    causes: [
      "Carregamento de recursos ou funcionalidades não utilizados na página.",
      "Configurações padrão do CMS, do tema ou de plugins de terceiros.",
    ],
    recommendations: [
      localized?.recommendation ??
        "Revisar este recurso no relatório detalhado do PageSpeed e aplicar a correção indicada para reduzir o impacto no carregamento.",
    ],
  };
}

function buildPageSpeedImprovements(
  mobile: any,
  desktop: any,
  translatedDescriptions: Record<string, string> = {},
) {
  const opportunities = [
    ...(mobile.opportunities ?? []),
    ...(desktop.opportunities ?? []),
  ];
  const unique = opportunities.filter(
    (opportunity, index, list) =>
      list.findIndex((item) => item.id === opportunity.id) === index,
  );
  const priority = unique.filter((opportunity) =>
    isPageSpeedTranslationPriorityAudit(
      opportunity.id,
      opportunity.title,
      opportunity.rawDescription,
    ),
  );
  const selected = [
    ...priority,
    ...unique
      .filter(
        (opportunity) =>
          !isPageSpeedTranslationPriorityAudit(
            opportunity.id,
            opportunity.title,
            opportunity.rawDescription,
          ),
      )
      .slice(0, 8),
  ];
  const improvements = selected.map((opportunity) =>
    localizedPageSpeedOpportunity(opportunity, translatedDescriptions),
  );
  const metricFallbacks = [
    {
      id: "lcp-metric",
      value: mobile.metrics?.lcp,
      title: "Melhorar o carregamento do conteúdo principal",
      description: `O PageSpeed registrou LCP de ${mobile.metrics?.lcp ?? "—"} no mobile e ${desktop.metrics?.lcp ?? "—"} no desktop.`,
      impact: [
        "O conteúdo principal pode demorar para aparecer no primeiro acesso.",
        "A percepção de velocidade pode ser prejudicada em redes móveis.",
      ],
      causes: [
        "Imagem, banner ou bloco principal pesado.",
        "CSS, fontes ou scripts bloqueando a renderização inicial.",
      ],
      recommendations: [
        "Otimizar o elemento identificado como maior conteúdo, priorizar seus recursos e revisar o tempo de resposta do servidor.",
      ],
    },
    {
      id: "tbt-metric",
      value: mobile.metrics?.tbt,
      title: "Reduzir o trabalho do navegador",
      description: `O tempo de bloqueio total registrado foi de ${mobile.metrics?.tbt ?? "—"} no mobile e ${desktop.metrics?.tbt ?? "—"} no desktop.`,
      impact: [
        "Interações podem ficar indisponíveis enquanto a página é processada.",
        "Dispositivos móveis podem sentir mais lentidão.",
      ],
      causes: [
        "Scripts grandes ou executados durante o carregamento inicial.",
        "Plugins, rastreadores e widgets de terceiros.",
      ],
      recommendations: [
        "Reduzir JavaScript não utilizado, adiar scripts não críticos e dividir tarefas longas em partes menores.",
      ],
    },
    {
      id: "cls-metric",
      value: mobile.metrics?.cls,
      title: "Evitar mudanças inesperadas no layout",
      description: `O PageSpeed registrou CLS de ${mobile.metrics?.cls ?? "—"} no mobile e ${desktop.metrics?.cls ?? "—"} no desktop.`,
      impact: [
        "Elementos podem mudar de posição durante o carregamento.",
        "A navegação pode causar cliques ou interações acidentais.",
      ],
      causes: [
        "Imagens ou elementos sem dimensões definidas.",
        "Fontes e conteúdos dinâmicos alterando o layout após a renderização.",
      ],
      recommendations: [
        "Definir dimensões para imagens e anúncios, reservar espaço para conteúdo dinâmico e evitar inserir elementos acima do conteúdo já renderizado.",
      ],
    },
    {
      id: "fcp-metric",
      value: mobile.metrics?.fcp,
      title: "Acelerar a primeira renderização",
      description: `O PageSpeed registrou FCP de ${mobile.metrics?.fcp ?? "—"} no mobile e ${desktop.metrics?.fcp ?? "—"} no desktop.`,
      impact: [
        "O visitante pode visualizar uma tela vazia por mais tempo.",
        "A percepção inicial de velocidade pode ser prejudicada.",
      ],
      causes: [
        "Recursos CSS e JavaScript bloqueando a renderização.",
        "Servidor, fontes ou recursos críticos com alta latência.",
      ],
      recommendations: [
        "Reduzir recursos bloqueantes, otimizar o caminho crítico de renderização e priorizar o conteúdo visível.",
      ],
    },
    {
      id: "ttfb-metric",
      value: mobile.metrics?.ttfb,
      title: "Reduzir o tempo de resposta do servidor",
      description: `O PageSpeed registrou TTFB de ${mobile.metrics?.ttfb ?? "—"} no mobile e ${desktop.metrics?.ttfb ?? "—"} no desktop.`,
      impact: [
        "Todos os recursos da página começam a carregar mais tarde.",
        "O atraso é mais perceptível em redes móveis.",
      ],
      causes: [
        "Falta de cache de página ou consultas lentas no servidor.",
        "Hospedagem ou processamento de plugins consumindo muitos recursos.",
      ],
      recommendations: [
        "Usar cache de página, revisar consultas e processamento no servidor e avaliar a infraestrutura de hospedagem.",
      ],
    },
    {
      id: "page-weight-metric",
      value: mobile.metrics?.pageSize,
      title: "Reduzir o peso total da página",
      description: `O PageSpeed mediu ${mobile.metrics?.pageSize ?? "—"} no mobile e ${desktop.metrics?.pageSize ?? "—"} no desktop para o peso total da página.`,
      impact: [
        "O download consome mais tempo e dados.",
        "Usuários em redes lentas podem abandonar a página antes do carregamento.",
      ],
      causes: [
        "Imagens, folhas de estilo e scripts maiores do que o necessário.",
        "Recursos de plugins e integrações carregados globalmente.",
      ],
      recommendations: [
        "Comprimir imagens, remover recursos desnecessários e ativar compressão e cache para arquivos estáticos.",
      ],
    },
  ];
  const existingTitles = new Set(
    improvements.map((improvement: any) => improvement.title.toLowerCase()),
  );
  for (const fallback of metricFallbacks) {
    if (improvements.length >= 8) break;
    if (fallback.value && !existingTitles.has(fallback.title.toLowerCase())) {
      const { id: _id, value: _value, ...improvement } = fallback;
      improvements.push(improvement);
      existingTitles.add(fallback.title.toLowerCase());
    }
  }
  return improvements;
}

function looksLikeEnglish(s: string | undefined, auditId?: string): boolean {
  return isLikelyEnglishPageSpeedText(auditId, s);
}

function sanitizeAiImprovement(
  improvement: any,
  pageSpeedImprovements: any[],
  idx: number,
) {
  const pageImp = pageSpeedImprovements?.[idx] ?? null;

  const sanitizeField = (field: any, fallback: any) => {
    if (typeof field === "string") {
      if (looksLikeEnglish(field, pageImp?.id)) {
        return fallback ?? null;
      }
      return field;
    }
    return field;
  };

  const sanitizeArray = (arr: any, fallbackArr: any[]) => {
    if (Array.isArray(arr) && arr.length > 0) {
      // If any element looks like English, prefer fallback
      const anyEnglish = arr.some((v: any) =>
        looksLikeEnglish(String(v), pageImp?.id),
      );
      if (anyEnglish) return fallbackArr ?? arr;
      return arr;
    }
    return fallbackArr ?? arr;
  };

  return {
    title: sanitizeField(
      improvement?.title,
      pageImp?.title ??
        (pageImp ? translatePageSpeedTitle(pageImp.id ?? "") : null),
    ),
    description: sanitizeField(
      improvement?.description,
      pageImp?.description ?? pageImp?.rawDescription ?? null,
    ),
    impact: sanitizeArray(improvement?.impact, pageImp?.impact ?? null),
    causes: sanitizeArray(improvement?.causes, pageImp?.causes ?? null),
    recommendations: sanitizeArray(
      improvement?.recommendations,
      pageImp?.recommendations ?? null,
    ),
  };
}

function publicPageSpeedOpportunities(opportunities: any[] = []) {
  return opportunities.map(({ title, displayValue, score }: any) => ({
    title,
    displayValue,
    score,
  }));
}

// buildSummaryResponse: monta o JSON que antes era retornado inline.
function buildSummaryResponse(mobile: any, desktop: any, ai: any) {
  const pageSpeedTranslations = ai?._pageSpeedTranslations ?? {};
  const pageSpeedImprovements = buildPageSpeedImprovements(
    mobile,
    desktop,
    pageSpeedTranslations,
  );

  let finalAi = ai ?? { improvements: [], uiux: null, extras: [] };

  if (
    !Array.isArray(finalAi?.improvements) ||
    finalAi.improvements.length === 0
  ) {
    finalAi = { ...finalAi, improvements: pageSpeedImprovements };
  } else if (finalAi.improvements.length < 8) {
    const existingTitles = new Set(
      finalAi.improvements
        .map((improvement: any) =>
          String(improvement.title ?? "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    );
    const mergedImprovements = [...finalAi.improvements];
    for (const improvement of pageSpeedImprovements) {
      const title = String(improvement.title ?? "")
        .trim()
        .toLowerCase();
      if (title && !existingTitles.has(title)) {
        mergedImprovements.push(improvement);
        existingTitles.add(title);
      }
      if (mergedImprovements.length >= 8) break;
    }
    finalAi = { ...finalAi, improvements: mergedImprovements };
  }

  // Sanitize generated text and use the normalized PageSpeed translation when needed.
  if (Array.isArray(finalAi?.improvements)) {
    const psImps = pageSpeedImprovements;
    finalAi = {
      ...finalAi,
      improvements: finalAi.improvements
        .slice(0, 8)
        .map((improvement: any, idx: number) => {
          const sanitized = sanitizeAiImprovement(improvement, psImps, idx);
          const fallback = psImps[idx] ?? null;
          const title =
            sanitized.title ??
            fallback?.title ??
            "Recomendação técnica do PageSpeed";
          const description = normalizePageSpeedDescription(
            fallback?.id,
            fallback?.rawDescription,
            sanitized.description ?? fallback?.description,
          );
          return {
            title: translateReportText(title),
            description: translateReportText(description),
            impact:
              Array.isArray(sanitized.impact) && sanitized.impact.length > 0
                ? sanitized.impact.map(translateReportText)
                : (fallback?.impact ?? [
                    "Pode atrasar o carregamento e a interação com a página.",
                  ]),
            causes:
              Array.isArray(sanitized.causes) && sanitized.causes.length > 0
                ? sanitized.causes.map(translateReportText)
                : (fallback?.causes ?? [
                    "Recursos ou funcionalidades carregados sem necessidade no primeiro acesso.",
                    "Configurações padrão do CMS, do tema ou de plugins de terceiros.",
                  ]),
            recommendations:
              Array.isArray(sanitized.recommendations) &&
              sanitized.recommendations.length > 0
                ? sanitized.recommendations.map(translateReportText)
                : (fallback?.recommendations ?? [
                    "Revisar e otimizar o recurso indicado no diagnóstico.",
                  ]),
          };
        }),
    };
  }

  const summaryResponse = {
    success: true,
    summary: {
      mobile: {
        scores: mobile.scores,
        metrics: mobile.metrics,
        screenshot: null,
        pagespeedScreenshot: null,
        opportunities: publicPageSpeedOpportunities(mobile.opportunities),
      },
      desktop: {
        scores: desktop.scores,
        metrics: desktop.metrics,
        screenshot: null,
        pagespeedScreenshot: null,
        opportunities: publicPageSpeedOpportunities(desktop.opportunities),
      },
      screenshot: null,
    },
    improvements: finalAi.improvements ?? [],
    uiux: finalAi.uiux ?? null,
    extras: finalAi.extras ?? [],
  };

  return summaryResponse;
}

async function aiAnalysis(
  url: string,
  mobile: any,
  desktop: any,
  screenshotDataUrl: string | null,
) {
  if (!OPENROUTER_API_KEY)
    throw new Error("OPENROUTER_API_KEY não configurada");

  // constrói summary básico, priorizando textos estáticos do dicionário
  const buildOpportunitiesWithPrecedence = (opps: any[]) =>
    opps.map((o: any) => ({
      id: normalizePageSpeedAuditId(o.id),
      title:
        PAGE_SPEED_LABELS[normalizePageSpeedAuditId(o.id)]?.title ??
        translatePageSpeedTitle(o.title, o.id),
      rawDescription: o.rawDescription,
      // se houver descrição curta estática, use-a direto (NUNCA passar por translateReportText)
      descriptionStatic: PAGE_SPEED_SHORT_DESCRIPTIONS[o.id] ?? null,
      displayValue: o.displayValue,
    }));

  const summary = {
    url,
    mobile: {
      scores: mobile.scores,
      metrics: mobile.metrics,
      top_opportunities: buildOpportunitiesWithPrecedence(
        mobile.opportunities ?? [],
      ),
    },
    desktop: {
      scores: desktop.scores,
      metrics: desktop.metrics,
      top_opportunities: buildOpportunitiesWithPrecedence(
        desktop.opportunities ?? [],
      ),
    },
  };

  // Reunir todos audit_ids que precisam de tradução (aqueles que não têm `descriptionStatic`)
  const collectMissing = (list: any[]) =>
    list
      .filter((it) => !it.descriptionStatic)
      .map((it) => ({ audit_id: it.id, text: it.rawDescription ?? "" }));

  const missingByAuditId = new Map<string, { audit_id: string; text: string }>();
  for (const item of [
    ...collectMissing(summary.mobile.top_opportunities),
    ...collectMissing(summary.desktop.top_opportunities),
  ]) {
    const auditId = normalizePageSpeedAuditId(item.audit_id);
    if (!missingByAuditId.has(auditId) && item.text) {
      missingByAuditId.set(auditId, { audit_id: auditId, text: item.text });
    }
  }
  const missing = [...missingByAuditId.values()];

  // Consultar cache Supabase (uma única query em lote)
  const cachedMap = await getPagespeedTranslationsBatch(
    missing.map((it) => it.audit_id),
  );
  const missingById: Record<string, string> = { ...cachedMap };
  const toTranslate = missing.filter((item) => {
    const auditId = normalizePageSpeedAuditId(item.audit_id);
    const cachedTranslation = cachedMap[auditId];
    if (
      cachedTranslation &&
      isValidPageSpeedTranslation(auditId, item.text, cachedTranslation)
    ) {
      return false;
    }
    delete missingById[auditId];
    return true;
  });

  console.log(
    `Tradução: ${Object.keys(cachedMap).length} do cache, ${toTranslate.length} vão pro OpenRouter.`,
  );

  // Se houver items para traduzir, chamar LLM em lote
  if (toTranslate.length > 0) {
    try {
      const translatedMap = await translateSummaryFields(toTranslate);
      Object.assign(missingById, translatedMap);
    } catch (e) {
      console.warn("Batch translation failed:", e?.message ?? e);
      // Em caso de falha, como fallback leve, tenta-se usar translatePageSpeedDescription local para não quebrar
      for (const it of toTranslate) {
        missingById[it.audit_id] = normalizePageSpeedDescription(
          it.audit_id,
          it.text,
          undefined,
        );
      }
    }
  }

  // Montar os textos finais no summary (com prioridade: static dict -> cache/translated -> fallback local)
  const finalize = (opps: any[]) =>
    opps.map((o) => {
      const desc =
        o.descriptionStatic ??
        missingById[o.id] ??
        translatePageSpeedDescription(o.rawDescription, o.id);
      return {
        id: normalizePageSpeedAuditId(o.id),
        title: o.title,
        description: normalizePageSpeedDescription(
          o.id,
          o.rawDescription,
          desc,
        ),
        displayValue: o.displayValue,
      };
    });

  const finalSummary = {
    url,
    mobile: {
      scores: summary.mobile.scores,
      metrics: summary.mobile.metrics,
      top_opportunities: finalize(summary.mobile.top_opportunities),
    },
    desktop: {
      scores: summary.desktop.scores,
      metrics: summary.desktop.metrics,
      top_opportunities: finalize(summary.desktop.top_opportunities),
    },
  };
  const pageSpeedTranslations = Object.fromEntries(
    [
      ...finalSummary.mobile.top_opportunities,
      ...finalSummary.desktop.top_opportunities,
    ].map((opportunity: any) => [
      normalizePageSpeedAuditId(opportunity.id),
      opportunity.description,
    ]),
  );
  const fallbackAnalysis = () => ({
    improvements: buildPageSpeedImprovements(
      mobile,
      desktop,
      pageSpeedTranslations,
    ),
    uiux: null,
    extras: [],
    _pageSpeedTranslations: pageSpeedTranslations,
  });

  // Prepara prompt único para a análise (mesma estrutura que antes, mas usando OpenRouter)
  const userContent: any[] = [
    {
      type: "text",
      text: `Analise este site (${url}) e gere um diagnóstico exclusivamente em PORTUGUÊS BRASILEIRO no estilo dos relatórios da agência Tupiniquim. Não use inglês, mesmo em títulos técnicos; quando necessário, mantenha apenas a sigla original entre parênteses.
Dados do PageSpeed:
${JSON.stringify(finalSummary, null, 2)}

${screenshotDataUrl ? "Você também recebeu um screenshot da home mobile do site para análise visual." : ""}

Retorne JSON com EXATAMENTE este formato:
{
  "improvements": [
    {
      "title": "Nome do problema",
      "description": "Descrição técnica do problema (1-2 parágrafos)",
      "impact": ["item 1", "item 2", "item 3"],
      "causes": ["causa 1", "causa 2"],
      "recommendations": ["ação 1", "ação 2", "ação 3"]
    }
  ],
  "uiux": {
    "overview": "parágrafo geral sobre UI/UX do site",
    "diagnosis": ["ponto 1", "ponto 2"],
    "recommendations": ["recomendação 1", "recomendação 2"]
  },
  "extras": [
    { "title": "Sugestão extra (ex: WhatsApp flutuante)", "description": "explicação detalhada" }
  ]
}

Gere exatamente 8 improvements baseados nas oportunidades reais do PageSpeed, priorizando os itens com maior economia estimada ou impacto. Use linguagem técnica, clara e exclusivamente em português brasileiro. Não use palavras ou títulos em inglês, nem mesmo entre parênteses; traduza todos os termos técnicos.

Cada improvement deve preencher obrigatoriamente todos estes campos:
- title: título numerável e objetivo do problema.
- description: uma única frase curta, técnica e específica sobre o problema identificado. Nunca use frases genéricas como "O PageSpeed identificou este ponto como uma oportunidade de melhoria".
- impact: 2 ou 3 impactos objetivos.
- causes: de 2 a 4 causas comuns, preferencialmente relacionadas ao WordPress, Elementor, tema ou plugins quando os dados indicarem esse contexto.
- recommendations: de 2 a 4 ações práticas e específicas.

Não deixe arrays vazios, não repita o mesmo problema e não invente problemas que não estejam relacionados aos dados fornecidos. A resposta deve permitir montar um relatório com as seções: Descrição, Impacto, Causas comuns e Recomendações.`,
    },
  ];

  if (screenshotDataUrl)
    userContent.push({
      type: "image_url",
      image_url: { url: screenshotDataUrl },
    });

  let res: Response;
  try {
    res = await fetch(`${OPENROUTER_API_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "Você é consultor sênior de performance web e UX. Responda SEMPRE com JSON válido, sem markdown.",
        },
        { role: "user", content: userContent },
      ],
      temperature: 0.0,
      max_tokens: 4000,
      response_format: { type: "json_object" },
      }),
    });
  } catch (error) {
    console.warn(
      "OpenRouter AI indisponível; usando traduções do PageSpeed.",
      error,
    );
    return fallbackAnalysis();
  }

  if (!res.ok) {
    const t = await res.text();
    console.error("OpenRouter AI", res.status, t);
    return fallbackAnalysis();
  }

  let data: any;
  try {
    data = await res.json();
  } catch (error) {
    console.warn(
      "OpenRouter AI retornou uma resposta inválida; usando traduções do PageSpeed.",
      error,
    );
    return fallbackAnalysis();
  }
  const content: string = data.choices?.[0]?.message?.content ?? "{}";
  try {
    return {
      ...JSON.parse(content),
      _pageSpeedTranslations: pageSpeedTranslations,
    };
  } catch (e) {
    console.warn("aiAnalysis: conteúdo bruto recebido:", content.slice(0, 500));
    console.warn("Resposta da IA não continha JSON válido; usando PageSpeed.");
    return fallbackAnalysis();
  }
}

// Handler HTTP
// ===================================================================
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: "Parâmetro 'url' é obrigatório." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let mobile;
    let desktop;
    let ai;
    const pageSpeedResults = await Promise.allSettled([
      runPageSpeed(url, "mobile"),
      runPageSpeed(url, "desktop"),
    ]);
    const scoreAvailability = {
      mobile: pageSpeedResults[0].status === "fulfilled",
      desktop: pageSpeedResults[1].status === "fulfilled",
    };
    const successfulResults = pageSpeedResults
      .filter(
        (result): result is PromiseFulfilledResult<any> =>
          result.status === "fulfilled",
      )
      .map((result) => result.value);

    if (successfulResults.length === 0) {
      const errors = pageSpeedResults
        .filter((result) => result.status === "rejected")
        .map((result) => result.reason?.message ?? String(result.reason))
        .join(" | ");
      throw new Error(
        `O PageSpeed Insights não respondeu em nenhuma estratégia. ${errors}`,
      );
    }
    [mobile, desktop] = [successfulResults[0], successfulResults[1]];
    if (successfulResults.length === 1) {
      const failedStrategy =
        pageSpeedResults[0].status === "rejected" ? "mobile" : "desktop";
      console.warn(
        `PageSpeed ${failedStrategy} falhou; continuando com o resultado disponível.`,
      );
    }

    // If only one strategy succeeded, use it for both to continue generating the report (best-effort)
    const fallback = mobile ?? desktop;
    mobile = mobile ?? fallback;
    desktop = desktop ?? fallback;
    console.log("PageSpeed ok. Skipping visual cards to reduce latency.");

    // Skip generating visual cards to reduce latency — no screenshots included
    (mobile as any).pagespeedScreenshot = null;
    (desktop as any).pagespeedScreenshot = null;
    // Also clear raw PageSpeed screenshots to avoid further processing
    (mobile as any).screenshot = null;
    (desktop as any).screenshot = null;
    console.log(
      "Skipped visual card generation and cleared screenshots to reduce latency.",
    );

    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");

    console.log("Gerando IA… (se configurada)");
    if (openRouterApiKey) {
      try {
        ai = await aiAnalysis(url, mobile, desktop, mobile.screenshot);
        console.log("IA ok via OpenRouter.");
      } catch (e) {
        console.warn("aiAnalysis (OpenRouter) falhou:", e?.message ?? e);
        ai = { improvements: [], uiux: null, extras: [] };
      }
    } else {
      console.warn(
        "Nenhuma chave de IA configurada (OPENROUTER_API_KEY) — pulando análise IA e usando fallback.",
      );
      ai = { improvements: [], uiux: null, extras: [] };
    }
    const summaryResponse = {
      ...buildSummaryResponse(mobile, desktop, ai),
      scoreAvailability,
    };

    return new Response(JSON.stringify(summaryResponse), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("diagnose error", e);
    return new Response(
      JSON.stringify({ error: e.message ?? "Erro desconhecido" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
