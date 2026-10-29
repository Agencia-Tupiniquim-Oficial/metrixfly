import { useEffect, useRef, useState, FormEvent } from "react";
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
  type ServiceInterest,
} from "@/features/diagnostics/model/quote-request";
import {
  buildCampaignTrackingForSubmission,
  clearCampaignTracking,
} from "@/features/diagnostics/model/campaign-tracking";
import { isPublicDiagnosticReportId } from "@/features/diagnostics/services/diagnostic-reports";
import {
  sampleDiagnosticResult,
  sampleBusinessSummary,
} from "@/features/diagnostics/demo/diagnosticMock";
import { importPdfReports } from "@/lib/dynamic-import";
import { startGeoCrawl } from "@/lib/geo-crawl-cache";
import { runDiagnosticWithProgress } from "@/features/diagnostics/services/diagnose-site";
import { trackQuoteRequestLead } from "@/features/diagnostics/services/quote-analytics";
import { recordQuoteInterest } from "@/features/diagnostics/services/quote-interest";
import {
  applyDiagnosticProgress,
  initialDiagnosticProgress,
  type DiagnosticProgressEvent,
  type DiagnosticProgressState,
} from "@/features/diagnostics/model/diagnostic-progress";
type Result = DiagnoseResult;

const DiagnosticPage = () => {
  const {
    diagnostic,
    setDiagnostic,
    diagnosticReportId,
    setDiagnosticReportId,
  } = useDiagnosis();

  const [searchParams] = useSearchParams();
  // The home page hands the typed address over as ?url=; it wins over any
  // diagnostic saved from an earlier visit, which must not be shown instead.
  const [requestedUrl] = useState(() =>
    searchParams.get("demo") === "1" ? "" : (searchParams.get("url")?.trim() ?? ""),
  );
  // Saved diagnostics are rehydrated asynchronously after mount, so with a
  // requested address only the result of this page's own run may be shown.
  const ownRunDone = useRef(!requestedUrl);
  const [url, setUrl] = useState(
    requestedUrl || (diagnostic?.geo?.domain ?? ""),
  );
  const [loading, setLoading] = useState(false);
  const [diagnosticProgress, setDiagnosticProgress] =
    useState<DiagnosticProgressState>(initialDiagnosticProgress);
  const [geoLoading, setGeoLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(
    requestedUrl ? null : (diagnostic ?? null),
  );
  const [reportUrl, setReportUrl] = useState<string | null>(() =>
    !requestedUrl && diagnosticReportId && isPublicDiagnosticReportId(diagnosticReportId)
      ? `${window.location.origin}/diagnostico/${diagnosticReportId}`
      : null,
  );
  const [previewMode, setPreviewMode] = useState<"view" | "edit">("view");
  const [downloading, setDownloading] = useState(false);
  const [quoteSending, setQuoteSending] = useState(false);
  const [businessDownloading, setBusinessDownloading] = useState(false);
  const [businessSummary, setBusinessSummary] = useState<BusinessSummary | null>(null);
  const [businessLoading, setBusinessLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!diagnostic || !ownRunDone.current) return;
    setResult(diagnostic);
    if (diagnostic.geo?.domain) setUrl(diagnostic.geo.domain);
  }, [diagnostic]);

  // An address handed over as ?url= (landing page) starts the diagnostic once.
  const autoRunStarted = useRef(false);
  useEffect(() => {
    if (!requestedUrl || autoRunStarted.current) return;
    autoRunStarted.current = true;
    void runDiagnosticFor(requestedUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setReportUrl(
      diagnosticReportId && isPublicDiagnosticReportId(diagnosticReportId)
        ? `${window.location.origin}/diagnostico/${diagnosticReportId}`
        : null,
    );
  }, [diagnosticReportId]);

  const runDiagnostic = (e: FormEvent) => {
    e.preventDefault();
    return runDiagnosticFor(url);
  };

  const runDiagnosticFor = async (rawUrl: string) => {
    let normalized = rawUrl.trim();
    if (!/^https?:\/\//i.test(normalized)) normalized = "https://" + normalized;

    setLoading(true);
    // The GEO/AEO crawl runs alongside, so opening GEO/AEO later does not repeat it.
    // A failure here is silent: the GEO/AEO page crawls on demand instead.
    if (searchParams.get("demo") !== "1") void startGeoCrawl(normalized).catch(() => undefined);
    setDiagnosticProgress(initialDiagnosticProgress);
    setResult(null);
    setReportUrl(null);
    setDiagnosticReportId(null);
    setBusinessSummary(null);
    try {
      const completed = await runDiagnosticWithProgress(
        normalized,
        (event: DiagnosticProgressEvent) =>
          setDiagnosticProgress((current) =>
            applyDiagnosticProgress(current, event),
          ),
      );
      const diagnosticResult = {
        ...completed.diagnosis,
        geo: { ...completed.diagnosis.geo, domain: normalized },
      } satisfies DiagnoseResult;
      ownRunDone.current = true;
      setResult(diagnosticResult);
      setDiagnostic(diagnosticResult);
      if (
        completed.reportId &&
        isPublicDiagnosticReportId(completed.reportId)
      ) {
        setDiagnosticReportId(completed.reportId);
        toast({
          title: "Diagnóstico pronto!",
          description: "Relatório salvo e pronto para compartilhar.",
        });
      } else {
        setDiagnosticReportId(null);
        toast({
          title: "Diagnóstico pronto, mas sem link permanente",
          description:
            completed.persistenceError ??
            "O relatório continua disponível nesta sessão, mas não foi possível confirmar o salvamento.",
          variant: "destructive",
        });
      }
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
      } = await importPdfReports();
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

  const publicReportId =
    diagnosticReportId && isPublicDiagnosticReportId(diagnosticReportId)
      ? diagnosticReportId
      : null;

  const recordQuoteDialogOpen = (interest: ServiceInterest) => {
    const analyzedUrl = result?.geo?.domain?.trim() || url.trim();
    if (!analyzedUrl) return;
    void recordQuoteInterest({
      eventType: "dialog_opened",
      domain: /^https?:\/\//i.test(analyzedUrl) ? analyzedUrl : `https://${analyzedUrl}`,
      reportId: publicReportId,
      serviceInterest: interest,
    });
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

      const { createDiagnosticReportPdf } = await importPdfReports();
      const pdf = await createDiagnosticReportPdf(normalizedUrl, result);
      validateDiagnosticPdf(pdf);
      const payload: QuoteEmailRequest = {
        ...request,
        domain: normalizedUrl,
        diagnosticSummary: buildDiagnosticSummary(result),
        campaignTracking: buildCampaignTrackingForSubmission({
          search: window.location.search,
          href: window.location.href,
        }),
      };
      const formData = new FormData();
      formData.append("form-name", payload["form-name"]);
      formData.append("name", payload.name);
      formData.append("company", payload.company);
      formData.append("email", payload.email);
      formData.append("phone", payload.phone);
      formData.append("domain", payload.domain);
      if (payload.serviceInterest) {
        formData.append("serviceInterest", payload.serviceInterest);
      }
      formData.append("diagnosticSummary", payload.diagnosticSummary);
      formData.append(
        "campaignTracking",
        JSON.stringify(payload.campaignTracking),
      );
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
      clearCampaignTracking();
      trackQuoteRequestLead(normalizedUrl);
      void recordQuoteInterest({
        eventType: "request_submitted",
        domain: normalizedUrl,
        reportId: publicReportId,
        serviceInterest: request.serviceInterest,
      });
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
        title: "Não foi possível gerar o relatório",
        description:
          "Ocorreu um erro interno no servidor ao gerar a versão corporativa do relatório. Tente novamente em alguns instantes.",
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
      } = await importPdfReports();
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

  const isDemo = searchParams.get("demo") === "1";

  const activeResult = result ?? (isDemo ? sampleDiagnosticResult : null);
  const activeBusinessSummary = businessSummary ?? (isDemo ? sampleBusinessSummary : null);

  return <DiagnosticExperience
    url={isDemo ? "metricfly-demo.com.br" : url}
    setUrl={setUrl}
    loading={loading}
    diagnosticProgress={diagnosticProgress}
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
    onQuoteDialogOpen={isDemo ? undefined : recordQuoteDialogOpen}
    quoteSending={quoteSending}
    reportUrl={isDemo ? null : reportUrl}
    openGeoDashboard={openGeoDashboard}
  />;
};

export default DiagnosticPage;
