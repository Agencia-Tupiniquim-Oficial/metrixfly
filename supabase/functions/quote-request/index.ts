import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_PDF_BYTES = 4 * 1024 * 1024;
const RESEND_API_URL = "https://api.resend.com/emails";
const quoteRecipient = "suporte@agenciatupiniquim.com.br";
const campaignParameterNames = [
  "matchtype",
  "device",
  "adposition",
  "placement",
  "targetid",
  "feeditemid",
  "adgroupid",
  "target",
  "gclid",
  "devicemodel",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  "utm_source_platform",
] as const;

type CampaignParameter = (typeof campaignParameterNames)[number];
type CampaignTracking = {
  parameters: Record<CampaignParameter, string>;
  entryUrl: string;
  formUrl: string;
  convertedAt: string;
};

const googleAdsParameters: { key: CampaignParameter; label: string }[] = [
  { key: "gclid", label: "Identificador do clique (gclid)" },
  { key: "device", label: "Dispositivo (device)" },
  { key: "devicemodel", label: "Modelo do dispositivo (devicemodel)" },
  { key: "matchtype", label: "Tipo de correspondência (matchtype)" },
  { key: "adposition", label: "Posição do anúncio (adposition)" },
  { key: "placement", label: "Posicionamento (placement)" },
  { key: "targetid", label: "ID do alvo (targetid)" },
  { key: "feeditemid", label: "ID do item do feed (feeditemid)" },
  { key: "adgroupid", label: "ID do grupo de anúncios (adgroupid)" },
  { key: "target", label: "Alvo (target)" },
];

const utmParameters: { key: CampaignParameter; label: string }[] = [
  { key: "utm_source", label: "Origem (utm_source)" },
  { key: "utm_medium", label: "Mídia (utm_medium)" },
  { key: "utm_campaign", label: "Campanha (utm_campaign)" },
  { key: "utm_term", label: "Termo (utm_term)" },
  { key: "utm_content", label: "Conteúdo (utm_content)" },
  { key: "utm_id", label: "ID da campanha (utm_id)" },
  { key: "utm_source_platform", label: "Plataforma de origem (utm_source_platform)" },
];

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function requiredText(
  value: unknown,
  maxLength: number,
): string | null {
  if (
    typeof value !== "string" ||
    !value.trim() ||
    value.trim().length > maxLength
  ) {
    return null;
  }
  return value.trim();
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

function validatedUrl(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 4096) return null;
  if (!value) return "";
  try {
    const parsed = new URL(value);
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password
    ) {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
}

function isIsoTimestamp(value: string): boolean {
  const milliseconds = Date.parse(value);
  if (Number.isNaN(milliseconds)) return false;
  try {
    return new Date(milliseconds).toISOString() === value;
  } catch {
    return false;
  }
}

function parseCampaignTracking(
  value: FormDataEntryValue | null,
): CampaignTracking | null {
  const emptyParameters = Object.fromEntries(
    campaignParameterNames.map((name) => [name, ""]),
  ) as Record<CampaignParameter, string>;

  if (value === null) {
    return {
      parameters: emptyParameters,
      entryUrl: "",
      formUrl: "",
      convertedAt: "",
    };
  }
  if (typeof value !== "string" || value.length > 20000) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;

  const tracking = parsed as Record<string, unknown>;
  if (
    !tracking.parameters ||
    typeof tracking.parameters !== "object" ||
    Array.isArray(tracking.parameters)
  ) {
    return null;
  }
  const providedParameters = tracking.parameters as Record<string, unknown>;
  const parameters = { ...emptyParameters };
  for (const name of campaignParameterNames) {
    const parameter = providedParameters[name];
    if (parameter === undefined) continue;
    if (typeof parameter !== "string" || parameter.length > 500) return null;
    parameters[name] = parameter.trim();
  }

  const entryUrl = validatedUrl(tracking.entryUrl);
  const formUrl = validatedUrl(tracking.formUrl);
  const convertedAt = tracking.convertedAt;
  if (
    entryUrl === null ||
    formUrl === null ||
    typeof convertedAt !== "string" ||
    convertedAt.length > 40 ||
    (convertedAt !== "" && !isIsoTimestamp(convertedAt))
  ) {
    return null;
  }

  return { parameters, entryUrl, formUrl, convertedAt };
}

function campaignTrackingText(tracking: CampaignTracking): string {
  const valueFor = (key: CampaignParameter) =>
    tracking.parameters[key] || "Não informado";
  const rows = (items: { key: CampaignParameter; label: string }[]) =>
    items.map(({ key, label }) => `${label}: ${valueFor(key)}`);

  return [
    "Rastreamento de campanha",
    "",
    "Parâmetros do Google Ads:",
    ...rows(googleAdsParameters),
    "",
    "Parâmetros UTM:",
    ...rows(utmParameters),
    "",
    "Origem e conversão:",
    `URL de entrada: ${tracking.entryUrl || "Não informado"}`,
    `URL da página do formulário: ${tracking.formUrl || "Não informado"}`,
    `Data e hora da conversão: ${tracking.convertedAt || "Não informado"}`,
  ].join("\n");
}

function campaignTrackingHtml(tracking: CampaignTracking): string {
  const valueFor = (key: CampaignParameter) =>
    tracking.parameters[key] || "Não informado";
  const table = (items: { key: CampaignParameter; label: string }[]) =>
    `<table style="width:100%;border-collapse:collapse">${items
      .map(
        ({ key, label }) =>
          `<tr><th style="padding:8px;text-align:left;border-bottom:1px solid #eee">${escapeHtml(label)}</th><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(valueFor(key))}</td></tr>`,
      )
      .join("")}</table>`;
  const metadata = [
    ["URL de entrada", tracking.entryUrl],
    ["URL da página do formulário", tracking.formUrl],
    ["Data e hora da conversão", tracking.convertedAt],
  ];

  return `
    <h2>Rastreamento de campanha</h2>
    <h3>Parâmetros do Google Ads</h3>
    ${table(googleAdsParameters)}
    <h3>Parâmetros UTM</h3>
    ${table(utmParameters)}
    <h3>Origem e conversão</h3>
    <table style="width:100%;border-collapse:collapse">${metadata
      .map(
        ([label, value]) =>
          `<tr><th style="padding:8px;text-align:left;border-bottom:1px solid #eee">${label}</th><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(value || "Não informado")}</td></tr>`,
      )
      .join("")}</table>
  `;
}

function makePdfFilename(domain: string): string {
  const hostname = new URL(domain).hostname
    .replace(/^www\./i, "")
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `${hostname || "site"}_diagnostico.pdf`;
}

function validatePdf(file: FormDataEntryValue | null): file is File {
  return (
    file instanceof File &&
    file.type.toLowerCase().split(";")[0].trim() === "application/pdf" &&
    file.size > 0 &&
    file.size <= MAX_PDF_BYTES
  );
}

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, 405);
  }

  const apiKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("RESEND_FROM_EMAIL");
  if (!apiKey || !from) {
    return jsonResponse(
      {
        error:
          "Envio não configurado. Configure RESEND_API_KEY e RESEND_FROM_EMAIL nos secrets do Supabase.",
      },
      503,
    );
  }

  try {
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return jsonResponse({ error: "Dados da solicitação inválidos." }, 400);
    }

    const formName = requiredText(formData.get("form-name"), 50);
    const name = requiredText(formData.get("name"), 200);
    const company = requiredText(formData.get("company"), 200);
    const email = requiredText(formData.get("email"), 320);
    const phone = requiredText(formData.get("phone"), 80);
    const domain = requiredText(formData.get("domain"), 2048);
    const diagnosticSummary = requiredText(
      formData.get("diagnosticSummary"),
      12000,
    );
    const campaignTracking = parseCampaignTracking(
      formData.get("campaignTracking"),
    );
    const report = formData.get("report");

    if (
      formName !== "form-contato" ||
      !name ||
      !company ||
      !email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      !phone ||
      !domain ||
      !diagnosticSummary ||
      !campaignTracking ||
      !validatePdf(report)
    ) {
      return jsonResponse(
        { error: "Preencha corretamente os dados da solicitação." },
        400,
      );
    }

    let parsedDomain: URL;
    try {
      parsedDomain = new URL(domain);
    } catch {
      return jsonResponse({ error: "O domínio analisado é inválido." }, 400);
    }
    if (
      !["http:", "https:"].includes(parsedDomain.protocol) ||
      parsedDomain.username ||
      parsedDomain.password
    ) {
      return jsonResponse({ error: "O domínio analisado é inválido." }, 400);
    }

    const pdfBytes = new Uint8Array(await report.arrayBuffer());
    if (new TextDecoder().decode(pdfBytes.subarray(0, 5)) !== "%PDF-") {
      return jsonResponse(
        { error: "Não foi possível anexar um relatório PDF válido." },
        400,
      );
    }
    const pdfBase64 = encodeBase64(pdfBytes);

    const text = [
      "Nova solicitação de orçamento - Metrixfly",
      "",
      `Formulário: ${formName}`,
      `Nome: ${name}`,
      `Empresa: ${company}`,
      `E-mail: ${email}`,
      `Telefone: ${phone}`,
      `Site analisado: ${parsedDomain.href}`,
      "",
      "Resumo do diagnóstico:",
      diagnosticSummary,
      "",
      campaignTrackingText(campaignTracking),
    ].join("\n");
    const html = `
      <h1>Nova solicitação de orçamento - Metrixfly</h1>
      <p><strong>Formulário:</strong> ${escapeHtml(formName)}</p>
      <p><strong>Nome:</strong> ${escapeHtml(name)}<br>
      <strong>Empresa:</strong> ${escapeHtml(company)}<br>
      <strong>E-mail:</strong> ${escapeHtml(email)}<br>
      <strong>Telefone:</strong> ${escapeHtml(phone)}<br>
      <strong>Site analisado:</strong> <a href="${escapeHtml(parsedDomain.href)}">${escapeHtml(parsedDomain.href)}</a></p>
      <h2>Resumo do diagnóstico</h2>
      <pre style="white-space:pre-wrap;font-family:inherit">${escapeHtml(diagnosticSummary)}</pre>
      ${campaignTrackingHtml(campaignTracking)}
    `;

    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [quoteRecipient],
        reply_to: email,
        subject: "[Speed Fly] Novo orçamento",
        text,
        html,
        attachments: [
          {
            filename: makePdfFilename(parsedDomain.href),
            content: pdfBase64,
          },
        ],
      }),
    });

    if (!response.ok) {
      console.error("Resend quote request failed", response.status);
      return jsonResponse(
        {
          error:
            "O serviço de e-mail não aceitou o envio. Verifique a configuração do remetente e tente novamente.",
        },
        502,
      );
    }

    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Quote request email delivery failed", error);
    return jsonResponse(
      { error: "Não foi possível enviar a solicitação. Tente novamente." },
      502,
    );
  }
});
