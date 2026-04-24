// @ts-nocheck
import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType, ImageRun, PageBreak,
} from "https://esm.sh/docx@8.5.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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
  const diagnostics = Object.values(audits)
    .filter((a: any) => a.details?.type === "diagnostic" && (a.score ?? 1) < 0.9)
    .slice(0, 8)
    .map((a: any) => ({ id: a.id, title: a.title, displayValue: a.displayValue, score: a.score }));
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
    diagnostics,
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
      text: `Analise este site (${url}) e gere um diagnóstico em PORTUGUÊS BRASILEIRO no estilo de uma agência (Tupiniquim).
Dados do PageSpeed:
${JSON.stringify(summary, null, 2)}

${screenshotDataUrl ? "Você também recebeu um screenshot da home mobile do site para análise visual." : ""}

Retorne JSON com EXATAMENTE este formato:
{
  "improvements": [
    { "title": "Nome do problema", "problem": "Descrição do problema...", "impact": ["item 1", "item 2"], "recommendation": ["ação 1", "ação 2"] }
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

Gere de 3 a 5 improvements baseados nas oportunidades reais do PageSpeed. Use linguagem técnica mas clara, como nos relatórios da Tupiniquim.`,
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

const ORANGE = "EA6A1F";
const DARK = "1A1A1A";
const GRAY = "666666";
const RED = "D93025";
const AMBER = "F9AB00";
const GREEN = "0F9D58";

const scoreColor = (n: number) => (n >= 90 ? GREEN : n >= 50 ? AMBER : RED);

function p(text: string, opts: any = {}) {
  return new Paragraph({
    spacing: { after: 120 },
    ...opts,
    children: opts.children ?? [new TextRun({ text, ...(opts.run ?? {}) })],
  });
}

function h1(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, bold: true, size: 36, color: ORANGE })],
  });
}
function h2(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, size: 28, color: DARK })],
  });
}
function h3(text: string) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, color: DARK })],
  });
}
function bullet(text: string) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 80 },
    children: [new TextRun({ text, size: 22 })],
  });
}

function scoresTable(label: string, scores: any) {
  const cell = (text: string, color: string, bold = false) =>
    new TableCell({
      width: { size: 2340, type: WidthType.DXA },
      margins: { top: 120, bottom: 120, left: 120, right: 120 },
      shading: { fill: "F7F7F7", type: ShadingType.CLEAR },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text, bold, color, size: bold ? 36 : 20 })],
        }),
      ],
    });

  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [2340, 2340, 2340, 2340],
    rows: [
      new TableRow({
        children: [
          cell(`${scores.performance}`, scoreColor(scores.performance), true),
          cell(`${scores.accessibility}`, scoreColor(scores.accessibility), true),
          cell(`${scores.bestPractices}`, scoreColor(scores.bestPractices), true),
          cell(`${scores.seo}`, scoreColor(scores.seo), true),
        ],
      }),
      new TableRow({
        children: [
          cell("Desempenho", DARK),
          cell("Acessibilidade", DARK),
          cell("Práticas", DARK),
          cell("SEO", DARK),
        ],
      }),
    ],
  });
}

function metricsTable(metrics: any) {
  const row = (label: string, value: string) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: 4680, type: WidthType.DXA },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 20, color: GRAY })] })],
        }),
        new TableCell({
          width: { size: 4680, type: WidthType.DXA },
          margins: { top: 100, bottom: 100, left: 160, right: 160 },
          children: [new Paragraph({ children: [new TextRun({ text: value, bold: true, size: 24, color: DARK })] })],
        }),
      ],
    });
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [4680, 4680],
    rows: [
      row("First Contentful Paint", metrics.fcp),
      row("Largest Contentful Paint", metrics.lcp),
      row("Total Blocking Time", metrics.tbt),
      row("Cumulative Layout Shift", metrics.cls),
      row("Speed Index", metrics.si),
    ],
  });
}

function dataUrlToBytes(dataUrl: string): Uint8Array | null {
  try {
    const b64 = dataUrl.split(",")[1];
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  } catch { return null; }
}

async function buildDocx(url: string, mobile: any, desktop: any, ai: any): Promise<Uint8Array> {
  const hostname = new URL(url).hostname.replace("www.", "").toUpperCase();
  const children: any[] = [];

  // Capa
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 1200, after: 200 },
      children: [new TextRun({ text: "DIAGNÓSTICO DE SITE", bold: true, size: 28, color: GRAY })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: hostname, bold: true, size: 56, color: ORANGE })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 600 },
      children: [new TextRun({ text: url, italics: true, size: 22, color: GRAY })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  );

  // Sugestões de melhoria
  children.push(h1("Sugestões de Melhoria"));
  (ai.improvements || []).forEach((imp: any, i: number) => {
    children.push(h2(`${i + 1}. ${imp.title}`));
    children.push(h3("Problema Identificado"));
    children.push(p(imp.problem));
    if (imp.impact?.length) {
      children.push(h3("Impacto"));
      imp.impact.forEach((x: string) => children.push(bullet(x)));
    }
    if (imp.recommendation?.length) {
      children.push(h3("Recomendação Técnica"));
      imp.recommendation.forEach((x: string) => children.push(bullet(x)));
    }
  });

  // UI/UX
  if (ai.uiux) {
    children.push(h1("Melhorias UI/UX"));
    children.push(p(ai.uiux.overview));
    if (ai.uiux.diagnosis?.length) {
      children.push(h3("Diagnóstico"));
      ai.uiux.diagnosis.forEach((x: string) => children.push(bullet(x)));
    }
    if (ai.uiux.recommendations?.length) {
      children.push(h3("Recomendações"));
      ai.uiux.recommendations.forEach((x: string) => children.push(bullet(x)));
    }
  }

  // Extras
  (ai.extras || []).forEach((ex: any) => {
    children.push(h2(ex.title));
    children.push(p(ex.description));
  });

  // Performance
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(h1("Performance"));

  for (const [label, data] of [["Desktop", desktop], ["Mobile", mobile]] as const) {
    children.push(h2(label));
    children.push(p(`Pontuação geral de desempenho: ${data.scores.performance}/100.`));
    children.push(scoresTable(label, data.scores));
    children.push(new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Métricas principais:", bold: true, size: 22 })] }));
    children.push(metricsTable(data.metrics));

    if (data.screenshot) {
      const bytes = dataUrlToBytes(data.screenshot);
      if (bytes) {
        const isMobile = label === "Mobile";
        children.push(
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 120 },
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

    if (data.opportunities?.length) {
      children.push(h3("Diagnóstico do PageSpeed"));
      data.opportunities.forEach((o: any) => children.push(bullet(`${o.title}${o.displayValue ? ` — ${o.displayValue}` : ""}`)));
    }
  }

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 22 } } } },
    sections: [{
      properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } },
      children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url || !/^https?:\/\//.test(url)) {
      return new Response(JSON.stringify({ error: "Informe uma URL válida (com http/https)" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Diagnosticando", url);
    const [mobile, desktop] = await Promise.all([runPageSpeed(url, "mobile"), runPageSpeed(url, "desktop")]);
    console.log("PageSpeed ok. Gerando IA…");

    const ai = await aiAnalysis(url, mobile, desktop, mobile.screenshot);
    console.log("IA ok. Gerando docx…");

    const docx = await buildDocx(url, mobile, desktop, ai);
    const docxB64 = btoa(String.fromCharCode(...docx));

    return new Response(JSON.stringify({
      success: true,
      summary: {
        mobile: { scores: mobile.scores, metrics: mobile.metrics },
        desktop: { scores: desktop.scores, metrics: desktop.metrics },
        screenshot: mobile.screenshot,
      },
      improvements: ai.improvements ?? [],
      docx: docxB64,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("diagnose error", e);
    return new Response(JSON.stringify({ error: e.message ?? "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
