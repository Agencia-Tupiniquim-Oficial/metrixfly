import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const OPENROUTER_API_BASE =
  Deno.env.get("OPENROUTER_API_BASE") ?? "https://openrouter.ai/api";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type SummaryRequest = {
  url: string;
  scores: unknown;
  metrics: unknown;
  improvements: unknown[];
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseModelJson(content: string): unknown {
  const withoutFence = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "");
  return JSON.parse(withoutFence);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Método não permitido." }, 405);
  if (!OPENROUTER_API_KEY) {
    return jsonResponse({ error: "OPENROUTER_API_KEY não configurada." }, 500);
  }

  try {
    const input = (await req.json()) as Partial<SummaryRequest>;
    if (
      typeof input.url !== "string" ||
      !input.url.trim() ||
      !input.scores ||
      !input.metrics ||
      !Array.isArray(input.improvements)
    ) {
      return jsonResponse(
        { error: "Dados do diagnóstico incompletos para gerar o resumo." },
        400,
      );
    }

    const prompt = `Crie um relatório executivo detalhado em português do Brasil para o proprietário do site abaixo.

Regras obrigatórias:
- Retorne somente JSON válido, sem markdown.
- Use exatamente as chaves "resumo", "contexto", "impactoNegocio", "prioridades" e "proximoPasso".
- "resumo" deve ter 2 ou 3 parágrafos curtos, consultivos e fáceis de entender.
- "contexto" deve explicar como está a experiência atual de quem visita o site, sem termos técnicos.
- "impactoNegocio" deve listar 3 ou 4 possíveis efeitos para clientes, contatos, vendas e confiança.
- "prioridades" deve ser uma lista de 3 a 5 objetos, cada um com "titulo", "porQueImporta" e "acao".
- "proximoPasso" deve ser uma recomendação objetiva para iniciar as melhorias.
- Não use siglas ou jargões técnicos como LCP, TBT, CLS, FCP, TTFB, render-blocking, PageSpeed, cache, JavaScript ou SEO técnico.
- Traduza os dados para impacto de negócio: velocidade percebida, confiança, primeira impressão, facilidade para encontrar informações e risco de perder contatos/vendas.
- Não invente números, problemas ou resultados que não estejam nos dados.

Dados do diagnóstico:
${JSON.stringify({
      url: input.url,
      scores: input.scores,
      metrics: input.metrics,
      improvements: input.improvements.slice(0, 8),
    })}`;

    const response = await fetch(`${OPENROUTER_API_BASE}/v1/chat/completions`, {
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
            content: "Você é um consultor de negócios digitais. Responda somente JSON válido.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 1200,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error("OpenRouter business summary failed", response.status, details);
      return jsonResponse({ error: "Não foi possível gerar o resumo executivo agora." }, 502);
    }

    const payload = await response.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return jsonResponse({ error: "A IA não retornou um resumo válido." }, 502);
    }

    const parsed = parseModelJson(content) as Record<string, unknown>;
    const resumo = typeof parsed.resumo === "string" ? parsed.resumo.trim() : "";
    const contexto = typeof parsed.contexto === "string" ? parsed.contexto.trim() : "";
    const impactoNegocio = Array.isArray(parsed.impactoNegocio)
      ? parsed.impactoNegocio.filter((item): item is string => typeof item === "string").slice(0, 4)
      : [];
    const prioridades = Array.isArray(parsed.prioridades)
      ? parsed.prioridades
          .filter(
            (item): item is Record<string, unknown> =>
              Boolean(item) && typeof item === "object",
          )
          .map((item) => ({
            titulo: typeof item.titulo === "string" ? item.titulo.trim() : "",
            porQueImporta:
              typeof item.porQueImporta === "string" ? item.porQueImporta.trim() : "",
            acao: typeof item.acao === "string" ? item.acao.trim() : "",
          }))
          .filter((item) => item.titulo && item.porQueImporta && item.acao)
          .slice(0, 5)
      : [];
    const proximoPasso =
      typeof parsed.proximoPasso === "string" ? parsed.proximoPasso.trim() : "";

    if (
      !resumo ||
      !contexto ||
      impactoNegocio.length === 0 ||
      prioridades.length === 0 ||
      !proximoPasso
    ) {
      return jsonResponse({ error: "A IA retornou um resumo incompleto." }, 502);
    }

    return jsonResponse({
      resumo,
      contexto,
      impactoNegocio,
      prioridades,
      proximoPasso,
    });
  } catch (error) {
    console.error("business-summary error", error);
    return jsonResponse({ error: "Erro ao gerar o resumo executivo." }, 500);
  }
});
