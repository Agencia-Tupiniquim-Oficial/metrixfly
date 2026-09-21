import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { docxResponseToBlob, downloadBlob } from "@/lib/docx-download";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Download,
  FileSearch,
  Globe2,
  Loader2,
  Network,
  Plus,
  Search,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

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
    coverage?: { pagesCrawled: number; sitemapUrls: number; brokenLinksChecked: number };
  };
  visibility: {
    chatgpt: number | null;
    gemini: number | null;
    perplexity: number | null;
  };
  pages: Page[];
  findings: Finding[];
  entities: { name: string; coverage: number; pages: number }[];
  citations: { source: string; type: string; status: string }[];
};

const fallbackFindings: Finding[] = [
  {
    severity: "warning",
    title: "Configure seus prompts de monitoramento",
    description:
      "A visibilidade em ChatGPT, Gemini e Perplexity precisa de consultas definidas para ser medida.",
    recommendation:
      "Adicione perguntas reais dos seus clientes e rode o monitoramento semanalmente.",
  },
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
    ? "text-emerald-600"
    : score >= 50
      ? "text-amber-600"
      : "text-red-600";
}

function severityLabel(severity: Finding["severity"]) {
  return severity === "critical" ? "Crítico" : severity === "warning" ? "Atenção" : "Aprovado";
}

function severityClass(severity: Finding["severity"]) {
  return severity === "critical"
    ? "border-red-200 bg-red-50 text-red-700"
    : severity === "warning"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: typeof Bot;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className="h-4 w-4 text-primary" />
      </div>
      <div className={`mt-3 text-4xl font-bold ${scoreColor(value)}`}>
        {value}
        <span className="text-base font-normal text-muted-foreground">
          /100
        </span>
      </div>
      <Progress value={value} className="mt-3 h-2" />
    </Card>
  );
}

const GeoAeoDashboard = () => {
  const location = useLocation();
  const initialUrl =
    typeof location.state?.url === "string" ? location.state.url : "";
  const [url, setUrl] = useState(initialUrl);
  const [loading, setLoading] = useState(false);
  const [crawlStage, setCrawlStage] = useState("Preparando o rastreamento...");
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitor, setCompetitor] = useState("");
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

  const runCrawl = async (event?: FormEvent) => {
    event?.preventDefault();
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
    setCrawlStage("Verificando robots.txt e sitemap.xml...");
    let stageTimer: number | undefined;
    try {
      stageTimer = window.setTimeout(() => setCrawlStage("Descobrindo páginas importantes..."), 1200);
      const { data, error } = await supabase.functions.invoke("geo-aeo-crawl", {
        body: { url: normalized },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCrawlStage("Consolidando recomendações...");
      const crawl = data as CrawlResult;
      setResult(crawl);
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
    if (initialUrl && !result && !loading) {
      void runCrawl();
    }
  }, [initialUrl]);

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
        if (!diagnosisData?.summary?.mobile || !diagnosisData?.summary?.desktop) {
          throw new Error("O diagnóstico PageSpeed não retornou as duas estratégias.");
        }

        const { data: docData, error: docErr } =
          await supabase.functions.invoke("diagnose-site", {
            body: {
              docxOnly: true,
              url: normalized,
              mobile: diagnosisData.summary.mobile,
              desktop: diagnosisData.summary.desktop,
              ai: {
                improvements: diagnosisData.improvements ?? [],
                uiux: diagnosisData.uiux ?? null,
                extras: diagnosisData.extras ?? [],
                geo: { ...crawl, prompts },
              },
            },
          });
        if (docErr) throw docErr;
        const blob = docxResponseToBlob(docData);
        downloadBlob(blob, `${crawl.domain}_relatorio_completo.docx`);
        toast({
          title: "Relatório completo pronto",
          description: "Download iniciado.",
        });
      } catch (e: any) {
        console.error(e);
        toast({
          title: "Erro ao gerar .docx",
          description: e?.message ?? String(e),
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
  const prioritizedFindings = useMemo(
    () =>
      [...(result?.findings ?? []), ...fallbackFindings]
        .sort((a, b) => Number(b.severity === "critical") - Number(a.severity === "critical"))
        .slice(0, 6),
    [result],
  );
  const addPrompt = async () => {
    const value = prompt.trim();
    if (!value || prompts.includes(value)) return;
    setPrompts((current) => [...current, value]);
    setPrompt("");
    if (projectId) {
      const { error } = await supabase
        .from("geo_prompts")
        .insert({ project_id: projectId, prompt: value });
      if (error)
        toast({
          title: "Prompt não salvo",
          description: error.message,
          variant: "destructive",
        });
    }
  };
  const addCompetitor = async () => {
    const value = competitor.trim();
    if (!value || competitors.includes(value)) return;
    setCompetitors((current) => [...current, value]);
    setCompetitor("");
    if (projectId) {
      const { error } = await supabase
        .from("geo_competitors")
        .insert({ project_id: projectId, domain: value });
      if (error)
        toast({
          title: "Concorrente não salvo",
          description: error.message,
          variant: "destructive",
        });
    }
  };
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

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="border-b bg-white">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Diagnóstico técnico
            </Link>
            <Link
              to="/geo-admin"
              className="text-sm text-primary hover:underline"
            >
              Administração
            </Link>
          </div>
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5 text-primary" /> Agent Crawl{" "}
            <span className="text-muted-foreground font-normal">GEO/AEO</span>
          </div>
          <Badge variant="secondary">BETA</Badge>
        </div>
      </header>
      <div className="container py-8 md:py-12">
        <div className="max-w-3xl">
          <p className="mb-3 text-sm font-medium text-primary">
            VISIBILIDADE EM BUSCA E IA
          </p>
          <h1 className="text-3xl font-bold tracking-tight md:text-5xl">
            Descubra se sua marca é encontrada e citada por IAs.
          </h1>
          <p className="mt-4 text-muted-foreground">
            Um crawl profissional para GEO (Generative Engine Optimization) e
            AEO (Answer Engine Optimization), com recomendações que sua equipe
            pode executar.
          </p>
        </div>
        <Card className="mt-8 p-2 shadow-sm">
          <form onSubmit={runCrawl} className="flex flex-col gap-2 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 px-3">
              <Globe2 className="h-4 w-4 text-muted-foreground" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="suaempresa.com.br"
                className="border-0 focus-visible:ring-0"
                required
                disabled={loading}
              />
            </div>
            <Button type="submit" size="lg" disabled={loading}>
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
        {!userId && (
          <Card className="mt-4 border-primary/20 bg-primary/5 p-4 hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex-1">
                <p className="font-medium">Salve os projetos da sua agência</p>
                <p className="text-xs text-muted-foreground">
                  Entre com seu e-mail para manter históricos, prompts e
                  evidências isolados por usuário.
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
          <Card className="mt-4 border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              <span>{crawlStage}</span>
            </div>
            <Progress value={crawlStage.includes("Consolidando") ? 90 : crawlStage.includes("Descobrindo") ? 45 : 15} className="mt-3 h-1.5" />
            <p className="mt-2 text-center text-xs text-muted-foreground">
              O agente analisa até 12 páginas do domínio e ignora falhas isoladas.
            </p>
          </Card>
        )}
        {!result && !loading && (
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {[
              [
                Bot,
                "Visibility Score",
                "Mede presença e prontidão para mecanismos generativos.",
              ],
              [
                Network,
                "Entity & Topic Graph",
                "Encontra entidades, tópicos e cobertura semântica.",
              ],
              [
                Target,
                "Plano de ação",
                "Prioriza melhorias por impacto e esforço estimado.",
              ],
            ].map(([Icon, title, text]) => (
              <Card key={title as string} className="p-5">
                <Icon className="mb-3 h-5 w-5 text-primary" />
                <h3 className="font-semibold">{title as string}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {text as string}
                </p>
              </Card>
            ))}
          </div>
        )}
        {result && (
          <section className="mt-10 space-y-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm text-muted-foreground">
                  Relatório de {result.domain}
                </p>
                <h2 className="text-2xl font-bold">Resumo executivo</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={exportReport}>
                  <Download className="mr-2 h-4 w-4" /> CSV
                </Button>
                <Badge variant="outline">
                  Atualizado{" "}
                  {new Date(result.crawledAt).toLocaleString("pt-BR")}
                </Badge>
              </div>
            </div>
            <div className="flex gap-1 overflow-x-auto rounded-lg border bg-white p-1 text-sm">
              {[
                "Overview",
                "Prompt Intelligence",
                "Crawl técnico",
                "Concorrentes",
              ].map((tab, index) => (
                <a
                  key={tab}
                  href={`#geo-${index}`}
                  className="whitespace-nowrap rounded-md px-3 py-2 font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {tab}
                </a>
              ))}
            </div>
            <Card className="overflow-hidden border-slate-200 shadow-sm">
              <div className="flex flex-col justify-between gap-6 p-6 sm:flex-row sm:items-center">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                    Relatório de auditoria
                  </p>
                  <h2 className="mt-2 text-2xl font-bold tracking-tight">
                    {result.domain}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Última análise em{" "}
                    {new Date(result.crawledAt).toLocaleDateString("pt-BR")} ·{" "}
                    {result.stats.pages} páginas avaliadas
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`text-5xl font-bold ${scoreColor(overall)}`}>{overall}</div>
                  <div className="text-sm text-muted-foreground">
                    <div className="font-medium text-foreground">Score geral</div>
                    <div>de prontidão digital</div>
                  </div>
                </div>
              </div>
            </Card>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["GEO", result.scores.geo, "Presença em mecanismos generativos"],
                ["AEO", result.scores.aeo, "Capacidade de responder perguntas"],
                ["Técnico", result.scores.technical, "Saúde estrutural do domínio"],
              ].map(([label, value, description]) => (
                <Card key={label as string} className="border-slate-200 p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-sm font-semibold">{label as string}</div>
                      <p className="mt-1 text-xs text-muted-foreground">{description as string}</p>
                    </div>
                    <span className={`text-2xl font-bold ${scoreColor(value as number)}`}>{value}</span>
                  </div>
                  <Progress value={value as number} className="mt-4 h-1.5" />
                </Card>
              ))}
            </div>
            <Card className="border-slate-200 p-6 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">Recomendações prioritárias</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Ações com maior impacto identificadas nesta análise.
                  </p>
                </div>
                <Badge variant="outline">{prioritizedFindings.length} itens</Badge>
              </div>
              <div className="mt-5 grid gap-3 lg:grid-cols-2">
                {prioritizedFindings.map((finding, index) => (
                  <div key={`${finding.title}-${index}`} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex gap-3">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium">{finding.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{finding.description}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className={`shrink-0 ${severityClass(finding.severity)}`}>
                        {severityLabel(finding.severity)}
                      </Badge>
                    </div>
                    <p className="mt-3 border-t pt-3 text-sm text-primary">{finding.recommendation}</p>
                  </div>
                ))}
              </div>
            </Card>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="GEO Score" value={result.scores.geo} icon={Bot} />
              <Metric
                label="AEO Score"
                value={result.scores.aeo}
                icon={Target}
              />
              <Metric
                label="Técnico"
                value={result.scores.technical}
                icon={FileSearch}
              />
              <Metric
                label="Autoridade"
                value={result.scores.authority}
                icon={TrendingUp}
              />
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-20 w-20 items-center justify-center rounded-full border-8 border-primary/20 text-3xl font-bold ${scoreColor(overall)}`}
                  >
                    {overall}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      Score geral de prontidão
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Baseado em {result.stats.pages} páginas rastreadas e
                      sinais públicos do domínio.
                    </p>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  {Object.entries(result.stats).map(([key, value]) => (
                    <div key={key} className="rounded-lg bg-muted/50 p-3">
                      <div className="text-xl font-semibold">{value}</div>
                      <div className="text-xs text-muted-foreground">
                        {
                          (
                            {
                              pages: "Páginas",
                              indexedPages: "Indexáveis",
                              schemaPages: "Com schema",
                              answerPages: "Prontas para resposta",
                              words: "Palavras",
                            } as Record<string, string>
                          )[key]
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold">Visibilidade por mecanismo</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Configure prompts para ativar o monitoramento.
                </p>
                <div className="mt-5 space-y-4">
                  {[
                    ["ChatGPT", result.visibility.chatgpt],
                    ["Gemini", result.visibility.gemini],
                    ["Perplexity", result.visibility.perplexity],
                  ].map(([name, value]) => (
                    <div
                      key={name as string}
                      className="flex items-center justify-between border-b pb-3"
                    >
                      <span>{name as string}</span>
                      <span className="font-semibold text-muted-foreground">
                        {value == null ? "Não monitorado" : `${value}/100`}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
            {result.scoreBreakdown?.technical && (
              <Card className="p-6">
                <h3 className="font-semibold">Como a pontuação foi calculada</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {result.scoreBreakdown.technical.formula}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  {[
                    ["Base média", result.scoreBreakdown.technical.base],
                    ["Bônus robots.txt", result.scoreBreakdown.technical.robotsBonus],
                    ["Bônus sitemap.xml", result.scoreBreakdown.technical.sitemapBonus],
                    ["Desconto por links quebrados", result.scoreBreakdown.technical.brokenLinksPenalty],
                  ].map(([label, value]) => (
                    <div key={label as string} className="rounded-lg bg-muted/50 p-3">
                      <div className="text-lg font-semibold">{value}</div>
                      <div className="text-xs text-muted-foreground">{label as string}</div>
                    </div>
                  ))}
                </div>
                {result.scoreBreakdown.coverage && (
                  <p className="mt-4 text-xs text-muted-foreground">
                    {result.scoreBreakdown.coverage.pagesCrawled} páginas analisadas ·{" "}
                    {result.scoreBreakdown.coverage.sitemapUrls} URLs encontradas no sitemap ·{" "}
                    {result.scoreBreakdown.coverage.brokenLinksChecked} links verificados
                  </p>
                )}
              </Card>
            )}
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <CircleAlert className="h-4 w-4 text-amber-500" />{" "}
                  Oportunidades prioritárias
                </h3>
                <div className="space-y-4">
                  {[...result.findings, ...fallbackFindings]
                    .slice(0, 5)
                    .map((finding, index) => (
                      <div
                        key={`${finding.title}-${index}`}
                        className="flex gap-3 border-b pb-4 last:border-0 last:pb-0"
                      >
                        {finding.severity === "passed" ? (
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        ) : (
                          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        )}
                        <div>
                          <p className="font-medium">{finding.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {finding.description}
                          </p>
                          <p className="mt-2 text-sm text-primary">
                            {finding.recommendation}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </Card>
              <Card className="p-6">
                <h3 className="mb-4 flex items-center gap-2 font-semibold">
                  <Network className="h-4 w-4 text-primary" /> Entidades e
                  tópicos
                </h3>
                {result.entities.length ? (
                  <div className="space-y-4">
                    {result.entities.slice(0, 6).map((entity) => (
                      <div key={entity.name}>
                        <div className="mb-1 flex justify-between text-sm">
                          <span>{entity.name}</span>
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
                <Button variant="outline" className="mt-6 w-full">
                  Ver mapa de tópicos{" "}
                  <ChevronRight className="ml-auto h-4 w-4" />
                </Button>
              </Card>
            </div>
            <Card className="p-6">
              <h3 className="mb-4 font-semibold">Score por página</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b text-muted-foreground">
                      <th className="pb-3">Página</th>
                      <th className="pb-3">Título</th>
                      <th className="pb-3">Score</th>
                      <th className="pb-3">Alertas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.pages.map((page) => (
                      <tr key={page.url} className="border-b last:border-0">
                        <td className="max-w-[280px] truncate py-3 text-primary">
                          {page.url}
                        </td>
                        <td className="py-3">{page.title || "Sem título"}</td>
                        <td
                          className={`py-3 font-semibold ${scoreColor(page.score)}`}
                        >
                          {page.score}
                        </td>
                        <td className="py-3 text-muted-foreground">
                          {page.issues.length || "Nenhuma"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
            <div id="geo-1" className="grid gap-6 lg:grid-cols-2">
              <Card className="p-6">
                <h3 className="flex items-center gap-2 font-semibold">
                  <Bot className="h-4 w-4 text-primary" /> Prompt Intelligence
                </h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cadastre perguntas reais para acompanhar visibilidade,
                  menções, posição e citações. A execução automática exige uma
                  integração autorizada com cada mecanismo.
                </p>
                <div className="mt-4 flex gap-2">
                  <Input
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addPrompt()}
                    placeholder="ex.: melhor agência de SEO para e-commerce"
                  />
                  <Button onClick={addPrompt} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                {prompts.length ? (
                  <div className="mt-4 space-y-2">
                    {prompts.map((item) => (
                      <div
                        key={item}
                        className="rounded-md bg-muted/50 p-3 text-sm"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                ) : null}
              </Card>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <Button
                onClick={() => runCrawlAndReport()}
                className="bg-emerald-600 text-white"
                disabled={loading}
              >
                Gerar relatório completo
              </Button>
              <Button onClick={exportReport} variant="outline">
                Exportar CSV
              </Button>
            </div>
          </section>
        )}
      </div>
    </main>
  );
};

export default GeoAeoDashboard;
