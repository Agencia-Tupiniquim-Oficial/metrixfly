import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ExternalLink, Loader2, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AdminHeader } from "@/features/admin/components/AdminHeader";
import { useAdminSession, useNoIndex } from "@/features/admin/hooks/use-admin-session";
import {
  AdminAccessError,
  emailsByReport,
  filterAnalyses,
  filterContacts,
  groupContacts,
  listAnalyses,
  listReportLeads,
  signOutAdmin,
  type AdminAnalysis,
  type AdminLead,
} from "@/features/admin/services/admin-api";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; analyses: AdminAnalysis[]; leads: AdminLead[] | null }
  | { status: "forbidden" }
  | { status: "error"; message: string };

const eyebrow = "text-xs font-bold uppercase tracking-widest text-primary";

function scoreClasses(score: number) {
  if (score >= 90) return { text: "text-emerald-700 dark:text-emerald-300", bar: "bg-success" };
  if (score >= 50) return { text: "text-amber-700 dark:text-amber-300", bar: "bg-warning" };
  return { text: "text-rose-700 dark:text-rose-300", bar: "bg-destructive" };
}

function ScoreCell({ score }: { score: number | null }) {
  if (score === null) return <span className="text-muted-foreground">-</span>;
  const tone = scoreClasses(score);
  return (
    <div className="flex items-center gap-3">
      <span className={`w-8 font-extrabold ${tone.text}`}>{score}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}

function QuoteBadge({ analysis }: { analysis: AdminAnalysis }) {
  if (analysis.quoteSubmitted > 0) {
    return (
      <Badge className="border-transparent bg-success text-primary-foreground">
        Pediu orçamento
      </Badge>
    );
  }
  if (analysis.quoteOpened > 0) {
    return <Badge variant="outline">Abriu o formulário</Badge>;
  }
  return <span className="text-muted-foreground">-</span>;
}

export default function AdminPage() {
  useNoIndex();
  const session = useAdminSession();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [term, setTerm] = useState("");

  const load = useCallback(async () => {
    setState({ status: "loading" });
    try {
      const [analyses, leads] = await Promise.all([
        listAnalyses(),
        // The e-mail list is extra: the analyses still show if it cannot be read.
        listReportLeads().catch((error: unknown) => {
          console.error("Unable to load the captured e-mails", error);
          return null;
        }),
      ]);
      setState({ status: "ready", analyses, leads });
    } catch (error) {
      if (error instanceof AdminAccessError) {
        setState({ status: "forbidden" });
        return;
      }
      console.error("Unable to load the analyses", error);
      setState({
        status: "error",
        // Postgrest errors carry a message but are not always Error instances.
        message:
          typeof (error as { message?: unknown })?.message === "string"
            ? (error as { message: string }).message
            : "Não foi possível carregar as análises.",
      });
    }
  }, []);

  const signedIn = session.status === "signed-in";
  useEffect(() => {
    if (signedIn) void load();
  }, [signedIn, load]);

  const analyses = state.status === "ready" ? state.analyses : [];
  const leads = useMemo(() => (state.status === "ready" ? state.leads : null), [state]);
  const emails = useMemo(() => emailsByReport(leads ?? []), [leads]);
  const visible = useMemo(() => filterAnalyses(analyses, term, emails), [analyses, term, emails]);
  const contacts = useMemo(
    () => filterContacts(groupContacts(leads ?? []), term),
    [leads, term],
  );
  const requests = analyses.filter((analysis) => analysis.quoteSubmitted > 0).length;

  if (session.status === "anonymous") return <Navigate to="/admin/login" replace />;

  const signOut = async () => {
    try {
      await signOutAdmin();
    } catch (error) {
      console.error("Unable to sign out", error);
    }
  };

  return (
    <div className="min-h-screen bg-secondary/40">
      <AdminHeader
        email={session.status === "signed-in" ? session.email : undefined}
        onSignOut={signedIn ? signOut : undefined}
      />
      <main className="container max-w-6xl space-y-6 py-10 md:py-12">
        {(session.status === "loading" || state.status === "loading") && (
          <div role="status" className="flex items-center justify-center gap-3 py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <p>Carregando análises...</p>
          </div>
        )}

        {state.status === "forbidden" && (
          <Card
            role="alert"
            className="mx-auto max-w-xl space-y-4 border-border bg-card p-8 text-center"
          >
            <h1 className="text-xl font-semibold">Sem acesso</h1>
            <p className="text-muted-foreground">
              Esta conta não tem acesso à área administrativa. Entre com o e-mail
              da agência.
            </p>
            <Button type="button" variant="outline" onClick={signOut}>
              Sair
            </Button>
          </Card>
        )}

        {state.status === "error" && (
          <Card
            role="alert"
            className="mx-auto max-w-xl space-y-4 border-border bg-card p-8 text-center"
          >
            <h1 className="text-xl font-semibold">Não foi possível carregar</h1>
            <p className="text-muted-foreground">{state.message}</p>
            <Button type="button" variant="outline" onClick={() => void load()}>
              Tentar de novo
            </Button>
          </Card>
        )}

        {state.status === "ready" && (
          <>
            <div className="flex flex-wrap items-end justify-between gap-5">
              <div className="space-y-1.5">
                <p className={eyebrow}>Histórico</p>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
                  Análises realizadas
                </h1>
                <p className="text-sm text-muted-foreground">
                  {analyses.length}{" "}
                  {analyses.length === 1 ? "análise salva" : "análises salvas"} ·{" "}
                  {requests} {requests === 1 ? "pedido" : "pedidos"} de orçamento. Os
                  mais recentes primeiro.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-3">
                  <Search aria-hidden="true" className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    aria-label="Buscar domínio ou e-mail"
                    placeholder="Buscar domínio ou e-mail"
                    value={term}
                    onChange={(event) => setTerm(event.target.value)}
                    className="h-10 w-52 border-0 bg-transparent px-0 focus-visible:ring-0"
                  />
                </div>
                <Button asChild variant="hero">
                  <Link to="/">Nova análise</Link>
                </Button>
              </div>
            </div>

            <Card className="overflow-hidden border-border bg-card">
              {visible.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                  {analyses.length === 0
                    ? "Ainda não há análises salvas."
                    : "Nenhum domínio encontrado para essa busca."}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[860px] text-left text-sm">
                    <thead>
                      <tr className="bg-muted/40 text-muted-foreground">
                        <th className="px-6 py-3.5 font-semibold">Domínio</th>
                        <th className="px-6 py-3.5 font-semibold">E-mail</th>
                        <th className="px-6 py-3.5 font-semibold">Data da análise</th>
                        <th className="w-56 px-6 py-3.5 font-semibold">Desempenho no celular</th>
                        <th className="px-6 py-3.5 font-semibold">Orçamento</th>
                        <th className="px-6 py-3.5">
                          <span className="sr-only">Ações</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((analysis) => (
                        <tr key={analysis.id} className="border-t border-border">
                          <td className="px-6 py-4 font-bold">{analysis.domain}</td>
                          <td className="px-6 py-4">
                            {emails.get(analysis.id) ?? (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-muted-foreground">
                            {new Date(analysis.createdAt).toLocaleString("pt-BR")}
                          </td>
                          <td className="px-6 py-4">
                            <ScoreCell score={analysis.mobileScore} />
                          </td>
                          <td className="px-6 py-4">
                            <QuoteBadge analysis={analysis} />
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button asChild variant="outline" size="sm">
                              <a
                                href={`/diagnostico/${analysis.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label={`Abrir o relatório de ${analysis.domain}`}
                              >
                                Abrir
                                <ExternalLink aria-hidden="true" className="ml-1.5 h-3.5 w-3.5" />
                              </a>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>

            <section aria-labelledby="admin-contacts-title" className="space-y-3">
              <h2 id="admin-contacts-title" className="text-xl font-extrabold tracking-tight">
                E-mails que liberaram relatórios
              </h2>
              {leads === null ? (
                <p role="status" className="text-sm text-muted-foreground">
                  Não foi possível carregar os e-mails agora.
                </p>
              ) : (
                <Card className="overflow-hidden border-border bg-card">
                  {contacts.length === 0 ? (
                    <p className="px-6 py-10 text-center text-sm text-muted-foreground">
                      {leads.length === 0
                        ? "Ainda não há e-mails registrados."
                        : "Nenhum e-mail encontrado para essa busca."}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-left text-sm">
                        <thead>
                          <tr className="bg-muted/40 text-muted-foreground">
                            <th className="px-6 py-3.5 font-semibold">E-mail</th>
                            <th className="px-6 py-3.5 font-semibold">Análises</th>
                            <th className="px-6 py-3.5 font-semibold">Sites analisados</th>
                            <th className="px-6 py-3.5 font-semibold">Última análise</th>
                          </tr>
                        </thead>
                        <tbody>
                          {contacts.map((contact) => (
                            <tr key={contact.email} className="border-t border-border">
                              <td className="px-6 py-4 font-bold">{contact.email}</td>
                              <td className="px-6 py-4">{contact.analyses}</td>
                              <td className="px-6 py-4 text-muted-foreground">
                                {contact.domains.join(", ")}
                              </td>
                              <td className="px-6 py-4 text-muted-foreground">
                                {new Date(contact.lastAt).toLocaleString("pt-BR")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </Card>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
