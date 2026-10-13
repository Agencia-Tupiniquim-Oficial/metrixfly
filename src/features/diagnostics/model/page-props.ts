import type { FormEvent } from "react";
import type { BusinessSummary } from "./business-report";
import type { DiagnoseResult, Improvement } from "./diagnose";

export type DiagnosticPageProps = {
  url: string;
  setUrl: (url: string) => void;
  loading: boolean;
  runDiagnostic: (event: FormEvent) => void;
  result: DiagnoseResult | null;
  geoLoading: boolean;
  runGeoCrawl: (event: FormEvent) => void;
  downloadTechnicalPdf: () => void;
  downloading: boolean;
  downloadClientReport: () => void;
  businessDownloading: boolean;
  businessSummary: BusinessSummary | null;
  setBusinessSummary?: (summary: BusinessSummary) => void;
  businessLoading: boolean;
  fetchBusinessSummary: () => Promise<BusinessSummary | null>;
  previewMode: "view" | "edit";
  setPreviewMode: (mode: "view" | "edit") => void;
  updateImprovement: (
    index: number,
    field: keyof Improvement,
    value: string | string[],
  ) => void;
  updateUiuxOverview: (value: string) => void;
  openGeoDashboard?: (crawl?: unknown) => void;
};
