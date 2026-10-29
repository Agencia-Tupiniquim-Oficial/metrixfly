import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { pushDataLayerEvent } from "@/lib/analytics";
import QuoteRequestDialog from "@/features/diagnostics/components/QuoteRequestDialog";
import { useQuoteRequest } from "@/features/diagnostics/hooks/use-quote-request";
import { useOptionalDiagnosis } from "@/features/diagnostics/state/DiagnosisContext";

const buttonClass =
  "border-primary-foreground bg-transparent font-bold text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground";

type Props = {
  /** Where the band sits, for the click event (e.g. "home", "geo-aeo"). */
  location: string;
};

/**
 * The "Solicitar orçamento" button of the closing band. With a diagnostic already run it
 * opens the same quote form as the report; without one it leads to the diagnostic page,
 * where the form opens as soon as the report is ready.
 */
export default function QuoteBandAction({ location }: Props) {
  const diagnosis = useOptionalDiagnosis();
  const result = diagnosis?.diagnostic ?? null;
  const [open, setOpen] = useState(false);
  const { sendQuoteRequest, recordQuoteDialogOpen, quoteSending } = useQuoteRequest({
    result,
    url: result?.geo?.domain ?? "",
    reportId: diagnosis?.diagnosticReportId ?? null,
  });

  const track = () =>
    pushDataLayerEvent({ event: "cta_click", cta_id: "quote_band", location });

  if (!result) {
    return (
      <Button asChild size="lg" variant="outline" className={buttonClass}>
        <Link to="/diagnostico" state={{ openQuote: true }} onClick={track}>
          Solicitar orçamento
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button
        type="button"
        size="lg"
        variant="outline"
        className={buttonClass}
        onClick={() => {
          track();
          setOpen(true);
        }}
      >
        Solicitar orçamento
      </Button>
      <QuoteRequestDialog
        open={open}
        onOpenChange={setOpen}
        showTrigger={false}
        onSubmitRequest={sendQuoteRequest}
        onOpened={recordQuoteDialogOpen}
        sending={quoteSending}
      />
    </>
  );
}
