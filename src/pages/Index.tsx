import { useState, FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Gauge, Sparkles, FileText, Globe, Eye } from "lucide-react";
import DocxPreview from "@/components/DocxPreview";

type Scores = { performance: number; accessibility: number; bestPractices: number; seo: number };
type Metrics = { fcp: string; lcp: string; tbt: string; cls: string; si: string };
type SideData = {
  scores: Scores;
  metrics: Metrics;
  screenshot?: string | null;
  opportunities?: { title: string; displayValue?: string }[];
};
type Improvement = {
  title: string;
  description?: string;
  problem?: string;
  impact?: string[];
  causes?: string[];
  recommendations?: string[];
};
type Result = {
  summary: { mobile: SideData; desktop: SideData; screenshot: string | null };
  improvements: Improvement[];
  uiux?: { overview?: string; diagnosis?: string[]; recommendations?: string[] } | null;
  extras?: { title: string; description: string }[];
  docx: string;
};

const scoreClass = (n: number) =>
  n >= 90 ? "text-success border-success" : n >= 50 ? "text-warning border-warning" : "text-destructive border-destructive";

function ScoreRing({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-16 h-16 rounded-full border-[3px] flex items-center justify-center font-bold text-xl ${scoreClass(value)}`}
      >
        {value}
      </div>
      <span className="text-xs text-muted-foreground text-center">{label}</span>
    </div>
  );
}

function ScoresGrid({ title, scores, metrics }: { title: string; scores: Scores; metrics: Metrics }) {
  return (
    <Card className="p-6 bg-card border-border">
      <h3 className="text-lg font-semibold mb-4 text-foreground">{title}</h3>
      <div className="grid grid-cols-4 gap-3 mb-6">
        <ScoreRing value={scores.performance} label="Desempenho" />
        <ScoreRing value={scores.accessibility} label="Acessibilidade" />
        <ScoreRing value={scores.bestPractices} label="Práticas" />
        <ScoreRing value={scores.seo} label="SEO" />
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        {Object.entries({ FCP: metrics.fcp, LCP: metrics.lcp, TBT: metrics.tbt, CLS: metrics.cls, SI: metrics.si }).map(([k, v]) => (
          <div key={k} className="flex justify-between border-b border-border py-1.5">
            <span className="text-muted-foreground">{k}</span>
            <span className="text-foreground font-medium">{v}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

const Index = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const { toast } = useToast();

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = "https://" + normalized;

    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("diagnose-site", { body: { url: normalized } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data as Result);
      toast({ title: "Diagnóstico pronto!", description: "Seu relatório foi gerado com sucesso." });
    } catch (err: any) {
      console.error(err);
      toast({ title: "Erro ao gerar diagnóstico", description: err.message ?? "Tente novamente", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const downloadDocx = () => {
    if (!result) return;
    const bin = atob(result.docx);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const host = (() => { try { return new URL(url.startsWith("http") ? url : "https://" + url).hostname.replace("www.", ""); } catch { return "site"; } })();
    a.download = `${host}_diagnostico.docx`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <main className="min-h-screen" style={{ background: "var(--gradient-hero)" }}>
      <div className="container max-w-5xl py-12 md:py-20">
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-xs text-muted-foreground mb-6">
            <Sparkles className="w-3 h-3 text-primary" /> Diagnóstico automático de sites
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            Cole o link.{" "}
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "var(--gradient-primary)" }}>
              Receba o relatório.
            </span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Performance (PageSpeed), análise visual da home e sugestões priorizadas — exportadas em .docx no padrão da agência.
          </p>
        </header>

        <Card className="p-2 bg-card border-border" style={{ boxShadow: "var(--shadow-card)" }}>
          <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center flex-1 px-3 gap-2">
              <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="exemplo.com.br"
                className="border-0 bg-transparent focus-visible:ring-0 text-base"
                disabled={loading}
                required
              />
            </div>
            <Button type="submit" size="lg" disabled={loading} variant="hero" className="font-semibold">
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analisando…</> : <><Gauge className="w-4 h-4 mr-2" /> Diagnosticar</>}
            </Button>
          </form>
        </Card>

        {loading && (
          <p className="text-center text-sm text-muted-foreground mt-6 animate-pulse">
            Rodando PageSpeed mobile + desktop e gerando análise com IA. Isso leva ~30-60s…
          </p>
        )}

        {result && (
          <section className="mt-10 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <ScoresGrid title="📱 Mobile" scores={result.summary.mobile.scores} metrics={result.summary.mobile.metrics} />
              <ScoresGrid title="💻 Desktop" scores={result.summary.desktop.scores} metrics={result.summary.desktop.metrics} />
            </div>

            {result.summary.screenshot && (
              <Card className="p-6 bg-card border-border">
                <h3 className="text-lg font-semibold mb-4 text-foreground">Screenshot mobile</h3>
                <img src={result.summary.screenshot} alt="Screenshot do site" className="max-h-96 mx-auto rounded-lg border border-border" />
              </Card>
            )}

            {result.improvements?.length > 0 && (
              <Card className="p-6 bg-card border-border">
                <h3 className="text-lg font-semibold mb-4 text-foreground flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" /> Sugestões de melhoria
                </h3>
                <ol className="space-y-4">
                  {result.improvements.map((imp, i) => (
                    <li key={i} className="border-l-2 border-primary pl-4">
                      <h4 className="font-semibold text-foreground">{i + 1}. {imp.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{imp.problem}</p>
                    </li>
                  ))}
                </ol>
              </Card>
            )}

            <div className="sticky bottom-4">
              <Button onClick={downloadDocx} size="lg" variant="hero" className="w-full font-semibold" style={{ boxShadow: "var(--shadow-glow)" }}>
                <Download className="w-5 h-5 mr-2" /> Baixar relatório .docx completo
              </Button>
            </div>
          </section>
        )}

        {!result && !loading && (
          <div className="grid sm:grid-cols-3 gap-4 mt-12">
            {[
              { icon: Gauge, title: "PageSpeed completo", desc: "Mobile + desktop, métricas Core Web Vitals e oportunidades." },
              { icon: Sparkles, title: "Análise visual com IA", desc: "Screenshot da home avaliada por IA com sugestões de UI/UX." },
              { icon: FileText, title: "Export .docx", desc: "Relatório no padrão da agência, pronto pra entregar ao cliente." },
            ].map(({ icon: Icon, title, desc }) => (
              <Card key={title} className="p-5 bg-card/50 border-border">
                <Icon className="w-5 h-5 text-primary mb-3" />
                <h4 className="font-semibold mb-1">{title}</h4>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default Index;
