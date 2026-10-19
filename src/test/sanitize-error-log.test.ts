import { describe, expect, it } from "vitest";
import {
  formatErrorForLog,
  sanitizeErrorLogDetails,
} from "../../supabase/functions/_shared/sanitize-error-log.ts";

describe("Edge Function error log sanitization", () => {
  it("preserves error details while redacting credentials from JSON", () => {
    const details = sanitizeErrorLogDetails(
      JSON.stringify({
        error: { message: "Provider rejected the request" },
        authorization: "Bearer header-secret",
        apiKey: "provider-secret",
      }),
    );

    expect(details).toContain("Provider rejected the request");
    expect(details).not.toContain("header-secret");
    expect(details).not.toContain("provider-secret");
  });

  it("redacts bearer tokens, query credentials, and the configured API key", () => {
    const details = formatErrorForLog(
      new Error(
        "Request failed with Bearer header-secret at https://example.test?api_key=query-secret",
      ),
      ["configured-secret"],
    );

    expect(details).toContain("Request failed");
    expect(details).not.toContain("header-secret");
    expect(details).not.toContain("query-secret");
    expect(
      sanitizeErrorLogDetails("Upstream echoed configured-secret", [
        "configured-secret",
      ]),
    ).not.toContain("configured-secret");
  });
});
