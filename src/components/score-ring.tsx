import { useReveal } from "@/hooks/use-reveal";

const RADIUS = 27;
const LENGTH = 2 * Math.PI * RADIUS;

type Tone = "success" | "warning" | "destructive";

const toneClasses: Record<Tone, { stroke: string; text: string }> = {
  success: { stroke: "stroke-success", text: "fill-success" },
  warning: { stroke: "stroke-warning", text: "fill-warning" },
  destructive: { stroke: "stroke-destructive", text: "fill-destructive" },
};

/** >= 90 green, 50-89 amber, below 50 red (same rule as the report score circles). */
function scoreTone(score: number): Tone {
  if (score >= 90) return "success";
  if (score >= 50) return "warning";
  return "destructive";
}

type ScoreRingProps = {
  label: string;
  score: number;
  size?: number;
};

export function ScoreRing({ label, score, size = 64 }: ScoreRingProps) {
  const tone = toneClasses[scoreTone(score)];
  const { ref, visible } = useReveal<SVGSVGElement>();
  const filled = visible
    ? (Math.min(Math.max(score, 0), 100) / 100) * LENGTH
    : 0;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        ref={ref}
        role="img"
        aria-label={`${label}: ${score} de 100`}
      >
        <circle
          cx="32"
          cy="32"
          r={RADIUS}
          fill="none"
          strokeWidth="5"
          className="stroke-muted"
        />
        <circle
          cx="32"
          cy="32"
          r={RADIUS}
          fill="none"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${LENGTH}`}
          transform="rotate(-90 32 32)"
          className={`${tone.stroke} transition-[stroke-dasharray] duration-[900ms] ease-out motion-reduce:transition-none`}
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
