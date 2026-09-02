import { FormEvent, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Bot, CheckCircle2, ChevronRight, CircleAlert, Download, FileSearch,
  Globe2, Loader2, Network, Plus, Search, Sparkles, Target, TrendingUp,
} from "lucide-react";

type Page = { url: string; title: string; score: number; issues: string[] };
type Finding = { severity: "critical" | "warning" | "passed"; title: string; description: string; recommendation: string };
type CrawlResult = {
  domain: string;
  crawledAt: string;
  scores: { geo: number; aeo: number; technical: number; authority: number };
  stats: { pages: number; indexedPages: number; schemaPages: number; answerPages: number; words: number };
  technicalDetails?: { robots: boolean; sitemap: boolean; llmsTxt: boolean; noindexPages: number; canonicalPages: number; images: number; imagesWithoutAlt: number; internalLinks: number };
  visibility: { chatgpt: number | null; gemini: number | null; perplexity: number | null };
  pages: Page[];
  findings: Finding[];
  entities: { name: string; coverage: number; pages: number }[];
  citations: { source: string; type: string; status: string }[];
};

const fallbackFindings: Finding[] = [
  { severity: "warning", title: "Configure seus prompts de monitoramento", description: "A visibilidade em ChatGPT, Gemini e Perplexity precisa de consultas definidas para ser medida.", recommendation: "Adicione perguntas reais dos seus clientes e rode o monitoramento semanalmente." },
  { severity: "passed", title: "Crawler pronto para análise", description: "O agente coleta sinais técnicos, semânticos e de respostas diretamente do domínio.", recommendation: "Use o plano de ação abaixo para priorizar as correções." },
];

function scoreColor(score: number) {
  return score >= 80 ? "text-emerald-600" : score >= 50 ? "text-amber-600" : "text-red-600";
}

function Metric({ label, value, icon: Icon }: { label: string; value: number; icon: typeof Bot }) {
  return <Card className="p-5"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{label}</span><Icon className="h-4 w-4 text-primary" /></div><div className={`mt-3 text-4xl font-bold ${scoreColor(value)}`}>{value}<span className="text-base font-normal text-muted-foreground">/100</span></div><Progress value={value} className="mt-3 h-2" /></Card>;
}

const GeoAeoDashboard = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CrawlResult | null>(null);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [prompt, setPrompt] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitor, setCompetitor] = useState("");
  const { toast } = useToast();

  const runCrawl = async (event: FormEvent) => {
    event.preventDefault();
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = `https://${normalized}`;
    try { new URL(normalized); } catch { toast({ title: "URL inválida", description: "Informe um domínio válido.", variant: "destructive" }); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("geo-aeo-crawl", { body: { url: normalized } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as CrawlResult);
    } catch (error) {
      console.error(error);
      toast({ title: "Não foi possível rastrear o site", description: error instanceof Error ? error.message : "Verifique o domínio e tente novamente.", variant: "destructive" });
    } finally { setLoading(false); }
  };

  const overall = useMemo(() => result ? Math.round((result.scores.geo + result.scores.aeo + result.scores.technical + result.scores.authority) / 4) : 0, [result]);
  const addPrompt = () => { const value = prompt.trim(); if (value && !prompts.includes(value)) setPrompts(current => [...current, value]); setPrompt(""); };
  const addCompetitor = () => { const value = competitor.trim(); if (value && !competitors.includes(value)) setCompetitors(current => [...current, value]); setCompetitor(""); };
  const exportReport = () => {
    if (!result) return;
    const rows = [["URL", "Título", "Score", "Alertas"], ...result.pages.map(page => [page.url, page.title, String(page.score), page.issues.join("; ")])];
    const blob = new Blob([rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(",")).join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${result.domain}-geo-aeo.csv`; link.click(); URL.revokeObjectURL(link.href);
  };

  return <main className="min-h-screen bg-slate-50">
    <header className="border-b bg-white">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Diagnóstico técnico</Link>
        <div className="flex items-center gap-2 font-semibold"><Sparkles className="h-5 w-5 text-primary" /> Agent Crawl <span className="text-muted-foreground font-normal">GEO/AEO</span></div>
        <Badge variant="secondary">BETA</Badge>
      </div>
    </header>
    <div className="container py-8 md:py-12">
      <div className="max-w-3xl">
        <p className="mb-3 text-sm font-medium text-primary">VISIBILIDADE EM BUSCA E IA</p>
        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Descubra se sua marca é encontrada e citada por IAs.</h1>
        <p className="mt-4 text-muted-foreground">Um crawl profissional para GEO (Generative Engine Optimization) e AEO (Answer Engine Optimization), com recomendações que sua equipe pode executar.</p>
      </div>
      <Card className="mt-8 p-2 shadow-sm">
        <form onSubmit={runCrawl} className="flex flex-col gap-2 sm:flex-row">
          <div className="flex flex-1 items-center gap-2 px-3"><Globe2 className="h-4 w-4 text-muted-foreground" /><Input value={url} onChange={e => setUrl(e.target.value)} placeholder="suaempresa.com.br" className="border-0 focus-visible:ring-0" required disabled={loading} /></div>
          <Button type="submit" size="lg" disabled={loading}>{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Rastreando site...</> : <><Search className="mr-2 h-4 w-4" /> Executar Agent Crawl</>}</Button>
        </form>
      </Card>
      {loading && <p className="mt-4 text-center text-sm text-muted-foreground animate-pulse">Analisando páginas, entidades, dados estruturados, respostas e fontes...</p>}
      {!result && !loading && <div className="mt-10 grid gap-4 md:grid-cols-3">{[
        [Bot, "Visibility Score", "Mede presença e prontidão para mecanismos generativos."],
        [Network, "Entity & Topic Graph", "Encontra entidades, tópicos e cobertura semântica."],
        [Target, "Plano de ação", "Prioriza melhorias por impacto e esforço estimado."],
      ].map(([Icon, title, text]) => <Card key={title as string} className="p-5"><Icon className="mb-3 h-5 w-5 text-primary" /><h3 className="font-semibold">{title as string}</h3><p className="mt-1 text-sm text-muted-foreground">{text as string}</p></Card>)}</div>}
      {result && <section className="mt-10 space-y-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-sm text-muted-foreground">Relatório de {result.domain}</p><h2 className="text-2xl font-bold">Resumo executivo</h2></div><div className="flex items-center gap-2"><Button variant="outline" size="sm" onClick={exportReport}><Download className="mr-2 h-4 w-4" /> CSV</Button><Badge variant="outline">Atualizado {new Date(result.crawledAt).toLocaleString("pt-BR")}</Badge></div></div>
        <div className="flex gap-1 overflow-x-auto rounded-lg border bg-white p-1 text-sm">
          {["Overview", "Prompt Intelligence", "Crawl técnico", "Concorrentes"].map((tab, index) => <a key={tab} href={`#geo-${index}`} className="whitespace-nowrap rounded-md px-3 py-2 font-medium text-muted-foreground hover:bg-muted hover:text-foreground">{tab}</a>)}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Metric label="GEO Score" value={result.scores.geo} icon={Bot} /><Metric label="AEO Score" value={result.scores.aeo} icon={Target} /><Metric label="Técnico" value={result.scores.technical} icon={FileSearch} /><Metric label="Autoridade" value={result.scores.authority} icon={TrendingUp} /></div>
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card className="p-6"><div className="flex items-center gap-3"><div className={`flex h-20 w-20 items-center justify-center rounded-full border-8 border-primary/20 text-3xl font-bold ${scoreColor(overall)}`}>{overall}</div><div><h3 className="text-lg font-semibold">Score geral de prontidão</h3><p className="text-sm text-muted-foreground">Baseado em {result.stats.pages} páginas rastreadas e sinais públicos do domínio.</p></div></div><div className="mt-6 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">{Object.entries(result.stats).map(([key, value]) => <div key={key} className="rounded-lg bg-muted/50 p-3"><div className="text-xl font-semibold">{value}</div><div className="text-xs text-muted-foreground">{({ pages: "Páginas", indexedPages: "Indexáveis", schemaPages: "Com schema", answerPages: "Prontas para resposta", words: "Palavras" } as Record<string, string>)[key]}</div></div>)}</div></Card>
          <Card className="p-6"><h3 className="font-semibold">Visibilidade por mecanismo</h3><p className="mt-1 text-xs text-muted-foreground">Configure prompts para ativar o monitoramento.</p><div className="mt-5 space-y-4">{[["ChatGPT", result.visibility.chatgpt], ["Gemini", result.visibility.gemini], ["Perplexity", result.visibility.perplexity]].map(([name, value]) => <div key={name as string} className="flex items-center justify-between border-b pb-3"><span>{name as string}</span><span className="font-semibold text-muted-foreground">{value == null ? "Não monitorado" : `${value}/100`}</span></div>)}</div></Card>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6"><h3 className="mb-4 flex items-center gap-2 font-semibold"><CircleAlert className="h-4 w-4 text-amber-500" /> Oportunidades prioritárias</h3><div className="space-y-4">{[...result.findings, ...fallbackFindings].slice(0, 5).map((finding, index) => <div key={`${finding.title}-${index}`} className="flex gap-3 border-b pb-4 last:border-0 last:pb-0">{finding.severity === "passed" ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />}<div><p className="font-medium">{finding.title}</p><p className="mt-1 text-sm text-muted-foreground">{finding.description}</p><p className="mt-2 text-sm text-primary">{finding.recommendation}</p></div></div>)}</div></Card>
          <Card className="p-6"><h3 className="mb-4 flex items-center gap-2 font-semibold"><Network className="h-4 w-4 text-primary" /> Entidades e tópicos</h3>{result.entities.length ? <div className="space-y-4">{result.entities.slice(0, 6).map(entity => <div key={entity.name}><div className="mb-1 flex justify-between text-sm"><span>{entity.name}</span><span className="text-muted-foreground">{entity.coverage}% · {entity.pages} pág.</span></div><Progress value={entity.coverage} /></div>)}</div> : <p className="text-sm text-muted-foreground">Nenhuma entidade semântica detectada. Adicione conteúdo topical e dados estruturados.</p>}<Button variant="outline" className="mt-6 w-full">Ver mapa de tópicos <ChevronRight className="ml-auto h-4 w-4" /></Button></Card>
        </div>
        <Card className="p-6"><h3 className="mb-4 font-semibold">Score por página</h3><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-muted-foreground"><th className="pb-3">Página</th><th className="pb-3">Título</th><th className="pb-3">Score</th><th className="pb-3">Alertas</th></tr></thead><tbody>{result.pages.map(page => <tr key={page.url} className="border-b last:border-0"><td className="max-w-[280px] truncate py-3 text-primary">{page.url}</td><td className="py-3">{page.title || "Sem título"}</td><td className={`py-3 font-semibold ${scoreColor(page.score)}`}>{page.score}</td><td className="py-3 text-muted-foreground">{page.issues.length || "Nenhuma"}</td></tr>)}</tbody></table></div></Card>
        <div id="geo-1" className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6"><h3 className="flex items-center gap-2 font-semibold"><Bot className="h-4 w-4 text-primary" /> Prompt Intelligence</h3><p className="mt-1 text-sm text-muted-foreground">Cadastre perguntas reais para acompanhar visibilidade, menções, posição e citações. A execução automática exige uma integração autorizada com cada mecanismo.</p><div className="mt-4 flex gap-2"><Input value={prompt} onChange={e => setPrompt(e.target.value)} onKeyDown={e => e.key === "Enter" && addPrompt()} placeholder="ex.: melhor agência de SEO para e-commerce" /><Button onClick={addPrompt} size="icon"><Plus className="h-4 w-4" /></Button></div>{prompts.length ? <div className="mt-4 space-y-2">{prompts.map(item => <div key={item} className="rounded-md bg-muted/50 p-3 text-sm">{item}<Badge className="ml-2" variant="secondary">Aguardando coleta</Badge></div>)}</div> : <p className="mt-4 text-xs text-muted-foreground">Sugestão: misture prompts de descoberta, comparação, preço, problemas e marca.</p>}</Card>
          <Card id="geo-3" className="p-6"><h3 className="flex items-center gap-2 font-semibold"><TrendingUp className="h-4 w-4 text-primary" /> Benchmark competitivo</h3><p className="mt-1 text-sm text-muted-foreground">Compare seu domínio com concorrentes nos mesmos prompts e descubra gaps de fontes e entidades.</p><div className="mt-4 flex gap-2"><Input value={competitor} onChange={e => setCompetitor(e.target.value)} onKeyDown={e => e.key === "Enter" && addCompetitor()} placeholder="concorrente.com.br" /><Button onClick={addCompetitor} size="icon"><Plus className="h-4 w-4" /></Button></div>{competitors.length ? <div className="mt-4 space-y-2">{competitors.map(item => <div key={item} className="flex justify-between rounded-md bg-muted/50 p-3 text-sm"><span>{item}</span><Badge variant="outline">Pronto para comparar</Badge></div>)}</div> : <p className="mt-4 text-xs text-muted-foreground">Adicione até 5 concorrentes para criar uma comparação orientada a evidências.</p>}</Card>
        </div>
        <Card id="geo-2" className="p-6"><h3 className="mb-4 flex items-center gap-2 font-semibold"><FileSearch className="h-4 w-4 text-primary" /> Checklist de crawl para agentes</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{Object.entries({ "robots.txt": result.technicalDetails?.robots, "sitemap.xml": result.technicalDetails?.sitemap, "llms.txt (experimental)": result.technicalDetails?.llmsTxt, "Canonicals": result.technicalDetails?.canonicalPages === result.pages.length, "Alt text": !result.technicalDetails?.imagesWithoutAlt, "Noindex": !result.technicalDetails?.noindexPages, "JSON-LD": result.stats.schemaPages > 0, "FAQ/conteúdo resposta": result.stats.answerPages > 0 }).map(([label, passed]) => <div key={label} className="flex items-center gap-2 rounded-lg border p-3 text-sm">{passed ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <CircleAlert className="h-4 w-4 text-amber-500" />}<span>{label}</span></div>)}</div><p className="mt-4 text-xs text-muted-foreground">`llms.txt` é exibido como experimento informativo; não é tratado como fator comprovado de ranking.</p></Card>
        <Card className="border-primary/20 bg-primary/5 p-6"><h3 className="font-semibold">Próximos módulos</h3><p className="mt-1 text-sm text-muted-foreground">O crawl técnico já está ativo. Para medir citações reais em modelos, adicione chaves de API e prompts monitorados no próximo passo.</p></Card>
      </section>}
    </div>
  </main>;
};

export default GeoAeoDashboard;
