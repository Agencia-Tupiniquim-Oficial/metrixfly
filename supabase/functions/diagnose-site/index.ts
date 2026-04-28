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

async function runPageSpeed(url: string, strategy: "mobile" | "desktop") {
  const params = new URLSearchParams({ url, strategy });
  ["performance", "accessibility", "best-practices", "seo"].forEach((c) => params.append("category", c));
  const apiKey = Deno.env.get("PAGESPEED_API_KEY");
  if (apiKey) params.append("key", apiKey);
  const res = await fetch(`${PAGESPEED}?${params}`);
  if (!res.ok) throw new Error(`PageSpeed ${strategy} falhou: ${res.status}`);
  const data = await res.json();
  const lr = data.lighthouseResult;
  const cats = lr.categories;
  const audits = lr.audits;
  const opportunities = Object.values(audits)
    .filter((a: any) => a.details?.type === "opportunity" && (a.score ?? 1) < 0.9)
    .sort((a: any, b: any) => (a.score ?? 1) - (b.score ?? 1))
    .slice(0, 8)
    .map((a: any) => ({ id: a.id, title: a.title, description: a.description, displayValue: a.displayValue, score: a.score }));
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
      text: `Analise este site (${url}) e gere um diagnóstico em PORTUGUÊS BRASILEIRO no estilo dos relatórios da agência Tupiniquim.
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

Gere de 4 a 6 improvements baseados nas oportunidades reais do PageSpeed. Use linguagem técnica mas clara. Cada improvement deve ter Descrição, Impacto, Causas comuns e Recomendações — exatamente como nos relatórios da Tupiniquim.`,
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

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
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
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: GREEN, space: 6 } },
    children: [new TextRun({ text, font: "Bree Serif", size: 36, color: GREEN })],
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

  // ===== CAPA =====
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 2400, after: 200 },
      children: [new TextRun({ text: "DIAGNÓSTICO DE SITE", bold: true, size: 32, color: GRAY, font: "Arial" })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [new TextRun({ text: hostname, font: "Bree Serif", size: 56, color: GREEN })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: url, italics: true, size: 22, color: GRAY, font: "Arial" })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // ===== TÍTULO DO RELATÓRIO =====
  children.push(
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: `${hostname} - DIAGNÓSTICO DE SITE`, bold: true, size: 24, color: DARK_GREEN, font: "Arial" })],
    }),
  );

  // ===== SUGESTÕES DE MELHORIA =====
  children.push(sectionTitle("Sugestões de melhoria"));

  (ai.improvements || []).forEach((imp: any, i: number) => {
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

    if (data.screenshot) {
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
      data.opportunities.forEach((o: any) =>
        children.push(bullet(`${o.title}${o.displayValue ? ` — ${o.displayValue}` : ""}`)),
      );
    }
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 22, color: DARK } } } },
    sections: [{
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 2200, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      headers: { default: buildHeader() },
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
    console.log("PageSpeed ok. Gerando IA…");

    const ai = await aiAnalysis(url, mobile, desktop, mobile.screenshot);
    console.log("IA ok. Gerando docx…");

    const docx = await buildDocx(url, mobile, desktop, ai);
    const docxB64 = bytesToBase64(docx);

    return new Response(JSON.stringify({
      success: true,
      summary: {
        mobile: {
          scores: mobile.scores,
          metrics: mobile.metrics,
          screenshot: mobile.screenshot,
          opportunities: mobile.opportunities ?? [],
        },
        desktop: {
          scores: desktop.scores,
          metrics: desktop.metrics,
          screenshot: desktop.screenshot,
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
