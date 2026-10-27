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
import { Building2, CheckCircle2, Download, Eye, Loader2 } from "lucide-react";
import { useState, type ReactNode } from "react";
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
  /** Rendered between the report and the closing quote band (e.g. the saved-report link). */
  footer?: ReactNode;
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
  footer,
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
            onOpened={onQuoteDialogOpen}
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

  const suggestionCount = result.improvements.length;
  const modeButton = (mode: "view" | "edit", label: string) => (
    <button
      type="button"
      aria-pressed={previewMode === mode}
      onClick={() => setPreviewMode(mode)}
      className={`min-h-10 rounded-lg px-3.5 text-sm transition-colors ${
        previewMode === mode
          ? "bg-card font-bold text-foreground shadow-sm"
          : "font-semibold text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
            {reportType === "corporate"
              ? "Versão corporativa"
              : "Relatório do diagnóstico"}
          </h2>
          <p className="text-sm text-muted-foreground">
            {reportType === "corporate"
              ? "Resumo para quem decide, sem jargão técnico."
              : `${suggestionCount} ${suggestionCount === 1 ? "sugestão" : "sugestões"} de melhoria · revise e edite os textos antes de baixar`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            role="group"
            aria-label="Modo do relatório"
            className="inline-flex rounded-xl bg-muted p-1"
          >
            {modeButton("view", "Visualizar")}
            {modeButton("edit", "Editar")}
          </div>
          {reportType === "full" ? (
            <>
              <Button
                onClick={downloadTechnicalPdf}
                disabled={downloading}
                size="lg"
                variant="hero"
                className="font-bold"
              >
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Baixar PDF técnico
              </Button>
              <Button
                type="button"
                onClick={handleSelectCorporate}
                size="lg"
                variant="outline"
                className="font-bold"
              >
                Versão corporativa
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                onClick={() => setReportType("full")}
                size="lg"
                variant="outline"
                className="font-bold"
              >
                Voltar ao relatório técnico
              </Button>
              <Button
                onClick={downloadBusinessPdf}
                disabled={businessDownloading || businessLoading}
                size="lg"
                variant="hero"
                className="font-bold"
              >
                {businessDownloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                {businessDownloading
                  ? "Preparando relatório..."
                  : "Baixar PDF corporativo"}
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-secondary p-4 md:p-10">
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

      {footer}

      {onSubmitQuoteRequest && (
        <section className="mt-8 flex flex-wrap items-center justify-between gap-6 rounded-2xl bg-primary px-6 py-8 text-primary-foreground md:px-10">
          <div className="min-w-0 flex-1 basis-80 space-y-1.5">
            <h2 className="text-2xl font-extrabold tracking-tight">
              Quer ajuda para aplicar essas melhorias?
            </h2>
            <p className="opacity-90">
              Nossa equipe recebe o diagnóstico junto com o pedido e retorna com
              um orçamento.
            </p>
          </div>
          <div className="w-full sm:w-64">
            <QuoteRequestDialog
              onSubmitRequest={onSubmitQuoteRequest}
              onOpened={onQuoteDialogOpen}
              sending={quoteSending}
              triggerClassName="border-transparent bg-background text-primary hover:bg-background/90 hover:text-primary"
            />
          </div>
        </section>
      )}
    </div>
  );
}
