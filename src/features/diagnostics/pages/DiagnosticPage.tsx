import { useEffect, useRef, useState, FormEvent } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useDiagnosis } from "@/features/diagnostics/state/DiagnosisContext";
import { getDiagnosticErrorMessage } from "@/features/diagnostics/services/error-handler";
import { DiagnosticExperience } from "@/features/diagnostics/components/DiagnosticExperience";
import type { DiagnoseResult, Improvement } from "@/features/diagnostics/model/diagnose";
import type { BusinessSummary } from "@/features/diagnostics/model/business-report";
import type { QuoteRequest } from "@/features/diagnostics/model/quote-request";
import { normalizeLeadEmail } from "@/features/diagnostics/model/report-lead";
import { useQuoteRequest } from "@/features/diagnostics/hooks/use-quote-request";
import { isPublicDiagnosticReportId } from "@/features/diagnostics/services/diagnostic-reports";
import {
  sampleDiagnosticResult,
  sampleBusinessSummary,
} from "@/features/diagnostics/demo/diagnosticMock";
import { importPdfReports } from "@/lib/dynamic-import";
import { startGeoCrawl } from "@/lib/geo-crawl-cache";
import { runDiagnosticWithProgress } from "@/features/diagnostics/services/diagnose-site";
import {
  submitReportLead,
} from "@/features/diagnostics/services/report-lead";
import {
  applyDiagnosticProgress,
  initialDiagnosticProgress,
  type DiagnosticProgressEvent,
  type DiagnosticProgressState,
} from "@/features/diagnostics/model/diagnostic-progress";
type Result = DiagnoseResult;

// Lives as long as the saved diagnostic (same tab session), so navigating or refreshing keeps the report open.
const UNLOCKED_KEY = "diagnosis:report-unlocked";

const readUnlocked = () => {
  try {
    return sessionStorage.getItem(UNLOCKED_KEY) === "1";
  } catch {
    return false;
  }
};

const writeUnlocked = (unlocked: boolean) => {
  try {
    if (unlocked) sessionStorage.setItem(UNLOCKED_KEY, "1");
    else sessionStorage.removeItem(UNLOCKED_KEY);
  } catch {
    // Storage unavailable: the report just asks again after a reload.
  }
};

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
  // "Solicitar orçamento" before any diagnostic leads here: the quote form opens when the report is ready.
  const routerLocation = useLocation();
  const [quoteIntent, setQuoteIntent] = useState(
    () => (routerLocation.state as { openQuote?: boolean } | null)?.openQuote === true,
  );
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  useEffect(() => {
    if ((routerLocation.state as { openQuote?: boolean } | null)?.openQuote) {
      navigate(`${routerLocation.pathname}${routerLocation.search}`, { replace: true, state: null });
    }
    // Runs once: the intent was already read into state above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // The e-mail is asked once per diagnostic: it is remembered across pages and reloads until a new one runs.
  const [reportUnlocked, setReportUnlocked] = useState(() => !requestedUrl && readUnlocked());
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
      writeUnlocked(false);
      setReportUnlocked(false);
      if (quoteIntent) {
        setQuoteIntent(false);
        setQuoteDialogOpen(true);
      }
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

  const isDemoMode = searchParams.get("demo") === "1";
  const { sendQuoteRequest, recordQuoteDialogOpen, quoteSending } = useQuoteRequest({
    result,
    url,
    reportId: diagnosticReportId,
    enabled: !isDemoMode,
  });

  // The report stays blurred until an e-mail is given, also while the quote form (which asks for one) is open.
  const reportLocked = !isDemoMode && result !== null && !reportUnlocked;

  const unlockReport = async (email: string) => {
    try {
      await submitReportLead({
        email,
        domain: result?.geo?.domain?.trim() || url.trim(),
        reportId: diagnosticReportId,
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Relatório liberado",
        description: "Não conseguimos registrar o seu e-mail agora, mas você já pode ver o diagnóstico.",
      });
    }
    writeUnlocked(true);
    setReportUnlocked(true);
  };

  // The e-mail typed in the quote form also releases the report, so the popup is not asked twice.
  const submitQuoteRequest = async (request: QuoteRequest) => {
    await sendQuoteRequest(request);
    const email = normalizeLeadEmail(request.email);
    if (email && !reportUnlocked) await unlockReport(email);
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
    sendQuoteRequest={isDemo ? undefined : submitQuoteRequest}
    onQuoteDialogOpen={isDemo ? undefined : recordQuoteDialogOpen}
    quoteDialogOpen={quoteDialogOpen}
    onQuoteDialogOpenChange={setQuoteDialogOpen}
    quoteSending={quoteSending}
    reportUrl={isDemo ? null : reportUrl}
    reportLocked={reportLocked}
    emailGateOpen={reportLocked && !quoteDialogOpen}
    onUnlockReport={isDemo ? undefined : unlockReport}
    openGeoDashboard={openGeoDashboard}
  />;
};

export default DiagnosticPage;
