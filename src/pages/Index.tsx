// Prototype: Three variants of the diagnostic landing page, switchable via ?variant=, on the existing / route.
import { useState, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { docxResponseToBlob, downloadBlob } from "@/lib/docx-download";
import { downloadBusinessReport, type BusinessSummary } from "@/lib/business-report";
import { PrototypeSwitcher, type VariantInfo } from "@/components/PrototypeSwitcher";
import { VariantA } from "./prototype/VariantA";
import { VariantB } from "./prototype/VariantB";
import { VariantC } from "./prototype/VariantC";
import type { DiagnosticVariantProps } from "./prototype/types";
import {
  sampleDiagnosticResult,
  sampleBusinessSummary,
  type DiagnosticResult,
  type DiagnosticImprovement,
} from "./prototype/diagnosticMock";
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

const PROTOTYPE_VARIANTS: VariantInfo[] = [
  {
    key: "A",
    name: "Split-Cockpit",
    description: "Layout assimétrico com foco em conversão e impacto comercial direto",
  },
  {
    key: "B",
    name: "Auditor Studio",
    description: "Bancada técnica tabulada com Core Web Vitals e matriz de problemas",
  },
  {
    key: "C",
    name: "Executive Storyboard",
    description: "Narrativa executiva com boletim de notas, simulador de perda e roadmap",
  },
];

const Index = () => {
  const { diagnostic, setDiagnostic } = useDiagnosis();

  const [url, setUrl] = useState(diagnostic?.geo?.domain ?? "");
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(diagnostic ?? null);
  const [previewMode, setPreviewMode] = useState<"view" | "edit">("view");
  const [downloading, setDownloading] = useState(false);
  const [businessDownloading, setBusinessDownloading] = useState(false);
  const [businessSummary, setBusinessSummary] = useState<BusinessSummary | null>(null);
  const [businessLoading, setBusinessLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentVariant = (searchParams.get("variant") || "A").toUpperCase();
  const [useDemoData, setUseDemoData] = useState(false);

  const toggleDemoData = () => {
    setUseDemoData((prev) => {
      const next = !prev;
      if (next && !url) {
        setUrl("speedlink-demo.com.br");
      }
      return next;
    });
  };

  const runDiagnostic = async (e: FormEvent) => {
    e.preventDefault();
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = "https://" + normalized;

    setLoading(true);
    setResult(null);
    setBusinessSummary(null);
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

  const fetchBusinessSummary = async (): Promise<BusinessSummary | null> => {
    if (businessSummary) return businessSummary;
    if (!result) return null;
    setBusinessLoading(true);
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
      const summary = data as BusinessSummary;
      setBusinessSummary(summary);
      return summary;
    } catch (error) {
      console.error(error);
      toast({
        title: "Erro ao gerar versão corporativa",
        description:
          error instanceof Error
            ? error.message
            : "Não foi possível gerar a versão corporativa.",
        variant: "destructive",
      });
      return null;
    } finally {
      setBusinessLoading(false);
    }
  };

  const downloadClientReport = async () => {
    if (!result) return;
    setBusinessDownloading(true);
    try {
      const normalized = url.startsWith("http") ? url : `https://${url}`;
      let data = businessSummary;
      if (!data) {
        data = await fetchBusinessSummary();
        if (!data) return;
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

  const activeResult = (result ?? (useDemoData ? sampleDiagnosticResult : null)) as unknown as DiagnosticResult | null;
  const activeBusinessSummary = businessSummary ?? (useDemoData ? sampleBusinessSummary : null);

  const variantProps: DiagnosticVariantProps = {
    url,
    setUrl,
    loading,
    runDiagnostic,
    result: activeResult,
    geoLoading,
    runGeoCrawl,
    downloadDocx,
    downloading,
    downloadClientReport,
    businessDownloading,
    businessSummary: activeBusinessSummary,
    setBusinessSummary,
    businessLoading,
    fetchBusinessSummary,
    previewMode,
    setPreviewMode,
    updateImprovement: (index, field, value) => {
      updateImprovement(index, field as keyof Improvement, value);
    },
    updateUiuxOverview,
    openGeoDashboard,
  };

  return (
    <>
      {currentVariant === "A" && <VariantA {...variantProps} />}
      {currentVariant === "B" && <VariantB {...variantProps} />}
      {currentVariant === "C" && <VariantC {...variantProps} />}
      {currentVariant !== "A" && currentVariant !== "B" && currentVariant !== "C" && (
        <VariantA {...variantProps} />
      )}
      <PrototypeSwitcher
        variants={PROTOTYPE_VARIANTS}
        current={currentVariant}
        hasSampleData={useDemoData}
        onToggleSampleData={toggleDemoData}
      />
    </>
  );
};

export default Index;
