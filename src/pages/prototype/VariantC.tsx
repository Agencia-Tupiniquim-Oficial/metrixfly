import React, { useMemo, useState } from "react";
import {
  Calculator,
  Compass,
  FileText,
  Flame,
  Gauge,
  Loader2,
  Sparkles,
  TrendingDown,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import DiagnosticForm from "@/components/DiagnosticForm";
import DiagnosticPreview from "@/components/DiagnosticPreview";
import { CleanScoresGrid } from "./CleanScoresGrid";
import type { DiagnosticVariantProps } from "./types";

export function VariantC({
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
  const [monthlyTraffic, setMonthlyTraffic] = useState(15000);
  const [avgTicket, setAvgTicket] = useState(250);

  const mobileScore = result?.summary.mobile.scores.performance ?? 43;
  const grade =
    mobileScore >= 90
      ? { letter: "A", label: "Excelente", color: "text-emerald-700 border-emerald-500 bg-emerald-50" }
      : mobileScore >= 75
        ? { letter: "B", label: "Bom", color: "text-teal-700 border-teal-500 bg-teal-50" }
        : mobileScore >= 50
          ? { letter: "C", label: "Regular", color: "text-amber-700 border-amber-500 bg-amber-50" }
          : mobileScore >= 30
            ? { letter: "D", label: "Crítico", color: "text-orange-700 border-orange-500 bg-orange-50" }
            : { letter: "F", label: "Grave", color: "text-rose-700 border-rose-500 bg-rose-50" };

  const simulation = useMemo(() => {
    const estimatedBounceRate = mobileScore < 50 ? 0.38 : mobileScore < 80 ? 0.22 : 0.08;
    const lostVisitors = Math.round(monthlyTraffic * estimatedBounceRate);
    const standardConversionRate = 0.02; // 2%
    const lostLeadsOrSales = Math.round(lostVisitors * standardConversionRate);
    const lostRevenueEstimate = lostLeadsOrSales * avgTicket;

    return {
      estimatedBounceRate: Math.round(estimatedBounceRate * 100),
      lostVisitors,
      lostLeadsOrSales,
      lostRevenueEstimate,
    };
  }, [monthlyTraffic, avgTicket, mobileScore]);

  return (
    <main
      className="min-h-screen pb-32"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="container max-w-5xl py-12 md:py-20">
        {/* Header */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-sm font-medium text-secondary-foreground mb-6">
            <Compass className="w-4 h-4 text-primary" /> Variante C: Storyboard com Calculadora de Negócio
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-foreground">
            Diagnóstico &{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              Impacto Financeiro
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Apresentação executiva orientada a faturamento: descubra o quanto a lentidão
            custa ao negócio e receba o plano de otimização completo.
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
                title: "Boletim de Notas",
                desc: "Avaliação clara de desempenho para tomadores de decisão.",
              },
              {
                icon: Calculator,
                title: "Simulador de Perda",
                desc: "Quantifique o valor financeiro do abandono de visitantes por lentidão.",
              },
              {
                icon: FileText,
                title: "Relatórios Word (.docx)",
                desc: "Gere versões técnicas e comerciais prontas para apresentação.",
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

              <div className="grid md:grid-cols-12 gap-8 items-center">
                <div className="md:col-span-4 flex items-center gap-6">
                  <div
                    className={`w-24 h-24 rounded-2xl border-[3px] flex flex-col items-center justify-center font-extrabold shadow-sm ${grade.color}`}
                  >
                    <span className="text-4xl">{grade.letter}</span>
                    <span className="text-xs uppercase font-bold tracking-wider">
                      {grade.label}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold block">
                      Score Mobile
                    </span>
                    <span className="text-3xl font-extrabold text-foreground">
                      {mobileScore}/100
                    </span>
                    <span className="text-xs text-muted-foreground block mt-1">
                      {mobileScore < 50 ? "Abaixo do padrão de mercado" : "Dentro da média esperada"}
                    </span>
                  </div>
                </div>

                <div className="md:col-span-8 border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-8 space-y-3">
                  <h3 className="text-xl font-bold text-foreground">
                    O que esse resultado significa para o seu cliente
                  </h3>
                  <p className="text-base text-muted-foreground leading-relaxed">
                    {businessSummary?.resumo ||
                      `O tempo de resposta no celular (${result.summary.mobile.metrics.lcp}) gera desistência de potenciais clientes logo nos primeiros segundos após o clique nas buscas.`}
                  </p>
                </div>
              </div>
            </Card>

            {/* Act 2: Interactive Loss & Opportunity Calculator */}
            <Card className="p-8 bg-card border-border shadow-md space-y-8">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  2
                </span>
                <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Simulação Financeira de Perda por Lentidão
                </span>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <Calculator className="w-6 h-6 text-primary" />
                  Calculadora de Retorno & Abandono de Tráfego
                </h3>
                <p className="text-base text-muted-foreground mt-2">
                  Ajuste o tráfego estimado e o ticket médio para ver o impacto financeiro da taxa de desistência mobile.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-8 items-center">
                {/* Sliders Container */}
                <div className="space-y-6 p-6 rounded-2xl bg-muted/30 border border-border">
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground">Visitantes Mensais Estimados:</span>
                      <span className="font-bold text-primary font-mono">
                        {monthlyTraffic.toLocaleString("pt-BR")} acessos
                      </span>
                    </div>
                    <Slider
                      value={[monthlyTraffic]}
                      onValueChange={(val) => setMonthlyTraffic(val[0])}
                      min={1000}
                      max={100000}
                      step={1000}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>1.000</span>
                      <span>50.000</span>
                      <span>100.000</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium text-foreground">Ticket Médio ou Valor do Lead:</span>
                      <span className="font-bold text-primary font-mono">
                        R$ {avgTicket.toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <Slider
                      value={[avgTicket]}
                      onValueChange={(val) => setAvgTicket(val[0])}
                      min={50}
                      max={2000}
                      step={25}
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>R$ 50</span>
                      <span>R$ 1.000</span>
                      <span>R$ 2.000</span>
                    </div>
                  </div>
                </div>

                {/* Outcome KPI Card */}
                <div className="p-6 rounded-2xl bg-rose-50/60 border border-rose-200 space-y-4">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1.5">
                      <Flame className="w-4 h-4" /> Desperdício Comercial Estimado
                    </span>
                    <div className="text-4xl font-extrabold text-rose-700 mt-2 font-mono">
                      R$ {simulation.lostRevenueEstimate.toLocaleString("pt-BR")}
                      <span className="text-sm font-normal text-rose-600 ml-2">/ mês perdidos</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-rose-200/80 text-sm">
                    <div>
                      <span className="text-xs text-rose-600 block">Visitantes que desistem:</span>
                      <span className="text-base font-bold text-rose-800 font-mono mt-0.5 block">
                        ~{simulation.lostVisitors.toLocaleString("pt-BR")} pessoas
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-rose-600 block">Aumento de Rejeição:</span>
                      <span className="text-base font-bold text-rose-800 font-mono mt-0.5 block">
                        +{simulation.estimatedBounceRate}% abandono
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-rose-600 italic leading-relaxed">
                    *Estimativa com base em estudos do Google sobre a correlação entre tempo de carregamento mobile e desistência de compra.
                  </p>
                </div>
              </div>
            </Card>

            {/* Act 3: Detailed Metrics */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  3
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

            {/* Act 4: Diagnostic Preview and Exporting */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                  4
                </span>
                <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                  Revisão e Exportação de Documentos (.docx)
                </span>
              </div>

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
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
