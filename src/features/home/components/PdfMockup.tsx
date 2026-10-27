import logoColored from "@/assets/logo-colored.png";

const lineWidths = ["w-full", "w-[88%]", "w-[72%]"];
const secondLineWidths = ["w-full", "w-[80%]"];

function Lines({ widths }: { widths: string[] }) {
  return (
    <>
      {widths.map((width) => (
        <div key={width} className={`h-1.5 rounded-sm bg-muted ${width}`} />
      ))}
    </>
  );
}

/** Decorative sketch of the PDF report; it carries no real data. */
export default function PdfMockup() {
  return (
    <div
      aria-hidden="true"
      className="flex justify-center rounded-2xl border border-border bg-secondary/60 p-6"
    >
      <div
        className="flex w-full max-w-sm flex-col gap-3.5 rounded-lg bg-card px-8 py-9"
        style={{ boxShadow: "var(--shadow-card)" }}
      >
        <img src={logoColored} alt="" className="h-11 w-11 self-center object-contain" />
        <span className="text-center text-lg uppercase leading-tight text-primary">
          seusite.com.br — diagnóstico de site
        </span>
        <span className="text-base text-muted-foreground">Sugestões de melhoria</span>
        <span className="text-xs font-bold text-muted-foreground">
          1. Reduzir JavaScript não utilizado
        </span>
        <Lines widths={lineWidths} />
        <span className="mt-1.5 text-xs font-bold text-muted-foreground">
          2. Melhorar a entrega de imagens
        </span>
        <Lines widths={secondLineWidths} />
        <div className="mt-2.5 flex flex-wrap gap-2">
          <span className="rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground">
            PDF técnico
          </span>
          <span className="rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold">
            Versão corporativa
          </span>
        </div>
      </div>
    </div>
  );
}
