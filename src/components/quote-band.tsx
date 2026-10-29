import type { ReactNode } from "react";

type QuoteBandProps = {
  /** The call to action, supplied by the page (it depends on whether a diagnostic exists). */
  children: ReactNode;
};

/** Closing band shared by the public pages. */
export default function QuoteBand({ children }: QuoteBandProps) {
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
        {children}
      </div>
    </section>
  );
}
