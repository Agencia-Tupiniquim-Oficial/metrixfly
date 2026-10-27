import React from "react";
import { Card } from "@/components/ui/card";
import { ScoreRing } from "@/components/score-ring";
import type { Metrics, Scores } from "@/features/diagnostics/model/diagnose";

type CleanScoresGridProps = {
  title: string;
  scores: Scores;
  metrics: Metrics;
};

type MetricStatus = "good" | "attention" | "unknown";

const statusDot: Record<MetricStatus, string> = {
  good: "bg-success",
  attention: "bg-warning",
  unknown: "bg-muted-foreground/40",
};

/** Colors the status dot only; the displayed value and the target stay untouched. */
function metricStatus(
  value: string | number | undefined,
  limit: number,
): MetricStatus {
  const text = String(value ?? "");
  const match = text.replace(",", ".").match(/-?\d+(?:\.\d+)?/);
  if (!match) return "unknown";
  const number = Number(match[0]);
  const inMilliseconds = text.toLowerCase().includes("ms");
  // The limit of TBT is in ms (200); the timings are in seconds.
  const normalized = limit >= 100 && !inMilliseconds ? number * 1000 : number;
  return normalized <= limit ? "good" : "attention";
}

export function CleanScoresGrid({
  title,
  scores,
  metrics,
}: CleanScoresGridProps) {
  const metricRows = [
    { label: "FCP (First Contentful Paint)", value: metrics.fcp, target: "< 1.8s", limit: 1.8 },
    { label: "LCP (Largest Contentful Paint)", value: metrics.lcp, target: "< 2.5s", limit: 2.5 },
    { label: "TBT (Total Blocking Time)", value: metrics.tbt, target: "< 200ms", limit: 200 },
    { label: "CLS (Cumulative Layout Shift)", value: metrics.cls, target: "< 0.1", limit: 0.1 },
    { label: "SI (Speed Index)", value: metrics.si, target: "< 3.4s", limit: 3.4 },
  ];

  return (
    <Card className="motion-card p-6 bg-card border-border shadow-sm">
      <h3 className="text-lg font-bold mb-5 text-foreground flex items-center gap-2">
        {title}
      </h3>

      <div className="mb-5 grid grid-cols-2 gap-x-2 gap-y-4 min-[460px]:grid-cols-4">
        <ScoreRing label="Desempenho" score={scores.performance} size={60} />
        <ScoreRing label="Acessibilidade" score={scores.accessibility} size={60} />
        <ScoreRing label="Práticas" score={scores.bestPractices} size={60} />
        <ScoreRing label="SEO" score={scores.seo} size={60} />
      </div>

      <div className="divide-y divide-border/80 border-t border-border/80 text-sm">
        {metricRows.map((m) => (
          <div key={m.label} className="flex items-center gap-3 py-2.5">
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${statusDot[metricStatus(m.value, m.limit)]}`}
            />
            <div className="min-w-0 flex-1">
              <span className="font-medium text-foreground block">{m.label}</span>
              <span className="text-xs text-muted-foreground">Meta: {m.target}</span>
            </div>
            <span className="text-base font-bold text-foreground tabular-nums">
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
