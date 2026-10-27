import { describe, expect, it } from "vitest";
import {
  parseQuoteInterestEvent,
  parseServiceInterest,
  serviceInterestLabel,
} from "../../supabase/functions/_shared/quote-interest.ts";

const sessionId = "6f1c2c1e-3b1a-4d6e-8f43-5b2f1c0d9a77";
const reportId = "0b8e7f3a-91c4-4c53-bb0a-2f6d3e4a5c10";

const valid = {
  eventType: "dialog_opened",
  sessionId,
  reportId,
  domain: "https://www.Exemplo.com.br/pagina?x=1",
  serviceInterest: "search_console",
};

describe("service interest in the quote email", () => {
  it("defaults to general when the field is absent or blank", () => {
    expect(parseServiceInterest(null)).toBe("general");
    expect(parseServiceInterest("")).toBe("general");
  });

  it("accepts the known services and rejects anything else", () => {
    expect(parseServiceInterest("search_console")).toBe("search_console");
    expect(parseServiceInterest("analytics")).toBe("analytics");
    expect(parseServiceInterest("<script>")).toBeNull();
  });

  it("labels each interest for the sales team", () => {
    expect(serviceInterestLabel("general")).toBe("Orçamento geral");
    expect(serviceInterestLabel("search_console")).toBe("Google Search Console");
    expect(serviceInterestLabel("analytics")).toBe("Google Analytics");
  });
});

describe("parseQuoteInterestEvent", () => {
  it("normalizes a valid event to the stored shape", () => {
    expect(parseQuoteInterestEvent(valid)).toEqual({
      event_type: "dialog_opened",
      session_id: sessionId,
      report_id: reportId,
      domain: "exemplo.com.br",
      service_interest: "search_console",
    });
  });

  it("defaults the service interest to general and allows a missing report id", () => {
    const { reportId: _reportId, serviceInterest: _interest, ...rest } = valid;

    expect(parseQuoteInterestEvent(rest)).toMatchObject({
      report_id: null,
      service_interest: "general",
    });
  });

  it.each([
    ["unknown event type", { ...valid, eventType: "page_view" }],
    ["invalid session id", { ...valid, sessionId: "abc" }],
    ["invalid report id", { ...valid, reportId: "not-a-uuid" }],
    ["unknown service interest", { ...valid, serviceInterest: "seo_audit" }],
    ["non-http domain", { ...valid, domain: "javascript:alert(1)" }],
    ["missing domain", { ...valid, domain: "" }],
    ["non-object body", "dialog_opened"],
    ["null body", null],
  ])("rejects %s", (_name, body) => {
    expect(parseQuoteInterestEvent(body)).toBeNull();
  });

  it("ignores extra fields so personal data is never stored", () => {
    const parsed = parseQuoteInterestEvent({
      ...valid,
      email: "ana@example.com",
      phone: "+55 41 99999-0000",
    });

    expect(Object.keys(parsed ?? {}).sort()).toEqual(
      ["domain", "event_type", "report_id", "service_interest", "session_id"],
    );
  });
});
