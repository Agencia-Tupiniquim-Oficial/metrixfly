import React from "react";
import {
  CheckCircle2,
  Calculator,
  FileText,
  Gauge,
  Loader2,
  Monitor,
  Smartphone,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import DiagnosticForm from "@/features/diagnostics/components/DiagnosticForm";
import DiagnosticPreview from "@/features/diagnostics/components/DiagnosticPreview";
import { CleanScoresGrid } from "./CleanScoresGrid";
import logoColored from "@/assets/logo-colored.png";
import type { DiagnosticPageProps } from "@/features/diagnostics/model/page-props";
import { isDiagnosticOptimized } from "@/features/diagnostics/model/diagnose";

export function DiagnosticExperience({
  url,
  setUrl,
  loading,
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
  quoteSending,
}: DiagnosticPageProps) {
  const getGrade = (score: number) => {
    if (score >= 90)
      return {
        letter: "A",
        label: "Excelente",
        color:
          "text-emerald-700 border-emerald-500 bg-emerald-50 dark:text-emerald-200 dark:border-emerald-800 dark:bg-emerald-950/50",
      };
    if (score >= 75)
      return {
        letter: "B",
        label: "Bom",
        color:
          "text-teal-700 border-teal-500 bg-teal-50 dark:text-teal-200 dark:border-teal-800 dark:bg-teal-950/50",
      };
    if (score >= 50)
      return {
        letter: "C",
        label: "Regular",
        color:
          "text-amber-700 border-amber-500 bg-amber-50 dark:text-amber-200 dark:border-amber-800 dark:bg-amber-950/50",
      };
    if (score >= 30)
      return {
        letter: "D",
        label: "Crítico",
        color:
          "text-orange-700 border-orange-500 bg-orange-50 dark:text-orange-200 dark:border-orange-800 dark:bg-orange-950/50",
      };
    return {
      letter: "F",
      label: "Grave",
      color:
        "text-rose-700 border-rose-500 bg-rose-50 dark:text-rose-200 dark:border-rose-800 dark:bg-rose-950/50",
    };
  };

  const mobileScore = result?.summary.mobile.scores.performance ?? 43;
  const desktopScore = result?.summary.desktop.scores.performance ?? 71;
  const mobileGrade = getGrade(mobileScore);
  const desktopGrade = getGrade(desktopScore);
  const optimized = isDiagnosticOptimized(result);
  const financialCalculatorUrl = `/calculadora-financeira?mobileScore=${mobileScore}&traffic=15000&ticket=250`;

  return (
    <main
      className="min-h-screen pb-32"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="container max-w-5xl py-12 md:py-20">
        {/* Header */}
        <header className="text-center mb-10 flex flex-col items-center">
          <img
            src={logoColored}
            alt="Logo"
            className="h-20 mb-8 object-contain drop-shadow-sm"
          />
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-foreground">
            Diagnóstico &{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              Desempenho 
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Analise as notas e métricas do PageSpeed Insights e identifique
            oportunidades técnicas para otimizar seu site.
          </p>
        </header>

        {/* Diagnostic Form */}
        <DiagnosticForm
          url={url}
          setUrl={setUrl}
          onSubmit={runDiagnostic}
          loading={loading}
          runGeoCrawl={runGeoCrawl}
          geoLoading={geoLoading}
        />

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-base text-muted-foreground animate-pulse font-medium">
              Rodando PageSpeed mobile + desktop e gerando análise com IA. Isso
              leva ~30-60s…
            </p>
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && (
          <div className="grid sm:grid-cols-3 gap-6 mt-16">
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
              <Card key={title} className="p-6 bg-card border-border shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">
                  {title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </Card>
            ))}
          </div>
        )}

        {/* Populated Results in Clean Narrative Storyline */}
        {result && (
          <section className="mt-12 space-y-12">
            {/* Act 1: Executive Grade Banner */}
            <Card className="p-8 bg-card border-border shadow-md">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  1
                </span>
                <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Boletim de Saúde Digital
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {[
                  {
                    icon: Smartphone,
                    title: "Dispositivo Móvel",
                    badge: "Mobile",
                    score: mobileScore,
                    grade: mobileGrade,
                    label: "Pontuação Mobile (Celular)",
                  },
                  {
                    icon: Monitor,
                    title: "Computador",
                    badge: "Desktop",
                    score: desktopScore,
                    grade: desktopGrade,
                    label: "Pontuação Desktop (Computador)",
                  },
                ].map((device) => (
                  <div
                    key={device.badge}
                    className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-muted/20 border border-border"
                  >
                    <div
                      className={`w-24 h-24 rounded-2xl border-[3px] flex flex-col items-center justify-center font-extrabold shadow-sm ${device.grade.color} shrink-0`}
                    >
                      <span className="text-4xl">{device.grade.letter}</span>
                      <span className="text-xs uppercase font-bold tracking-wider">
                        {device.grade.label}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <Badge variant="outline" className="mb-1">
                        {device.badge}
                      </Badge>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
                        {device.label}
                      </span>
                      <span className="text-3xl font-extrabold text-foreground">
                        {device.score}/100
                      </span>
                      <span className="text-xs text-muted-foreground block">
                        {device.score < 50
                          ? "Abaixo do padrão de mercado"
                          : "Dentro da média esperada"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 border-t border-border pt-8 space-y-3">
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
                    <h3 className="text-xl font-bold text-foreground">
                      O que esse resultado significa
                    </h3>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {businessSummary?.resumo ||
                        `O PageSpeed registrou LCP de ${result?.summary.mobile.metrics.lcp} no celular e ${result?.summary.desktop.metrics.lcp} no computador. Consulte as métricas e oportunidades abaixo para orientar a análise técnica.`}
                    </p>
                  </>
                )}
              </div>
            </Card>

            {/* Financial simulation is separate from the optimization diagnosis. */}
            <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between bg-card border-border shadow-md">
              <div className="space-y-1">
                <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Simulação de otimização
                </p>
                <h2 className="text-xl font-bold text-foreground">
                  Estime o potencial de melhoria do seu site
                </h2>
                <p className="text-sm text-muted-foreground">
                  Explore estimativas de otimização com base nas notas de
                  desempenho e nos dados informados.
                </p>
              </div>
              <Button asChild size="lg" className="shrink-0">
                <Link to={financialCalculatorUrl}>
                  <Calculator aria-hidden="true" />
                  Abrir estimativa de otimização
                </Link>
              </Button>
            </Card>

            {/* Act 2: Detailed Metrics */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  2
                </span>
                <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Auditoria Técnica Completa
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <CleanScoresGrid
                  title="📱 Desempenho Mobile"
                  scores={result.summary.mobile.scores}
                  metrics={result.summary.mobile.metrics}
                />
                <CleanScoresGrid
                  title="💻 Desempenho Desktop"
                  scores={result.summary.desktop.scores}
                  metrics={result.summary.desktop.metrics}
                />
              </div>

              {result.summary.screenshot && (
                <Card className="p-6 bg-card border-border shadow-sm">
                  <div className="flex items-center justify-between mb-4">
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
                  <div className="rounded-xl overflow-hidden border border-border bg-muted/20 flex items-center justify-center p-2">
                    <img
                      src={result.summary.screenshot}
                      alt="Screenshot do site"
                      className="max-h-96 rounded-lg object-contain"
                    />
                  </div>
                </Card>
              )}
            </div>

            {/* Act 3: Diagnostic Preview and Exporting */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  3
                </span>
                <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  {optimized
                    ? "Resultado do diagnóstico"
                    : "Revisão e Exportação de Documentos (PDF)"}
                </span>
              </div>

              <DiagnosticPreview
                url={url.startsWith("http") ? url : "https://" + url}
                result={result}
                previewMode={previewMode}
                setPreviewMode={setPreviewMode}
                updateImprovement={updateImprovement}
                updateUiuxOverview={updateUiuxOverview}
                onSubmitQuoteRequest={sendQuoteRequest}
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
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
