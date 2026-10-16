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
import { tupiniquimLogo } from "@/assets/brand";
import { getClientLogoDataUrl } from "@/features/diagnostics/services/client-logo";
import type {
  DiagnoseResult,
  Improvement,
  PageSummary,
} from "@/features/diagnostics/model/diagnose";
import { isDiagnosticOptimized } from "@/features/diagnostics/model/diagnose";
import type { BusinessSummary } from "@/features/diagnostics/model/business-report";
import {
  DIAGNOSTIC_REPORT_COLORS,
  DIAGNOSTIC_REPORT_FONTS,
  DIAGNOSTIC_REPORT_LAYOUT,
  DIAGNOSTIC_REPORT_TYPOGRAPHY,
} from "@/features/diagnostics/components/diagnostic-report-design";

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
  logo: { width: 88, height: 48, objectFit: "contain", marginRight: 10 },
  clientLogo: { width: 88, height: 48, objectFit: "contain", marginLeft: 10 },
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
});

const pxToPt = (pixels: number) => pixels * 0.75;
const keepWordsIntact = (word: string) => [word];

const diagnosticStyles = StyleSheet.create({
  page: {
    paddingHorizontal: pxToPt(DIAGNOSTIC_REPORT_LAYOUT.pagePaddingX),
    paddingBottom: pxToPt(DIAGNOSTIC_REPORT_LAYOUT.pagePaddingY),
    fontFamily: DIAGNOSTIC_REPORT_FONTS.pdfBody,
    fontSize: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.description.fontSize),
    color: DIAGNOSTIC_REPORT_COLORS.text,
    lineHeight: DIAGNOSTIC_REPORT_TYPOGRAPHY.description.lineHeight,
    backgroundColor: DIAGNOSTIC_REPORT_COLORS.paper,
  },
  coverPage: { paddingTop: pxToPt(DIAGNOSTIC_REPORT_LAYOUT.coverTopPadding) },
  contentPage: { paddingTop: pxToPt(DIAGNOSTIC_REPORT_LAYOUT.pagePaddingY) },
  coverLogoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: pxToPt(DIAGNOSTIC_REPORT_LAYOUT.coverLogoMarginBottom),
  },
  coverLogo: {
    width: pxToPt(DIAGNOSTIC_REPORT_LAYOUT.coverLogoWidth),
    height: pxToPt(DIAGNOSTIC_REPORT_LAYOUT.coverLogoHeight),
    objectFit: "contain",
  },
  coverClientLogo: {
    width: pxToPt(160),
    height: pxToPt(DIAGNOSTIC_REPORT_LAYOUT.coverLogoHeight),
    objectFit: "contain",
    marginLeft: pxToPt(24),
  },
  title: {
    color: DIAGNOSTIC_REPORT_COLORS.green,
    fontSize: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.title.fontSize),
    fontFamily: DIAGNOSTIC_REPORT_FONTS.pdfHeading,
    lineHeight: DIAGNOSTIC_REPORT_TYPOGRAPHY.title.lineHeight,
    marginBottom: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.title.marginBottom),
  },
  coverSection: {
    color: DIAGNOSTIC_REPORT_COLORS.greenSoft,
    fontSize: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.section.fontSize),
    fontFamily: DIAGNOSTIC_REPORT_FONTS.pdfHeading,
    lineHeight: DIAGNOSTIC_REPORT_TYPOGRAPHY.section.lineHeight,
    marginBottom: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.section.marginBottom),
    paddingBottom: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.section.paddingBottom),
  },
  section: {
    color: DIAGNOSTIC_REPORT_COLORS.greenSoft,
    fontSize: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.section.fontSize),
    fontFamily: DIAGNOSTIC_REPORT_FONTS.pdfHeading,
    lineHeight: DIAGNOSTIC_REPORT_TYPOGRAPHY.section.lineHeight,
    marginTop: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.section.marginTop),
    marginBottom: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.section.marginBottom),
    paddingBottom: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.section.paddingBottom),
  },
  improvement: { marginBottom: pxToPt(DIAGNOSTIC_REPORT_LAYOUT.contentImprovementGap) },
  coverImprovement: { marginBottom: pxToPt(DIAGNOSTIC_REPORT_LAYOUT.coverImprovementGap) },
  improvementTitle: {
    color: DIAGNOSTIC_REPORT_COLORS.heading,
    fontFamily: DIAGNOSTIC_REPORT_FONTS.pdfBodyBold,
    fontSize: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.contentImprovementTitle.fontSize),
    lineHeight: DIAGNOSTIC_REPORT_TYPOGRAPHY.contentImprovementTitle.lineHeight,
    marginTop: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.contentImprovementTitle.marginTop),
    marginBottom: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.contentImprovementTitle.marginBottom),
  },
  coverImprovementTitle: {
    color: DIAGNOSTIC_REPORT_COLORS.heading,
    fontFamily: DIAGNOSTIC_REPORT_FONTS.pdfBodyBold,
    fontSize: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.coverImprovementTitle.fontSize),
    lineHeight: DIAGNOSTIC_REPORT_TYPOGRAPHY.coverImprovementTitle.lineHeight,
    marginTop: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.coverImprovementTitle.marginTop),
    marginBottom: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.coverImprovementTitle.marginBottom),
  },
  subheading: {
    color: DIAGNOSTIC_REPORT_COLORS.heading,
    fontSize: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.subheading.fontSize),
    lineHeight: DIAGNOSTIC_REPORT_TYPOGRAPHY.subheading.lineHeight,
    fontFamily: DIAGNOSTIC_REPORT_FONTS.pdfBodyBold,
    marginTop: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.subheading.marginTop),
    marginBottom: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.subheading.marginBottom),
  },
  paragraph: {
    fontSize: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.description.fontSize),
    lineHeight: DIAGNOSTIC_REPORT_TYPOGRAPHY.description.lineHeight,
    marginBottom: pxToPt(7),
  },
  coverDescription: {
    fontSize: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.coverDescription.fontSize),
    lineHeight: DIAGNOSTIC_REPORT_TYPOGRAPHY.coverDescription.lineHeight,
    marginBottom: pxToPt(7),
  },
  uiuxOverview: {
    fontSize: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.uiuxOverview.fontSize),
    lineHeight: DIAGNOSTIC_REPORT_TYPOGRAPHY.uiuxOverview.lineHeight,
    marginBottom: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.uiuxOverview.marginBottom),
  },
  extraTitle: {
    color: DIAGNOSTIC_REPORT_COLORS.heading,
    fontFamily: DIAGNOSTIC_REPORT_FONTS.pdfBodyBold,
    fontSize: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.extraTitle.fontSize),
    lineHeight: DIAGNOSTIC_REPORT_TYPOGRAPHY.extraTitle.lineHeight,
    marginBottom: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.extraTitle.marginBottom),
  },
  bulletList: {
    paddingLeft: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.bullet.indent),
  },
  bullet: {
    flexDirection: "row",
    marginBottom: pxToPt(DIAGNOSTIC_REPORT_TYPOGRAPHY.bullet.gap),
  },
  bulletMark: { width: pxToPt(18), color: DIAGNOSTIC_REPORT_COLORS.green },
  bulletText: { flex: 1 },
  diagnosticFooter: {
    position: "absolute",
    bottom: 18,
    left: pxToPt(DIAGNOSTIC_REPORT_LAYOUT.pagePaddingX),
    right: pxToPt(DIAGNOSTIC_REPORT_LAYOUT.pagePaddingX),
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: DIAGNOSTIC_REPORT_COLORS.border,
    color: DIAGNOSTIC_REPORT_COLORS.text,
    fontSize: 8,
    textAlign: "center",
  },
  deviceHeading: {
    color: DIAGNOSTIC_REPORT_COLORS.heading,
    fontFamily: DIAGNOSTIC_REPORT_FONTS.pdfBodyBold,
    fontSize: pxToPt(16),
    marginBottom: pxToPt(8),
  },
  outerScoreCard: {
    backgroundColor: DIAGNOSTIC_REPORT_COLORS.paper,
    borderWidth: 1,
    borderColor: DIAGNOSTIC_REPORT_COLORS.border,
    borderRadius: 8,
    padding: pxToPt(16),
    marginBottom: pxToPt(32),
  },
  scoreCard: {
    backgroundColor: DIAGNOSTIC_REPORT_COLORS.paper,
    borderWidth: 1,
    borderColor: DIAGNOSTIC_REPORT_COLORS.border,
    borderRadius: 8,
  },
  scoreCardHeader: { padding: pxToPt(24), paddingBottom: pxToPt(12) },
  scoreCardTitle: {
    color: DIAGNOSTIC_REPORT_COLORS.heading,
    fontSize: pxToPt(14),
    fontFamily: DIAGNOSTIC_REPORT_FONTS.pdfBodyBold,
  },
  scoreCardContent: { padding: pxToPt(24), paddingTop: 0 },
  scoreRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: pxToPt(24),
    marginBottom: pxToPt(16),
  },
  scoreItem: {
    width: pxToPt(56),
    flexGrow: 0,
    flexShrink: 0,
    flexBasis: pxToPt(56),
    alignItems: "center",
  },
  scoreCircle: {
    width: pxToPt(56),
    height: pxToPt(56),
    borderWidth: pxToPt(4),
    borderRadius: pxToPt(28),
    backgroundColor: DIAGNOSTIC_REPORT_COLORS.paper,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreNumber: {
    fontSize: pxToPt(14),
    fontFamily: DIAGNOSTIC_REPORT_FONTS.pdfBody,
    fontWeight: 600,
    textAlign: "center",
  },
  scoreLabel: {
    color: DIAGNOSTIC_REPORT_COLORS.heading,
    fontSize: pxToPt(10),
    textAlign: "center",
    marginTop: pxToPt(8),
  },
  navigationScore: {
    backgroundColor: "#FFFBEB",
    color: "#B45309",
    fontSize: pxToPt(14),
    paddingHorizontal: pxToPt(8),
    paddingVertical: pxToPt(4),
    borderRadius: 4,
    marginLeft: "auto",
  },
  metrics: {
    flexDirection: "row",
    flexWrap: "wrap",
    borderTopWidth: 1,
    borderTopColor: DIAGNOSTIC_REPORT_COLORS.border,
    paddingTop: pxToPt(16),
  },
  metric: {
    width: "50%",
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: DIAGNOSTIC_REPORT_COLORS.border,
    paddingHorizontal: pxToPt(4),
    paddingVertical: pxToPt(8),
  },
  metricLabel: {
    color: DIAGNOSTIC_REPORT_COLORS.heading,
    fontSize: pxToPt(14),
  },
  metricValue: {
    color: DIAGNOSTIC_REPORT_COLORS.text,
    fontSize: pxToPt(14),
    fontFamily: DIAGNOSTIC_REPORT_FONTS.pdfBody,
  },
  opportunitiesTitle: {
    color: DIAGNOSTIC_REPORT_COLORS.heading,
    fontSize: pxToPt(16),
    fontFamily: DIAGNOSTIC_REPORT_FONTS.pdfBodyBold,
    marginTop: pxToPt(16),
    marginBottom: pxToPt(6),
  },
  optimizedCallout: {
    backgroundColor: "#F0FDF4",
    borderLeftWidth: 3,
    borderLeftColor: DIAGNOSTIC_REPORT_COLORS.green,
    padding: pxToPt(12),
    marginBottom: pxToPt(16),
    color: DIAGNOSTIC_REPORT_COLORS.green,
    fontFamily: DIAGNOSTIC_REPORT_FONTS.pdfBody,
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

function Header({ clientLogo }: { clientLogo?: string | null }) {
  return (
    <View style={styles.header}>
      <Image src={tupiniquimLogo} style={styles.logo} />
      {clientLogo ? <Image src={clientLogo} style={styles.clientLogo} /> : null}
      <View>
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

function ReportPage({
  children,
  clientLogo,
}: {
  children: React.ReactNode;
  clientLogo?: string | null;
}) {
  return (
    <Page size="A4" style={styles.page} wrap>
      <Header clientLogo={clientLogo} />
      {children}
      <Footer />
    </Page>
  );
}

function DiagnosticReportPage({
  children,
  cover = false,
  clientLogo,
}: {
  children: React.ReactNode;
  cover?: boolean;
  clientLogo?: string | null;
}) {
  return (
    <Page
      size="A4"
      style={[
        diagnosticStyles.page,
        cover ? diagnosticStyles.coverPage : diagnosticStyles.contentPage,
      ]}
      wrap
    >
      {cover ? (
        <View style={diagnosticStyles.coverLogoRow}>
          <Image src={tupiniquimLogo} style={diagnosticStyles.coverLogo} />
          {clientLogo ? (
            <Image src={clientLogo} style={diagnosticStyles.coverClientLogo} />
          ) : null}
        </View>
      ) : null}
      {children}
      <Text
        fixed
        style={diagnosticStyles.diagnosticFooter}
        render={({ pageNumber, totalPages }) => `Tupiniquim  •  ${pageNumber} / ${totalPages}`}
      />
    </Page>
  );
}

function Section({ children }: { children: string }) {
  return <Text style={styles.section} minPresenceAhead={30}>{children}</Text>;
}

function DiagnosticSection({
  children,
  cover = false,
}: {
  children: string;
  cover?: boolean;
}) {
  return (
    <Text
      style={cover ? diagnosticStyles.coverSection : diagnosticStyles.section}
      minPresenceAhead={30}
    >
      {children}
    </Text>
  );
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

function DiagnosticBulletList({ items }: { items?: string[] }) {
  if (!items?.length) return null;
  return (
    <View style={diagnosticStyles.bulletList}>
      {items.map((item, index) => (
        <View key={`${index}-${item}`} style={diagnosticStyles.bullet} wrap={false}>
          <Text style={diagnosticStyles.bulletMark}>•</Text>
          <Text
            style={diagnosticStyles.bulletText}
            hyphenationCallback={keepWordsIntact}
          >
            {item}
          </Text>
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
    ["Práticas", summary.scores.bestPractices],
    ["SEO", summary.scores.seo],
  ] as const;
  const scoreColor = (value: number) => {
    if (value >= 90) {
      return {
        color: DIAGNOSTIC_REPORT_COLORS.scoreGood,
        borderColor: DIAGNOSTIC_REPORT_COLORS.scoreGoodRing,
      };
    }
    if (value >= 50) {
      return {
        color: DIAGNOSTIC_REPORT_COLORS.scoreMedium,
        borderColor: DIAGNOSTIC_REPORT_COLORS.scoreMediumRing,
      };
    }
    return {
      color: DIAGNOSTIC_REPORT_COLORS.scorePoor,
      borderColor: DIAGNOSTIC_REPORT_COLORS.scorePoorRing,
    };
  };
  const metrics = [
    ["FCP", summary.metrics.fcp],
    ["TBT", summary.metrics.tbt],
    ["SI", summary.metrics.si],
    ["LCP", summary.metrics.lcp],
    ["CLS", summary.metrics.cls],
    ["TTFB", summary.metrics.ttfb],
    ["TTI", summary.metrics.tti],
    ["Tamanho da página", summary.metrics.pageSize],
    ["Requisições", summary.metrics.requests],
  ] as const;

  return (
    <View style={diagnosticStyles.outerScoreCard}>
      <Text style={diagnosticStyles.deviceHeading}>{label}:</Text>
      <View style={diagnosticStyles.scoreCard}>
        <View style={diagnosticStyles.scoreCardHeader}>
          <Text style={diagnosticStyles.scoreCardTitle}>{label}</Text>
        </View>
        <View style={diagnosticStyles.scoreCardContent}>
          <View style={diagnosticStyles.scoreRow}>
            {scores.map(([name, value]) => (
              <View key={name} style={diagnosticStyles.scoreItem}>
                <View style={[diagnosticStyles.scoreCircle, scoreColor(value)]}>
                  <Text style={[diagnosticStyles.scoreNumber, { color: scoreColor(value).color }]}>
                    {Math.round(value)}
                  </Text>
                </View>
                <Text style={diagnosticStyles.scoreLabel}>{name}</Text>
              </View>
            ))}
            {summary.scores.navigation !== undefined &&
            summary.scores.navigation !== null ? (
              <Text style={diagnosticStyles.navigationScore}>
                {summary.scores.navigation}
              </Text>
            ) : null}
          </View>
          <View style={diagnosticStyles.metrics}>
            {metrics.map(([name, value]) =>
              value === undefined || value === null || value === "" ? null : (
                <View key={name} style={diagnosticStyles.metric}>
                  <Text style={diagnosticStyles.metricLabel}>{name}</Text>
                  <Text style={diagnosticStyles.metricValue}>{String(value)}</Text>
                </View>
              ),
            )}
          </View>
          {showOpportunities && summary.opportunities?.length ? (
            <>
              <Text style={diagnosticStyles.opportunitiesTitle}>
                Diagnóstico do PageSpeed
              </Text>
              <DiagnosticBulletList
                items={summary.opportunities.map((opportunity) =>
                  opportunity.displayValue
                    ? `${opportunity.title} — ${opportunity.displayValue}`
                    : opportunity.title,
                )}
              />
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function ImprovementSection({
  items,
  startIndex = 0,
  cover = false,
  showTitle = true,
}: {
  items: Improvement[];
  startIndex?: number;
  cover?: boolean;
  showTitle?: boolean;
}) {
  return (
    <>
      {showTitle ? (
        <DiagnosticSection cover={cover}>Sugestões de melhoria</DiagnosticSection>
      ) : null}
      {items.map((item, itemIndex) => (
        <View
          key={`${startIndex + itemIndex}-${item.title}`}
          style={cover ? diagnosticStyles.coverImprovement : diagnosticStyles.improvement}
        >
          <Text
            style={
              cover
                ? diagnosticStyles.coverImprovementTitle
                : diagnosticStyles.improvementTitle
            }
            minPresenceAhead={24}
          >
            {numberedTitle(startIndex + itemIndex, item.title)}
          </Text>
          {(item.description || item.problem) && (
            <>
              <Text style={diagnosticStyles.subheading}>Descrição</Text>
              <Text
                style={
                  cover
                    ? diagnosticStyles.coverDescription
                    : diagnosticStyles.paragraph
                }
                hyphenationCallback={keepWordsIntact}
              >
                {item.description ?? item.problem}
              </Text>
            </>
          )}
          {item.impact?.length ? (
            <>
              <Text style={diagnosticStyles.subheading}>Impacto</Text>
              <DiagnosticBulletList items={item.impact} />
            </>
          ) : null}
          {item.causes?.length ? (
            <>
              <Text style={diagnosticStyles.subheading}>Causas comuns</Text>
              <DiagnosticBulletList items={item.causes} />
            </>
          ) : null}
          {item.recommendations?.length ? (
            <>
              <Text style={diagnosticStyles.subheading}>Recomendações</Text>
              <DiagnosticBulletList items={item.recommendations} />
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
      <DiagnosticSection>Visibilidade em busca e IA</DiagnosticSection>
      <Text style={diagnosticStyles.paragraph}>
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
      <Text style={diagnosticStyles.subheading}>Presença em mecanismos de resposta</Text>
      <DiagnosticBulletList
        items={[
          `ChatGPT: ${geo.visibility.chatgpt ?? "N/D"}`,
          `Gemini: ${geo.visibility.gemini ?? "N/D"}`,
          `Perplexity: ${geo.visibility.perplexity ?? "N/D"}`,
        ]}
      />
      {geo.prompts.length ? (
        <>
          <Text style={diagnosticStyles.subheading}>Perguntas monitoradas</Text>
          <DiagnosticBulletList items={geo.prompts} />
        </>
      ) : null}
      {geo.findings.length ? (
        <>
          <Text style={diagnosticStyles.subheading}>Recomendações GEO/AEO</Text>
          {geo.findings.map((finding, index) => (
            <View key={`${index}-${finding.title}`} style={diagnosticStyles.improvement}>
              <Text style={diagnosticStyles.improvementTitle}>{finding.title}</Text>
              <Text style={diagnosticStyles.paragraph}>{finding.description}</Text>
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
  clientLogo,
}: {
  url: string;
  result: DiagnoseResult;
  geo?: GeoReportData;
  clientLogo?: string | null;
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
      <DiagnosticReportPage cover clientLogo={clientLogo}>
        <Text style={diagnosticStyles.title}>{hostname} - DIAGNÓSTICO DE SITE</Text>
        {optimized ? (
          <View style={diagnosticStyles.optimizedCallout}>
            <Text>
              Seu site está otimizado! Todas as notas de desempenho estão acima de 90.
            </Text>
          </View>
        ) : (
          <ImprovementSection
            items={result.improvements.slice(
              0,
              DIAGNOSTIC_REPORT_LAYOUT.coverImprovementCount,
            )}
            cover
          />
        )}
      </DiagnosticReportPage>
      <DiagnosticReportPage>
        {!optimized ? (
          <>
            <ImprovementSection
              items={result.improvements.slice(
                DIAGNOSTIC_REPORT_LAYOUT.coverImprovementCount,
              )}
              startIndex={DIAGNOSTIC_REPORT_LAYOUT.coverImprovementCount}
              showTitle={false}
            />
            {result.uiux ? (
              <>
                <DiagnosticSection>Melhorias de UI/UX</DiagnosticSection>
                {result.uiux.overview ? (
                  <Text
                    style={diagnosticStyles.uiuxOverview}
                    hyphenationCallback={keepWordsIntact}
                  >
                    {result.uiux.overview}
                  </Text>
                ) : null}
                {result.uiux.diagnosis?.length ? (
                  <>
                    <Text style={diagnosticStyles.subheading}>Diagnóstico</Text>
                    <DiagnosticBulletList items={result.uiux.diagnosis} />
                  </>
                ) : null}
                {result.uiux.recommendations?.length ? (
                  <>
                    <Text style={diagnosticStyles.subheading}>Recomendações</Text>
                    <DiagnosticBulletList items={result.uiux.recommendations} />
                  </>
                ) : null}
              </>
            ) : null}
            {result.extras?.length ? (
              <>
                <DiagnosticSection>Sugestões extras</DiagnosticSection>
                {result.extras.map((extra, index) => (
                  <View key={`${index}-${extra.title}`} style={diagnosticStyles.improvement}>
                    <Text style={diagnosticStyles.extraTitle}>{extra.title}</Text>
                    <Text
                      style={diagnosticStyles.paragraph}
                      hyphenationCallback={keepWordsIntact}
                    >
                      {extra.description}
                    </Text>
                  </View>
                ))}
              </>
            ) : null}
          </>
        ) : null}
        {geo ? <GeoSections geo={geo} /> : null}
      </DiagnosticReportPage>
      <DiagnosticReportPage>
        <DiagnosticSection>Performance</DiagnosticSection>
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
      </DiagnosticReportPage>
    </Document>
  );
}

function BusinessReport({
  url,
  summary,
  clientLogo,
}: {
  url: string;
  summary: BusinessSummary;
  clientLogo?: string | null;
}) {
  const hostname = hostLabel(url);
  return (
    <Document
      title={`${hostname} - Relatório executivo`}
      author="Tupiniquim"
      subject="Relatório executivo de oportunidades digitais"
      language="pt-BR"
    >
      <ReportPage clientLogo={clientLogo}>
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
  return getClientLogoDataUrl(url).then((clientLogo) =>
    renderPdf(<TechnicalReport url={url} result={result} clientLogo={clientLogo} />),
  );
}

export function createGeoAeoReportPdf(
  url: string,
  result: DiagnoseResult,
  geo: GeoReportData,
): Promise<Blob> {
  return getClientLogoDataUrl(url).then((clientLogo) =>
    renderPdf(
      <TechnicalReport url={url} result={result} geo={geo} clientLogo={clientLogo} />,
    ),
  );
}

export function createBusinessReportPdf(
  url: string,
  summary: BusinessSummary,
): Promise<Blob> {
  return getClientLogoDataUrl(url).then((clientLogo) =>
    renderPdf(<BusinessReport url={url} summary={summary} clientLogo={clientLogo} />),
  );
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
