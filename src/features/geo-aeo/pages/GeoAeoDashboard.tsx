import { FormEvent, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import type { DiagnoseResult } from "@/features/diagnostics/model/diagnose";
import { importPdfReports } from "@/lib/dynamic-import";
import {
  analyzeRobotsTxt,
  type RobotsDocument,
  type ContentSignal,
} from "@/features/geo-aeo/lib/robots";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/app-header";
import { useDiagnosis } from "@/features/diagnostics/state/DiagnosisContext";
import {
  lastGeoCrawlKey,
  lookupGeoCrawl,
  rememberGeoCrawl,
} from "@/lib/geo-crawl-cache";
import { ScoreRing } from "@/components/score-ring";
import { Download, Globe2, Loader2, Network, Search } from "lucide-react";

type Page = { url: string; title: string; score: number; issues: string[] };
type Finding = {
  severity: "critical" | "warning" | "passed";
  title: string;
  description: string;
  recommendation: string;
};
type ResponseRecord = {
  id: string;
  platform: string;
  prompt: string;
  response: string;
  mentioned: boolean;
  citation: string;
  createdAt: string;
};
type CrawlResult = {
  domain: string;
  crawledAt: string;
  scores: { geo: number; aeo: number; technical: number; authority: number };
  stats: {
    pages: number;
    indexedPages: number;
    schemaPages: number;
    answerPages: number;
    words: number;
  };
  technicalDetails?: {
    robots: boolean;
    sitemap: boolean;
    llmsTxt: boolean;
    noindexPages: number;
    canonicalPages: number;
    images: number;
    imagesWithoutAlt: number;
    internalLinks: number;
    brokenLinks: number;
  };
  scoreBreakdown?: {
    technical?: {
      base: number;
      robotsBonus: number;
      sitemapBonus: number;
      brokenLinksPenalty: number;
      formula: string;
    };
    coverage?: {
      pagesCrawled: number;
      sitemapUrls: number;
      brokenLinksChecked: number;
    };
  };
  visibility: {
    chatgpt: number | null;
    gemini: number | null;
    perplexity: number | null;
  };
  robotsTxt?: RobotsDocument;
  pages: Page[];
  findings: Finding[];
  entities: { name: string; coverage: number; pages: number }[];
  citations: { source: string; type: string; status: string }[];
};

const fallbackFindings: Finding[] = [
  {
    severity: "passed",
    title: "Crawler pronto para análise",
    description:
      "O agente coleta sinais técnicos, semânticos e de respostas diretamente do domínio.",
    recommendation: "Use o plano de ação abaixo para priorizar as correções.",
  },
];

function scoreColor(score: number) {
  return score >= 80
    ? "text-emerald-600 dark:text-emerald-400"
    : score >= 50
      ? "text-amber-600 dark:text-amber-400"
      : "text-red-600 dark:text-red-400";
}

function severityLabel(severity: Finding["severity"]) {
  return severity === "critical"
    ? "Crítico"
    : severity === "warning"
      ? "Atenção"
      : "Aprovado";
}

function severityClass(severity: Finding["severity"]) {
  return severity === "critical"
    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
    : severity === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/50 dark:text-amber-200"
      : "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200";
}

function contentSignalLabel(signal: ContentSignal) {
  switch (signal) {
    case "yes":
      return "Sim";
    case "no":
      return "Não";
    case "conflicting":
      return "Conflitante";
    case "unverifiable":
      return "Não foi possível verificar";
    case "unspecified":
      return "Não informado";
  }
}

const GeoAeoDashboard = () => {
  const location = useLocation();
  const initialUrl =
    typeof location.state?.url === "string" ? location.state.url : "";
  // The site diagnosed on the diagnostic page: its crawl is reused, not repeated.
  const { diagnostic, isHydrated } = useDiagnosis();
  const diagnosedSite = diagnostic?.geo?.domain ?? "";
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [crawlStage, setCrawlStage] = useState("Preparando o rastreamento...");
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [responseRecords, setResponseRecords] = useState<ResponseRecord[]>([]);
  const [responsePlatform, setResponsePlatform] = useState("ChatGPT");
  const [responsePrompt, setResponsePrompt] = useState("");
  const [responseText, setResponseText] = useState("");
  const [responseCitation, setResponseCitation] = useState("");
  const [responseMentioned, setResponseMentioned] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setUserId(data.user?.id ?? null))
      .catch((error) => console.error("Unable to read auth session", error));
  }, []);
  useEffect(() => {
    if (!result) return;
    const saved = localStorage.getItem(`geo-aeo:${result.domain}:responses`);
    if (saved) setResponseRecords(JSON.parse(saved) as ResponseRecord[]);
  }, [result]);
  useEffect(() => {
    if (result)
      localStorage.setItem(
        `geo-aeo:${result.domain}:responses`,
        JSON.stringify(responseRecords),
      );
  }, [result, responseRecords]);

  const runCrawl = async (event?: FormEvent, override?: string) => {
    event?.preventDefault();
    let normalized = (override ?? url).trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;
    try {
      new URL(normalized);
    } catch {
      toast({
        title: "URL inválida",
        description: "Informe um domínio válido.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    setCrawlStage("Verificando robots.txt e sitemap.xml...");
    let stageTimer: number | undefined;
    try {
      stageTimer = window.setTimeout(
        () => setCrawlStage("Descobrindo páginas importantes..."),
        1200,
      );
      const { data, error } = await supabase.functions.invoke("geo-aeo-crawl", {
        body: { url: normalized },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCrawlStage("Consolidando recomendações...");
      const crawl = data as CrawlResult;
      setResult(crawl);
      rememberGeoCrawl(normalized, crawl);
      if (userId) {
        const { data: project, error: projectError } = await supabase
          .from("geo_projects")
          .upsert(
            { owner_id: userId, name: crawl.domain, domain: crawl.domain },
            { onConflict: "owner_id,domain" },
          )
          .select("id")
          .single();
        if (projectError) throw projectError;
        setProjectId(project.id);
        const { error: snapshotError } = await supabase
          .from("geo_crawl_snapshots")
          .insert({
            project_id: project.id,
            scores: crawl.scores,
            stats: crawl.stats,
            technical_details: crawl.technicalDetails ?? {},
            pages: crawl.pages,
            findings: crawl.findings,
          });
        if (snapshotError) throw snapshotError;
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Não foi possível rastrear o site",
        description:
          error instanceof Error
            ? error.message
            : "Verifique o domínio e tente novamente.",
        variant: "destructive",
      });
    } finally {
      if (stageTimer !== undefined) window.clearTimeout(stageTimer);
      setLoading(false);
      setCrawlStage("Preparando o rastreamento...");
    }
  };

  useEffect(() => {
    if (result || loading) return;
    const site = initialUrl || diagnosedSite;
    if (!site) return;
    const cached = lookupGeoCrawl(site);
    if (cached.status === "done") {
      setUrl(site);
      setResult(cached.result as CrawlResult);
      return;
    }
    if (cached.status === "pending") {
      // The crawl started with the diagnostic is still running: wait for it.
      setUrl(site);
      setLoading(true);
      setCrawlStage("Rastreando o site...");
      cached.promise.then(
        (crawl) => {
          setResult(crawl as CrawlResult);
          setLoading(false);
        },
        () => {
          void runCrawl(undefined, site);
        },
      );
      return;
    }
    // Nothing saved for this site (e.g. after a reload): crawl it now.
    if (!url) setUrl(site);
    void runCrawl(undefined, site);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialUrl, diagnosedSite]);

  const runCrawlAndReport = async (event?: FormEvent) => {
    if (event) event.preventDefault();
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;
    try {
      new URL(normalized);
    } catch {
      toast({
        title: "URL inválida",
        description: "Informe um domínio válido.",
        variant: "destructive",
      });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("geo-aeo-crawl", {
        body: { url: normalized },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const crawl = data as CrawlResult;
      setResult(crawl);

      // persist snapshot if logged
      if (userId) {
        try {
          const { data: project, error: projectError } = await supabase
            .from("geo_projects")
            .upsert(
              { owner_id: userId, name: crawl.domain, domain: crawl.domain },
              { onConflict: "owner_id,domain" },
            )
            .select("id")
            .single();
          if (!projectError && project?.id) {
            setProjectId(project.id);
            await supabase.from("geo_crawl_snapshots").insert({
              project_id: project.id,
              scores: crawl.scores,
              stats: crawl.stats,
              technical_details: crawl.technicalDetails ?? {},
              pages: crawl.pages,
              findings: crawl.findings,
            });
          }
        } catch (e) {
          console.error("persist snapshot failed", e);
        }
      }

      // Reuse the PageSpeed pipeline for the performance section. GEO scores
      // are not PageSpeed category scores and must not be sent as zeros.
      try {
        const { data: diagnosisData, error: diagnosisError } =
          await supabase.functions.invoke("diagnose-site", {
            body: { url: normalized },
          });
        if (diagnosisError) throw diagnosisError;
        if (diagnosisData?.error) throw new Error(diagnosisData.error);
        if (
          !diagnosisData?.summary?.mobile ||
          !diagnosisData?.summary?.desktop
        ) {
          throw new Error(
            "O diagnóstico PageSpeed não retornou as duas estratégias.",
          );
        }

        const { createGeoAeoReportPdf, downloadPdf, reportPdfFilename } =
          await importPdfReports();
        const blob = await createGeoAeoReportPdf(
          normalized,
          diagnosisData as DiagnoseResult,
          { ...crawl, prompts: [] },
        );
        downloadPdf(blob, reportPdfFilename(normalized, "relatorio_completo"));
        toast({
          title: "Relatório PDF pronto",
          description: "Download iniciado.",
        });
      } catch (error: unknown) {
        console.error(error);
        toast({
          title: "Erro ao gerar PDF",
          description: error instanceof Error ? error.message : String(error),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error(error);
      toast({
        title: "Não foi possível rastrear o site",
        description:
          error instanceof Error
            ? error.message
            : "Verifique o domínio e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const overall = useMemo(
    () =>
      result
        ? Math.round(
            (result.scores.geo +
              result.scores.aeo +
              result.scores.technical +
              result.scores.authority) /
              4,
          )
        : 0,
    [result],
  );
  const robotsVisibility = useMemo(
    () => analyzeRobotsTxt(result?.robotsTxt, result?.domain),
    [result],
  );
  const robotsPayloadMissing = result != null && result.robotsTxt == null;
  const robotsApproved =
    robotsVisibility.available && robotsVisibility.status === "allowed";
  const robotsCardDescription = !robotsVisibility.available
    ? robotsPayloadMissing
      ? "A auditoria não retornou o conteúdo do robots.txt. Atualize a função de crawl para verificar as regras."
      : `Não foi possível consultar o robots.txt. ${result?.robotsTxt?.error ?? ""}`
    : robotsVisibility.explanation;
  const hasContentSignals =
    robotsVisibility.contentSignals.search !== "unspecified" ||
    robotsVisibility.contentSignals.aiInput !== "unspecified" ||
    robotsVisibility.contentSignals.aiTrain !== "unspecified";
  const contentSignalSummary =
    !robotsVisibility.available || !hasContentSignals
      ? null
      : `Sinais de uso — busca: ${contentSignalLabel(robotsVisibility.contentSignals.search)}, entrada em modelos de IA: ${contentSignalLabel(robotsVisibility.contentSignals.aiInput)}, treinamento: ${contentSignalLabel(robotsVisibility.contentSignals.aiTrain)}. Esses sinais não substituem as regras de rastreamento.`;
  const robotsRecommendation = !robotsVisibility.available
    ? robotsPayloadMissing
      ? "A resposta de geo-aeo-crawl não inclui o campo robotsTxt. Atualize/republique a função para disponibilizar o conteúdo e o erro técnico da coleta."
      : "Confirme se o domínio publica /robots.txt e se ele pode ser acessado publicamente."
    : robotsApproved
      ? "Os agentes avaliados podem rastrear o site conforme as regras publicadas."
      : "Revise as diretivas Permitir e Não permitir se quiser liberar outros caminhos ou agentes.";
  const prioritizedFindings = useMemo(
    () =>
      [...(result?.findings ?? []), ...fallbackFindings]
        .sort(
          (a, b) =>
            Number(b.severity === "critical") -
            Number(a.severity === "critical"),
        )
        .slice(0, 6),
    [result],
  );
  const exportReport = () => {
    if (!result) return;
    const rows = [
      ["URL", "Título", "Score", "Alertas"],
      ...result.pages.map((page) => [
        page.url,
        page.title,
        String(page.score),
        page.issues.join("; "),
      ]),
    ];
    const blob = new Blob(
      [
        rows
          .map((row) =>
            row
              .map((cell) => `"${(cell || "").toString().replace(/"/g, '""')}"`)
              .join(","),
          )
          .join("\n"),
      ],
      { type: "text/csv;charset=utf-8" },
    );
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${result.domain}-geo-aeo.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };
  const addResponse = async () => {
    if (!responsePrompt.trim() || !responseText.trim()) {
      toast({
        title: "Resposta incompleta",
        description: "Informe o prompt e cole a resposta do mecanismo.",
        variant: "destructive",
      });
      return;
    }
    const record = {
      id: crypto.randomUUID(),
      platform: responsePlatform,
      prompt: responsePrompt.trim(),
      response: responseText.trim(),
      mentioned: responseMentioned,
      citation: responseCitation.trim(),
      createdAt: new Date().toISOString(),
    };
    setResponseRecords((current) => [...current, record]);
    if (projectId) {
      const { error } = await supabase.from("geo_response_evidence").insert({
        project_id: projectId,
        platform: record.platform,
        prompt: record.prompt,
        response: record.response,
        mentioned: record.mentioned,
        citation_url: record.citation || null,
      });
      if (error)
        toast({
          title: "Evidência não salva",
          description: error.message,
          variant: "destructive",
        });
    }
    setResponsePrompt("");
    setResponseText("");
    setResponseCitation("");
    setResponseMentioned(false);
  };
  const visibility = responseRecords.length
    ? Math.round(
        (responseRecords.filter((item) => item.mentioned).length /
          responseRecords.length) *
          100,
      )
    : null;
  const citationRate = responseRecords.length
    ? Math.round(
        (responseRecords.filter((item) => item.citation).length /
          responseRecords.length) *
          100,
      )
    : null;
  const requestMagicLink = async () => {
    if (!userEmail.trim()) return;
    const { error } = await supabase.auth.signInWithOtp({
      email: userEmail.trim(),
      options: { emailRedirectTo: window.location.href },
    });
    if (error)
      toast({
        title: "Não foi possível enviar o acesso",
        description: error.message,
        variant: "destructive",
      });
    else
      toast({
        title: "Link enviado",
        description:
          "Confira seu e-mail para ativar a persistência da agência.",
      });
  };

  // The home page is the only entry point: with nothing to show, go there.
  if (
    isHydrated &&
    !result &&
    !loading &&
    !initialUrl &&
    !diagnosedSite &&
    !lastGeoCrawlKey()
  ) {
    return <Navigate to="/" replace />;
  }

  const subscores: [string, number, string][] = result
    ? [
        ["GEO", result.scores.geo, "Presença em mecanismos generativos"],
        ["AEO", result.scores.aeo, "Capacidade de responder perguntas"],
        ["Técnico", result.scores.technical, "Saúde estrutural do domínio"],
        ["Autoridade", result.scores.authority, "Sinais de autoridade do domínio"],
      ]
    : [];
  const statLabels: Record<string, string> = {
    pages: "Páginas",
    indexedPages: "Indexáveis",
    schemaPages: "Com schema",
    answerPages: "Prontas para resposta",
    words: "Palavras",
  };
  const eyebrow = "text-xs font-bold uppercase tracking-widest text-primary";

  return (
    <div className="min-h-screen bg-secondary/40">
      <AppHeader />
      <main className="container max-w-6xl space-y-8 py-10 md:py-12">
        <section className="flex flex-wrap items-end justify-between gap-7">
          <div className="motion-enter min-w-0 flex-1 basis-96 space-y-2.5">
            <p className={eyebrow}>Agent Crawl · GEO/AEO</p>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
              Descubra se sua marca é encontrada e citada por IAs.
            </h1>
            <p className="max-w-xl text-muted-foreground">
              Um crawl profissional para GEO (Generative Engine Optimization) e
              AEO (Answer Engine Optimization), com recomendações que sua equipe
              pode executar.
            </p>
          </div>
          <Card
            className="motion-card flex-1 basis-96 border-border bg-card p-2"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <form onSubmit={runCrawl} className="flex flex-col gap-2 sm:flex-row">
              <div className="flex flex-1 items-center gap-2 px-3">
                <Globe2 className="h-4 w-4 text-muted-foreground" />
                <Input
                  aria-label="Endereço do site"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="suaempresa.com.br"
                  className="border-0 bg-transparent focus-visible:ring-0"
                  required
                  disabled={loading}
                />
              </div>
              <Button type="submit" size="lg" variant="hero" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rastreando
                    site...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" /> Executar Agent Crawl
                  </>
                )}
              </Button>
            </form>
          </Card>
        </section>

        {!userId && (
          <Card className="hidden border-primary/20 bg-primary/5 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="font-medium">Salve os projetos da sua agência</p>
                <p className="text-xs text-muted-foreground">
                  Entre com seu e-mail para manter históricos e evidências
                  isolados por usuário.
                </p>
              </div>
              <div className="flex gap-2">
                <Input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
                <Button variant="outline" onClick={requestMagicLink}>
                  Enviar acesso
                </Button>
              </div>
            </div>
          </Card>
        )}

        {loading && (
          <Card className="motion-enter border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>{crawlStage}</span>
            </div>
            <Progress
              value={
                crawlStage.includes("Consolidando")
                  ? 90
                  : crawlStage.includes("Descobrindo")
                    ? 45
                    : 15
              }
              className="mt-3 h-1.5"
            />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              O agente analisa até 12 páginas do domínio e ignora falhas
              isoladas.
            </p>
          </Card>
        )}

        {result && (
          <div className="motion-stagger space-y-8">
            <Card className="motion-card flex flex-wrap items-center gap-9 border-border bg-card p-6 shadow-sm md:p-8">
              <div className="flex min-w-0 flex-1 basis-96 items-center gap-6">
                <ScoreRing label="Score geral de prontidão" score={overall} size={132} />
                <div className="min-w-0 space-y-1">
                  <span className={eyebrow}>Prontidão digital</span>
                  <h2 className="break-all text-2xl font-extrabold tracking-tight">
                    {result.domain}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Atualizado em{" "}
                    {new Date(result.crawledAt).toLocaleString("pt-BR")} ·{" "}
                    {result.stats.pages} páginas avaliadas
                  </p>
                </div>
              </div>
              <div className="grid flex-1 basis-[32rem] grid-cols-2 gap-3 lg:grid-cols-4">
                {subscores.map(([label, value, description]) => (
                  <div
                    key={label}
                    className="flex flex-col gap-2 rounded-xl border border-border bg-muted/30 p-4"
                  >
                    <span className="text-sm font-bold">{label}</span>
                    <span
                      className={`text-3xl font-extrabold leading-none ${scoreColor(value)}`}
                    >
                      {value}
                      <span className="text-sm font-semibold text-muted-foreground">
                        /100
                      </span>
                    </span>
                    <Progress value={value} className="h-1.5" />
                    <span className="text-xs leading-snug text-muted-foreground">
                      {description}
                    </span>
                  </div>
                ))}
              </div>
            </Card>

            <section className="space-y-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 className="text-2xl font-extrabold tracking-tight">
                  Recomendações prioritárias
                </h2>
                <span className="text-sm text-muted-foreground">
                  Ações com maior impacto nesta análise
                </span>
              </div>
              <div className="motion-stagger grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {prioritizedFindings.map((finding, index) => (
                  <Card
                    key={`${finding.title}-${index}`}
                    className="motion-card flex flex-col gap-3 border-border bg-card p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-bold">{finding.title}</p>
                      <Badge
                        variant="outline"
                        className={`shrink-0 ${severityClass(finding.severity)}`}
                      >
                        {severityLabel(finding.severity)}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {finding.description}
                    </p>
                    <p className="mt-auto border-t border-border pt-3 text-sm font-semibold text-primary">
                      {finding.recommendation}
                    </p>
                  </Card>
                ))}
                <Card className="motion-card flex flex-col gap-3 border-border bg-card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="font-bold">Visibilidade por mecanismo</p>
                    <Badge
                      variant="outline"
                      className={`shrink-0 ${severityClass(robotsApproved ? "passed" : "warning")}`}
                    >
                      {robotsApproved ? "Aprovado" : "Atenção"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {robotsCardDescription}
                  </p>
                  {robotsVisibility.robotsUrl && (
                    <a
                      href={robotsVisibility.robotsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block break-all text-xs text-primary underline"
                    >
                      robots.txt
                    </a>
                  )}
                  <p className="mt-auto border-t border-border pt-3 text-sm font-semibold text-primary">
                    {robotsRecommendation}
                  </p>
                  {contentSignalSummary && (
                    <p className="text-xs text-muted-foreground">
                      {contentSignalSummary}
                    </p>
                  )}
                </Card>
              </div>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              {result.scoreBreakdown?.technical && (
                <Card className="motion-card flex flex-col gap-3.5 border-border bg-card p-6">
                  <h2 className="text-lg font-extrabold">
                    Como a pontuação foi calculada
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {result.scoreBreakdown.technical.formula}
                  </p>
                  <div className="flex flex-col text-sm">
                    {[
                      ["Base média das páginas", result.scoreBreakdown.technical.base],
                      ["Bônus robots.txt", result.scoreBreakdown.technical.robotsBonus],
                      ["Bônus sitemap.xml", result.scoreBreakdown.technical.sitemapBonus],
                      [
                        "Desconto por links quebrados",
                        result.scoreBreakdown.technical.brokenLinksPenalty,
                      ],
                    ].map(([label, value]) => (
                      <div
                        key={label as string}
                        className="flex justify-between border-t border-border py-2.5"
                      >
                        <span>{label as string}</span>
                        <strong>{value}</strong>
                      </div>
                    ))}
                  </div>
                  {result.scoreBreakdown.coverage && (
                    <p className="text-xs text-muted-foreground">
                      {result.scoreBreakdown.coverage.pagesCrawled} páginas
                      analisadas · {result.scoreBreakdown.coverage.sitemapUrls}{" "}
                      URLs encontradas no sitemap ·{" "}
                      {result.scoreBreakdown.coverage.brokenLinksChecked} links
                      verificados
                    </p>
                  )}
                </Card>
              )}

              <Card className="motion-card flex flex-col gap-3.5 border-border bg-card p-6">
                <h2 className="text-lg font-extrabold">Sinais encontrados</h2>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {Object.entries(result.stats).map(([key, value]) => (
                    <div key={key} className="rounded-xl bg-muted/50 p-3.5">
                      <div className="text-2xl font-extrabold">{value}</div>
                      <div className="text-xs text-muted-foreground">
                        {statLabels[key]}
                      </div>
                    </div>
                  ))}
                </div>
                <h3 className="mt-2 flex items-center gap-2 text-sm font-bold">
                  <Network className="h-4 w-4 text-primary" /> Entidades e tópicos
                </h3>
                {result.entities.length ? (
                  <div className="space-y-3">
                    {result.entities.slice(0, 6).map((entity) => (
                      <div key={entity.name}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span className="font-semibold">{entity.name}</span>
                          <span className="text-muted-foreground">
                            {entity.coverage}% · {entity.pages} pág.
                          </span>
                        </div>
                        <Progress value={entity.coverage} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Nenhuma entidade semântica detectada. Adicione conteúdo
                    topical e dados estruturados.
                  </p>
                )}
              </Card>
            </section>

            <Card className="motion-card overflow-hidden border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-5">
                <h2 className="text-lg font-extrabold">Score por página</h2>
                <Button onClick={exportReport} variant="outline">
                  <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                  Exportar CSV
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead>
                    <tr className="bg-muted/40 text-muted-foreground">
                      <th className="px-6 py-3 font-semibold">Página</th>
                      <th className="px-6 py-3 font-semibold">Título</th>
                      <th className="px-6 py-3 font-semibold">Score</th>
                      <th className="px-6 py-3 font-semibold">Alertas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.pages.map((page) => (
                      <tr key={page.url} className="border-t border-border">
                        <td className="max-w-[280px] truncate px-6 py-3.5 text-primary">
                          {page.url}
                        </td>
                        <td className="px-6 py-3.5">{page.title || "Sem título"}</td>
                        <td
                          className={`px-6 py-3.5 font-bold ${scoreColor(page.score)}`}
                        >
                          {page.score}
                        </td>
                        <td className="px-6 py-3.5 text-muted-foreground">
                          {page.issues.length || "Nenhuma"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default GeoAeoDashboard;
