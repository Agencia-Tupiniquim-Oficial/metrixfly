import type { FormEvent } from "react";
import type { DiagnosticResult, DiagnosticImprovement } from "./diagnosticMock";
import type { BusinessSummary } from "@/lib/business-report";

export type DiagnosticVariantProps = {
  url: string;
  setUrl: (url: string) => void;
  loading: boolean;
  runDiagnostic: (e: FormEvent) => void;
  result: DiagnosticResult | null;
  geoLoading: boolean;
  runGeoCrawl: (e: FormEvent) => void;
  downloadDocx: () => void;
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
    field: keyof DiagnosticImprovement,
    value: string | string[],
  ) => void;
  updateUiuxOverview: (value: string) => void;
  openGeoDashboard?: (crawl?: unknown) => void;
};
