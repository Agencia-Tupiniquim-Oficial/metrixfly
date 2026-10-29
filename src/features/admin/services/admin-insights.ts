import type { AdminAnalysis, AdminContact, AdminLead } from "@/features/admin/services/admin-api";

/** Dates are local `yyyy-mm-dd` strings; an empty bound is open. */
export type DateRange = { from: string; to: string };
export type RangePreset = "all" | "today" | "7d" | "30d" | "custom";
export type QuoteStatus = "requested" | "opened" | "none";
export type StatusFilter = "all" | QuoteStatus;
export type SortKey = "date" | "domain" | "score";
export type SortDirection = "asc" | "desc";

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CHART_DAYS = 45;

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function toLocalDay(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The local calendar day of a timestamp, so "today" matches what the agency sees on screen. */
export function localDay(iso: string): string {
  return toLocalDay(new Date(iso));
}

export function presetRange(preset: Exclude<RangePreset, "custom">, now = new Date()): DateRange {
  if (preset === "all") return { from: "", to: "" };
  const to = toLocalDay(now);
  if (preset === "today") return { from: to, to };
  const days = preset === "7d" ? 6 : 29;
  return { from: toLocalDay(new Date(now.getTime() - days * DAY_MS)), to };
}

export function inRange(iso: string, range: DateRange): boolean {
  const day = localDay(iso);
  if (range.from && day < range.from) return false;
  if (range.to && day > range.to) return false;
  return true;
}

export function quoteStatus(analysis: AdminAnalysis): QuoteStatus {
  if (analysis.quoteSubmitted > 0) return "requested";
  if (analysis.quoteOpened > 0) return "opened";
  return "none";
}

export function filterByStatus(analyses: AdminAnalysis[], status: StatusFilter): AdminAnalysis[] {
  return status === "all" ? analyses : analyses.filter((analysis) => quoteStatus(analysis) === status);
}

export type AdminSummary = {
  analyses: number;
  requests: number;
  /** Share of analyses that ended in a quote request, or null without analyses. */
  conversion: number | null;
  averageMobileScore: number | null;
  uniqueEmails: number;
};

export function summarize(analyses: AdminAnalysis[], leads: AdminLead[] | null): AdminSummary {
  const requests = analyses.filter((analysis) => analysis.quoteSubmitted > 0).length;
  const scores = analyses.flatMap((analysis) =>
    analysis.mobileScore === null ? [] : [analysis.mobileScore],
  );
  return {
    analyses: analyses.length,
    requests,
    conversion: analyses.length === 0 ? null : requests / analyses.length,
    averageMobileScore:
      scores.length === 0 ? null : Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
    uniqueEmails: leads === null ? 0 : new Set(leads.map((lead) => lead.email)).size,
  };
}

export type DayBucket = { day: string; analyses: number; requests: number };

/** Analyses per day over the filtered period (the last 45 days of it when it is longer). */
export function dailySeries(
  analyses: AdminAnalysis[],
  range: DateRange,
  now = new Date(),
): DayBucket[] {
  if (analyses.length === 0 && !range.from) return [];
  const days = analyses.map((analysis) => localDay(analysis.createdAt)).sort();
  const end = range.to || toLocalDay(now);
  const start = range.from || days[0] || end;
  const buckets = new Map<string, DayBucket>();
  const cursor = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  while (cursor <= last) {
    const day = toLocalDay(cursor);
    buckets.set(day, { day, analyses: 0, requests: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const analysis of analyses) {
    const bucket = buckets.get(localDay(analysis.createdAt));
    if (!bucket) continue;
    bucket.analyses += 1;
    if (analysis.quoteSubmitted > 0) bucket.requests += 1;
  }
  return [...buckets.values()].slice(-MAX_CHART_DAYS);
}

export function sortAnalyses(
  analyses: AdminAnalysis[],
  key: SortKey,
  direction: SortDirection,
): AdminAnalysis[] {
  const factor = direction === "asc" ? 1 : -1;
  const compare = (a: AdminAnalysis, b: AdminAnalysis) => {
    if (key === "domain") return a.domain.localeCompare(b.domain, "pt-BR");
    if (key === "score") return (a.mobileScore ?? -1) - (b.mobileScore ?? -1);
    return a.createdAt.localeCompare(b.createdAt);
  };
  return [...analyses].sort((a, b) => factor * compare(a, b));
}

export function filterLeadsByRange(leads: AdminLead[], range: DateRange): AdminLead[] {
  return leads.filter((lead) => inRange(lead.createdAt, range));
}

export function pageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

function csvCell(value: string): string {
  // Cells starting with a formula character are prefixed so spreadsheets do not run them.
  const safe = /^[=+\-@]/.test(value) ? `'${value}` : value;
  return /[",\n;]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(rows: string[][]): string {
  return rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
}

export function analysesCsv(analyses: AdminAnalysis[], emails: Map<string, string>): string {
  const statusLabel: Record<QuoteStatus, string> = {
    requested: "Pediu orçamento",
    opened: "Abriu o formulário",
    none: "Sem orçamento",
  };
  return toCsv([
    ["Domínio", "E-mail", "Data", "Desempenho celular", "Desempenho desktop", "Orçamento", "Relatório"],
    ...analyses.map((analysis) => [
      analysis.domain,
      emails.get(analysis.id) ?? "",
      new Date(analysis.createdAt).toLocaleString("pt-BR"),
      analysis.mobileScore === null ? "" : String(analysis.mobileScore),
      analysis.desktopScore === null ? "" : String(analysis.desktopScore),
      statusLabel[quoteStatus(analysis)],
      `/diagnostico/${analysis.id}`,
    ]),
  ]);
}

export function contactsCsv(contacts: AdminContact[]): string {
  return toCsv([
    ["E-mail", "Análises", "Sites analisados", "Última análise"],
    ...contacts.map((contact) => [
      contact.email,
      String(contact.analyses),
      contact.domains.join(", "),
      new Date(contact.lastAt).toLocaleString("pt-BR"),
    ]),
  ]);
}

export function downloadCsv(filename: string, content: string): void {
  // The BOM keeps accents readable when the file is opened in Excel.
  const blob = new Blob(["\uFEFF", content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
