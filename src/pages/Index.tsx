import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Download,
  Gauge,
  Sparkles,
  FileText,
  Globe,
  Eye,
  Pencil,
} from "lucide-react";
import DiagnosticPreview from "@/components/DiagnosticPreview";
import DiagnosticForm from "@/components/DiagnosticForm";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { docxResponseToBlob, downloadBlob } from "@/lib/docx-download";
import { downloadBusinessReport } from "@/lib/business-report";

type Scores = {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
};
type Metrics = {
  fcp: string;
  lcp: string;
  tbt: string;
  cls: string;
  si: string;
};
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
  uiux?: {
    overview?: string;
    diagnosis?: string[];
    recommendations?: string[];
  } | null;
  extras?: { title: string; description: string }[];
  docx: string;
  geo?: any;
};

async function getDiagnosticErrorMessage(error: unknown): Promise<string> {
  if (
    error instanceof Error &&
    error.message &&
    error.message !== "Edge Function returned a non-2xx status code"
  ) {
    return error.message;
  }

  const context =
    error && typeof error === "object" && "context" in error
      ? (error as { context?: unknown }).context
      : undefined;

  if (context instanceof Response) {
    try {
      const body = (await context.clone().json()) as { error?: string };
      if (body.error) return body.error;
    } catch {
      // The response may not contain JSON; keep the generic function error below.
    }
  }

  return error instanceof Error ? error.message : "Tente novamente";
}

const scoreClass = (n: number) =>
  n >= 90
    ? "text-success border-success"
    : n >= 50
      ? "text-warning border-warning"
      : "text-destructive border-destructive";

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

function ScoresGrid({
  title,
  scores,
  metrics,
}: {
  title: string;
  scores: Scores;
  metrics: Metrics;
}) {
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
        {Object.entries({
          FCP: metrics.fcp,
          LCP: metrics.lcp,
          TBT: metrics.tbt,
          CLS: metrics.cls,
          SI: metrics.si,
        }).map(([k, v]) => (
          <div
            key={k}
            className="flex justify-between border-b border-border py-1.5"
          >
            <span className="text-muted-foreground">{k}</span>
            <span className="text-foreground font-medium">{v}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

const Index = () => {
  const { diagnostic, setDiagnostic } = useDiagnosis();

  const [url, setUrl] = useState(diagnostic?.geo?.domain ?? "");
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(diagnostic ?? null);
  const [previewMode, setPreviewMode] = useState<"view" | "edit">("view");
  const [downloading, setDownloading] = useState(false);
  const [businessDownloading, setBusinessDownloading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const runDiagnostic = async (e: FormEvent) => {
    e.preventDefault();
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = "https://" + normalized;

    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("diagnose-site", {
        body: { url: normalized },
      });
      if (data?.error) throw new Error(data.error);
      if (error) throw error;
      setResult(data as Result);
      setDiagnostic(data as any);
      toast({
        title: "Diagnóstico pronto!",
        description: "Seu relatório foi gerado com sucesso.",
      });
    } catch (err: unknown) {
      console.error(err);
      toast({
        title: "Erro ao gerar diagnóstico",
        description: await getDiagnosticErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateImprovement = (
    index: number,
    field: keyof Improvement,
    value: string | string[],
  ) => {
    setResult(
      (current) =>
        current && {
          ...current,
          improvements: current.improvements.map((item, i) =>
            i === index ? { ...item, [field]: value } : item,
          ),
        },
    );

    // persist to context so it survives navigation
    setDiagnostic((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        improvements: prev.improvements.map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      } as any;
    });
  };

  const updateUiuxOverview = (value: string) => {
    setResult(
      (current) =>
        current && {
          ...current,
          uiux: { ...(current.uiux ?? {}), overview: value },
        },
    );

    setDiagnostic((prev) => {
      if (!prev) return prev;
      return { ...prev, uiux: { ...(prev.uiux ?? {}), overview: value } } as any;
    });
  };

  const updateUiuxField = (field: "diagnosis" | "recommendations", items: string[]) => {
    setResult((current) =>
      current && {
        ...current,
        uiux: { ...(current.uiux ?? {}), [field]: items },
      },
    );

    setDiagnostic((prev) => {
      if (!prev) return prev;
      return { ...prev, uiux: { ...(prev.uiux ?? {}), [field]: items } } as any;
    });
  };

  const updateOpportunities = (device: "desktop" | "mobile", items: string[]) => {
    setResult((current) =>
      current && {
        ...current,
        summary: {
          ...current.summary,
          ...(device === "desktop" ? { desktop: { ...(current.summary.desktop ?? {}), opportunities: items.map((t) => ({ title: t })) } } : {}),
          ...(device === "mobile" ? { mobile: { ...(current.summary.mobile ?? {}), opportunities: items.map((t) => ({ title: t })) } } : {}),
        },
      },
    );

    setDiagnostic((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        summary: {
          ...prev.summary,
          ...(device === "desktop" ? { desktop: { ...(prev.summary.desktop ?? {}), opportunities: items.map((t) => ({ title: t })) } } : {}),
          ...(device === "mobile" ? { mobile: { ...(prev.summary.mobile ?? {}), opportunities: items.map((t) => ({ title: t })) } } : {}),
        },
      } as any;
    });
  };

  const downloadDocx = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      const normalized = url.startsWith("http") ? url : "https://" + url;
      const { data, error } = await supabase.functions.invoke("diagnose-site", {
        body: {
          docxOnly: true,
          url: normalized,
          mobile: result.summary.mobile,
          desktop: result.summary.desktop,
          ai: {
            improvements: result.improvements,
            uiux: result.uiux,
            extras: result.extras,
          },
        },
      });
      if (error) throw error;
      const blob = docxResponseToBlob(data);
      const host = (() => {
        try {
          return new URL(
            url.startsWith("http") ? url : "https://" + url,
          ).hostname.replace("www.", "");
        } catch {
          return "site";
        }
      })();
      downloadBlob(blob, `${host}_diagnostico.docx`);
      toast({
        title: "Relatório pronto",
        description: "Download iniciado.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao baixar relatório",
        description: err instanceof Error ? err.message : "Não foi possível gerar o arquivo .docx.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const downloadClientReport = async () => {
    if (!result) return;
    setBusinessDownloading(true);
    try {
      const normalized = url.startsWith("http") ? url : `https://${url}`;
      const { data, error } = await supabase.functions.invoke("business-summary", {
        body: {
          url: normalized,
          scores: {
            mobile: result.summary.mobile.scores,
            desktop: result.summary.desktop.scores,
          },
          metrics: {
            mobile: result.summary.mobile.metrics,
            desktop: result.summary.desktop.metrics,
          },
          improvements: result.improvements,
        },
      });
      if (error) throw error;
      if (
        !data?.resumo ||
        !data.contexto ||
        !Array.isArray(data.impactoNegocio) ||
        !Array.isArray(data.prioridades) ||
        !data.proximoPasso
      ) {
        throw new Error("A função não retornou um resumo válido.");
      }
      await downloadBusinessReport(normalized, data);
      toast({
        title: "Relatório para cliente pronto",
        description: "Download iniciado.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao gerar relatório para cliente",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível gerar o relatório simplificado.",
        variant: "destructive",
      });
    } finally {
      setBusinessDownloading(false);
    }
  };

  const openGeoDashboard = (crawlResult?: any) => {
    if (crawlResult) {
      navigate("/geo-aeo", {
        state: { fromDiagnosis: true, crawl: crawlResult },
      });
    } else {
      navigate("/geo-aeo");
    }
  };

  const runGeoCrawl = async (event: FormEvent) => {
    event.preventDefault();

    const normalized = url.trim().startsWith("http")
      ? url.trim()
      : `https://${url.trim()}`;

    if (!url.trim()) {
      toast({
        title: "Preencha a URL",
        description: "Informe a URL que deseja analisar antes de abrir Geo/AEO.",
        variant: "destructive",
      });
      return;
    }

    setGeoLoading(true);

    try {
      navigate("/geo-aeo", { state: { url: normalized } });
    } finally {
      setGeoLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--gradient-hero)" }}
    >
      <div className="container max-w-5xl py-12 md:py-20">
        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border text-xs text-muted-foreground mb-6">
            <Sparkles className="w-3 h-3 text-primary" /> Diagnóstico automático
            de sites
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
            Cole o link.{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "var(--gradient-primary)" }}
            >
              Receba o relatório.
            </span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Performance (PageSpeed), análise visual da home e sugestões
            priorizadas — exportadas em .docx.
          </p>
        </header>

        <DiagnosticForm
          url={url}
          setUrl={setUrl}
          onSubmit={runDiagnostic}
          loading={loading}
          runGeoCrawl={runGeoCrawl}
          geoLoading={geoLoading}
        />

        {loading && (
          <p className="text-center text-sm text-muted-foreground mt-6 animate-pulse">
            Rodando PageSpeed mobile + desktop e gerando análise com IA. Isso
            leva ~30-60s…
          </p>
        )}

        {result && (
          <section className="mt-10 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <ScoresGrid
                title="📱 Mobile"
                scores={result.summary.mobile.scores}
                metrics={result.summary.mobile.metrics}
              />
              <ScoresGrid
                title="💻 Desktop"
                scores={result.summary.desktop.scores}
                metrics={result.summary.desktop.metrics}
              />
            </div>

            {result.summary.screenshot && (
              <Card className="p-6 bg-card border-border">
                <h3 className="text-lg font-semibold mb-4 text-foreground">
                  Screenshot mobile
                </h3>
                <a href={result.summary.screenshot} target="_blank" rel="noopener noreferrer">
                  <img
                    src={result.summary.screenshot}
                    alt="Screenshot do site"
                    className="max-h-96 mx-auto rounded-lg border border-border"
                    style={{ cursor: "zoom-in" }}
                  />
                </a>
              </Card>
            )}


            <DiagnosticPreview
              url={url.startsWith("http") ? url : "https://" + url}
              result={result}
              previewMode={previewMode}
              setPreviewMode={setPreviewMode}
              updateImprovement={updateImprovement}
              updateUiuxOverview={updateUiuxOverview}
              downloadDocx={downloadDocx}
              downloading={downloading}
              downloadBusinessReport={downloadClientReport}
              businessDownloading={businessDownloading}
            />
          </section>
        )}

        {!result && !loading && (
          <div className="grid sm:grid-cols-3 gap-4 mt-12">
            {[
              {
                icon: Gauge,
                title: "PageSpeed completo",
                desc: "Mobile + desktop, métricas Core Web Vitals e oportunidades.",
              },
              {
                icon: Sparkles,
                title: "Análise visual com IA",
                desc: "Screenshot da home avaliada por IA com sugestões de UI/UX.",
              },
              {
                icon: FileText,
                title: "Export .docx",
                desc: "Relatório no padrão da agência, pronto pra entregar ao cliente.",
              },
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
