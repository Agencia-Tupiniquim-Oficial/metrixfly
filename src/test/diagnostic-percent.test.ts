import { describe, expect, it } from "vitest";
import {
  estimateDiagnosticPercent,
  initialDiagnosticProgress,
} from "@/features/diagnostics/model/diagnostic-progress";

describe("estimateDiagnosticPercent", () => {
  it("starts at zero and counts each confirmed stage as a fifth", () => {
    expect(estimateDiagnosticPercent(initialDiagnosticProgress, 0)).toBe(0);
    expect(
      estimateDiagnosticPercent({ ...initialDiagnosticProgress, starting: "completed" }, 0),
    ).toBe(20);
    expect(
      estimateDiagnosticPercent(
        { starting: "completed", mobile: "completed", desktop: "failed", ai: "fallback", finalizing: "running" },
        0,
      ),
    ).toBe(80);
  });

  it("creeps with time inside a stage but never reaches the next confirmed stage", () => {
    const running = { ...initialDiagnosticProgress, starting: "running" as const };
    const early = estimateDiagnosticPercent(running, 5);
    const late = estimateDiagnosticPercent(running, 600);

    expect(early).toBeGreaterThan(0);
    expect(late).toBeGreaterThan(early);
    expect(late).toBeLessThan(20);
  });

  it("never shows 100% before the report exists", () => {
    const done = { starting: "completed", mobile: "completed", desktop: "completed", ai: "completed", finalizing: "completed" } as const;
    expect(estimateDiagnosticPercent(done, 600)).toBe(99);
  });
});
