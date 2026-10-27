import { pushDataLayerEvent } from "@/lib/analytics";

function hostnameOf(domain: string): string {
  try {
    return new URL(domain).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Call only after the quote-request function confirmed the delivery. The
 * payload carries the analyzed site, never the contact's personal data.
 */
export function trackQuoteRequestLead(analyzedDomain: string): void {
  pushDataLayerEvent({
    event: "generate_lead",
    form_name: "form-contato",
    lead_source: "diagnostic_quote_request",
    site_domain: hostnameOf(analyzedDomain),
    event_id: crypto.randomUUID(),
  });
}
