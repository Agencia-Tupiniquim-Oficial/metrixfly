import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Download, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminAnalysesTable } from "@/features/admin/components/AdminAnalysesTable";
import { AdminContactsTable } from "@/features/admin/components/AdminContactsTable";
import {
  AdminFilters,
  defaultFilters,
  type AdminFilterState,
} from "@/features/admin/components/AdminFilters";
import { AdminHeader } from "@/features/admin/components/AdminHeader";
import { AdminPagination } from "@/features/admin/components/AdminPagination";
import { AdminDailyChart, AdminStats } from "@/features/admin/components/AdminStats";
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
import {
  analysesCsv,
  contactsCsv,
  dailySeries,
  downloadCsv,
  filterByStatus,
  filterLeadsByRange,
  inRange,
  pageCount,
  sortAnalyses,
  summarize,
  type SortDirection,
  type SortKey,
} from "@/features/admin/services/admin-insights";

type LoadState =
  | { status: "loading" }
  | { status: "ready"; analyses: AdminAnalysis[]; leads: AdminLead[] | null }
  | { status: "forbidden" }
  | { status: "error"; message: string };

const eyebrow = "text-xs font-bold uppercase tracking-widest text-primary";
const PAGE_SIZE = 10;
const ANALYSES_LIMIT = 200;
const emptyMessage = "px-6 py-10 text-center text-sm text-muted-foreground";

export default function AdminPage() {
  useNoIndex();
  const session = useAdminSession();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<AdminFilterState>(defaultFilters);
  const [sort, setSort] = useState<{ key: SortKey; direction: SortDirection }>({
    key: "date",
    direction: "desc",
  });
  const [analysesPage, setAnalysesPage] = useState(1);
  const [contactsPage, setContactsPage] = useState(1);

  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setState({ status: "loading" });
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
    } finally {
      setRefreshing(false);
    }
  }, []);

  const signedIn = session.status === "signed-in";
  useEffect(() => {
    if (signedIn) void load();
  }, [signedIn, load]);

  // A new filter or order starts again from the first page.
  useEffect(() => {
    setAnalysesPage(1);
    setContactsPage(1);
  }, [filters, sort]);

  const all = useMemo(() => (state.status === "ready" ? state.analyses : []), [state]);
  const leads = state.status === "ready" ? state.leads : null;
  const emails = useMemo(() => emailsByReport(leads ?? []), [leads]);

  // Period and quote status narrow what the cards, chart and tables show; the search narrows the tables.
  const inPeriod = useMemo(
    () =>
      filterByStatus(
        all.filter((analysis) => inRange(analysis.createdAt, filters.range)),
        filters.status,
      ),
    [all, filters.range, filters.status],
  );
  const leadsInPeriod = useMemo(
    () => (leads === null ? null : filterLeadsByRange(leads, filters.range)),
    [leads, filters.range],
  );
  const summary = useMemo(() => summarize(inPeriod, leadsInPeriod), [inPeriod, leadsInPeriod]);
  const series = useMemo(() => dailySeries(inPeriod, filters.range), [inPeriod, filters.range]);

  const visible = useMemo(
    () =>
      sortAnalyses(filterAnalyses(inPeriod, filters.term, emails), sort.key, sort.direction),
    [inPeriod, filters.term, emails, sort],
  );
  const contacts = useMemo(
    () => filterContacts(groupContacts(leadsInPeriod ?? []), filters.term),
    [leadsInPeriod, filters.term],
  );

  const analysesPages = pageCount(visible.length, PAGE_SIZE);
  const contactsPages = pageCount(contacts.length, PAGE_SIZE);
  const analysesSlice = visible.slice(
    (Math.min(analysesPage, analysesPages) - 1) * PAGE_SIZE,
    Math.min(analysesPage, analysesPages) * PAGE_SIZE,
  );
  const contactsSlice = contacts.slice(
    (Math.min(contactsPage, contactsPages) - 1) * PAGE_SIZE,
    Math.min(contactsPage, contactsPages) * PAGE_SIZE,
  );

  if (session.status === "anonymous") return <Navigate to="/admin/login" replace />;

  const signOut = async () => {
    try {
      await signOutAdmin();
    } catch (error) {
      console.error("Unable to sign out", error);
    }
  };

  const changeSort = (key: SortKey) =>
    setSort((current) =>
      current.key === key
        ? { key, direction: current.direction === "asc" ? "desc" : "asc" }
        : { key, direction: key === "domain" ? "asc" : "desc" },
    );

  const stamp = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-secondary/40">
      <AdminHeader
        email={session.status === "signed-in" ? session.email : undefined}
        onSignOut={signedIn ? signOut : undefined}
      />
      <main className="container max-w-7xl space-y-6 py-8 md:py-10">
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
              Esta conta não tem acesso à área administrativa. Entre com o e-mail da agência.
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
                <p className={eyebrow}>Painel</p>
                <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
                  Análises realizadas
                </h1>
                <p className="text-sm text-muted-foreground">
                  {summary.analyses} {summary.analyses === 1 ? "análise" : "análises"} ·{" "}
                  {summary.requests} {summary.requests === 1 ? "pedido" : "pedidos"} de orçamento
                  no período.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void load(true)}
                  disabled={refreshing}
                >
                  <RefreshCw
                    aria-hidden="true"
                    className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  Atualizar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={visible.length === 0}
                  onClick={() =>
                    downloadCsv(`metricfly-analises-${stamp}.csv`, analysesCsv(visible, emails))
                  }
                >
                  <Download aria-hidden="true" className="mr-2 h-4 w-4" />
                  Exportar CSV
                </Button>
                <Button asChild variant="hero">
                  <Link to="/">Nova análise</Link>
                </Button>
              </div>
            </div>

            <AdminFilters value={filters} onChange={setFilters} />
            <AdminStats summary={summary} emailsAvailable={leads !== null} />
            <AdminDailyChart series={series} />

            <Tabs defaultValue="analyses" className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <TabsList className="h-11">
                  <TabsTrigger value="analyses" className="min-h-9 px-4">
                    Análises ({visible.length})
                  </TabsTrigger>
                  <TabsTrigger value="contacts" className="min-h-9 px-4">
                    Contatos ({leads === null ? "-" : contacts.length})
                  </TabsTrigger>
                </TabsList>
                {all.length >= ANALYSES_LIMIT && (
                  <p className="text-xs text-muted-foreground">
                    Mostrando as {ANALYSES_LIMIT} análises mais recentes.
                  </p>
                )}
              </div>

              <TabsContent value="analyses" className="mt-0">
                <Card className="overflow-hidden border-border bg-card">
                  {visible.length === 0 ? (
                    <p className={emptyMessage}>
                      {all.length === 0
                        ? "Ainda não há análises salvas."
                        : "Nenhum domínio encontrado para esses filtros."}
                    </p>
                  ) : (
                    <>
                      <AdminAnalysesTable
                        analyses={analysesSlice}
                        emails={emails}
                        sortKey={sort.key}
                        direction={sort.direction}
                        onSort={changeSort}
                      />
                      <AdminPagination
                        page={Math.min(analysesPage, analysesPages)}
                        pages={analysesPages}
                        total={visible.length}
                        pageSize={PAGE_SIZE}
                        onPage={setAnalysesPage}
                      />
                    </>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="contacts" className="mt-0 space-y-3">
                {leads === null ? (
                  <p role="status" className="text-sm text-muted-foreground">
                    Não foi possível carregar os e-mails agora.
                  </p>
                ) : (
                  <>
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={contacts.length === 0}
                        onClick={() =>
                          downloadCsv(`metricfly-contatos-${stamp}.csv`, contactsCsv(contacts))
                        }
                      >
                        <Download aria-hidden="true" className="mr-2 h-4 w-4" />
                        Exportar contatos
                      </Button>
                    </div>
                    <Card className="overflow-hidden border-border bg-card">
                      {contacts.length === 0 ? (
                        <p className={emptyMessage}>
                          {leads.length === 0
                            ? "Ainda não há e-mails registrados."
                            : "Nenhum e-mail encontrado para esses filtros."}
                        </p>
                      ) : (
                        <>
                          <AdminContactsTable contacts={contactsSlice} />
                          <AdminPagination
                            page={Math.min(contactsPage, contactsPages)}
                            pages={contactsPages}
                            total={contacts.length}
                            pageSize={PAGE_SIZE}
                            onPage={setContactsPage}
                          />
                        </>
                      )}
                    </Card>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}
