import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { pushDataLayerEvent } from "@/lib/analytics";

type QuoteBandProps = {
  /** Where the band sits, for the click event (e.g. "home", "geo-aeo"). */
  location: string;
};

/**
 * Closing band shared by the public pages. A quote request is sent together with a
 * diagnostic, so outside the report the button leads to the diagnostic page.
 */
export default function QuoteBand({ location }: QuoteBandProps) {
  return (
    <section className="container pb-16 md:pb-24">
      <div className="flex flex-wrap items-center justify-between gap-8 rounded-3xl bg-primary px-6 py-12 text-primary-foreground md:px-12 md:py-16">
        <div className="flex min-w-0 flex-1 basis-96 flex-col gap-3">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight">
            Achou os problemas? A gente ajuda a resolver.
          </h2>
          <p className="text-lg opacity-90">
            Depois do diagnóstico, nossa equipe pode priorizar e executar as
            melhorias no seu site.
          </p>
        </div>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="border-primary-foreground bg-transparent font-bold text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
        >
          <Link
            to="/diagnostico"
            onClick={() =>
              pushDataLayerEvent({ event: "cta_click", cta_id: "quote_band", location })
            }
          >
            Solicitar orçamento
          </Link>
        </Button>
      </div>
    </section>
  );
}
