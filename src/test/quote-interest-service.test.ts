import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ invoke: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { functions: { invoke: mocks.invoke } },
}));

import {
  recordQuoteInterest,
  resetQuoteInterestForTests,
} from "@/features/diagnostics/services/quote-interest";

const base = {
  eventType: "dialog_opened" as const,
  domain: "https://exemplo.com.br",
  reportId: "0b8e7f3a-91c4-4c53-bb0a-2f6d3e4a5c10",
};

describe("recordQuoteInterest", () => {
  beforeEach(() => {
    mocks.invoke.mockReset();
    mocks.invoke.mockResolvedValue({ data: { success: true }, error: null });
    resetQuoteInterestForTests();
    window.sessionStorage.clear();
  });

  it("sends the event with a stable session id and no personal data", async () => {
    await recordQuoteInterest({ ...base, serviceInterest: "analytics" });

    expect(mocks.invoke).toHaveBeenCalledTimes(1);
    const [name, options] = mocks.invoke.mock.calls[0];
    expect(name).toBe("quote-interest");
    expect(options.body).toMatchObject({
      eventType: "dialog_opened",
      domain: "https://exemplo.com.br",
      reportId: base.reportId,
      serviceInterest: "analytics",
    });
    expect(options.body.sessionId).toMatch(/^[0-9a-f-]{36}$/);
    expect(Object.keys(options.body).sort()).toEqual(
      ["domain", "eventType", "reportId", "serviceInterest", "sessionId"],
    );
  });

  it("does not repeat the same event for the same company and interest", async () => {
    await recordQuoteInterest(base);
    await recordQuoteInterest(base);
    await recordQuoteInterest({ ...base, serviceInterest: "analytics" });
    await recordQuoteInterest({ ...base, eventType: "request_submitted" });

    expect(mocks.invoke).toHaveBeenCalledTimes(3);
  });

  it("reuses the same session id across events", async () => {
    await recordQuoteInterest(base);
    await recordQuoteInterest({ ...base, eventType: "request_submitted" });

    const ids = mocks.invoke.mock.calls.map(([, options]) => options.body.sessionId);
    expect(ids[0]).toBe(ids[1]);
  });

  it("never throws or blocks the flow when the request fails", async () => {
    mocks.invoke.mockRejectedValueOnce(new Error("network down"));
    await expect(recordQuoteInterest(base)).resolves.toBeUndefined();

    mocks.invoke.mockResolvedValueOnce({ data: null, error: new Error("500") });
    await expect(
      recordQuoteInterest({ ...base, domain: "https://outro.com.br" }),
    ).resolves.toBeUndefined();
  });

  it("allows a retry after a failed attempt", async () => {
    mocks.invoke.mockResolvedValueOnce({ data: null, error: new Error("500") });
    await recordQuoteInterest(base);
    await recordQuoteInterest(base);

    expect(mocks.invoke).toHaveBeenCalledTimes(2);
  });
});
