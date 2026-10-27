import BusinessReportPreview from "@/features/diagnostics/components/BusinessReportPreview";
import QuoteRequestDialog from "@/features/diagnostics/components/QuoteRequestDialog";
import DiagnosticReportPreview from "@/features/diagnostics/components/DiagnosticReportPreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BusinessSummary } from "@/features/diagnostics/model/business-report";
import type {
  QuoteRequest,
  ServiceInterest,
} from "@/features/diagnostics/model/quote-request";
import { Building2, CheckCircle2, Download, Eye, FileText, Loader2, Pencil, UserRound } from "lucide-react";
import { useState } from "react";
import {
  isDiagnosticOptimized,
  type DiagnoseResult,
  type Improvement,
} from "@/features/diagnostics/model/diagnose";

type Props = {
  url: string;
  result: DiagnoseResult | null;
  previewMode: "view" | "edit";
  setPreviewMode: (mode: "view" | "edit") => void;
  updateImprovement: (
    index: number,
    field: keyof Improvement,
    value: string | string[],
  ) => void;
  updateUiuxOverview: (value: string) => void;
  downloadTechnicalPdf: () => void;
  downloading: boolean;
  downloadBusinessPdf: () => void;
  businessDownloading: boolean;
  businessSummary?: BusinessSummary | null;
  setBusinessSummary?: (summary: BusinessSummary) => void;
  businessLoading?: boolean;
  onLoadBusinessSummary?: () => Promise<BusinessSummary | null>;
  onSubmitQuoteRequest?: (request: QuoteRequest) => Promise<void>;
  onQuoteDialogOpen?: (interest: ServiceInterest) => void;
  quoteSending?: boolean;
};

export default function DiagnosticPreview({
  url,
  result,
  previewMode,
  setPreviewMode,
  updateImprovement,
  updateUiuxOverview,
  downloadTechnicalPdf,
  downloading,
  downloadBusinessPdf,
  businessDownloading,
  businessSummary,
  setBusinessSummary,
  businessLoading = false,
  onLoadBusinessSummary,
  onSubmitQuoteRequest,
  onQuoteDialogOpen,
  quoteSending = false,
}: Props) {
  const [reportType, setReportType] = useState<"full" | "corporate">("full");

  if (!result) return null;

  if (isDiagnosticOptimized(result)) {
    return (
      <Card className="flex flex-col gap-5 border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900 dark:bg-emerald-950/40">
        <div className="flex items-start gap-3 text-emerald-900 dark:text-emerald-100">
          <CheckCircle2 aria-hidden="true" className="mt-0.5 h-6 w-6 shrink-0" />
          <div className="space-y-1">
            <h2 className="text-lg font-bold">Seu site está otimizado!</h2>
            <p className="text-sm leading-relaxed">
              Todas as notas de desempenho estão acima de 90. Não há sugestões
              técnicas adicionais para este diagnóstico.
            </p>
          </div>
        </div>
        <Button
          onClick={downloadTechnicalPdf}
          disabled={downloading}
          size="lg"
          variant="hero"
          className="w-full font-semibold sm:w-fit"
        >
          {downloading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <Download className="mr-2 h-5 w-5" />
          )}
          Baixar resultado do diagnóstico em PDF
        </Button>
        {onSubmitQuoteRequest && (
          <QuoteRequestDialog
            onSubmitRequest={onSubmitQuoteRequest}
            sending={quoteSending}
          />
        )}
      </Card>
    );
  }

  const handleSelectCorporate = () => {
    setReportType("corporate");
    if (!businessSummary && !businessLoading && onLoadBusinessSummary) {
      void onLoadBusinessSummary();
    }
  };

  return (
    <div>
      <Card className="border-border bg-card overflow-hidden">
        {/* Row 1: report type selector */}
        <div className="flex border-b border-border">
          <button
            type="button"
            onClick={() => setReportType("full")}
            className={`flex flex-1 items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition-colors
              ${reportType === "full"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
          >
            <FileText className="h-4 w-4 shrink-0" />
            Relatório técnico 
          </button>
          <div className="w-px bg-border" />
          <button
            type="button"
            onClick={handleSelectCorporate}
            className={`flex flex-1 items-center justify-center gap-2 px-6 py-4 text-sm font-semibold transition-colors
              ${reportType === "corporate"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"}`}
          >
            <Building2 className="h-4 w-4 shrink-0" />
            Versão corporativa
          </button>
        </div>

        {/* Row 2: preview area with view/edit toggle anchored top-right */}
        <div className="relative -mx-0 overflow-x-auto rounded-b-lg bg-muted/40 px-4 py-8">
          <div className="absolute right-4 top-4 inline-flex rounded-md border border-border bg-card shadow-sm">
            <Button
              type="button"
              size="sm"
              variant={previewMode === "view" ? "default" : "ghost"}
              onClick={() => setPreviewMode("view")}
              className="rounded-r-none"
            >
              <Eye className="mr-1.5 h-4 w-4" />
              Visualizar
            </Button>
            <Button
              type="button"
              size="sm"
              variant={previewMode === "edit" ? "default" : "ghost"}
              onClick={() => setPreviewMode("edit")}
              className="rounded-l-none border-l border-border"
            >
              <Pencil className="mr-1.5 h-4 w-4" />
              Editar
            </Button>
          </div>

          {reportType === "corporate" ? (
            businessLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">
                    Gerando versão corporativa...
                  </p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Sintetizando os dados do diagnóstico em formato executivo para negócios.
                  </p>
                </div>
              </div>
            ) : businessSummary ? (
              <BusinessReportPreview
                url={url}
                summary={businessSummary}
                editable={previewMode === "edit"}
                onSummaryChange={setBusinessSummary}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <Building2 className="h-10 w-10 text-muted-foreground" />
                <div className="space-y-1">
                  <p className="text-base font-semibold text-foreground">
                    Versão corporativa pronta para gerar
                  </p>
                  <p className="text-sm text-muted-foreground max-w-md">
                    Gere o resumo executivo para visualizar e personalizar antes de baixar.
                  </p>
                </div>
                <Button
                  onClick={onLoadBusinessSummary}
                  variant="hero"
                  disabled={businessLoading}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Gerar e visualizar versão corporativa
                </Button>
              </div>
            )
          ) : (
            <DiagnosticReportPreview
              url={url}
              mobile={result.summary.mobile}
              desktop={result.summary.desktop}
              improvements={result.improvements}
              uiux={result.uiux}
              extras={result.extras}
              editable={previewMode === "edit"}
              onImprovementChange={updateImprovement}
              onUiuxOverviewChange={updateUiuxOverview}
            />
          )}
        </div>
      </Card>


      <div className="sticky bottom-4 mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Button
          onClick={downloadTechnicalPdf}
          disabled={downloading}
          size="lg"
          variant={reportType === "full" ? "hero" : "outline"}
          className="w-full font-semibold"
          style={reportType === "full" ? { boxShadow: "var(--shadow-glow)" } : undefined}
        >
          <Download className="mr-2 h-5 w-5" />
          Baixar relatório técnico em PDF
        </Button>
        <Button
          onClick={downloadBusinessPdf}
          disabled={businessDownloading || businessLoading}
          size="lg"
          variant={reportType === "corporate" ? "hero" : "outline"}
          className="w-full font-semibold"
          style={reportType === "corporate" ? { boxShadow: "var(--shadow-glow)" } : undefined}
        >
          {businessDownloading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <UserRound className="mr-2 h-5 w-5" />
          )}
          {businessDownloading
            ? "Preparando relatório..."
            : "Baixar versão corporativa em PDF"}
        </Button>
        {onSubmitQuoteRequest && (
          <QuoteRequestDialog
            onSubmitRequest={onSubmitQuoteRequest}
            sending={quoteSending}
          />
        )}
      </div>
    </div>
  );
}
