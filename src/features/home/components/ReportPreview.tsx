import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const RING_RADIUS = 27;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

type Tone = "success" | "warning" | "destructive";

const toneClasses: Record<Tone, { stroke: string; text: string }> = {
  success: { stroke: "stroke-success", text: "fill-success" },
  warning: { stroke: "stroke-warning", text: "fill-warning" },
  destructive: { stroke: "stroke-destructive", text: "fill-destructive" },
};

function toneFor(score: number): Tone {
  if (score >= 90) return "success";
  if (score >= 50) return "warning";
  return "destructive";
}

function ScoreRing({ label, score }: { label: string; score: number }) {
  const tone = toneClasses[toneFor(score)];
  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width="64"
        height="64"
        viewBox="0 0 64 64"
        role="img"
        aria-label={`${label} ${score}`}
      >
        <circle
          cx="32"
          cy="32"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="5"
          className="stroke-muted"
        />
        <circle
          cx="32"
          cy="32"
          r={RING_RADIUS}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * RING_LENGTH} ${RING_LENGTH}`}
          transform="rotate(-90 32 32)"
          className={tone.stroke}
        />
        <text
          x="32"
          y="38"
          textAnchor="middle"
          fontSize="16"
          fontWeight="700"
          className={tone.text}
        >
          {score}
        </text>
      </svg>
      <span className="text-center text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

const performanceScores = [
  { label: "Desempenho", score: 86 },
  { label: "Acessibilidade", score: 100 },
  { label: "Práticas", score: 100 },
  { label: "SEO", score: 100 },
];

const metrics = [
  { label: "LCP", value: "3,3 s" },
  { label: "TBT", value: "10 ms" },
  { label: "CLS", value: "0" },
];

const aiScores = [
  { label: "GEO", value: 32 },
  { label: "AEO", value: 22 },
  { label: "Técnico", value: 64 },
];

const cardShadow = { boxShadow: "var(--shadow-card)" };

/** Static, illustrative numbers: the home page never runs a real analysis. */
export default function ReportPreview() {
  return (
    <div className="flex min-w-0 flex-col gap-4" aria-label="Exemplo ilustrativo de relatório">
      <Card className="space-y-5 border-border bg-card p-6" style={cardShadow}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Desempenho mobile
            </span>
            <span className="text-sm font-semibold">seusite.com.br</span>
          </div>
          <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
            Exemplo ilustrativo
          </span>
        </div>
        <div className="grid grid-cols-4 gap-3">
          {performanceScores.map((item) => (
            <ScoreRing key={item.label} {...item} />
          ))}
        </div>
        <dl className="grid grid-cols-3 border-t border-border pt-4">
          {metrics.map(({ label, value }) => (
            <div key={label} className="flex flex-col">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-lg font-bold">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card
        className="flex flex-wrap items-center gap-5 border-border bg-card px-6 py-5"
        style={cardShadow}
      >
        <div className="flex min-w-[8.5rem] flex-1 flex-col">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">
            Prontidão para IA
          </span>
          <span className="text-sm text-muted-foreground">Agent Crawl GEO/AEO</span>
        </div>
        <dl className="flex flex-wrap gap-5">
          {aiScores.map(({ label, value }) => (
            <div key={label} className="flex flex-col">
              <dd
                className={cn(
                  "text-2xl font-extrabold",
                  toneFor(value) === "destructive" ? "text-destructive" : "text-warning",
                )}
              >
                {value}
              </dd>
              <dt className="text-xs text-muted-foreground">{label}</dt>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
