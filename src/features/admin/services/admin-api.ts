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

export function filterAnalyses(
  analyses: AdminAnalysis[],
  term: string,
): AdminAnalysis[] {
  const needle = term.trim().toLowerCase();
  if (!needle) return analyses;
  return analyses.filter((analysis) =>
    analysis.domain.toLowerCase().includes(needle),
  );
}
