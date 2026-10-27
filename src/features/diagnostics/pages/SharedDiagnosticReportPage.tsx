import { useEffect, useState } from "react";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logoColored from "@/assets/logo-colored.png";
import DiagnosticReportPreview from "@/features/diagnostics/components/DiagnosticReportPreview";
import {
  getPublicDiagnosticReport,
  type PublicDiagnosticReport,
} from "@/features/diagnostics/services/diagnostic-reports";
import { importPdfReports } from "@/lib/dynamic-import";
import { useToast } from "@/hooks/use-toast";

export default function SharedDiagnosticReportPage() {
  const { reportId = "" } = useParams();
  const [report, setReport] = useState<PublicDiagnosticReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMessage(null);
    setReport(null);

    void getPublicDiagnosticReport(reportId)
      .then((savedReport) => {
        if (!active) return;
        if (!savedReport) {
          setErrorMessage("Não encontramos um relatório com este identificador.");
          return;
        }
        setReport(savedReport);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar este relatório. Tente novamente.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reportId]);

  const downloadPdf = async () => {
    if (!report) return;
    setDownloading(true);
    try {
      const url = report.report.geo?.domain;
      if (!url) throw new Error("O site analisado não está disponível no relatório.");
      const {
        createDiagnosticReportPdf,
        downloadPdf: savePdf,
        reportPdfFilename,
      } = await importPdfReports();
      const blob = await createDiagnosticReportPdf(url, report.report);
      savePdf(blob, reportPdfFilename(url, "diagnostico"));
      toast({
        title: "Relatório pronto",
        description: "Download iniciado.",
      });
    } catch (error) {
      console.error("Unable to download the shared diagnostic report.", error);
      toast({
        title: "Erro ao baixar relatório",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível gerar o arquivo PDF.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main className="min-h-screen pb-16" style={{ background: "var(--gradient-hero)" }}>
      <div className="container max-w-5xl space-y-8 py-12 md:py-16">
        <header className="flex flex-col items-center gap-5 text-center">
          <Link to="/" aria-label="Ir para o início">
            <img src={logoColored} alt="Metricfly" className="h-16 object-contain" />
          </Link>
          <h1 className="text-3xl font-bold text-foreground">
            Relatório de diagnóstico
          </h1>
          {report && (
            <Button onClick={downloadPdf} disabled={downloading}>
              {downloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Baixar relatório em PDF
            </Button>
          )}
        </header>

        {loading && (
          <div role="status" className="flex items-center justify-center gap-3 py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p>Carregando relatório salvo...</p>
          </div>
        )}

        {!loading && errorMessage && (
          <section
            role="alert"
            className="mx-auto max-w-xl space-y-4 rounded-lg border border-border bg-card p-8 text-center"
          >
            <h2 className="text-xl font-semibold">Relatório indisponível</h2>
            <p className="text-muted-foreground">{errorMessage}</p>
            <Button asChild variant="outline">
              <Link to="/diagnostico">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar ao diagnóstico
              </Link>
            </Button>
          </section>
        )}

        {!loading && report && (
          <>
            <p className="text-center text-sm text-muted-foreground">
              Relatório criado em{" "}
              {new Date(report.createdAt).toLocaleString("pt-BR")}
            </p>
            <DiagnosticReportPreview
              url={report.report.geo?.domain ?? ""}
              mobile={report.report.summary.mobile}
              desktop={report.report.summary.desktop}
              improvements={report.report.improvements}
              uiux={report.report.uiux}
              extras={report.report.extras}
            />
          </>
        )}
      </div>
    </main>
  );
}
