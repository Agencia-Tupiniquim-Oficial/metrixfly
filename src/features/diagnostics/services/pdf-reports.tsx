/* eslint-disable react-refresh/only-export-components */

import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import type { ReactElement } from "react";
import logo from "@/assets/logo-colored.png";
import type {
  DiagnoseResult,
  Improvement,
  PageSummary,
} from "@/features/diagnostics/model/diagnose";
import { isDiagnosticOptimized } from "@/features/diagnostics/model/diagnose";
import type { BusinessSummary } from "@/features/diagnostics/model/business-report";

const GREEN = "#008F4C";
const DARK_GREEN = "#006633";
const TEXT = "#333333";
const MUTED = "#666666";

const styles = StyleSheet.create({
  page: {
    paddingTop: 92,
    paddingHorizontal: 48,
    paddingBottom: 64,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: TEXT,
    lineHeight: 1.45,
    backgroundColor: "#FFFFFF",
  },
  header: {
    position: "absolute",
    top: 24,
    left: 48,
    right: 48,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#DDE8DF",
    paddingBottom: 8,
  },
  logo: { width: 38, height: 38, objectFit: "contain", marginRight: 10 },
  brand: { color: DARK_GREEN, fontSize: 12, fontFamily: "Helvetica-Bold" },
  brandCaption: { color: MUTED, fontSize: 8 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 48,
    right: 48,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#DDE8DF",
    color: MUTED,
    fontSize: 8,
    textAlign: "center",
  },
  title: {
    color: DARK_GREEN,
    fontSize: 20,
    fontFamily: "Times-Bold",
    marginBottom: 32,
  },
  section: {
    color: GREEN,
    fontSize: 15,
    fontFamily: "Times-Bold",
    marginTop: 16,
    marginBottom: 8,
  },
  subheading: {
    color: TEXT,
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    marginTop: 8,
    marginBottom: 3,
  },
  paragraph: { marginBottom: 7 },
  bullet: { flexDirection: "row", marginBottom: 4, paddingLeft: 10 },
  bulletMark: { width: 12, color: GREEN },
  bulletText: { flex: 1 },
  improvement: {
    marginBottom: 12,
    padding: 10,
  },
  improvementTitle: {
    color: DARK_GREEN,
    fontFamily: "Helvetica-Bold",
    fontSize: 11,
    marginBottom: 4,
  },
  scoreRow: { flexDirection: "row", gap: 8, marginVertical: 7 },
  scoreCard: {
    flexGrow: 1,
    flexBasis: 0,
    padding: 8,
    backgroundColor: "#F3F8F4",
    borderRadius: 4,
    textAlign: "center",
  },
  scoreValue: { color: GREEN, fontSize: 15, fontFamily: "Helvetica-Bold" },
  scoreLabel: { color: MUTED, fontSize: 7, marginTop: 2 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginVertical: 6 },
  metric: {
    width: "31%",
    padding: 6,
    backgroundColor: "#F7F8F7",
    borderRadius: 3,
  },
  metricLabel: { color: MUTED, fontSize: 7 },
  metricValue: { fontFamily: "Helvetica-Bold", marginTop: 2 },
  businessCallout: {
    backgroundColor: "#F3F8F4",
    borderLeftWidth: 3,
    borderLeftColor: GREEN,
    padding: 10,
    marginBottom: 8,
  },
  optimizedCallout: {
    backgroundColor: "#F0FDF4",
    borderLeftWidth: 3,
    borderLeftColor: GREEN,
    padding: 12,
    marginBottom: 16,
    color: DARK_GREEN,
    fontFamily: "Helvetica-Bold",
  },
});

function hostLabel(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toUpperCase();
  } catch {
    return "SITE";
  }
}

function filenameHost(url: string): string {
  return hostLabel(url)
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/^-+|-+$/g, "") || "site";
}

function numberedTitle(index: number, title: string): string {
  const unnumberedTitle = title.replace(/^(?:\d+\s*[.)]\s*)+/, "").trim();
  return `${index + 1}. ${unnumberedTitle}`;
}

function Header() {
  return (
    <View style={styles.header}>
      <Image src={logo} style={styles.logo} />
      <View>
        <Text style={styles.brand}>TUPINIQUIM</Text>
        <Text style={styles.brandCaption}>Diagnóstico e estratégia digital</Text>
      </View>
    </View>
  );
}

function Footer() {
  return (
    <Text
      fixed
      style={styles.footer}
      render={({ pageNumber, totalPages }) => `Tupiniquim  •  ${pageNumber} / ${totalPages}`}
    />
  );
}

function ReportPage({ children }: { children: React.ReactNode }) {
  return (
    <Page size="A4" style={styles.page} wrap>
      <Header />
      {children}
      <Footer />
    </Page>
  );
}

function Section({ children }: { children: string }) {
  return <Text style={styles.section} minPresenceAhead={30}>{children}</Text>;
}

function BulletList({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <View>
      {items.map((item, index) => (
        <View key={`${index}-${item}`} style={styles.bullet} wrap={false}>
          <Text style={styles.bulletMark}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function ScoreCards({
  summary,
  label,
  showOpportunities = true,
}: {
  summary: PageSummary;
  label: string;
  showOpportunities?: boolean;
}) {
  const scores = [
    ["Desempenho", summary.scores.performance],
    ["Acessibilidade", summary.scores.accessibility],
    ["Práticas recomendadas", summary.scores.bestPractices],
    ["SEO", summary.scores.seo],
  ] as const;

  return (
    <View>
      <Text style={styles.subheading}>{label}</Text>
      <View style={styles.scoreRow}>
        {scores.map(([name, value]) => (
          <View key={name} style={styles.scoreCard}>
            <Text style={styles.scoreValue}>{Math.round(value)}</Text>
            <Text style={styles.scoreLabel}>{name}</Text>
          </View>
        ))}
      </View>
      <View style={styles.metrics}>
        {[
          ["FCP", summary.metrics.fcp],
          ["LCP", summary.metrics.lcp],
          ["TBT", summary.metrics.tbt],
          ["CLS", summary.metrics.cls],
          ["Speed Index", summary.metrics.si],
          ["TTFB", summary.metrics.ttfb],
          ["TTI", summary.metrics.tti],
          ["Tamanho da página", summary.metrics.pageSize],
          ["Requisições", summary.metrics.requests],
        ].map(([name, value]) =>
          value === undefined || value === null || value === "" ? null : (
            <View key={name} style={styles.metric}>
              <Text style={styles.metricLabel}>{name}</Text>
              <Text style={styles.metricValue}>{String(value)}</Text>
            </View>
          ),
        )}
      </View>
      {showOpportunities && summary.opportunities?.length ? (
        <>
          <Text style={styles.subheading}>Oportunidades do PageSpeed</Text>
          <BulletList
            items={summary.opportunities.map((opportunity) =>
              opportunity.displayValue
                ? `${opportunity.title} — ${opportunity.displayValue}`
                : opportunity.title,
            )}
          />
        </>
      ) : null}
    </View>
  );
}

function ImprovementSection({ items }: { items: Improvement[] }) {
  return (
    <>
      <Section>Sugestões de melhoria</Section>
      {items.map((item, index) => (
        <View key={`${index}-${item.title}`} style={styles.improvement}>
          <Text style={styles.improvementTitle}>
            {numberedTitle(index, item.title)}
          </Text>
          {(item.description || item.problem) && (
            <Text style={styles.paragraph}>{item.description ?? item.problem}</Text>
          )}
          {item.impact?.length ? (
            <>
              <Text style={styles.subheading}>Impacto</Text>
              <BulletList items={item.impact} />
            </>
          ) : null}
          {item.causes?.length ? (
            <>
              <Text style={styles.subheading}>Causas comuns</Text>
              <BulletList items={item.causes} />
            </>
          ) : null}
          {item.recommendations?.length ? (
            <>
              <Text style={styles.subheading}>Recomendações</Text>
              <BulletList items={item.recommendations} />
            </>
          ) : null}
        </View>
      ))}
    </>
  );
}

export type GeoReportData = {
  domain: string;
  crawledAt: string;
  scores: { geo: number; aeo: number; technical: number; authority: number };
  stats: {
    pages: number;
    indexedPages: number;
    schemaPages: number;
    answerPages: number;
    words: number;
  };
  visibility: {
    chatgpt: number | null;
    gemini: number | null;
    perplexity: number | null;
  };
  pages: { url: string; title: string; score: number; issues: string[] }[];
  findings: {
    severity: "critical" | "warning" | "passed";
    title: string;
    description: string;
    recommendation: string;
  }[];
  prompts: string[];
};

function GeoSections({ geo }: { geo: GeoReportData }) {
  return (
    <>
      <Section>Visibilidade em busca e IA</Section>
      <Text style={styles.paragraph}>
        Rastreamento de {geo.domain}: {geo.stats.pages} página(s) avaliadas;{" "}
        {geo.stats.indexedPages} indexáveis; {geo.stats.schemaPages} com dados estruturados.
      </Text>
      <View style={styles.scoreRow}>
        {[
          ["GEO", geo.scores.geo],
          ["AEO", geo.scores.aeo],
          ["Técnico", geo.scores.technical],
          ["Autoridade", geo.scores.authority],
        ].map(([name, score]) => (
          <View key={name} style={styles.scoreCard}>
            <Text style={styles.scoreValue}>{score}/100</Text>
            <Text style={styles.scoreLabel}>{name}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.subheading}>Presença em mecanismos de resposta</Text>
      <BulletList
        items={[
          `ChatGPT: ${geo.visibility.chatgpt ?? "N/D"}`,
          `Gemini: ${geo.visibility.gemini ?? "N/D"}`,
          `Perplexity: ${geo.visibility.perplexity ?? "N/D"}`,
        ]}
      />
      {geo.prompts.length ? (
        <>
          <Text style={styles.subheading}>Perguntas monitoradas</Text>
          <BulletList items={geo.prompts} />
        </>
      ) : null}
      {geo.findings.length ? (
        <>
          <Text style={styles.subheading}>Recomendações GEO/AEO</Text>
          {geo.findings.map((finding, index) => (
            <View key={`${index}-${finding.title}`} style={styles.improvement}>
              <Text style={styles.improvementTitle}>{finding.title}</Text>
              <Text style={styles.paragraph}>{finding.description}</Text>
              <Text>Recomendação: {finding.recommendation}</Text>
            </View>
          ))}
        </>
      ) : null}
    </>
  );
}

function TechnicalReport({
  url,
  result,
  geo,
}: {
  url: string;
  result: DiagnoseResult;
  geo?: GeoReportData;
}) {
  const hostname = hostLabel(url);
  const optimized = isDiagnosticOptimized(result);
  return (
    <Document
      title={`${hostname} - Diagnóstico de site`}
      author="Tupiniquim"
      subject="Diagnóstico técnico de performance e visibilidade digital"
      language="pt-BR"
    >
      <ReportPage>
        <Text style={styles.title}>{hostname} - DIAGNÓSTICO DE SITE</Text>
        {optimized ? (
          <View style={styles.optimizedCallout}>
            <Text>
              Seu site está otimizado! Todas as notas de desempenho estão acima de 90.
            </Text>
          </View>
        ) : (
          <>
            <ImprovementSection items={result.improvements} />
            {result.uiux && (
              <>
                <Section>Melhorias de UI/UX</Section>
                {result.uiux.overview ? (
                  <Text style={styles.paragraph}>{result.uiux.overview}</Text>
                ) : null}
                {result.uiux.diagnosis?.length ? (
                  <>
                    <Text style={styles.subheading}>Diagnóstico</Text>
                    <BulletList items={result.uiux.diagnosis} />
                  </>
                ) : null}
                {result.uiux.recommendations?.length ? (
                  <>
                    <Text style={styles.subheading}>Recomendações</Text>
                    <BulletList items={result.uiux.recommendations} />
                  </>
                ) : null}
              </>
            )}
            {result.extras?.length ? (
              <>
                <Section>Sugestões extras</Section>
                {result.extras.map((extra, index) => (
                  <View key={`${index}-${extra.title}`} style={styles.improvement}>
                    <Text style={styles.improvementTitle}>{extra.title}</Text>
                    <Text>{extra.description}</Text>
                  </View>
                ))}
              </>
            ) : null}
          </>
        )}
        {geo ? <GeoSections geo={geo} /> : null}
        <View break={!optimized}>
          <Section>Performance</Section>
          <ScoreCards
            summary={result.summary.desktop}
            label="Desktop"
            showOpportunities={!optimized}
          />
          <ScoreCards
            summary={result.summary.mobile}
            label="Mobile"
            showOpportunities={!optimized}
          />
        </View>
      </ReportPage>
    </Document>
  );
}

function BusinessReport({ url, summary }: { url: string; summary: BusinessSummary }) {
  const hostname = hostLabel(url);
  return (
    <Document
      title={`${hostname} - Relatório executivo`}
      author="Tupiniquim"
      subject="Relatório executivo de oportunidades digitais"
      language="pt-BR"
    >
      <ReportPage>
        <Text style={styles.title}>{hostname} - RELATÓRIO EXECUTIVO</Text>
        <Section>Visão geral</Section>
        <View style={styles.businessCallout}>
          <Text>{summary.resumo}</Text>
        </View>
        <Section>O que isso significa para o negócio</Section>
        <Text style={styles.paragraph}>{summary.contexto}</Text>
        <BulletList items={summary.impactoNegocio} />
        <Text style={styles.paragraph}>
          Relatório preparado pela Tupiniquim
        </Text>
        <View break>
          <Section>Prioridades recomendadas</Section>
          {summary.prioridades.map((priority, index) => (
            <View key={`${index}-${priority.titulo}`} style={styles.improvement}>
              <Text style={styles.improvementTitle}>
                {numberedTitle(index, priority.titulo)}
              </Text>
              <Text style={styles.paragraph}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>Por que importa: </Text>
                {priority.porQueImporta}
              </Text>
              <Text style={styles.paragraph}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>O que fazer: </Text>
                {priority.acao}
              </Text>
            </View>
          ))}
          <Section>Próximo passo</Section>
          <Text>{summary.proximoPasso}</Text>
        </View>
      </ReportPage>
    </Document>
  );
}

async function renderPdf(document: ReactElement): Promise<Blob> {
  const blob = await pdf(document).toBlob();
  if (blob.type !== "application/pdf") {
    throw new Error("A geração do relatório não retornou um PDF válido.");
  }
  return blob;
}

export function createDiagnosticReportPdf(
  url: string,
  result: DiagnoseResult,
): Promise<Blob> {
  return renderPdf(<TechnicalReport url={url} result={result} />);
}

export function createGeoAeoReportPdf(
  url: string,
  result: DiagnoseResult,
  geo: GeoReportData,
): Promise<Blob> {
  return renderPdf(<TechnicalReport url={url} result={result} geo={geo} />);
}

export function createBusinessReportPdf(
  url: string,
  summary: BusinessSummary,
): Promise<Blob> {
  return renderPdf(<BusinessReport url={url} summary={summary} />);
}

export function reportPdfFilename(url: string, suffix: string): string {
  return `${filenameHost(url)}_${suffix}.pdf`;
}

export function downloadPdf(blob: Blob, filename: string): void {
  if (blob.type !== "application/pdf") {
    throw new Error("O arquivo para download não está no formato PDF.");
  }

  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
}
