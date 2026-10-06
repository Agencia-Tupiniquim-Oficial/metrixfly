import BusinessDocxPreview from "@/components/BusinessDocxPreview";
import DocxPreview from "@/components/DocxPreview";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { BusinessSummary } from "@/lib/business-report";
import { Building2, Download, Eye, FileText, Loader2, Pencil, UserRound } from "lucide-react";
import { useState } from "react";

type DiagnosticImprovement = {
  title: string;
  description?: string;
  problem?: string;
  impact?: string[];
  causes?: string[];
  recommendations?: string[];
};

type DiagnosticSideData = {
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
    navigation?: number;
  };
  metrics: {
    fcp: string;
    lcp: string;
    tbt: string;
    cls: string;
    si: string;
  };
  screenshot?: string | null;
  pagespeedScreenshot?: string | null;
  opportunities?: { title: string; displayValue?: string }[];
};

type DiagnosticResult = {
  summary: {
    mobile: DiagnosticSideData;
    desktop: DiagnosticSideData;
    screenshot?: string | null;
  };
  improvements: DiagnosticImprovement[];
  uiux?: {
    overview?: string;
    diagnosis?: string[];
    recommendations?: string[];
  } | null;
  extras?: { title: string; description: string }[];
  docx?: string;
  geo?: unknown;
};

type Props = {
  url: string;
  result: DiagnosticResult | null;
  previewMode: "view" | "edit";
  setPreviewMode: (mode: "view" | "edit") => void;
  updateImprovement: (
    index: number,
    field: string,
    value: string | string[],
  ) => void;
  updateUiuxOverview: (value: string) => void;
  downloadDocx: () => void;
  downloading: boolean;
  downloadBusinessReport: () => void;
  businessDownloading: boolean;
  businessSummary?: BusinessSummary | null;
  setBusinessSummary?: (summary: BusinessSummary) => void;
  businessLoading?: boolean;
  onLoadBusinessSummary?: () => Promise<unknown>;
};

export default function DiagnosticPreview({
  url,
  result,
  previewMode,
  setPreviewMode,
  updateImprovement,
  updateUiuxOverview,
  downloadDocx,
  downloading,
  downloadBusinessReport,
  businessDownloading,
  businessSummary,
  setBusinessSummary,
  businessLoading = false,
  onLoadBusinessSummary,
}: Props) {
  const [reportType, setReportType] = useState<"full" | "corporate">("full");

  if (!result) return null;

  const handleSelectCorporate = () => {
    setReportType("corporate");
    if (!businessSummary && !businessLoading && onLoadBusinessSummary) {
      void onLoadBusinessSummary();
    }
  };

  return (
    <div>
      <Card className="border-border bg-card p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-foreground">
              <Eye className="h-4 w-4 text-primary" />
              {reportType === "corporate"
                ? "Preview da versão corporativa (.docx)"
                : "Preview do relatório completo (.docx)"}
            </h3>
            <p className="text-sm text-muted-foreground">
              {reportType === "corporate"
                ? "Visualize o resumo executivo de negócios e ajuste textos antes de baixar."
                : "Visualize o padrão e ajuste textos antes de baixar."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md border border-border bg-secondary p-1">
              <Button
                type="button"
                size="sm"
                variant={reportType === "full" ? "default" : "ghost"}
                onClick={() => setReportType("full")}
              >
                <FileText className="mr-1.5 h-4 w-4" />
                Relatório completo
              </Button>
              <Button
                type="button"
                size="sm"
                variant={reportType === "corporate" ? "default" : "ghost"}
                onClick={handleSelectCorporate}
              >
                <Building2 className="mr-1.5 h-4 w-4" />
                Versão corporativa
              </Button>
            </div>

            <div className="inline-flex rounded-md border border-border bg-secondary p-1">
              <Button
                type="button"
                size="sm"
                variant={previewMode === "view" ? "default" : "ghost"}
                onClick={() => setPreviewMode("view")}
              >
                <Eye className="mr-1.5 h-4 w-4" />
                Visualizar
              </Button>
              <Button
                type="button"
                size="sm"
                variant={previewMode === "edit" ? "default" : "ghost"}
                onClick={() => setPreviewMode("edit")}
              >
                <Pencil className="mr-1.5 h-4 w-4" />
                Editar
              </Button>
            </div>
          </div>
        </div>

        <div className="-mx-6 -mb-6 overflow-x-auto rounded-b-lg bg-muted/40 px-4 py-8">
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
              <BusinessDocxPreview
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
            <DocxPreview
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

      <div className="sticky bottom-4 mt-4 grid gap-3 sm:grid-cols-2">
        <Button
          onClick={downloadDocx}
          disabled={downloading}
          size="lg"
          variant={reportType === "full" ? "hero" : "outline"}
          className="w-full font-semibold"
          style={reportType === "full" ? { boxShadow: "var(--shadow-glow)" } : undefined}
        >
          <Download className="mr-2 h-5 w-5" />
          Baixar relatório .docx completo
        </Button>
        <Button
          onClick={downloadBusinessReport}
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
            : "Baixar versão corporativa"}
        </Button>
      </div>
    </div>
  );
}
