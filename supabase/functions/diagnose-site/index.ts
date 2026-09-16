// @ts-nocheck
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, ImageRun, PageBreak,
  Header, BorderStyle,
} from "https://esm.sh/docx@8.5.0";
import { HEADER_PNG_B64 } from "./header-asset.ts";

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_KEY = Deno.env.get("SUPABASE_KEY") ?? "";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// OpenRouter defaults
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const OPENROUTER_API_BASE = Deno.env.get("OPENROUTER_API_BASE") ?? "https://api.openrouter.ai";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PAGESPEED = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function runPageSpeed(url: string, strategy: "mobile" | "desktop") {
  const params = new URLSearchParams({ url, strategy });
  ["performance", "accessibility", "best-practices", "seo"].forEach((c) => params.append("category", c));
  const apiKey = Deno.env.get("PAGESPEED_API_KEY");
  if (apiKey) params.append("key", apiKey);

    async function safeFetchWithRetries(fullUrl: string, options: any = {}, retries = 0, backoff = 200, perRequestTimeout = Number(Deno.env.get("AUDIT_REQUEST_TIMEOUT_MS") || 6000)) {
    // Retries default reduced to 0 for lower latency. Each request is aborted after perRequestTimeout ms.
    for (let i = 0; i <= retries; i++) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), perRequestTimeout);
      try {
        const res = await fetch(fullUrl, { ...options, signal: controller.signal });
        clearTimeout(id);
        if (res.status !== 429) return res;
        // 429 -> wait and retry if attempts remain
        if (i < retries) await new Promise((r) => setTimeout(r, backoff * (i + 1)));
        else return res;
      } catch (e) {
        clearTimeout(id);
        // Treat abort as a transient error and retry if attempts remain
        if (i === retries) throw e;
        await new Promise((r) => setTimeout(r, backoff * (i + 1)));
      }
    }
  }

  const res = await safeFetchWithRetries(`${PAGESPEED}?${params}`);
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
        googleMsg ?? "PageSpeed API recusou a requisição. Verifique se a API está ativada e se PAGESPEED_API_KEY é válida.",
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
  const opportunities = Object.values(audits)
    .filter((a: any) => {
      const t = a.details?.type;
      const scoreMode = a.scoreDisplayMode;
      const actionableScore = typeof a.score === "number"
        && a.score < 0.9
        && scoreMode !== "notApplicable"
        && scoreMode !== "manual";
      const hasSavings = (a.details?.overallSavingsMs ?? 0) > 0
        || (a.details?.overallSavingsBytes ?? 0) > 0;
      const hasDiagnosticDetails = t === "diagnostic"
        && (a.details?.items?.length || a.displayValue);

      return !excludedAuditIds.has(a.id)
        && !/(screenshot|thumbnail|trace|filmstrip)/i.test(a.id)
        && (
          t === "opportunity"
          || actionableScore
          || hasSavings
          || hasDiagnosticDetails
        );
    })
    .sort((a: any, b: any) => {
      const aImpact = (a.details?.overallSavingsBytes ?? 0) / 1000
        + (a.details?.overallSavingsMs ?? 0)
        + (1 - (a.score ?? 1)) * 100;
      const bImpact = (b.details?.overallSavingsBytes ?? 0) / 1000
        + (b.details?.overallSavingsMs ?? 0)
        + (1 - (b.score ?? 1)) * 100;
      return bImpact - aImpact;
    })
    .slice(0, 8)
    .map((a: any) => ({
      id: a.id,
      title: translatePageSpeedTitle(PAGE_SPEED_LABELS[a.id]?.title ?? a.title),
      rawDescription: a.description,
      displayValue: translatePageSpeedDisplayValue(a.displayValue),
      score: a.score,
    }));
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
    opportunities,
    finalUrl: lr.finalUrl,
  };
}

const PAGE_SPEED_LABELS: Record<string, { title: string; recommendation: string }> = {
  "render-blocking-resources": {
    title: "Eliminar recursos que bloqueiam a renderização",
    recommendation: "Inserir o CSS essencial diretamente na página e adiar o carregamento de CSS não crítico. Aplicar defer ou async aos scripts que não são necessários para a primeira renderização.",
  },
  "unused-javascript": {
    title: "Reduzir JavaScript não utilizado",
    recommendation: "Remover dependências e códigos que não são usados nesta página e carregar scripts apenas quando o recurso correspondente for utilizado.",
  },
  "unused-css-rules": {
    title: "Reduzir CSS não utilizado",
    recommendation: "Remover regras de estilo não utilizadas e dividir o CSS por página ou componente para entregar somente o necessário ao visitante.",
  },
  "uses-long-cache-ttl": {
    title: "Usar políticas de cache eficientes",
    recommendation: "Configurar cache longo para arquivos estáticos próprios, como CSS, JavaScript, fontes e imagens, usando versionamento quando houver alterações.",
  },
  "uses-optimized-images": {
    title: "Otimizar imagens",
    recommendation: "Converter imagens para WebP ou AVIF, reduzir suas dimensões e aplicar compressão adequada sem comprometer a qualidade visual.",
  },
  "offscreen-images": {
    title: "Adiar o carregamento de imagens fora da tela",
    recommendation: "Ativar lazy loading para imagens que aparecem abaixo da primeira dobra e manter o carregamento prioritário apenas para o conteúdo inicial.",
  },
  "uses-responsive-images": {
    title: "Entregar imagens responsivas",
    recommendation: "Disponibilizar versões adequadas para cada tamanho de tela usando srcset e sizes, evitando baixar arquivos maiores do que o necessário.",
  },
  "largest-contentful-paint-element": {
    title: "Melhorar o Largest Contentful Paint (LCP)",
    recommendation: "Identificar o maior elemento visível, priorizar seu carregamento e reduzir o tempo de resposta do servidor, o peso da imagem ou do conteúdo que o compõe.",
  },
  "server-response-time": {
    title: "Reduzir o tempo de resposta do servidor (TTFB)",
    recommendation: "Avaliar hospedagem, cache de página, consultas e scripts do servidor para diminuir o tempo até o primeiro byte.",
  },
  "font-display": {
    title: "Configurar a exibição das fontes",
    recommendation: "Usar font-display: swap ou opcional e pré-carregar somente as fontes realmente necessárias para evitar texto invisível durante o carregamento.",
  },
  "modern-image-formats": {
    title: "Usar formatos de imagem de última geração",
    recommendation: "Formatos como WebP e AVIF geralmente oferecem melhor compressão do que PNG ou JPEG, o que resulta em downloads mais rápidos e menor consumo de dados.",
  },
  "dom-size": {
    title: "Evitar um tamanho excessivo do DOM",
    recommendation: "Reduzir a complexidade da página simplificando a estrutura HTML e removendo elementos desnecessários, o que melhora o tempo de processamento do navegador.",
  },
  "unminified-javascript": {
    title: "Minificar JavaScript",
    recommendation: "Remover espaços em branco, comentários e outros caracteres irrelevantes dos arquivos de script para reduzir seu tamanho total.",
  },
  "unminified-css": {
    title: "Minificar CSS",
    recommendation: "Compactar os arquivos de estilo para reduzir o peso da página e acelerar o download dos recursos visuais.",
  },
  "efficient-animated-content": {
    title: "Usar formatos de vídeo para conteúdo animado",
    recommendation: "Substituir GIFs grandes por vídeos MP4/WebM ou animações CSS/Lottie para reduzir drasticamente o peso dos elementos em movimento.",
  },
  "network-dependency-tree": {
    title: "Reduzir a cadeia de solicitações críticas",
    recommendation: "Reduzir dependências em sequência, eliminar recursos desnecessários e priorizar apenas os arquivos necessários para o conteúdo inicial.",
  },
  "legacy-javascript": {
    title: "Reduzir JavaScript legado",
    recommendation: "Entregar JavaScript moderno para navegadores atuais e evitar polyfills e transformações que não são necessários para o público-alvo.",
  },
  "long-tasks": {
    title: "Evitar tarefas longas na linha de execução principal",
    recommendation: "Dividir tarefas JavaScript longas, adiar scripts não essenciais e reduzir o trabalho executado durante o carregamento inicial.",
  },
  "third-parties": {
    title: "Reduzir o impacto de scripts de terceiros",
    recommendation: "Adiar analytics, anúncios, chats e pixels até que sejam necessários ou após a interação do usuário, preservando o carregamento do conteúdo principal.",
  },
  "unsized-images": {
    title: "Definir dimensões das imagens",
    recommendation: "Informar width e height ou aspect-ratio para todas as imagens, reservando espaço antes do download e evitando mudanças de layout.",
  },
  "uses-text-compression": {
    title: "Ativar compressão dos recursos",
    recommendation: "Configurar Brotli ou GZIP para HTML, CSS e JavaScript e verificar se a compressão está ativa no servidor e no CDN.",
  },
  "total-byte-weight": {
    title: "Reduzir o tamanho total dos recursos",
    recommendation: "Remover recursos desnecessários, comprimir imagens e adiar scripts e estilos que não participam da renderização inicial.",
  },
};

const PAGE_SPEED_TITLE_TRANSLATIONS: Record<string, string> = {
  "render-blocking resources": "Recursos que bloqueiam a renderização",
  "render-blocking resources (render-blocking resources)": "Recursos que bloqueiam a renderização",
  "legacy javascript": "JavaScript legado",
  "unused javascript": "JavaScript não utilizado",
  "unused css": "CSS não utilizado",
  "reduce javascript execution time": "Reduzir o tempo de execução de JavaScript",
  "main-thread work": "Minimizar o trabalho da linha de execução principal",
  "efficient cache lifetimes": "Usar ciclos de vida eficientes de cache",
  "properly size images": "Dimensionar as imagens corretamente",
  "modern image formats": "Usar formatos modernos de imagem",
  "image elements do not have explicit width and height": "Definir dimensões explícitas para as imagens",
  "largest contentful paint": "Detalhamento do maior elemento de conteúdo (LCP)",
  "network dependency tree": "Reduzir a cadeia de solicitações críticas",
  "long tasks": "Evitar tarefas longas na linha de execução principal",
  "third parties": "Reduzir o impacto de scripts de terceiros",
  "total byte weight": "Reduzir o peso total da página",
  "uses text compression": "Ativar a compressão de recursos",
  "unused css rules": "Reduzir CSS não utilizado",
  "server response time": "Reduzir o tempo de resposta do servidor",
  "missing source maps for large first-party javascript": "Adicionar mapas de origem ao JavaScript próprio",
  "links do not have a discernible name": "Nomear os links de forma compreensível",
  "links do not have discernible names": "Nomear os links de forma compreensível",
  "improve image delivery": "Melhorar a entrega de imagens",
  "document does not have a main landmark": "Definir uma região principal no documento",
  "render-blocking requests": "Eliminar solicitações que bloqueiam a renderização",
  "critical request chains": "Reduzir as cadeias de solicitações críticas",
  "use efficient cache lifetimes": "Usar ciclos de vida eficientes de cache",
};

function translatePageSpeedTitle(title: string): string {
  const normalized = String(title ?? "").trim().toLowerCase();
  return PAGE_SPEED_TITLE_TRANSLATIONS[normalized] ?? title
    .replace(/\bRender-blocking resources\b/gi, "Recursos que bloqueiam a renderização")
    .replace(/\bLegacy JavaScript\b/gi, "JavaScript legado")
    .replace(/\bUnused JavaScript\b/gi, "JavaScript não utilizado")
    .replace(/\bUnused CSS\b/gi, "CSS não utilizado")
    .replace(/\bMain-thread work\b/gi, "Trabalho da linha de execução principal")
    .replace(/\bLargest Contentful Paint\b/gi, "Maior elemento de conteúdo")
    .replace(/\bFirst Contentful Paint\b/gi, "Primeira renderização de conteúdo")
    .replace(/\bTotal Blocking Time\b/gi, "Tempo total de bloqueio")
    .replace(/\bCumulative Layout Shift\b/gi, "Mudança cumulativa de layout")
    .replace(/\bSpeed Index\b/gi, "Índice de velocidade")
    .replace(/\bMissing source maps for large first-party JavaScript\b/gi, "Adicionar mapas de origem ao JavaScript próprio")
    .replace(/\bLinks do not have a discernible name\b/gi, "Nomear os links de forma compreensível")
    .replace(/\bImprove image delivery\b/gi, "Melhorar a entrega de imagens")
    .replace(/\bNetwork dependency tree\b/gi, "Reduzir a árvore de dependências de rede")
    .replace(/\bDocument does not have a main landmark\b/gi, "Definir uma região principal no documento")
    .replace(/\bRender-blocking requests\b/gi, "Eliminar solicitações que bloqueiam a renderização")
    .replace(/\bEst savings of\b/gi, "Economia estimada de");
}

function translatePageSpeedDisplayValue(displayValue: string | undefined): string | undefined {
  return displayValue?.replace(/\bEst savings of\b/gi, "Economia estimada de");
}

function translateReportText(value: unknown): string {
  return String(value ?? "")
    .replace(/\bRender-blocking resources\b/gi, "recursos que bloqueiam a renderização")
    .replace(/\bRender-blocking requests\b/gi, "solicitações que bloqueiam a renderização")
    .replace(/\bUnused JavaScript\b/gi, "JavaScript não utilizado")
    .replace(/\bUnused CSS\b/gi, "CSS não utilizado")
    .replace(/\bLegacy JavaScript\b/gi, "JavaScript legado")
    .replace(/\bMain-thread work\b/gi, "trabalho da linha de execução principal")
    .replace(/\bLargest Contentful Paint\b/gi, "maior elemento de conteúdo")
    .replace(/\bFirst Contentful Paint\b/gi, "primeira renderização de conteúdo")
    .replace(/\bTotal Blocking Time\b/gi, "tempo total de bloqueio")
    .replace(/\bCumulative Layout Shift\b/gi, "mudança cumulativa de layout")
    .replace(/\bSpeed Index\b/gi, "índice de velocidade")
    .replace(/\bNetwork dependency tree\b/gi, "árvore de dependências de rede")
    .replace(/\bMissing source maps\b/gi, "mapas de origem ausentes")
    .replace(/\bsource maps\b/gi, "mapas de origem")
    .replace(/\bfirst-party\b/gi, "próprio")
    .replace(/\bImprove image delivery\b/gi, "melhorar a entrega de imagens")
    .replace(/\bDocument does not have a main landmark\b/gi, "o documento não possui uma região principal")
    .replace(/\bLinks do not have a discernible name\b/gi, "há links sem nome compreensível")
    .replace(/\bEfficient cache lifetimes\b/gi, "ciclos de vida eficientes de cache")
    .replace(/\bThird-party code\b/gi, "código de terceiros")
    .replace(/\bthird-party\b/gi, "de terceiros")
    .replace(/\bJavaScript execution time\b/gi, "tempo de execução do JavaScript")
    .replace(/\bEst savings of\b/gi, "economia estimada de")
    .replace(/\bImprove\b/gi, "melhorar")
    .replace(/\bReduce\b/gi, "reduzir")
    .replace(/\bAvoid\b/gi, "evitar")
    .replace(/\bUse\b/gi, "usar");
}

function translatePageSpeedDescription(description: string | undefined): string {
  if (!description) return "O relatório identificou este ponto como uma melhoria específica para a página analisada.";
  return description
    .replace(/^Eliminate render-blocking resources by inlining critical resources and deferring non-critical resources\./i, "Recursos de CSS e JavaScript estão bloqueando a renderização inicial. O conteúdo crítico deve ser carregado primeiro e os recursos não essenciais devem ser adiados.")
    .replace(/^Reduce unused JavaScript and defer loading scripts until they are needed to reduce bytes consumed by network activity\./i, "Há JavaScript carregado que não é utilizado durante o carregamento inicial. Esses scripts devem ser adiados até que sejam necessários.")
    .replace(/^Reduce unused rules from stylesheets and defer CSS not used for above-the-fold content to reduce unnecessary bytes consumed by network activity\./i, "As folhas de estilo contêm regras que não são utilizadas no conteúdo inicial. O CSS não crítico deve ser removido, dividido ou adiado.")
    .replace(/^Serve images that are appropriately-sized to save cellular data and improve load time\./i, "Há imagens maiores do que as dimensões em que são exibidas. Entregar arquivos dimensionados corretamente reduz o download e melhora o carregamento.")
    .replace(/^Serve images in next-gen formats to reduce the download size of images and improve page load time\./i, "As imagens podem ser entregues em formatos modernos, como WebP ou AVIF, para reduzir o tamanho do download.")
    .replace(/^Avoid serving legacy JavaScript to modern browsers\./i, "Parte do JavaScript atende navegadores antigos e pode ser substituída por código moderno para reduzir o processamento.")
    .replace(/^Reduce the impact of third-party code\./i, "Scripts de terceiros estão consumindo rede e processamento durante o carregamento. Eles devem ser reduzidos ou adiados.")
    .replace(/^Serve static assets with an efficient cache policy\./i, "Os recursos estáticos não estão utilizando uma política de cache suficientemente eficiente para visitas recorrentes.")
    .replace(/^Avoid chaining critical requests\./i, "A página depende de várias solicitações críticas em sequência, aumentando o tempo até que os recursos principais sejam carregados.")
    .replace(/^Reduce JavaScript execution time\./i, "O navegador está gastando tempo elevado para interpretar, compilar e executar JavaScript.")
    .replace(/^Minimize main-thread work\./i, "A linha de execução principal está sobrecarregada com tarefas de JavaScript, estilo, layout e renderização.")
    .replace(/^Image elements do not have explicit width and height\./i, "Há imagens sem dimensões explícitas, o que pode fazer o layout mudar durante o carregamento.")
    .replace(/^Document does not have a main landmark\./i, "O documento não define uma região principal, dificultando a navegação por tecnologias assistivas.")
    .replace(/^Links do not have discernible names\./i, "Há links sem um nome compreensível para leitores de tela e outros recursos de tecnologia assistiva.")
    .replace(/^Missing source maps for large first-party JavaScript\./i, "Os arquivos JavaScript próprios de maior tamanho não possuem mapas de origem para facilitar a investigação e manutenção.")
    .replace(/^Render-blocking requests\./i, "Há solicitações de rede bloqueando a renderização inicial e atrasando a exibição do conteúdo visível.");
}


// Supabase helpers (pagespeed_translations table)
async function getPagespeedTranslation(audit_id: string): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  try {
    const { data, error } = await supabase
      .from("pagespeed_translations")
      .select("translated_description")
      .eq("audit_id", audit_id)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.warn("supabase getPagespeedTranslation error", error.message ?? error);
      return null;
    }
    return data?.translated_description ?? null;
  } catch (e) {
    console.warn("getPagespeedTranslation failed", e?.message ?? e);
    return null;
  }
}

async function upsertPagespeedTranslation(audit_id: string, translated: string) {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    await supabase.from("pagespeed_translations").upsert({
      audit_id,
      translated_description: translated,
      updated_at: new Date().toISOString(),
    }, { onConflict: ["audit_id"] });
  } catch (e) {
    console.warn("upsertPagespeedTranslation failed", e?.message ?? e);
  }
}

// Batch-translate summary items using OpenRouter (single call)
async function translateSummaryFields(items: Array<{ audit_id: string; text: string }>) {
  if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY não configurada");

  // Build the prompt instructing the model to return strict JSON
  const system = "Você é um tradutor técnico para pt-BR. Preserve siglas (LCP, CLS, TBT, FCP, TTFB) e termos técnicos. Retorne apenas JSON válido. Não adicione prefixos como 'PT-BR:' ou similares — 'translated_text' deve conter apenas o texto em português brasileiro.";
  const userPrompt = `Receba um array JSON com objetos { "audit_id", "text" } e retorne um array JSON com objetos { "audit_id", "translated_text" } onde translated_text é a tradução/adaptação técnica em português brasileiro. Não misture inglês e português na mesma frase. Preserve siglas técnicas entre parênteses apenas se necessário.

Entrada:
${JSON.stringify(items, null, 2)}

Resposta: retorne somente JSON, exemplo:
[
  { "audit_id": "unused-javascript", "translated_text": "Texto em português..." },
  ...
]`;

  const res = await fetch(`${OPENROUTER_API_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-5-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.0,
      max_tokens: 2000,
    }),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`OpenRouter translation request falhou: ${res.status} ${txt}`);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content ?? "";

  // Tentar parsear JSON da resposta (tentar extrair substring JSON se necessário)
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch (e) {
    // tentar extrair a primeira substring JSON (curto fallback)
    const match = content.match(/\[.*\]/s);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch (e2) {
        throw new Error("Falha ao parsear JSON de tradução em lote");
      }
    } else {
      throw new Error("Resposta da OpenRouter não continha JSON esperado");
    }
  }

  // parsed deve ser um array de {audit_id, translated_text}
  if (!Array.isArray(parsed)) throw new Error("Formato inesperado da tradução (esperado array)");

  // Upsert no supabase e retornar mapa
  const map: Record<string, string> = {};
  for (const it of parsed) {
    if (it?.audit_id && it?.translated_text) {
      map[it.audit_id] = it.translated_text;
      // salva no cache (não bloquear a resposta)
      upsertPagespeedTranslation(it.audit_id, it.translated_text).catch((e) =>
        console.warn("upsertPagespeedTranslation error", e?.message ?? e),
      );
    }
  }
  return map;
}

function localizedPageSpeedOpportunity(opportunity: any) {
  const localized = PAGE_SPEED_LABELS[opportunity.id];
  const title = translatePageSpeedTitle(localized?.title ?? opportunity.title
    .replace(/^Properly size images$/i, "Dimensionar as imagens corretamente")
    .replace(/^Efficiently encode images$/i, "Codificar as imagens com eficiência")
    .replace(/^Minify JavaScript$/i, "Minificar JavaScript")
    .replace(/^Minify CSS$/i, "Minificar CSS"));

  return {
    title,
    description: `${PAGE_SPEED_SHORT_DESCRIPTIONS[opportunity.id] ?? translatePageSpeedDescription(opportunity.rawDescription).split(/[.!?](?:\s|$)/)[0] + "."}${opportunity.displayValue ? ` (${translatePageSpeedDisplayValue(opportunity.displayValue)})` : ""}`,
    impact: ["Pode atrasar a exibição do conteúdo principal.", "Pode aumentar o tempo de carregamento no primeiro acesso."],
    causes: [
      "Carregamento de recursos ou funcionalidades não utilizados na página.",
      "Configurações padrão do CMS, do tema ou de plugins de terceiros.",
    ],
    recommendations: [localized?.recommendation ?? "Revisar este recurso no relatório detalhado do PageSpeed e aplicar a correção indicada para reduzir o impacto no carregamento."],
  };
}

function buildPageSpeedImprovements(mobile: any, desktop: any) {
  const opportunities = [...(mobile.opportunities ?? []), ...(desktop.opportunities ?? [])];
  const unique = opportunities.filter((opportunity, index, list) =>
    list.findIndex((item) => item.id === opportunity.id) === index,
  );
  const improvements = unique.slice(0, 8).map(localizedPageSpeedOpportunity);
  const metricFallbacks = [
    {
      id: "lcp-metric",
      value: mobile.metrics?.lcp,
      title: "Melhorar o carregamento do conteúdo principal",
      description: `O PageSpeed registrou LCP de ${mobile.metrics?.lcp ?? "—"} no mobile e ${desktop.metrics?.lcp ?? "—"} no desktop.`,
      impact: ["O conteúdo principal pode demorar para aparecer no primeiro acesso.", "A percepção de velocidade pode ser prejudicada em redes móveis."],
      causes: ["Imagem, banner ou bloco principal pesado.", "CSS, fontes ou scripts bloqueando a renderização inicial."],
      recommendations: ["Otimizar o elemento identificado como maior conteúdo, priorizar seus recursos e revisar o tempo de resposta do servidor."],
    },
    {
      id: "tbt-metric",
      value: mobile.metrics?.tbt,
      title: "Reduzir o trabalho do navegador",
      description: `O tempo de bloqueio total registrado foi de ${mobile.metrics?.tbt ?? "—"} no mobile e ${desktop.metrics?.tbt ?? "—"} no desktop.`,
      impact: ["Interações podem ficar indisponíveis enquanto a página é processada.", "Dispositivos móveis podem sentir mais lentidão."],
      causes: ["Scripts grandes ou executados durante o carregamento inicial.", "Plugins, rastreadores e widgets de terceiros."],
      recommendations: ["Reduzir JavaScript não utilizado, adiar scripts não críticos e dividir tarefas longas em partes menores."],
    },
    {
      id: "cls-metric",
      value: mobile.metrics?.cls,
      title: "Evitar mudanças inesperadas no layout",
      description: `O PageSpeed registrou CLS de ${mobile.metrics?.cls ?? "—"} no mobile e ${desktop.metrics?.cls ?? "—"} no desktop.`,
      impact: ["Elementos podem mudar de posição durante o carregamento.", "A navegação pode causar cliques ou interações acidentais."],
      causes: ["Imagens ou elementos sem dimensões definidas.", "Fontes e conteúdos dinâmicos alterando o layout após a renderização."],
      recommendations: ["Definir dimensões para imagens e anúncios, reservar espaço para conteúdo dinâmico e evitar inserir elementos acima do conteúdo já renderizado."],
    },
    {
      id: "fcp-metric",
      value: mobile.metrics?.fcp,
      title: "Acelerar a primeira renderização",
      description: `O PageSpeed registrou FCP de ${mobile.metrics?.fcp ?? "—"} no mobile e ${desktop.metrics?.fcp ?? "—"} no desktop.`,
      impact: ["O visitante pode visualizar uma tela vazia por mais tempo.", "A percepção inicial de velocidade pode ser prejudicada."],
      causes: ["Recursos CSS e JavaScript bloqueando a renderização.", "Servidor, fontes ou recursos críticos com alta latência."],
      recommendations: ["Reduzir recursos bloqueantes, otimizar o caminho crítico de renderização e priorizar o conteúdo visível."],
    },
    {
      id: "ttfb-metric",
      value: mobile.metrics?.ttfb,
      title: "Reduzir o tempo de resposta do servidor",
      description: `O PageSpeed registrou TTFB de ${mobile.metrics?.ttfb ?? "—"} no mobile e ${desktop.metrics?.ttfb ?? "—"} no desktop.`,
      impact: ["Todos os recursos da página começam a carregar mais tarde.", "O atraso é mais perceptível em redes móveis."],
      causes: ["Falta de cache de página ou consultas lentas no servidor.", "Hospedagem ou processamento de plugins consumindo muitos recursos."],
      recommendations: ["Usar cache de página, revisar consultas e processamento no servidor e avaliar a infraestrutura de hospedagem."],
    },
    {
      id: "page-weight-metric",
      value: mobile.metrics?.pageSize,
      title: "Reduzir o peso total da página",
      description: `O PageSpeed mediu ${mobile.metrics?.pageSize ?? "—"} no mobile e ${desktop.metrics?.pageSize ?? "—"} no desktop para o peso total da página.`,
      impact: ["O download consome mais tempo e dados.", "Usuários em redes lentas podem abandonar a página antes do carregamento."],
      causes: ["Imagens, folhas de estilo e scripts maiores do que o necessário.", "Recursos de plugins e integrações carregados globalmente."],
      recommendations: ["Comprimir imagens, remover recursos desnecessários e ativar compressão e cache para arquivos estáticos."],
    },
  ];
  const existingTitles = new Set(improvements.map((improvement: any) => improvement.title.toLowerCase()));
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


function looksLikeEnglish(s: string | undefined): boolean {
  if (!s) return false;
  const str = String(s);
  // Simple heuristic: presence of common English stopwords without Portuguese indicators
  const eng = /\b(the|and|to|for|use|using|with|in|on|of|is|are|you|your|this|that|will|can|should)\b/i;
  const por = /\b(para|com|e|de|o|a|dos|das|no|na|por|pelo|pela|uma|um|não|não|se|que)\b/i;
  const hasEng = eng.test(str);
  const hasPor = por.test(str);
  return hasEng && !hasPor;
}

function sanitizeAiImprovement(improvement: any, pageSpeedImprovements: any[], idx: number) {
  const pageImp = pageSpeedImprovements?.[idx] ?? null;

  const sanitizeField = (field: any, fallback: any) => {
    if (typeof field === 'string') {
      if (looksLikeEnglish(field)) {
        return fallback ?? null;
      }
      return field;
    }
    return field;
  };

  const sanitizeArray = (arr: any, fallbackArr: any[]) => {
    if (Array.isArray(arr) && arr.length > 0) {
      // If any element looks like English, prefer fallback
      const anyEnglish = arr.some((v: any) => looksLikeEnglish(String(v)));
      if (anyEnglish) return fallbackArr ?? arr;
      return arr;
    }
    return fallbackArr ?? arr;
  };

  return {
    title: sanitizeField(improvement?.title, pageImp?.title ?? (pageImp ? translatePageSpeedTitle(pageImp.id ?? '') : null)),
    description: sanitizeField(improvement?.description, pageImp?.description ?? pageImp?.rawDescription ?? null),
    impact: sanitizeArray(improvement?.impact, pageImp?.impact ?? null),
    causes: sanitizeArray(improvement?.causes, pageImp?.causes ?? null),
    recommendations: sanitizeArray(improvement?.recommendations, pageImp?.recommendations ?? null),
  };
}

// buildSummaryResponse: monta o JSON que antes era retornado inline.
  const pageSpeedImprovements = buildPageSpeedImprovements(mobile, desktop);

  let finalAi = ai ?? { improvements: [], uiux: null, extras: [] };

  if (!Array.isArray(finalAi?.improvements) || finalAi.improvements.length === 0) {
    finalAi = { ...finalAi, improvements: pageSpeedImprovements };
  } else if (finalAi.improvements.length < 8) {
    const existingTitles = new Set(
      finalAi.improvements
        .map((improvement: any) => String(improvement.title ?? "").trim().toLowerCase())
        .filter(Boolean),
    );
    const mergedImprovements = [...finalAi.improvements];
    for (const improvement of pageSpeedImprovements) {
      const title = String(improvement.title ?? "").trim().toLowerCase();
      if (title && !existingTitles.has(title)) {
        mergedImprovements.push(improvement);
        existingTitles.add(title);
      }
      if (mergedImprovements.length >= 8) break;
    }
    finalAi = { ...finalAi, improvements: mergedImprovements };
  }

  // Aplicar sanitização dos textos gerados pela IA: evitar aplicar translateReportText que mistura inglês/português.
  if (Array.isArray(finalAi?.improvements)) {
    const psImps = pageSpeedImprovements;
    finalAi = {
      ...finalAi,
      improvements: finalAi.improvements.slice(0, 8).map((improvement: any, idx: number) => {
        const sanitized = sanitizeAiImprovement(improvement, psImps, idx);
        const fallback = psImps[idx] ?? null;
        return {
          title:
            sanitized.title ??
            (improvement?.title ? translatePageSpeedTitle(improvement.title) : (fallback?.title ?? translatePageSpeedTitle(fallback?.id ?? ""))),
          description:
            sanitized.description ??
            improvement?.description ??
            fallback?.description ??
            (fallback?.rawDescription ? translatePageSpeedDescription(fallback.rawDescription) : "Problema identificado no carregamento da página."),
          impact: Array.isArray(sanitized.impact) && sanitized.impact.length > 0
            ? sanitized.impact
            : (fallback?.impact ?? ["Pode atrasar o carregamento e a interação com a página."]),
          causes: Array.isArray(sanitized.causes) && sanitized.causes.length > 0
            ? sanitized.causes
            : (fallback?.causes ?? [
                "Recursos ou funcionalidades carregados sem necessidade no primeiro acesso.",
                "Configurações padrão do CMS, do tema ou de plugins de terceiros.",
              ]),
          recommendations: Array.isArray(sanitized.recommendations) && sanitized.recommendations.length > 0
            ? sanitized.recommendations
            : (fallback?.recommendations ?? ["Revisar e otimizar o recurso indicado no diagnóstico."]),
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
        opportunities: mobile.opportunities ?? [],
      },
      desktop: {
        scores: desktop.scores,
        metrics: desktop.metrics,
        screenshot: null,
        pagespeedScreenshot: null,
        opportunities: desktop.opportunities ?? [],
      },
      screenshot: null,
    },
    improvements: finalAi.improvements ?? [],
    uiux: finalAi.uiux ?? null,
    extras: finalAi.extras ?? [],
  };

  return summaryResponse;
}


// Cores estilo PageSpeed (faixas de score)
function scoreColor(score: number): { ring: string; bg: string; text: string } {
  if (score >= 90) return { ring: "#0CCE6B", bg: "#E6F4EA", text: "#0A7D43" };
  if (score >= 50) return { ring: "#FFA400", bg: "#FFF3E0", text: "#B86E00" };
  return { ring: "#FF4E42", bg: "#FCE8E6", text: "#C5221F" };
}

// Renderiza um SVG estilo PageSpeed com os 4 círculos + screenshot do site embutido
function buildPageSpeedSvg(
  scores: { performance: number; accessibility: number; bestPractices: number; seo: number },
  screenshotDataUrl: string | null,
  strategy: "mobile" | "desktop",
): string {
  const W = 1200;
  const H = 720;
  const items = [
    { label: "Desempenho", value: scores.performance },
    { label: "Acessibilidade", value: scores.accessibility },
    { label: "Práticas recomendadas", value: scores.bestPractices },
    { label: "SEO", value: scores.seo },
  ];

  const circleRow = items.map((it, i) => {
    const c = scoreColor(it.value);
    const cx = 180 + i * 230;
    const cy = 110;
    const r = 52;
    const circumference = 2 * Math.PI * r;
    const dash = (it.value / 100) * circumference;
    return `
      <g transform="translate(${cx}, ${cy})">
        <circle r="${r}" fill="${c.bg}" />
        <circle r="${r}" fill="none" stroke="${c.ring}" stroke-width="6"
                stroke-dasharray="${dash} ${circumference}" stroke-linecap="round"
                transform="rotate(-90)" />
        <text text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif"
              font-size="34" font-weight="600" fill="${c.text}">${it.value}</text>
        <text y="${r + 30}" text-anchor="middle" font-family="Arial, sans-serif"
              font-size="18" fill="#3C4043">${it.label}</text>
      </g>`;
  }).join("");

  // Score principal grande (Desempenho) à esquerda
  const main = scoreColor(scores.performance);
  const mainCx = 240;
  const mainCy = 430;
  const mainR = 110;
  const mainCirc = 2 * Math.PI * mainR;
  const mainDash = (scores.performance / 100) * mainCirc;

  const screenshotEmbed = screenshotDataUrl
    ? `<image x="640" y="290" width="${strategy === "mobile" ? 200 : 480}" height="${strategy === "mobile" ? 360 : 290}"
              href="${screenshotDataUrl}" preserveAspectRatio="xMidYMid meet" />`
    : `<rect x="640" y="290" width="480" height="290" fill="#F1F3F4" stroke="#DADCE0" />`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#FFFFFF" />
  <rect x="20" y="20" width="${W - 40}" height="${H - 40}" fill="#FFFFFF" stroke="#DADCE0" rx="8" />

  <!-- Tabs -->
  <text x="${W / 2 - 60}" y="60" font-family="Arial, sans-serif" font-size="16"
        fill="${strategy === "mobile" ? "#1A73E8" : "#5F6368"}" font-weight="${strategy === "mobile" ? "600" : "400"}">📱 Celular</text>
  <text x="${W / 2 + 30}" y="60" font-family="Arial, sans-serif" font-size="16"
        fill="${strategy === "desktop" ? "#1A73E8" : "#5F6368"}" font-weight="${strategy === "desktop" ? "600" : "400"}">🖥 Computador</text>
  <line x1="40" y1="80" x2="${W - 40}" y2="80" stroke="#E8EAED" />

  ${circleRow}

  <line x1="40" y1="220" x2="${W - 40}" y2="220" stroke="#E8EAED" />

  <!-- Score grande à esquerda -->
  <g transform="translate(${mainCx}, ${mainCy})">
    <circle r="${mainR}" fill="${main.bg}" />
    <circle r="${mainR}" fill="none" stroke="${main.ring}" stroke-width="10"
            stroke-dasharray="${mainDash} ${mainCirc}" stroke-linecap="round"
            transform="rotate(-90)" />
    <text text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif"
          font-size="68" font-weight="600" fill="${main.text}">${scores.performance}</text>
  </g>
  <text x="${mainCx}" y="${mainCy + mainR + 40}" text-anchor="middle"
        font-family="Arial, sans-serif" font-size="24" fill="#202124">Desempenho</text>

  <!-- Screenshot do site -->
  ${screenshotEmbed}

  <!-- Legenda -->
  <g transform="translate(120, 660)" font-family="Arial, sans-serif" font-size="13" fill="#5F6368">
    <polygon points="0,0 10,0 5,-9" fill="#FF4E42" />
    <text x="18" y="0">0–49</text>
    <rect x="70" y="-9" width="10" height="9" fill="#FFA400" />
    <text x="88" y="0">50–89</text>
    <circle cx="150" cy="-4" r="5" fill="#0CCE6B" />
    <text x="162" y="0">90–100</text>
  </g>
</svg>`;
}

// Converte SVG para PNG usando resvg-wasm (renderização local, sem limites de URL)
let resvgInitialized = false;
async function ensureResvg() {
  if (resvgInitialized) return;
  const mod: any = await import("https://esm.sh/@resvg/resvg-wasm@2.6.2");
  const wasmRes = await fetch("https://esm.sh/@resvg/resvg-wasm@2.6.2/index_bg.wasm");
  await mod.initWasm(await wasmRes.arrayBuffer());
  (globalThis as any).__Resvg = mod.Resvg;
  resvgInitialized = true;
}

async function svgToPng(svg: string): Promise<string | null> {
  try {
    await ensureResvg();
    const Resvg = (globalThis as any).__Resvg;
    const resvg = new Resvg(svg, { fitTo: { mode: "width", value: 1200 } });
    const png = resvg.render().asPng();
    return `data:image/png;base64,${bytesToBase64(png)}`;
  } catch (e) {
    console.warn("svgToPng erro", (e as Error).message);
    return null;
  }
}

async function buildPageSpeedCard(
  scores: { performance: number; accessibility: number; bestPractices: number; seo: number },
  siteScreenshotDataUrl: string | null,
  strategy: "mobile" | "desktop",
): Promise<string | null> {
  const svg = buildPageSpeedSvg(scores, siteScreenshotDataUrl, strategy);
  return await svgToPng(svg);
}

async function aiAnalysis(url: string, mobile: any, desktop: any, screenshotDataUrl: string | null) {
  if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY não configurada");

  // constrói summary básico, priorizando textos estáticos do dicionário
  const buildOpportunitiesWithPrecedence = (opps: any[]) =>
    opps.map((o: any) => ({
      id: o.id,
      title: PAGE_SPEED_LABELS[o.id]?.title ?? translatePageSpeedTitle(o.title),
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
      top_opportunities: buildOpportunitiesWithPrecedence(mobile.opportunities ?? []),
    },
    desktop: {
      scores: desktop.scores,
      metrics: desktop.metrics,
      top_opportunities: buildOpportunitiesWithPrecedence(desktop.opportunities ?? []),
    },
  };

  // Reunir todos audit_ids que precisam de tradução (aqueles que não têm `descriptionStatic`)
  const collectMissing = (list: any[]) => list
    .filter((it) => !it.descriptionStatic)
    .map((it) => ({ audit_id: it.id, text: it.rawDescription ?? "" }));

  const missing = [
    ...collectMissing(summary.mobile.top_opportunities),
    ...collectMissing(summary.desktop.top_opportunities),
  ];

  // Consultar cache Supabase por audit_id
  const missingById: Record<string, string> = {};
  const toTranslate: Array<{ audit_id: string; text: string }> = [];

  for (const it of missing) {
    const cached = await getPagespeedTranslation(it.audit_id);
    if (cached) {
      missingById[it.audit_id] = cached;
    } else {
      toTranslate.push(it);
    }
  }

  // Se houver items para traduzir, chamar LLM em lote
  if (toTranslate.length > 0) {
    try {
      const translatedMap = await translateSummaryFields(toTranslate);
      Object.assign(missingById, translatedMap);
    } catch (e) {
      console.warn("Batch translation failed:", e?.message ?? e);
      // Em caso de falha, como fallback leve, tenta-se usar translatePageSpeedDescription local para não quebrar
      for (const it of toTranslate) {
        missingById[it.audit_id] = translatePageSpeedDescription(it.text);
      }
    }
  }

  // Montar os textos finais no summary (com prioridade: static dict -> cache/translated -> fallback local)
  const finalize = (opps: any[]) => opps.map((o) => {
    const desc = o.descriptionStatic ?? missingById[o.id] ?? translatePageSpeedDescription(o.rawDescription);
    return {
      id: o.id,
      title: o.title,
      description: desc,
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

  if (screenshotDataUrl) userContent.push({ type: "image_url", image_url: { url: screenshotDataUrl } });

  const res = await fetch(`${OPENROUTER_API_BASE}/v1/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-5-mini",
      messages: [
        { role: "system", content: "Você é consultor sênior de performance web e UX. Responda SEMPRE com JSON válido, sem markdown." },
        { role: "user", content: userContent },
      ],
      temperature: 0.0,
      max_tokens: 3000,
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("OpenRouter AI", res.status, t);
    if (res.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente mais tarde.");
    // Em erro, fallback: montar melhorias a partir do PageSpeed para não quebrar fluxo
    return { improvements: buildPageSpeedImprovements(mobile, desktop), uiux: null, extras: [] };
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  // parse e retornar
  try {
    return JSON.parse(content);
  } catch (e) {
    // tentar extrair JSON substring
    const m = String(content).match(/\{[\s\S]*\}$/);
    if (m) return JSON.parse(m[0]);
    throw new Error("Resposta da IA não continha JSON válido");
  }
}

// Paleta Tupiniquim (extraída dos relatórios oficiais)
const GREEN = "008F45";        // verde Tupiniquim - títulos decorativos
const DARK_GREEN = "006633";   // verde mais escuro para títulos de capa
const BLACK = "000000";
const DARK = "1A1A1A";
const GRAY = "808080";
const LINK = "1155CC";

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function dataUrlToBytes(dataUrl: string): Uint8Array | null {
  try { return b64ToBytes(dataUrl.split(",")[1]); } catch { return null; }
}


// Cabeçalho com banner verde Tupiniquim (igual aos relatórios oficiais)
function buildHeader() {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        spacing: { after: 0 },
        children: [
          new ImageRun({
            type: "png",
            data: b64ToBytes(HEADER_PNG_B64),
            transformation: { width: 600, height: 96 },
            altText: { title: "Tupiniquim", description: "Cabeçalho Tupiniquim", name: "header" },
          }),
        ],
      }),
    ],
  });
}

// Parágrafo de corpo (Arial 11pt, cinza-escuro)
function body(text: string, opts: any = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 300 },
    ...opts,
    children: [new TextRun({ text, size: 22, color: DARK, ...(opts.run ?? {}) })],
  });
}

// Título principal (rosto da seção): Bree Serif verde - "Sugestões de melhoria", "Performance", etc.
function sectionTitle(text: string) {
  return new Paragraph({
    spacing: { before: 400, after: 280 },
    children: [new TextRun({ text, font: "Bree Serif", size: 34, color: "8BBC74" })],
  });
}

// Título de item numerado: "1. Nome do problema" - negrito preto, Arial
function itemTitle(text: string) {
  return new Paragraph({
    spacing: { before: 320, after: 160 },
    children: [new TextRun({ text, bold: true, size: 24, color: BLACK, font: "Arial" })],
  });
}

// Subtítulo dentro do item: "Descrição", "Impacto", "Causas comuns", "Recomendações"
function subTitle(text: string) {
  return new Paragraph({
    spacing: { before: 200, after: 100 },
    children: [new TextRun({ text, bold: true, size: 22, color: BLACK, font: "Arial" })],
  });
}

function bullet(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60, line: 280 },
    children: [new TextRun({ text, size: 22, color: DARK, font: "Arial" })],
  });
}

async function buildDocx(url: string, mobile: any, desktop: any, ai: any): Promise<Uint8Array> {
  const hostname = new URL(url).hostname.replace("www.", "").toUpperCase();
  const children: any[] = [];
  const improvements = Array.isArray(ai?.improvements) && ai.improvements.length > 0
    ? ai.improvements
    : buildPageSpeedImprovements(mobile, desktop);

  // ===== PRIMEIRA PÁGINA =====
  children.push(
    new Paragraph({
      alignment: AlignmentType.LEFT,
      spacing: { after: 260 },
      children: [
        new ImageRun({
          type: "png",
          data: b64ToBytes(HEADER_PNG_B64),
          transformation: { width: 600, height: 96 },
          altText: { title: "Tupiniquim", description: "Cabeçalho Tupiniquim", name: "header" },
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 200, after: 420 },
      children: [new TextRun({ text: `${hostname} - DIAGNÓSTICO DE SITE`, font: "Bree Serif", size: 32, color: GREEN })],
    }),
  );

  // ===== SUGESTÕES DE MELHORIA =====
  children.push(sectionTitle("Sugestões de melhoria"));

  improvements.forEach((imp: any, i: number) => {
    children.push(itemTitle(`${i + 1}. ${imp.title}`));

    if (imp.description) {
      children.push(subTitle("Descrição"));
      children.push(body(imp.description));
    }
    if (imp.impact?.length) {
      children.push(subTitle("Impacto"));
      imp.impact.forEach((x: string) => children.push(bullet(x)));
    }
    if (imp.causes?.length) {
      children.push(subTitle("Causas comuns"));
      imp.causes.forEach((x: string) => children.push(bullet(x)));
    }
    if (imp.recommendations?.length) {
      children.push(subTitle("Recomendações"));
      imp.recommendations.forEach((x: string) => children.push(bullet(x)));
    }
  });

  // ===== UI/UX =====
  if (ai.uiux) {
    children.push(sectionTitle("Melhorias de UI/UX"));
    if (ai.uiux.overview) children.push(body(ai.uiux.overview));
    if (ai.uiux.diagnosis?.length) {
      children.push(subTitle("Diagnóstico"));
      ai.uiux.diagnosis.forEach((x: string) => children.push(bullet(x)));
    }
    if (ai.uiux.recommendations?.length) {
      children.push(subTitle("Recomendações"));
      ai.uiux.recommendations.forEach((x: string) => children.push(bullet(x)));
    }
  }

  // ===== EXTRAS =====
  if (ai.extras?.length) {
    children.push(sectionTitle("Sugestões extras"));
    ai.extras.forEach((ex: any) => {
      children.push(itemTitle(ex.title));
      children.push(body(ex.description));
    });
  }

  // ===== PERFORMANCE =====
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(sectionTitle("Performance"));

  for (const [label, data] of [["Desktop", desktop], ["Mobile", mobile]] as const) {
    children.push(
      new Paragraph({
        spacing: { before: 240, after: 160 },
        children: [new TextRun({ text: `${label}:`, bold: true, size: 24, color: BLACK, font: "Arial" })],
      }),
    );

    children.push(
      body(
        `De acordo com a ferramenta PageSpeed Insights, a performance da página em dispositivos ${label.toLowerCase()} está com a pontuação de ${data.scores.performance}/100 em desempenho, ${data.scores.accessibility}/100 em acessibilidade, ${data.scores.bestPractices}/100 em práticas recomendadas e ${data.scores.seo}/100 em SEO.`,
      ),
    );

    // Render native docx card (numbers + labels) matching the preview — no images
    try {
      const scoreItems = [
        { label: "Desempenho", value: data.scores.performance },
        { label: "Acessibilidade", value: data.scores.accessibility },
        { label: "Práticas recomendadas", value: data.scores.bestPractices },
        { label: "SEO", value: data.scores.seo },
      ];

      // Row with big numbers
      const numRow = new TableRow({
        children: scoreItems.map((it) => new TableCell({
          width: { size: Math.floor(10000 / scoreItems.length), type: WidthType.DXA },
          margins: { top: 100, bottom: 100 },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { after: 120 },
              children: [
                new TextRun({ text: `${Math.round(it.value)}`, bold: true, size: 56, color: scoreColor(it.value).text }),
              ],
            }),
          ],
        })),
      });

      // Row with labels
      const labelRow = new TableRow({
        children: scoreItems.map((it) => new TableCell({
          width: { size: Math.floor(10000 / scoreItems.length), type: WidthType.DXA },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: it.label, size: 22, color: DARK })],
            }),
          ],
        })),
      });

      const tbl = new Table({
        rows: [numRow, labelRow],
        width: { size: 10000, type: WidthType.DXA },
      });

      children.push(new Paragraph({ spacing: { before: 160 } }));
      children.push(tbl);
      children.push(new Paragraph({ spacing: { after: 160 } }));
    } catch (e) {
      // Fallback: if building native card fails, skip it and continue
      console.warn("build native card failed:", e?.message ?? e);
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
    console.log("Skipped visual card generation and cleared screenshots to reduce latency.");

    const openRouterApiKey = Deno.env.get("OPENROUTER_API_KEY");

    console.log("Gerando IA… (se configurada)");
    let ai;
    if (openRouterApiKey) {
      try {
        ai = await aiAnalysis(url, mobile, desktop, mobile.screenshot);
        console.log("IA ok via OpenRouter.");
      } catch (e) {
        console.warn("aiAnalysis (OpenRouter) falhou:", e?.message ?? e);
        ai = { improvements: [], uiux: null, extras: [] };
      }
    } else {
      console.warn("Nenhuma chave de IA configurada (OPENROUTER_API_KEY) — pulando análise IA e usando fallback.");
      ai = { improvements: [], uiux: null, extras: [] };
    }
    // As oportunidades reais do PageSpeed garantem conteúdo mesmo quando a IA não está disponível.
    const pageSpeedImprovements = buildPageSpeedImprovements(mobile, desktop);
    if (!Array.isArray(ai?.improvements) || ai.improvements.length === 0) {
      ai = { ...ai, improvements: pageSpeedImprovements };
    } else if (ai.improvements.length < 8) {
      const existingTitles = new Set(
        ai.improvements
          .map((improvement: any) => String(improvement.title ?? "").trim().toLowerCase())
          .filter(Boolean),
      );
      const mergedImprovements = [...ai.improvements];
      for (const improvement of pageSpeedImprovements) {
        const title = String(improvement.title ?? "").trim().toLowerCase();
        if (title && !existingTitles.has(title)) {
          mergedImprovements.push(improvement);
          existingTitles.add(title);
        }
        if (mergedImprovements.length >= 8) break;
      }
      ai = { ...ai, improvements: mergedImprovements };
    }
    if (Array.isArray(ai?.improvements)) {
      ai = {
        ...ai,
        improvements: ai.improvements.slice(0, 8).map((improvement: any) => ({
          ...improvement,
          title: translateReportText(translatePageSpeedTitle(improvement.title ?? "Sugestão de melhoria")),
          description: translateReportText(improvement.description ?? "Problema identificado no carregamento da página."),
          impact: Array.isArray(improvement.impact)
            ? improvement.impact.map(translateReportText)
            : ["Pode atrasar o carregamento e a interação com a página."],
          causes: Array.isArray(improvement.causes) && improvement.causes.length > 0
            ? improvement.causes.map(translateReportText)
            : [
              "Recursos ou funcionalidades carregados sem necessidade no primeiro acesso.",
              "Configurações padrão do CMS, do tema ou de plugins de terceiros.",
            ],
          recommendations: Array.isArray(improvement.recommendations)
            ? improvement.recommendations.map(translateReportText)
            : ["Revisar e otimizar o recurso indicado no diagnóstico."],
        })),
      };
    }
    // Build report content but skip heavy docx generation in the inline request to reduce latency.
    // The docx can be requested separately via docxOnly flag (handled above) or generated in background.

    const summaryResponse = {
      success: true,
      summary: {
        mobile: {
          scores: mobile.scores,
          metrics: mobile.metrics,
          screenshot: null,
          pagespeedScreenshot: null,
          opportunities: mobile.opportunities ?? [],
        },
        desktop: {
          scores: desktop.scores,
          metrics: desktop.metrics,
          screenshot: null,
          pagespeedScreenshot: null,
          opportunities: desktop.opportunities ?? [],
        },
        screenshot: null,
      },
      improvements: ai.improvements ?? [],
      uiux: ai.uiux ?? null,
      extras: ai.extras ?? [],
    };

    return new Response(JSON.stringify(summaryResponse), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e: any) {
    console.error("diagnose error", e);
    return new Response(JSON.stringify({ error: e.message ?? "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
