import { useState } from "react";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { importPdfReports } from "@/lib/dynamic-import";
import type { DiagnoseResult } from "@/features/diagnostics/model/diagnose";
import {
  buildCampaignTrackingForSubmission,
  clearCampaignTracking,
} from "@/features/diagnostics/model/campaign-tracking";
import {
  buildDiagnosticSummary,
  validateDiagnosticPdf,
  type QuoteEmailRequest,
  type QuoteRequest,
  type ServiceInterest,
} from "@/features/diagnostics/model/quote-request";
import { isPublicDiagnosticReportId } from "@/features/diagnostics/services/diagnostic-reports";
import { trackQuoteRequestLead } from "@/features/diagnostics/services/quote-analytics";
import { recordQuoteInterest } from "@/features/diagnostics/services/quote-interest";

type Options = {
  result: DiagnoseResult | null;
  /** Fallback address when the result carries no domain. */
  url: string;
  reportId: string | null;
  /** False in demo mode, where no request may be sent. */
  enabled?: boolean;
};

/** Sends a quote request together with the diagnostic (PDF and summary) and records the interest signals. */
export function useQuoteRequest({ result, url, reportId, enabled = true }: Options) {
  const [quoteSending, setQuoteSending] = useState(false);

  const publicReportId =
    reportId && isPublicDiagnosticReportId(reportId)
      ? reportId
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
    if (!enabled) {
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


  return { quoteSending, recordQuoteDialogOpen, sendQuoteRequest };
}
