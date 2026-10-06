import React from "react";
import {
  Download,
  FileCheck2,
  FileText,
  Gauge,
  Loader2,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DiagnosticForm from "@/components/DiagnosticForm";
import DiagnosticPreview from "@/components/DiagnosticPreview";
import { CleanScoresGrid } from "./CleanScoresGrid";
import type { DiagnosticVariantProps } from "./types";

export function VariantA({
  url,
  setUrl,
  loading,
  runDiagnostic,
  result,
  geoLoading,
  runGeoCrawl,
  downloadDocx,
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
}: DiagnosticVariantProps) {
  const mobilePerf = result?.summary.mobile.scores.performance ?? 0;
  const desktopPerf = result?.summary.desktop.scores.performance ?? 0;
  const overallAvg = result
    ? Math.round(mobilePerf * 0.7 + desktopPerf * 0.3)
    : 0;

  return (
    <main
      className="min-h-screen pb-32"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="container max-w-5xl py-12 md:py-20">
        {/* Header */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-sm font-medium text-secondary-foreground mb-6">
            <Sparkles className="w-4 h-4 text-primary" /> Variante A: Foco em Decisão Executiva
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-foreground">
            Cole o link.{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              Receba o relatório.
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Performance completa do PageSpeed, diagnóstico visual da home e sugestões
            priorizadas prontas para exportar em .docx.
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
              Rodando PageSpeed mobile + desktop e gerando análise com IA. Isso leva ~30-60s…
            </p>
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && (
          <div className="grid sm:grid-cols-3 gap-6 mt-16">
            {[
              {
                icon: Gauge,
                title: "PageSpeed Completo",
                desc: "Análise mobile e desktop com Core Web Vitals e oportunidades de otimização.",
              },
              {
                icon: Sparkles,
                title: "Análise Visual com IA",
                desc: "Captura da página inicial avaliada com sugestões práticas de melhoria de UX.",
              },
              {
                icon: FileText,
                title: "Exportação em .docx",
                desc: "Relatório técnico e versão executiva prontos para apresentar ao cliente.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="p-6 bg-card border-border shadow-sm">
                <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-foreground">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Populated Results */}
        {result && (
          <section className="mt-12 space-y-10">
            {/* Executive Decision Highlight Card */}
            <Card className="p-8 bg-card border-border shadow-md">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-border pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="border-primary/40 text-primary bg-primary/5 text-xs font-semibold px-2.5 py-0.5">
                      Sumário Executivo
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {url.startsWith("http") ? url : "https://" + url}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground">
                    Painel de Decisão Comercial
                  </h2>
                  <p className="text-base text-muted-foreground mt-2 max-w-xl leading-relaxed">
                    {businessSummary?.resumo ||
                      "O site apresenta gargalos no carregamento mobile que afetam a taxa de conversão e a experiência do cliente nas buscas."}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="text-center sm:text-right">
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
                      Score Geral
                    </span>
                    <span
                      className={`text-4xl font-extrabold ${
                        overallAvg >= 85
                          ? "text-emerald-600"
                          : overallAvg >= 50
                            ? "text-amber-600"
                            : "text-rose-600"
                      }`}
                    >
                      {overallAvg}/100
                    </span>
                  </div>

                  <div className="h-10 w-px bg-border hidden sm:block" />

                  <div className="flex flex-col gap-2 w-full sm:w-auto">
                    <Button
                      onClick={downloadClientReport}
                      disabled={businessDownloading || businessLoading}
                      variant="hero"
                      className="font-semibold text-sm"
                    >
                      {businessDownloading || businessLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando…
                        </>
                      ) : (
                        <>
                          <FileCheck2 className="mr-2 h-4 w-4" /> Baixar Versão Executiva (.docx)
                        </>
                      )}
                    </Button>

                    <Button
                      onClick={downloadDocx}
                      disabled={downloading}
                      variant="outline"
                      className="text-sm font-medium"
                    >
                      {downloading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Baixando…
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4 text-primary" /> Relatório Completo (.docx)
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Key Highlights */}
              <div className="grid sm:grid-cols-3 gap-6 pt-6 text-sm">
                <div className="p-4 rounded-xl bg-muted/40 border border-border">
                  <span className="text-muted-foreground block text-xs font-medium uppercase tracking-wider mb-1">
                    Carregamento Mobile (LCP)
                  </span>
                  <span className="text-xl font-bold text-foreground">
                    {result.summary.mobile.metrics.lcp}
                  </span>
                  <span className="text-xs text-muted-foreground block mt-1">
                    Meta recomendada: menor que 2.5s
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border border-border">
                  <span className="text-muted-foreground block text-xs font-medium uppercase tracking-wider mb-1">
                    Travamento por Scripts (TBT)
                  </span>
                  <span className="text-xl font-bold text-foreground">
                    {result.summary.mobile.metrics.tbt}
                  </span>
                  <span className="text-xs text-muted-foreground block mt-1">
                    Tempo de bloqueio JavaScript
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-muted/40 border border-border">
                  <span className="text-muted-foreground block text-xs font-medium uppercase tracking-wider mb-1">
                    Estabilidade Visual (CLS)
                  </span>
                  <span className="text-xl font-bold text-foreground">
                    {result.summary.mobile.metrics.cls}
                  </span>
                  <span className="text-xs text-muted-foreground block mt-1">
                    Deslocamento de elementos na tela
                  </span>
                </div>
              </div>
            </Card>

            {/* Mobile & Desktop Scores Grid */}
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

            {/* Mobile Screenshot */}
            {result.summary.screenshot && (
              <Card className="p-6 bg-card border-border shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-foreground">
                    Captura de Tela Mobile
                  </h3>
                  <a
                    href={result.summary.screenshot}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Abrir imagem original
                  </a>
                </div>
                <div className="rounded-xl overflow-hidden border border-border bg-muted/20 flex items-center justify-center p-2">
                  <img
                    src={result.summary.screenshot}
                    alt="Screenshot mobile do site auditado"
                    className="max-h-96 rounded-lg object-contain"
                  />
                </div>
              </Card>
            )}

            {/* Full Diagnostic Preview Component with Technical/Corporate Toggle & Edit Mode */}
            <DiagnosticPreview
              url={url.startsWith("http") ? url : "https://" + url}
              result={result}
              previewMode={previewMode}
              setPreviewMode={setPreviewMode}
              updateImprovement={updateImprovement}
              updateUiuxOverview={updateUiuxOverview}
              downloadDocx={downloadDocx}
              downloading={downloading}
              downloadBusinessReport={downloadClientReport}
              businessDownloading={businessDownloading}
              businessSummary={businessSummary}
              setBusinessSummary={setBusinessSummary}
              businessLoading={businessLoading}
              onLoadBusinessSummary={fetchBusinessSummary}
            />
          </section>
        )}
      </div>
    </main>
  );
}
