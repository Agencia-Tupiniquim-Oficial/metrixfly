import React from "react";
import {
  CheckCircle2,
  Calculator,
  FileText,
  Gauge,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppHeader } from "@/components/app-header";
import DiagnosticForm from "@/features/diagnostics/components/DiagnosticForm";
import DiagnosticPreview from "@/features/diagnostics/components/DiagnosticPreview";
import { CleanScoresGrid } from "./CleanScoresGrid";
import type { DiagnosticPageProps } from "@/features/diagnostics/model/page-props";
import { isDiagnosticOptimized } from "@/features/diagnostics/model/diagnose";
import { DiagnosticProgress } from "./DiagnosticProgress";
import { initialDiagnosticProgress } from "@/features/diagnostics/model/diagnostic-progress";
import { DiagnosticReportShareCard } from "./DiagnosticReportShareCard";

const eyebrow = "text-xs font-bold uppercase tracking-widest text-primary";

/** >= 90 green, 50-89 amber, below 50 red; dark text tones keep the contrast. */
const toneClass = (score: number) => {
  if (score >= 90)
    return "text-emerald-700 border-emerald-500 bg-emerald-50 dark:text-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/50";
  if (score >= 50)
    return "text-amber-700 border-amber-500 bg-amber-50 dark:text-amber-200 dark:border-amber-800 dark:bg-amber-950/50";
  return "text-rose-700 border-rose-500 bg-rose-50 dark:text-rose-200 dark:border-rose-800 dark:bg-rose-950/50";
};

const getGrade = (score: number) => {
  if (score >= 90) return { letter: "A", label: "Excelente" };
  if (score >= 75) return { letter: "B", label: "Bom" };
  if (score >= 50) return { letter: "C", label: "Regular" };
  if (score >= 30) return { letter: "D", label: "Crítico" };
  return { letter: "F", label: "Grave" };
};

export function DiagnosticExperience({
  url,
  setUrl,
  loading,
  diagnosticProgress = initialDiagnosticProgress,
  runDiagnostic,
  result,
  geoLoading,
  runGeoCrawl,
  downloadTechnicalPdf,
  downloading,
  downloadClientReport,
  businessDownloading,
  businessSummary,
  setBusinessSummary,
  businessLoading,
  fetchBusinessSummary,
  previewMode,
  setPreviewMode,
  updateImprovement,
  updateUiuxOverview,
  sendQuoteRequest,
  onQuoteDialogOpen,
  quoteSending,
  reportUrl,
}: DiagnosticPageProps) {
  const mobileScore = result?.summary.mobile.scores.performance ?? 43;
  const desktopScore = result?.summary.desktop.scores.performance ?? 71;
  const optimized = isDiagnosticOptimized(result);
  const financialCalculatorUrl = `/calculadora-financeira?mobileScore=${mobileScore}&traffic=15000&ticket=250`;
  const domain = url.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");

  const form = (
    <DiagnosticForm
      url={result ? domain : url}
      setUrl={setUrl}
      onSubmit={runDiagnostic}
      loading={loading}
      runGeoCrawl={runGeoCrawl}
      geoLoading={geoLoading}
    />
  );

  return (
    <div
      className="min-h-screen pb-32"
      style={{ background: "var(--gradient-hero)" }}
    >
      <AppHeader />
      <main className="container max-w-6xl py-10 md:py-14">
        {loading ? (
          <DiagnosticProgress progress={diagnosticProgress} domain={domain} />
        ) : !result ? (
          <div className="mx-auto max-w-3xl">
            <header className="motion-enter mb-8 flex flex-col items-center text-center">
              <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground md:text-6xl">
                Diagnóstico &{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{ backgroundImage: "var(--gradient-primary)" }}
                >
                  Desempenho
                </span>
              </h1>
              <p className="mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Analise as notas e métricas do PageSpeed Insights e identifique
                oportunidades técnicas para otimizar seu site.
              </p>
            </header>

            {form}

            <div className="motion-stagger mt-16 grid gap-6 sm:grid-cols-3">
              {[
                {
                  icon: Gauge,
                  title: "Boletim de Notas",
                  desc: "Avaliação clara de desempenho para tomadores de decisão.",
                },
                {
                  icon: Calculator,
                  title: "Cenários de otimização",
                  desc: "Estime o impacto da lentidão na experiência dos visitantes do seu site",
                },
                {
                  icon: FileText,
                  title: "Relatórios em PDF",
                  desc: "Gere versões técnicas e comerciais prontas para apresentação.",
                },
              ].map(({ icon: Icon, title, desc }) => (
                <Card
                  key={title}
                  className="motion-card border-border bg-card p-6 shadow-sm"
                >
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-foreground">
                    {title}
                  </h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {desc}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          <div className="motion-stagger space-y-8">
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div className="min-w-0 flex-1 basis-80 space-y-1">
                <p className={eyebrow}>Diagnóstico de desempenho</p>
                <h1 className="break-all text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
                  {domain}
                </h1>
              </div>
              <div className="w-full lg:w-[40rem]">{form}</div>
            </div>

            <Card className="space-y-7 border-border bg-card p-6 shadow-md md:p-8">
              <p className={eyebrow}>Boletim de Saúde Digital</p>
              <div className="grid gap-5 md:grid-cols-2">
                {[
                  { badge: "Mobile", name: "Celular", score: mobileScore },
                  { badge: "Desktop", name: "Computador", score: desktopScore },
                ].map((device) => {
                  const grade = getGrade(device.score);
                  return (
                    <div
                      key={device.badge}
                      className="flex items-center gap-5 rounded-xl border border-border bg-muted/30 p-5"
                    >
                      <div
                        className={`flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl border-[3px] font-extrabold ${toneClass(device.score)}`}
                      >
                        <span className="text-4xl leading-none">{grade.letter}</span>
                        <span className="mt-1 text-[11px] font-bold uppercase tracking-wider">
                          {grade.label}
                        </span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {device.name}
                        </span>
                        <span className="text-3xl font-extrabold leading-tight text-foreground">
                          {device.score}
                          <span className="text-lg font-semibold text-muted-foreground">
                            /100
                          </span>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {device.score < 50
                            ? "Abaixo do padrão de mercado"
                            : "Dentro da média esperada"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 border-t border-border pt-6">
                {optimized ? (
                  <div
                    role="status"
                    className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100"
                  >
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 h-5 w-5 shrink-0"
                    />
                    <p className="text-base font-semibold leading-relaxed">
                      Seu site está otimizado! Todas as notas de desempenho
                      estão acima de 90.
                    </p>
                  </div>
                ) : (
                  <>
                    <h2 className="text-xl font-extrabold text-foreground">
                      O que esse resultado significa
                    </h2>
                    <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
                      {businessSummary?.resumo ||
                        `O PageSpeed registrou LCP de ${result?.summary.mobile.metrics.lcp} no celular e ${result?.summary.desktop.metrics.lcp} no computador. Consulte as métricas e oportunidades abaixo para orientar a análise técnica.`}
                    </p>
                  </>
                )}
              </div>
            </Card>

            <section className="space-y-4">
              <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                Auditoria técnica
              </h2>
              <div className="motion-stagger grid gap-5 md:grid-cols-2">
                <CleanScoresGrid
                  title="Celular"
                  scores={result.summary.mobile.scores}
                  metrics={result.summary.mobile.metrics}
                />
                <CleanScoresGrid
                  title="Computador"
                  scores={result.summary.desktop.scores}
                  metrics={result.summary.desktop.metrics}
                />
              </div>

              {result.summary.screenshot && (
                <Card className="border-border bg-card p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">
                      Captura da Página Inicial
                    </h3>
                    <a
                      href={result.summary.screenshot}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      Abrir em nova aba
                    </a>
                  </div>
                  <div className="flex items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/20 p-2">
                    <img
                      src={result.summary.screenshot}
                      alt="Screenshot do site"
                      className="max-h-96 rounded-lg object-contain"
                    />
                  </div>
                </Card>
              )}
            </section>

            <Card className="flex flex-col gap-5 border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between md:px-8">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Calculator aria-hidden="true" className="h-6 w-6 text-primary" />
                </span>
                <div className="space-y-0.5">
                  <h2 className="text-lg font-bold text-foreground">
                    Estime o potencial de melhoria do seu site
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Explore estimativas de otimização com base nas notas de
                    desempenho e nos dados informados.
                  </p>
                </div>
              </div>
              <Button asChild size="lg" variant="outline" className="shrink-0 border-primary text-primary">
                <Link to={financialCalculatorUrl}>
                  <Calculator aria-hidden="true" />
                  Abrir estimativa de otimização
                </Link>
              </Button>
            </Card>

            <section className="space-y-4">
              {optimized && (
                <h2 className="text-2xl font-extrabold tracking-tight text-foreground">
                  Resultado do diagnóstico
                </h2>
              )}

              <DiagnosticPreview
                url={url.startsWith("http") ? url : "https://" + url}
                result={result}
                previewMode={previewMode}
                setPreviewMode={setPreviewMode}
                updateImprovement={updateImprovement}
                updateUiuxOverview={updateUiuxOverview}
                onSubmitQuoteRequest={sendQuoteRequest}
                onQuoteDialogOpen={onQuoteDialogOpen}
                quoteSending={quoteSending}
                downloadTechnicalPdf={downloadTechnicalPdf}
                downloading={downloading}
                downloadBusinessPdf={downloadClientReport}
                businessDownloading={businessDownloading}
                businessSummary={businessSummary}
                setBusinessSummary={setBusinessSummary}
                businessLoading={businessLoading}
                onLoadBusinessSummary={fetchBusinessSummary}
              />
              {reportUrl && <DiagnosticReportShareCard reportUrl={reportUrl} />}
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
