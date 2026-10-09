export type FinancialCalculatorInputs = {
  monthlyVisitors: number;
  abandonmentRate: number;
  conversionRate: number;
  averageValue: number;
  recoveryRate: number;
  projectCost: number;
};

export type FinancialCalculatorEstimate = {
  abandonedVisitors: number;
  estimatedLostConversions: number;
  estimatedMonthlyLoss: number;
  recoverableConversions: number;
  estimatedMonthlyRecovery: number;
  estimatedAnnualRecovery: number;
  annualRoiPercent: number | null;
  paybackMonths: number | null;
};

export function estimateAbandonmentRate(mobileScore: number): number {
  if (mobileScore < 50) return 38;
  if (mobileScore < 80) return 22;
  return 8;
}

export function calculateFinancialEstimate(
  inputs: FinancialCalculatorInputs,
): FinancialCalculatorEstimate {
  const abandonedVisitors = Math.round(
    inputs.monthlyVisitors * (inputs.abandonmentRate / 100),
  );
  const estimatedLostConversions = Math.round(
    abandonedVisitors * (inputs.conversionRate / 100),
  );
  const estimatedMonthlyLoss =
    estimatedLostConversions * inputs.averageValue;
  const recoverableConversions = Math.round(
    estimatedLostConversions * (inputs.recoveryRate / 100),
  );
  const estimatedMonthlyRecovery =
    recoverableConversions * inputs.averageValue;
  const estimatedAnnualRecovery = estimatedMonthlyRecovery * 12;
  const annualRoiPercent =
    inputs.projectCost > 0
      ? Math.round(
          (((estimatedAnnualRecovery - inputs.projectCost) /
            inputs.projectCost) *
            100 +
            Number.EPSILON) *
            100,
        ) / 100
      : null;

  return {
    abandonedVisitors,
    estimatedLostConversions,
    estimatedMonthlyLoss,
    recoverableConversions,
    estimatedMonthlyRecovery,
    estimatedAnnualRecovery,
    annualRoiPercent,
    paybackMonths:
      inputs.projectCost > 0 && estimatedMonthlyRecovery > 0
        ? inputs.projectCost / estimatedMonthlyRecovery
        : null,
  };
}
