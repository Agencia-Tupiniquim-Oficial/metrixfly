import { supabase } from "@/integrations/supabase/client";
import type { ServiceInterest } from "@/features/diagnostics/model/quote-request";

export type QuoteInterestEventType = "dialog_opened" | "request_submitted";

export type QuoteInterestEvent = {
  eventType: QuoteInterestEventType;
  /** Analyzed site URL; the Edge Function reduces it to the hostname. */
  domain: string;
  reportId?: string | null;
  serviceInterest?: ServiceInterest;
};

const SESSION_KEY = "metrixfly:quote-interest-session";
const sentEvents = new Set<string>();
let inMemorySessionId: string | null = null;

function getSessionId(): string {
  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (stored) return stored;
    const created = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    inMemorySessionId = inMemorySessionId ?? crypto.randomUUID();
    return inMemorySessionId;
  }
}

export function resetQuoteInterestForTests(): void {
  sentEvents.clear();
  inMemorySessionId = null;
}

/**
 * Records the interest signal without ever blocking the user: failures are
 * logged and swallowed, and the same event is sent once per company and
 * interest in a browser session (the table also enforces this).
 */
export async function recordQuoteInterest(event: QuoteInterestEvent): Promise<void> {
  const serviceInterest = event.serviceInterest ?? "general";
  const key = `${event.eventType}|${event.domain}|${serviceInterest}`;
  if (sentEvents.has(key)) return;
  sentEvents.add(key);

  try {
    const { error } = await supabase.functions.invoke("quote-interest", {
      body: {
        eventType: event.eventType,
        sessionId: getSessionId(),
        domain: event.domain,
        reportId: event.reportId ?? null,
        serviceInterest,
      },
    });
    if (error) throw error;
  } catch (error) {
    sentEvents.delete(key);
    console.warn("Unable to record the quote interest event.", error);
  }
}
