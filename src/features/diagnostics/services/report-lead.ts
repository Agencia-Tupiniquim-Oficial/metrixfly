import { supabase } from "@/integrations/supabase/client";

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
