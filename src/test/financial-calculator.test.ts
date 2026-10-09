import { describe, expect, it } from "vitest";
import {
  calculateFinancialEstimate,
  estimateAbandonmentRate,
} from "@/lib/financial-calculator";

describe("financial calculator", () => {
  it("uses mobile performance as an editable abandonment starting point", () => {
    expect(estimateAbandonmentRate(43)).toBe(38);
    expect(estimateAbandonmentRate(71)).toBe(22);
    expect(estimateAbandonmentRate(90)).toBe(8);
  });

  it("estimates losses, recovery, ROI, and payback", () => {
    expect(
      calculateFinancialEstimate({
        monthlyVisitors: 15000,
        abandonmentRate: 38,
        conversionRate: 2,
        averageValue: 250,
        recoveryRate: 50,
        projectCost: 5000,
      }),
    ).toEqual({
      abandonedVisitors: 5700,
      estimatedLostConversions: 114,
      estimatedMonthlyLoss: 28500,
      recoverableConversions: 57,
      estimatedMonthlyRecovery: 14250,
      estimatedAnnualRecovery: 171000,
      annualRoiPercent: 3320,
      paybackMonths: 5000 / 14250,
    });
  });

  it("does not show ROI or payback without a valid investment or recovery", () => {
    const estimate = calculateFinancialEstimate({
      monthlyVisitors: 1000,
      abandonmentRate: 0,
      conversionRate: 2,
      averageValue: 250,
      recoveryRate: 50,
      projectCost: 0,
    });

    expect(estimate.annualRoiPercent).toBeNull();
    expect(estimate.paybackMonths).toBeNull();
  });
});
