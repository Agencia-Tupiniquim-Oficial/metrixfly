// src/types/diagnose.ts

export type Scores = {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  navigation?: string | null;
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
  opportunities?: any[];
};

export type DiagnoseResult = {
  summary: {
    mobile: PageSummary;
    desktop: PageSummary;
    screenshot?: string | null;
  };
  improvements: any[];
  uiux?: any | null;
  extras?: any[];
};
