import type { DiagnoseResult } from "@/features/diagnostics/model/diagnose";
import type { CampaignTracking } from "@/features/diagnostics/model/campaign-tracking";

export type QuoteRequest = {
  "form-name": "form-contato";
  name: string;
  company: string;
  email: string;
  phone: string;
};

export type QuoteEmailRequest = QuoteRequest & {
  domain: string;
  diagnosticSummary: string;
  campaignTracking: CampaignTracking;
};

const MAX_DIAGNOSTIC_PDF_BYTES = 4 * 1024 * 1024;

export function validateDiagnosticPdf(blob: Blob): void {
  if (blob.type.toLowerCase().split(";")[0].trim() !== "application/pdf") {
    throw new Error("O relatório gerado não está no formato PDF.");
  }
  if (blob.size === 0 || blob.size > MAX_DIAGNOSTIC_PDF_BYTES) {
    throw new Error("O relatório PDF está vazio ou excede o tamanho permitido para envio.");
  }
}

export function buildDiagnosticSummary(result: DiagnoseResult): string {
  const sections = [
    `Mobile: ${formatScores(result.summary.mobile.scores)}.`,
    `Desktop: ${formatScores(result.summary.desktop.scores)}.`,
  ];
  const improvements = result.improvements
    .slice(0, 8)
    .map((improvement) => improvement.title.trim())
    .filter(Boolean);

  if (improvements.length) {
    sections.push(`Principais oportunidades: ${improvements.join("; ")}.`);
  }

  const recommendations = result.uiux?.recommendations
    ?.map((recommendation) => recommendation.trim())
    .filter(Boolean)
    .slice(0, 5);
  if (recommendations?.length) {
    sections.push(`Recomendações de experiência: ${recommendations.join("; ")}.`);
  }

  return sections.join("\n");
}

function formatScores(scores: DiagnoseResult["summary"]["mobile"]["scores"]) {
  return [
    `desempenho ${scores.performance}/100`,
    `acessibilidade ${scores.accessibility}/100`,
    `boas práticas ${scores.bestPractices}/100`,
    `SEO ${scores.seo}/100`,
  ].join(", ");
}
