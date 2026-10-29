import { Check, Search } from "lucide-react";
import { ScoreRing } from "@/components/score-ring";

const bars = [
  { width: "w-4/5", delay: "0s" },
  { width: "w-3/5", delay: "0.4s" },
  { width: "w-2/3", delay: "0.8s" },
];

/** Decorative illustration for the FAQ: a report card with floating helper chips. */
export default function FaqVisual() {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto aspect-square w-full max-w-md overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/15 via-primary/5 to-transparent"
    >
      <div className="absolute -left-10 -top-10 h-44 w-44 rounded-full bg-primary/15 blur-2xl" />
      <div className="absolute -bottom-12 -right-8 h-52 w-52 rounded-full bg-primary/10 blur-3xl" />

      <div
        className="absolute left-6 top-8 flex h-14 w-14 animate-faq-float items-center justify-center rounded-2xl rounded-bl-sm bg-primary text-3xl font-extrabold text-primary-foreground shadow-lg"
        style={{ animationDelay: "0.3s" }}
      >
        ?
      </div>

      <div
        className="absolute right-6 top-14 flex w-44 animate-faq-float items-center gap-2 rounded-full border border-border bg-card px-3 py-2 shadow-md"
        style={{ animationDelay: "1.2s" }}
      >
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Search className="h-3.5 w-3.5" />
        </span>
        <span className="h-2 flex-1 rounded-full bg-muted" />
      </div>

      <div className="absolute inset-x-8 top-1/3 flex items-center gap-5 rounded-2xl border border-border bg-card p-5 shadow-xl">
        <ScoreRing label="Desempenho" score={94} size={88} />
        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {bars.map(({ width, delay }) => (
            <span key={width} className="block h-2.5 w-full rounded-full bg-muted">
              <span
                className={`block h-full animate-faq-bar rounded-full bg-primary ${width}`}
                style={{ animationDelay: delay }}
              />
            </span>
          ))}
        </div>
      </div>

      <div
        className="absolute bottom-10 right-6 flex animate-faq-float items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-bold shadow-lg ring-1 ring-border"
        style={{ animationDelay: "2s" }}
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success text-primary-foreground">
          <Check className="h-3 w-3" />
        </span>
        Pronto para IAs
      </div>
    </div>
  );
}
