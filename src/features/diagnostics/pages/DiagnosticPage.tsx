import { useState, FormEvent } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { useToast } from "@/hooks/use-toast";
import { useDiagnosis } from "@/features/diagnostics/state/DiagnosisContext";
import { getDiagnosticErrorMessage } from "@/features/diagnostics/services/error-handler";
import { DiagnosticExperience } from "@/features/diagnostics/components/DiagnosticExperience";
import type { DiagnoseResult, Improvement } from "@/features/diagnostics/model/diagnose";
import type { BusinessSummary } from "@/features/diagnostics/model/business-report";
import {
  buildDiagnosticSummary,
  validateDiagnosticPdf,
  type QuoteEmailRequest,
  type QuoteRequest,
} from "@/features/diagnostics/model/quote-request";
import {
  sampleDiagnosticResult,
  sampleBusinessSummary,
} from "@/features/diagnostics/demo/diagnosticMock";
type Result = DiagnoseResult;

const DiagnosticPage = () => {
  const { diagnostic, setDiagnostic } = useDiagnosis();

  const [url, setUrl] = useState(diagnostic?.geo?.domain ?? "");
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(diagnostic ?? null);
  const [previewMode, setPreviewMode] = useState<"view" | "edit">("view");
  const [downloading, setDownloading] = useState(false);
  const [quoteSending, setQuoteSending] = useState(false);
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
      const diagnosis = data as DiagnoseResult;
      const diagnosticResult = {
        ...diagnosis,
        geo: { ...diagnosis.geo, domain: normalized },
      } satisfies DiagnoseResult;
      setResult(diagnosticResult);
      setDiagnostic(diagnosticResult);
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

  const downloadTechnicalPdf = async () => {
    if (!result) return;
    setDownloading(true);
    try {
      const analyzedUrl = result.geo?.domain?.trim() || url.trim();
      const normalized = /^https?:\/\//i.test(analyzedUrl)
        ? analyzedUrl
        : `https://${analyzedUrl}`;
      try {
        new URL(normalized);
      } catch {
        throw new Error("Não foi possível identificar o domínio analisado para nomear o relatório.");
      }
      const {
        createDiagnosticReportPdf,
        downloadPdf,
        reportPdfFilename,
      } = await import("@/features/diagnostics/services/pdf-reports");
      const blob = await createDiagnosticReportPdf(normalized, result);
      downloadPdf(blob, reportPdfFilename(normalized, "diagnostico"));
      toast({
        title: "Relatório pronto",
        description: "Download iniciado.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Erro ao baixar relatório",
        description: err instanceof Error ? err.message : "Não foi possível gerar o arquivo PDF.",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const sendQuoteRequest = async (request: QuoteRequest) => {
    if (!result) {
      throw new Error("Gere um diagnóstico antes de solicitar um orçamento.");
    }
    if (isDemo) {
      throw new Error("Solicitações de orçamento não estão disponíveis no modo de demonstração.");
    }

    setQuoteSending(true);
    try {
      const analyzedUrl = result.geo?.domain?.trim() || url.trim();
      const normalizedUrl = /^https?:\/\//i.test(analyzedUrl)
        ? analyzedUrl
        : `https://${analyzedUrl}`;
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(normalizedUrl);
      } catch {
        throw new Error("Não foi possível identificar o domínio analisado.");
      }
      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        throw new Error("O domínio analisado precisa usar HTTP ou HTTPS.");
      }

      const { createDiagnosticReportPdf } = await import(
        "@/features/diagnostics/services/pdf-reports"
      );
      const pdf = await createDiagnosticReportPdf(normalizedUrl, result);
      validateDiagnosticPdf(pdf);
      const payload: QuoteEmailRequest = {
        ...request,
        domain: normalizedUrl,
        diagnosticSummary: buildDiagnosticSummary(result),
      };
      const formData = new FormData();
      formData.append("form-name", payload["form-name"]);
      formData.append("name", payload.name);
      formData.append("company", payload.company);
      formData.append("email", payload.email);
      formData.append("phone", payload.phone);
      formData.append("domain", payload.domain);
      formData.append("diagnosticSummary", payload.diagnosticSummary);
      formData.append("report", pdf, "diagnostico.pdf");
      const { data, error } = await supabase.functions.invoke("quote-request", {
        body: formData,
      });
      if (error) {
        if (error instanceof FunctionsHttpError) {
          let responseBody: unknown;
          try {
            responseBody = await error.context.json();
          } catch {
            responseBody = null;
          }
          if (
            responseBody &&
            typeof responseBody === "object" &&
            "error" in responseBody &&
            typeof responseBody.error === "string"
          ) {
            throw new Error(responseBody.error);
          }
        }
        throw error;
      }
      if (data?.success !== true) {
        throw new Error("O serviço não confirmou o envio da solicitação.");
      }
    } finally {
      setQuoteSending(false);
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
      const {
        createBusinessReportPdf,
        downloadPdf,
        reportPdfFilename,
      } = await import("@/features/diagnostics/services/pdf-reports");
      const blob = await createBusinessReportPdf(normalized, data);
      downloadPdf(blob, reportPdfFilename(normalized, "relatorio_cliente"));
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

  const activeResult = result ?? (isDemo ? sampleDiagnosticResult : null);
  const activeBusinessSummary = businessSummary ?? (isDemo ? sampleBusinessSummary : null);

  return <DiagnosticExperience
    url={isDemo ? "speedlink-demo.com.br" : url}
    setUrl={setUrl}
    loading={loading}
    runDiagnostic={runDiagnostic}
    result={activeResult}
    geoLoading={geoLoading}
    runGeoCrawl={runGeoCrawl}
    downloadTechnicalPdf={downloadTechnicalPdf}
    downloading={downloading}
    downloadClientReport={downloadClientReport}
    businessDownloading={businessDownloading}
    businessSummary={activeBusinessSummary}
    setBusinessSummary={setBusinessSummary}
    businessLoading={businessLoading}
    fetchBusinessSummary={fetchBusinessSummary}
    previewMode={previewMode}
    setPreviewMode={setPreviewMode}
    updateImprovement={(index, field, value) => {
      updateImprovement(index, field as keyof Improvement, value);
    }}
    updateUiuxOverview={updateUiuxOverview}
    sendQuoteRequest={isDemo ? undefined : sendQuoteRequest}
    quoteSending={quoteSending}
    openGeoDashboard={openGeoDashboard}
  />;
};

export default DiagnosticPage;
