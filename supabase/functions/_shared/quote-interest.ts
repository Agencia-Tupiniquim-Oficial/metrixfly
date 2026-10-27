export const QUOTE_INTEREST_EVENT_TYPES = [
  "dialog_opened",
  "request_submitted",
] as const;

export const SERVICE_INTERESTS = [
  "general",
  "search_console",
  "analytics",
] as const;

export type QuoteInterestEventType = (typeof QUOTE_INTEREST_EVENT_TYPES)[number];
export type ServiceInterest = (typeof SERVICE_INTERESTS)[number];

export type QuoteInterestRecord = {
  event_type: QuoteInterestEventType;
  session_id: string;
  report_id: string | null;
  domain: string;
  service_interest: ServiceInterest;
};

const SERVICE_INTEREST_LABELS: Record<ServiceInterest, string> = {
  general: "Orçamento geral",
  search_console: "Google Search Console",
  analytics: "Google Analytics",
};

export function serviceInterestLabel(interest: ServiceInterest): string {
  return SERVICE_INTEREST_LABELS[interest];
}

/** Form field value to a known interest: empty means general, unknown is invalid. */
export function parseServiceInterest(value: unknown): ServiceInterest | null {
  if (value === null || value === undefined || value === "") return "general";
  return oneOf(SERVICE_INTERESTS, value);
}

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function oneOf<T extends string>(
  options: readonly T[],
  value: unknown,
): T | null {
  return typeof value === "string" && (options as readonly string[]).includes(value)
    ? (value as T)
    : null;
}

function hostnameFrom(value: unknown): string | null {
  if (typeof value !== "string" || !value || value.length > 2048) return null;
  try {
    const parsed = new URL(value);
    if (
      !["http:", "https:"].includes(parsed.protocol) ||
      parsed.username ||
      parsed.password
    ) {
      return null;
    }
    const hostname = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    return hostname && hostname.length <= 253 ? hostname : null;
  } catch {
    return null;
  }
}

/**
 * Validates the public payload and keeps only the allowed fields, so no
 * personal data can reach the table even if the client sends it.
 */
export function parseQuoteInterestEvent(
  body: unknown,
): QuoteInterestRecord | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const input = body as Record<string, unknown>;

  const eventType = oneOf(QUOTE_INTEREST_EVENT_TYPES, input.eventType);
  const serviceInterest =
    input.serviceInterest === undefined
      ? "general"
      : oneOf(SERVICE_INTERESTS, input.serviceInterest);
  const domain = hostnameFrom(input.domain);
  const sessionId =
    typeof input.sessionId === "string" && UUID.test(input.sessionId)
      ? input.sessionId.toLowerCase()
      : null;

  let reportId: string | null = null;
  if (input.reportId !== undefined && input.reportId !== null) {
    if (typeof input.reportId !== "string" || !UUID.test(input.reportId)) {
      return null;
    }
    reportId = input.reportId.toLowerCase();
  }

  if (!eventType || !serviceInterest || !domain || !sessionId) return null;

  return {
    event_type: eventType,
    session_id: sessionId,
    report_id: reportId,
    domain,
    service_interest: serviceInterest,
  };
}
