import { useEffect, useState } from "react";
import QuoteBand from "@/components/quote-band";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
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

  const domain = report?.report.geo?.domain ?? "";

  return (
    <div className="min-h-screen bg-secondary/40">
      <header className="border-b border-border bg-background">
        <div className="container flex max-w-4xl flex-wrap items-center justify-between gap-4 py-3">
          <Link to="/" aria-label="Ir para o início" className="flex items-center gap-2.5">
            <img src={logoColored} alt="" className="h-9 w-9 object-contain" />
            <span className="text-lg font-extrabold tracking-tight">Metricfly</span>
          </Link>
          <div className="flex items-center gap-2">
            {report && (
              <Button onClick={downloadPdf} disabled={downloading} variant="hero">
                {downloading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Baixar relatório em PDF
              </Button>
            )}
            <ThemeToggle inline />
          </div>
        </div>
      </header>

      <main className="container max-w-4xl space-y-7 py-10 md:py-12">
        {loading && (
          <div role="status" className="flex items-center justify-center gap-3 py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p>Carregando relatório salvo...</p>
          </div>
        )}

        {!loading && errorMessage && (
          <section
            role="alert"
            className="mx-auto max-w-xl space-y-4 rounded-2xl border border-border bg-card p-8 text-center"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <h1 className="text-xl font-semibold">Relatório indisponível</h1>
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
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                Relatório de diagnóstico
              </p>
              <h1 className="break-words text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
                {domain || "Relatório de diagnóstico"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Relatório criado em{" "}
                {new Date(report.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>

            <div className="rounded-2xl bg-secondary p-2 sm:p-4 md:p-10">
              <DiagnosticReportPreview
                url={domain}
                mobile={report.report.summary.mobile}
                desktop={report.report.summary.desktop}
                improvements={report.report.improvements}
                uiux={report.report.uiux}
                extras={report.report.extras}
              />
            </div>

            <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card px-6 py-5">
              <div className="flex flex-col">
                <span className="font-bold">Gerado com Metricfly</span>
                <span className="text-sm text-muted-foreground">
                  Diagnostique o seu site também.
                </span>
              </div>
              <Button asChild variant="outline" size="lg" className="border-primary text-primary">
                <Link to="/">Diagnosticar meu site</Link>
              </Button>
            </section>
          </>
        )}
      </main>
      <QuoteBand location="relatorio-compartilhado" />
    </div>
  );
}
