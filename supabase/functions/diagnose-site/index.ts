// @ts-nocheck
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, ImageRun, PageBreak,
  Header, BorderStyle,
} from "https://esm.sh/docx@8.5.0";
import { HEADER_PNG_B64 } from "./header-asset.ts";

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
  const res = await fetch(`${PAGESPEED}?${params}`);
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
  const data = await res.json();
  const lr = data.lighthouseResult;
  const cats = lr.categories;
  const audits = lr.audits;
  const opportunities = Object.values(audits)
    .filter((a: any) => a.details?.type === "opportunity" && (a.score ?? 1) < 0.9)
    .sort((a: any, b: any) => (a.score ?? 1) - (b.score ?? 1))
    .slice(0, 8)
    .map((a: any) => ({
      id: a.id,
      title: PAGE_SPEED_LABELS[a.id]?.title ?? a.title,
      description: PAGE_SPEED_LABELS[a.id]?.recommendation ?? a.description,
      displayValue: a.displayValue,
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
    title: "Reduzir o tempo de resposta do servidor",
    recommendation: "Avaliar hospedagem, cache de página, consultas e scripts do servidor para diminuir o tempo até o primeiro byte.",
  },
  "font-display": {
    title: "Configurar a exibição das fontes",
    recommendation: "Usar font-display: swap ou opcional e pré-carregar somente as fontes realmente necessárias para evitar texto invisível durante o carregamento.",
  },
};

function localizedPageSpeedOpportunity(opportunity: any) {
  const localized = PAGE_SPEED_LABELS[opportunity.id];
  const title = localized?.title ?? opportunity.title
    .replace(/^Properly size images$/i, "Dimensionar as imagens corretamente")
    .replace(/^Efficiently encode images$/i, "Codificar as imagens com eficiência")
    .replace(/^Minify JavaScript$/i, "Minificar JavaScript")
    .replace(/^Minify CSS$/i, "Minificar CSS");

  return {
    title,
    description: `O PageSpeed identificou este ponto como uma oportunidade de melhoria no carregamento da página${opportunity.displayValue ? ` (${opportunity.displayValue})` : ""}.`,
    impact: ["Pode atrasar a exibição do conteúdo principal.", "Pode aumentar o tempo de carregamento no primeiro acesso."],
    recommendations: [localized?.recommendation ?? "Revisar este recurso no relatório detalhado do PageSpeed e aplicar a correção indicada para reduzir o impacto no carregamento."],
  };
}

function buildPageSpeedImprovements(mobile: any, desktop: any) {
  const opportunities = [...(mobile.opportunities ?? []), ...(desktop.opportunities ?? [])];
  const unique = opportunities.filter((opportunity, index, list) =>
    list.findIndex((item) => item.id === opportunity.id) === index,
  );
  const improvements = unique.slice(0, 8).map(localizedPageSpeedOpportunity);
  if (improvements.length > 0) return improvements;

  return [
    {
      title: "Melhorar o carregamento do conteúdo principal",
      description: `O PageSpeed registrou LCP de ${mobile.metrics?.lcp ?? "—"} no mobile e ${desktop.metrics?.lcp ?? "—"} no desktop.`,
      impact: ["O conteúdo principal pode demorar para aparecer no primeiro acesso.", "A percepção de velocidade pode ser prejudicada em redes móveis."],
      recommendations: ["Otimizar o elemento identificado como maior conteúdo, priorizar seus recursos e revisar o tempo de resposta do servidor."],
    },
    {
      title: "Reduzir o trabalho do navegador",
      description: `O tempo de bloqueio total registrado foi de ${mobile.metrics?.tbt ?? "—"} no mobile e ${desktop.metrics?.tbt ?? "—"} no desktop.`,
      impact: ["Interações podem ficar indisponíveis enquanto a página é processada.", "Dispositivos móveis podem sentir mais lentidão."],
      recommendations: ["Reduzir JavaScript não utilizado, adiar scripts não críticos e dividir tarefas longas em partes menores."],
    },
  ];
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
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY não configurada");

  const summary = {
    url,
    mobile: { scores: mobile.scores, metrics: mobile.metrics, top_opportunities: mobile.opportunities.map((o: any) => o.title) },
    desktop: { scores: desktop.scores, metrics: desktop.metrics },
  };

  const userContent: any[] = [
    {
      type: "text",
      text: `Analise este site (${url}) e gere um diagnóstico exclusivamente em PORTUGUÊS BRASILEIRO no estilo dos relatórios da agência Tupiniquim. Não use inglês, mesmo em títulos técnicos; quando necessário, mantenha apenas a sigla original entre parênteses.
Dados do PageSpeed:
${JSON.stringify(summary, null, 2)}

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

Gere de 4 a 6 improvements baseados nas oportunidades reais do PageSpeed. Use linguagem técnica mas clara e preencha todos os campos de cada item. Cada improvement deve ter Descrição, Impacto, Causas comuns e Recomendações — exatamente como nos relatórios da Tupiniquim. Não deixe arrays vazios e não invente problemas que não estejam relacionados aos dados fornecidos.`,
    },
  ];

  if (screenshotDataUrl) {
    userContent.push({ type: "image_url", image_url: { url: screenshotDataUrl } });
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: "Você é consultor sênior de performance web e UX. Responda SEMPRE com JSON válido, sem markdown." },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const t = await res.text();
    console.error("AI gateway", res.status, t);
    if (res.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em alguns minutos.");
    if (res.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos em Settings → Workspace → Usage.");
    throw new Error("Falha ao gerar análise com IA");
  }
  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "{}";
  return JSON.parse(content);
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

function buildDocx(url: string, mobile: any, desktop: any, ai: any): Promise<Uint8Array> {
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

    const psShot = data.pagespeedScreenshot ?? null;
    if (psShot) {
      const bytes = dataUrlToBytes(psShot);
      if (bytes) {
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
            children: [
              new ImageRun({
                type: "jpg",
                data: bytes,
                transformation: { width: 560, height: 380 },
                altText: { title: "pagespeed", description: `PageSpeed ${label}`, name: "pagespeed" },
              }),
            ],
          }),
        );
      }
    } else if (data.screenshot) {
      const bytes = dataUrlToBytes(data.screenshot);
      if (bytes) {
        const isMobile = label === "Mobile";
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 200, after: 200 },
            children: [
              new ImageRun({
                type: "jpg",
                data: bytes,
                transformation: isMobile ? { width: 240, height: 420 } : { width: 480, height: 300 },
                altText: { title: "screenshot", description: `Screenshot ${label}`, name: "screenshot" },
              }),
            ],
          }),
        );
      }
    }

    children.push(subTitle("Métricas principais"));
    children.push(bullet(`First Contentful Paint: ${data.metrics.fcp}`));
    children.push(bullet(`Largest Contentful Paint: ${data.metrics.lcp}`));
    children.push(bullet(`Total Blocking Time: ${data.metrics.tbt}`));
    children.push(bullet(`Cumulative Layout Shift: ${data.metrics.cls}`));
    children.push(bullet(`Speed Index: ${data.metrics.si}`));

    if (data.opportunities?.length) {
      children.push(subTitle("Diagnóstico do PageSpeed"));
      data.opportunities.forEach((o: any) => {
        const localized = localizedPageSpeedOpportunity(o);
        children.push(bullet(`${localized.title}${o.displayValue ? ` — ${o.displayValue}` : ""}`));
      });
    }
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 22, color: DARK } } } },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 720, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children,
    }],
  });

  return Packer.toBuffer(doc).then((b) => new Uint8Array(b));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url, docxOnly, mobile: editedMobile, desktop: editedDesktop, ai: editedAi } = await req.json();
    if (!url || !/^https?:\/\//.test(url)) {
      return new Response(JSON.stringify({ error: "Informe uma URL válida (com http/https)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (docxOnly) {
      const docx = await buildDocx(url, editedMobile, editedDesktop, editedAi);
      return new Response(JSON.stringify({ success: true, docx: bytesToBase64(docx) }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Diagnosticando", url);
    const [mobile, desktop] = await Promise.all([runPageSpeed(url, "mobile"), runPageSpeed(url, "desktop")]);
    console.log("PageSpeed ok. Renderizando cards visuais…");

    const [psMobileShot, psDesktopShot] = await Promise.all([
      buildPageSpeedCard(mobile.scores, mobile.screenshot, "mobile"),
      buildPageSpeedCard(desktop.scores, desktop.screenshot, "desktop"),
    ]);
    (mobile as any).pagespeedScreenshot = psMobileShot;
    (desktop as any).pagespeedScreenshot = psDesktopShot;
    console.log("Screenshots PageSpeed:", { mobile: !!psMobileShot, desktop: !!psDesktopShot });

    console.log("Gerando IA… (se configurada)");
    let ai;
    const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE_KEY) {
      ai = await aiAnalysis(url, mobile, desktop, mobile.screenshot);
      console.log("IA ok.");
    } else {
      console.warn("LOVABLE_API_KEY não configurada — pulando análise IA e usando fallback.");
      ai = { improvements: [], uiux: null, extras: [] };
    }
    // As oportunidades reais do PageSpeed garantem conteúdo mesmo quando a IA não está disponível.
    const pageSpeedImprovements = buildPageSpeedImprovements(mobile, desktop);
    if (!Array.isArray(ai?.improvements) || ai.improvements.length === 0) {
      ai = { ...ai, improvements: pageSpeedImprovements };
    }
    console.log("Gerando docx…");

    const docx = await buildDocx(url, mobile, desktop, ai);
    const docxB64 = bytesToBase64(docx);

    return new Response(JSON.stringify({
      success: true,
      summary: {
        mobile: {
          scores: mobile.scores,
          metrics: mobile.metrics,
          screenshot: mobile.screenshot,
          pagespeedScreenshot: psMobileShot,
          opportunities: mobile.opportunities ?? [],
        },
        desktop: {
          scores: desktop.scores,
          metrics: desktop.metrics,
          screenshot: desktop.screenshot,
          pagespeedScreenshot: psDesktopShot,
          opportunities: desktop.opportunities ?? [],
        },
        screenshot: mobile.screenshot,
      },
      improvements: ai.improvements ?? [],
      uiux: ai.uiux ?? null,
      extras: ai.extras ?? [],
      docx: docxB64,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("diagnose error", e);
    return new Response(JSON.stringify({ error: e.message ?? "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
