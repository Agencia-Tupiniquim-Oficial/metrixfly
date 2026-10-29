import { supabase } from "@/integrations/supabase/client";

const REMEMBERED_EMAIL_KEY = "metrixfly:report-lead-email";

export type ReportLead = {
  email: string;
  domain: string;
  reportId?: string | null;
};

/** Saves the e-mail next to the analyzed site so the agency sees it in the admin area. */
export async function submitReportLead({ email, domain, reportId }: ReportLead): Promise<void> {
  const { error } = await supabase.rpc("submit_report_lead", {
    lead_email: email,
    lead_domain: domain,
    lead_report_id: reportId ?? null,
  });
  if (error) throw error;
}

/** The e-mail given earlier in this browser, so the next report opens without asking again. */
export function readRememberedLeadEmail(): string | null {
  try {
    return window.localStorage.getItem(REMEMBERED_EMAIL_KEY);
  } catch {
    return null;
  }
}

export function rememberLeadEmail(email: string): void {
  try {
    window.localStorage.setItem(REMEMBERED_EMAIL_KEY, email);
  } catch {
    // Storage can be blocked; the report is then asked for again next time.
  }
}

export function forgetLeadEmailForTests(): void {
  try {
    window.localStorage.removeItem(REMEMBERED_EMAIL_KEY);
  } catch {
    // Nothing to clear.
  }
}
