import React, { useState } from "react";
import {
  Activity,
  CheckCircle,
  Download,
  FileText,
  Gauge,
  Layers,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DiagnosticForm from "@/components/DiagnosticForm";
import DiagnosticPreview from "@/components/DiagnosticPreview";
import { CleanScoresGrid } from "./CleanScoresGrid";
import type { DiagnosticVariantProps } from "./types";

export function VariantB({
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
  const [activeTab, setActiveTab] = useState("scores");

  return (
    <main
      className="min-h-screen pb-32"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="container max-w-5xl py-12 md:py-20">
        {/* Header */}
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-sm font-medium text-secondary-foreground mb-6">
            <Layers className="w-4 h-4 text-primary" /> Variante B: Abas Espaçosas & Foco Organizado
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4 text-foreground">
            Auditoria em{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              Abas Organizadas
            </span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Navegue pelos resultados sem sobrecarga visual: alterne facilmente entre métricas,
            edição do relatório oficial e sugestões da IA.
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
                title: "Scores Separados",
                desc: "Visualize Core Web Vitals mobile e desktop em abas amplas e organizadas.",
              },
              {
                icon: Sparkles,
                title: "Editor do Relatório",
                desc: "Aba dedicada para revisar, customizar textos corporativos e baixar em .docx.",
              },
              {
                icon: FileText,
                title: "Matriz de Oportunidades",
                desc: "Lista de ações práticas priorizadas sem poluição visual na tela.",
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

        {/* Populated Results in Clean Spacious Tabs */}
        {result && (
          <section className="mt-12 space-y-8">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Tab Selector Bar */}
              <div className="flex justify-center mb-8">
                <TabsList className="bg-card border border-border p-1.5 h-auto rounded-xl shadow-sm">
                  <TabsTrigger
                    value="scores"
                    className="text-sm md:text-base font-medium px-5 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                  >
                    <Gauge className="w-4 h-4 mr-2" />
                    Scores & Métricas
                  </TabsTrigger>

                  <TabsTrigger
                    value="preview"
                    className="text-sm md:text-base font-medium px-5 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Visualizar Relatório (.docx)
                  </TabsTrigger>

                  <TabsTrigger
                    value="improvements"
                    className="text-sm md:text-base font-medium px-5 py-2.5 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Oportunidades & IA ({result.improvements.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* TAB 1: Scores & Web Vitals */}
              <TabsContent value="scores" className="space-y-8 outline-none">
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
                        Screenshot Mobile Capturada
                      </h3>
                      <a
                        href={result.summary.screenshot}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Visualizar imagem original
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
              </TabsContent>

              {/* TAB 2: Full Diagnostic Preview with Corporate and Edit Features */}
              <TabsContent value="preview" className="space-y-6 outline-none">
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
              </TabsContent>

              {/* TAB 3: Opportunities & AI Diagnosis */}
              <TabsContent value="improvements" className="space-y-6 outline-none">
                {/* AI Overview Box */}
                {result.uiux?.overview && (
                  <Card className="p-6 bg-card border-border shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-primary" />
                      <h3 className="text-lg font-bold text-foreground">
                        Avaliação de UI / UX por Inteligência Artificial
                      </h3>
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed">
                      {result.uiux.overview}
                    </p>
                  </Card>
                )}

                {/* Improvements List */}
                <div className="space-y-4">
                  {result.improvements.map((item, index) => (
                    <Card key={index} className="p-6 bg-card border-border shadow-sm space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                            {index + 1}
                          </span>
                          <h4 className="text-lg font-bold text-foreground">{item.title}</h4>
                        </div>
                        <Badge variant="outline" className="text-xs px-2.5 py-0.5 border-primary/30 text-primary">
                          Prioridade Técnica
                        </Badge>
                      </div>

                      {item.problem && (
                        <p className="text-base text-muted-foreground leading-relaxed">
                          {item.problem}
                        </p>
                      )}

                      {item.recommendations && item.recommendations.length > 0 && (
                        <div className="p-4 rounded-xl bg-muted/30 border border-border/80 space-y-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-foreground block">
                            Ações Recomendadas:
                          </span>
                          {item.recommendations.map((rec, rIdx) => (
                            <div key={rIdx} className="flex items-start gap-2 text-sm text-foreground">
                              <CheckCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                              <span>{rec}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </section>
        )}
      </div>
    </main>
  );
}
