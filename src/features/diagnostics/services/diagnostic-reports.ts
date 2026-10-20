import type { DiagnoseResult } from "@/features/diagnostics/model/diagnose";

export type PublicDiagnosticReport = {
  id: string;
  report: DiagnoseResult;
  createdAt: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isPublicDiagnosticReportId(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function isDiagnoseResult(value: unknown): value is DiagnoseResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const report = value as Record<string, unknown>;
  const summary = report.summary;
  if (!summary || typeof summary !== "object" || Array.isArray(summary)) {
    return false;
  }
  const summaryRecord = summary as Record<string, unknown>;
  return ["mobile", "desktop"].every((device) => {
    const page = summaryRecord[device];
    if (!page || typeof page !== "object" || Array.isArray(page)) return false;
    const pageRecord = page as Record<string, unknown>;
    return (
      Boolean(pageRecord.scores) &&
      typeof pageRecord.scores === "object" &&
      !Array.isArray(pageRecord.scores) &&
      Boolean(pageRecord.metrics) &&
      typeof pageRecord.metrics === "object" &&
      !Array.isArray(pageRecord.metrics)
    );
  }) && Array.isArray(report.improvements);
}

export async function getPublicDiagnosticReport(
  id: string,
): Promise<PublicDiagnosticReport | null> {
  if (!isPublicDiagnosticReportId(id)) return null;

  const projectUrl = import.meta.env.VITE_SUPABASE_URL;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!projectUrl || !publishableKey) {
    throw new Error("A conexão com o serviço de relatórios não está configurada.");
  }

  let response: Response;
  try {
    response = await fetch(
      `${projectUrl.replace(/\/$/, "")}/rest/v1/rpc/get_public_diagnostic_report`,
      {
        method: "POST",
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ report_id: id }),
      },
    );
  } catch (error) {
    console.error("Unable to load the shared diagnostic report.", error);
    throw new Error("Não foi possível carregar este relatório. Tente novamente.");
  }

  if (!response.ok) {
    const responseBody = await response.text();
    console.error(
      "Unable to load the shared diagnostic report.",
      response.status,
      responseBody,
    );
    throw new Error("Não foi possível carregar este relatório. Tente novamente.");
  }

  let rows: unknown;
  try {
    rows = await response.json();
  } catch (error) {
    console.error("Public diagnostic report response was not valid JSON.", error);
    throw new Error("Este relatório está indisponível no momento.");
  }
  if (!Array.isArray(rows)) {
    console.error("Public diagnostic report lookup returned an invalid response.");
    throw new Error("Este relatório está indisponível no momento.");
  }
  const rawRow: unknown = rows[0];
  if (rawRow === undefined) return null;
  if (!isRecord(rawRow)) {
    console.error("The saved diagnostic report row has an invalid format.");
    throw new Error("Este relatório está indisponível no momento.");
  }
  const row = rawRow;
  if (
    row.id !== id ||
    typeof row.created_at !== "string" ||
    Number.isNaN(Date.parse(row.created_at)) ||
    !isDiagnoseResult(row.report)
  ) {
    console.error("The saved diagnostic report has an invalid format.", row.id);
    throw new Error("Este relatório está indisponível no momento.");
  }

  return {
    id,
    report: row.report,
    createdAt: row.created_at,
  };
}
