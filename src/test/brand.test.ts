import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  BRAND_NAME,
  quoteEmailHeading,
  quoteEmailSubject,
} from "../../supabase/functions/_shared/brand.ts";

const legacyBrandNames = /Speed ?Fly|Speed ?Link|Metrix ?fly/i;

function readProjectFile(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

describe("brand name", () => {
  it("uses Metricfly as the official name in quote request emails", () => {
    expect(BRAND_NAME).toBe("Metricfly");
    expect(quoteEmailSubject()).toBe("[Metricfly] Novo orçamento");
    expect(quoteEmailHeading()).toBe("Nova solicitação de orçamento - Metricfly");
  });

  it.each([
    "supabase/functions/quote-request/index.ts",
    "index.html",
    "README.md",
    "src/features/diagnostics/pages/SharedDiagnosticReportPage.tsx",
    "src/features/diagnostics/demo/diagnosticMock.ts",
  ])("keeps legacy brand names out of user-facing text in %s", (path) => {
    const visibleText = readProjectFile(path)
      // Internal identifiers and asset names are not user-facing.
      .replace(/metrixfly\.vercel\.app/gi, "")
      .replace(/metrixfly:[a-z-]+/gi, "");
    expect(visibleText).not.toMatch(legacyBrandNames);
  });
});
