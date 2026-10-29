import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AdminAnalysis = {
  id: string;
  domain: string;
  createdAt: string;
  mobileScore: number | null;
  desktopScore: number | null;
  quoteOpened: number;
  quoteSubmitted: number;
};

export type AdminLead = {
  id: string;
  email: string;
  domain: string;
  reportId: string | null;
  createdAt: string;
};

export type AdminContact = {
  email: string;
  analyses: number;
  domains: string[];
  lastAt: string;
};

/** The account is signed in but is not on the agency allowlist. */
export class AdminAccessError extends Error {
  constructor() {
    super("Esta conta não tem acesso à área administrativa.");
    this.name = "AdminAccessError";
  }
}

/**
 * Sends the sign-in link. New accounts are never created here: the agency
 * e-mails are registered by the project owner in Supabase Auth.
 */
export async function requestAdminLink(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim().toLowerCase(),
    options: {
      shouldCreateUser: false,
      emailRedirectTo: `${window.location.origin}/admin`,
    },
  });
  if (error) throw error;
}

export async function getAdminSession(): Promise<Session | null> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function signOutAdmin(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function listAnalyses(limit = 200): Promise<AdminAnalysis[]> {
  const { data, error } = await supabase.rpc("admin_list_analyses", {
    limit_rows: limit,
  });
  if (error) {
    if (error.code === "42501" || /not_authorized/i.test(error.message)) {
      throw new AdminAccessError();
    }
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    domain: row.domain ?? "Endereço não informado",
    createdAt: row.created_at,
    mobileScore: row.mobile_score,
    desktopScore: row.desktop_score,
    quoteOpened: Number(row.quote_opened),
    quoteSubmitted: Number(row.quote_submitted),
  }));
}

export async function listReportLeads(limit = 1000): Promise<AdminLead[]> {
  const { data, error } = await supabase.rpc("admin_list_report_leads", {
    limit_rows: limit,
  });
  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    domain: row.domain,
    reportId: row.report_id,
    createdAt: row.created_at,
  }));
}

/** E-mail given to unlock each report, by report id (the newest wins). */
export function emailsByReport(leads: AdminLead[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const lead of [...leads].reverse()) {
    if (lead.reportId) map.set(lead.reportId, lead.email);
  }
  return map;
}

/** One row per e-mail: how many analyses it unlocked, of which sites, and the last one. */
export function groupContacts(leads: AdminLead[]): AdminContact[] {
  const byEmail = new Map<string, AdminContact>();
  for (const lead of leads) {
    const contact = byEmail.get(lead.email) ?? {
      email: lead.email,
      analyses: 0,
      domains: [],
      lastAt: lead.createdAt,
    };
    contact.analyses += 1;
    if (!contact.domains.includes(lead.domain)) contact.domains.push(lead.domain);
    if (lead.createdAt > contact.lastAt) contact.lastAt = lead.createdAt;
    byEmail.set(lead.email, contact);
  }
  return [...byEmail.values()].sort((a, b) => b.lastAt.localeCompare(a.lastAt));
}

export function filterAnalyses(
  analyses: AdminAnalysis[],
  term: string,
  emails: Map<string, string> = new Map(),
): AdminAnalysis[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return analyses;
  return analyses.filter(
    (analysis) =>
      analysis.domain.toLowerCase().includes(needle) ||
      (emails.get(analysis.id) ?? "").includes(needle),
  );
}

export function filterContacts(contacts: AdminContact[], term: string): AdminContact[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return contacts;
  return contacts.filter(
    (contact) =>
      contact.email.includes(needle) ||
      contact.domains.some((domain) => domain.toLowerCase().includes(needle)),
  );
}
