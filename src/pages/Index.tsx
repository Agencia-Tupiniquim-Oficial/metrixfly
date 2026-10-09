// Main page — Variant C (Executive Storyboard) is the production UI.
import { useState, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDiagnosis } from "@/context/DiagnosisContext";
import { docxResponseToBlob, downloadBlob } from "@/lib/docx-download";
import { getDiagnosticErrorMessage } from "@/lib/error-handler";
import { VariantC } from "./prototype/VariantC";
import { DiagnoseResult, Improvement } from "@/types/diagnose";
import {
  sampleDiagnosticResult,
  sampleBusinessSummary,
  type DiagnosticResult,
} from "./prototype/diagnosticMock";

type Result = DiagnoseResult;

type SideData = {
  scores: {
    performance: number;
    accessibility: number;
    bestPractices: number;
    seo: number;
  };
  metrics: {
    fcp: string;
    lcp: string;
    tbt: string;
    cls: string;
    si: string;
  };
  screenshot?: string | null;
  opportunities?: { title: string; displayValue?: string }[];
};


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
      setDiagnostic(data as DiagnoseResult);
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

    setDiagnostic((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        improvements: prev.improvements.map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      } satisfies DiagnoseResult;
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
      return { ...prev, uiux: { ...(prev.uiux ?? {}), overview: value } } satisfies DiagnoseResult;
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

  const openGeoDashboard = (crawlResult?: unknown) => {
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

  const [searchParams] = useSearchParams();
  const isDemo = searchParams.get("demo") === "1";

  const activeResult = (result ?? (isDemo ? sampleDiagnosticResult : null)) as unknown as DiagnosticResult | null;
  const activeBusinessSummary = businessSummary ?? (isDemo ? sampleBusinessSummary : null);

  const variantProps: DiagnosticVariantProps = {
    url: isDemo ? "speedlink-demo.com.br" : url,
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

  return <VariantC {...variantProps} />;
};

export default Index;
