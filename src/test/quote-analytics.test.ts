import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { trackQuoteRequestLead } from "@/features/diagnostics/services/quote-analytics";

type TestWindow = Window & { dataLayer?: Record<string, unknown>[] };
const testWindow = window as TestWindow;

beforeEach(() => {
  testWindow.dataLayer = [];
});

afterEach(() => {
  delete testWindow.dataLayer;
});

describe("trackQuoteRequestLead", () => {
  it("pushes a generate_lead event with the analyzed hostname and no personal data", () => {
    trackQuoteRequestLead("https://www.exemplo.com.br/pagina?x=1");

    expect(testWindow.dataLayer).toHaveLength(1);
    const [entry] = testWindow.dataLayer!;
    expect(entry).toMatchObject({
      event: "generate_lead",
      form_name: "form-contato",
      lead_source: "diagnostic_quote_request",
      site_domain: "exemplo.com.br",
    });
    expect(typeof entry.event_id).toBe("string");
    expect(Object.keys(entry).sort()).toEqual(
      ["event", "event_id", "form_name", "lead_source", "site_domain"].sort(),
    );
  });

  it("gives every confirmed submission its own event_id", () => {
    trackQuoteRequestLead("https://exemplo.com.br");
    trackQuoteRequestLead("https://exemplo.com.br");

    const ids = testWindow.dataLayer!.map((entry) => entry.event_id);
    expect(new Set(ids).size).toBe(2);
  });

  it("does not throw when the domain is not a valid URL", () => {
    expect(() => trackQuoteRequestLead("not a url")).not.toThrow();
    expect(testWindow.dataLayer?.[0]).toMatchObject({ site_domain: "" });
  });
});
