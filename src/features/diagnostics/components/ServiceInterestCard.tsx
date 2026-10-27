import { Card } from "@/components/ui/card";
import QuoteRequestDialog from "@/features/diagnostics/components/QuoteRequestDialog";
import type {
  QuoteRequest,
  ServiceInterest,
} from "@/features/diagnostics/model/quote-request";

type Props = {
  onSubmitQuoteRequest: (request: QuoteRequest) => Promise<void>;
  onQuoteDialogOpen?: (interest: ServiceInterest) => void;
  quoteSending?: boolean;
};

/**
 * Commercial entry points for Google Search Console and Google Analytics
 * support. They reuse the quote request flow; the app has no direct
 * integration with either service.
 */
export default function ServiceInterestCard({
  onSubmitQuoteRequest,
  onQuoteDialogOpen,
  quoteSending = false,
}: Props) {
  return (
    <Card className="flex flex-col gap-5 border-border bg-card p-6 shadow-md">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Próximos passos
        </p>
        <h2 className="text-xl font-bold text-foreground">
          Entenda como as pessoas chegam ao seu site
        </h2>
        <p className="text-sm text-muted-foreground">
          O PageSpeed mede a velocidade das páginas. O Google Search Console e o
          Google Analytics mostram como o site é encontrado e usado. Nossa equipe
          pode ajudar a configurar e interpretar esses dados.
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <QuoteRequestDialog
          serviceInterest="search_console"
          triggerLabel="Quero ajuda com o Search Console"
          onSubmitRequest={onSubmitQuoteRequest}
          onOpened={onQuoteDialogOpen}
          sending={quoteSending}
        />
        <QuoteRequestDialog
          serviceInterest="analytics"
          triggerLabel="Quero ajuda com o Analytics"
          onSubmitRequest={onSubmitQuoteRequest}
          onOpened={onQuoteDialogOpen}
          sending={quoteSending}
        />
      </div>
    </Card>
  );
}
