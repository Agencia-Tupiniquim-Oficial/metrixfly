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
