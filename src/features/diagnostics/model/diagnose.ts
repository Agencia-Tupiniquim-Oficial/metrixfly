// src/types/diagnose.ts

export type Scores = {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  navigation?: number | string | null;
};

export type Metrics = {
  fcp?: string | null;
  lcp?: string | null;
  tbt?: string | null;
  cls?: string | number | null;
  si?: string | null;
  tti?: string | null;
  ttfb?: string | null;
  pageSize?: string | null;
  requests?: string | number | null;
};

export type PageSummary = {
  scores: Scores;
  metrics: Metrics;
  screenshot?: string | null;
  pagespeedScreenshot?: string | null;
  opportunities?: Opportunities[];
};

export type Opportunities = {
  title: string;
  displayValue?: string;
  score?: number;
  impact?: string[];
  causes?: string[];
  recommendations?: string[];
};

export type Improvement = {
  title: string;
  description?: string;
  problem?: string;
  impact?: string[];
  causes?: string[];
  recommendations?: string[];
};

export type UiUxSummary = {
  overview?: string;
  diagnosis?: string[];
  recommendations?: string[];
};

export type DiagnoseResult = {
  summary: {
    mobile: PageSummary;
    desktop: PageSummary;
    screenshot?: string | null;
  };
  scoreAvailability?: {
    mobile: boolean;
    desktop: boolean;
  };
  improvements: Improvement[];
  uiux?: UiUxSummary | null;
  extras?: { title: string; description: string }[];
  geo?: { domain?: string } | null;
};

export function isDiagnosticOptimized(
  result: DiagnoseResult | null | undefined,
): boolean {
  if (
    !result ||
    result.scoreAvailability?.mobile !== true ||
    result.scoreAvailability.desktop !== true
  ) {
    return false;
  }

  const scoreGroups = [
    result.summary?.mobile?.scores,
    result.summary?.desktop?.scores,
  ];
  const scoreNames = [
    "performance",
    "accessibility",
    "bestPractices",
    "seo",
  ] as const;

  return scoreGroups.every(
    (scores) =>
      scores !== undefined &&
      scoreNames.every((name) => {
        const score = scores[name];
        return typeof score === "number" && Number.isFinite(score) && score > 90;
      }),
  );
}
