import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AdminSession =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "signed-in"; email: string };

/** Follows the Supabase session, including the one created by the magic link. */
export function useAdminSession(): AdminSession {
  const [session, setSession] = useState<AdminSession>({ status: "loading" });

  useEffect(() => {
    let active = true;
    const apply = (email: string | null | undefined) => {
      if (!active) return;
      setSession(
        email ? { status: "signed-in", email } : { status: "anonymous" },
      );
    };

    supabase.auth
      .getSession()
      .then(({ data }) => apply(data.session?.user.email))
      .catch((error) => {
        console.error("Unable to read the admin session", error);
        apply(null);
      });

    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      apply(next?.user.email);
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  return session;
}

/** Keeps the admin pages out of search engines. */
export function useNoIndex(): void {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex,nofollow";
    document.head.appendChild(meta);
    return () => {
      meta.remove();
    };
  }, []);
}
