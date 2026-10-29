import type { FormEvent } from "react";
import type { BusinessSummary } from "./business-report";
import type { DiagnoseResult, Improvement } from "./diagnose";
import type { DiagnosticProgressState } from "./diagnostic-progress";
import type { QuoteRequest, ServiceInterest } from "./quote-request";

export type DiagnosticPageProps = {
  url: string;
  setUrl: (url: string) => void;
  loading: boolean;
  diagnosticProgress?: DiagnosticProgressState;
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
  sendQuoteRequest?: (request: QuoteRequest) => Promise<void>;
  onQuoteDialogOpen?: (interest: ServiceInterest) => void;
  quoteSending: boolean;
  reportUrl?: string | null;
  /** The finished report stays blurred until the visitor gives an e-mail. */
  reportLocked?: boolean;
  onUnlockReport?: (email: string) => Promise<void>;
  /** The quote popup opened by the closing band, or right after a diagnostic asked for from it. */
  quoteDialogOpen?: boolean;
  onQuoteDialogOpenChange?: (open: boolean) => void;
  /** The visitor asked for a quote before having a diagnostic: open it when the report is ready. */
  onQuoteIntent?: () => void;
  openGeoDashboard?: (crawl?: unknown) => void;
};
