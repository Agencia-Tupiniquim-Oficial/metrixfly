import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { parseQuoteInterestEvent } from "../_shared/quote-interest.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_BODY_BYTES = 4096;

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return jsonResponse({ error: "Método não permitido." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Registro não configurado." }, 503);
  }

  let body: unknown;
  try {
    const text = await req.text();
    if (text.length > MAX_BODY_BYTES) {
      return jsonResponse({ error: "Solicitação inválida." }, 400);
    }
    body = JSON.parse(text);
  } catch {
    return jsonResponse({ error: "Solicitação inválida." }, 400);
  }

  const record = parseQuoteInterestEvent(body);
  if (!record) return jsonResponse({ error: "Solicitação inválida." }, 400);

  try {
    // The unique key makes repeated events from one session a no-op.
    const response = await fetch(
      `${supabaseUrl.replace(/\/$/, "")}/rest/v1/quote_interest_events?on_conflict=session_id,event_type,domain,service_interest`,
      {
        method: "POST",
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
          Prefer: "resolution=ignore-duplicates,return=minimal",
        },
        body: JSON.stringify(record),
      },
    );

    if (!response.ok) {
      console.error("Quote interest insert failed", response.status);
      return jsonResponse({ error: "Não foi possível registrar o evento." }, 502);
    }
    return jsonResponse({ success: true });
  } catch (error) {
    console.error("Quote interest insert failed", error);
    return jsonResponse({ error: "Não foi possível registrar o evento." }, 502);
  }
});
