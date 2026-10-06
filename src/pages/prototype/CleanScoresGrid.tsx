import React from "react";
import { Card } from "@/components/ui/card";
import type { DiagnosticScores, DiagnosticMetrics } from "./diagnosticMock";

type CleanScoresGridProps = {
  title: string;
  scores: DiagnosticScores;
  metrics: DiagnosticMetrics;
};

export function CleanScoresGrid({
  title,
  scores,
  metrics,
}: CleanScoresGridProps) {
  const getScoreBadgeClass = (val: number) => {
    if (val >= 90) return "text-emerald-700 border-emerald-500 bg-emerald-50";
    if (val >= 50) return "text-amber-700 border-amber-500 bg-amber-50";
    return "text-rose-700 border-rose-500 bg-rose-50";
  };

  const metricRows = [
    { label: "FCP (First Contentful Paint)", value: metrics.fcp, target: "< 1.8s" },
    { label: "LCP (Largest Contentful Paint)", value: metrics.lcp, target: "< 2.5s" },
    { label: "TBT (Total Blocking Time)", value: metrics.tbt, target: "< 200ms" },
    { label: "CLS (Cumulative Layout Shift)", value: metrics.cls, target: "< 0.1" },
    { label: "SI (Speed Index)", value: metrics.si, target: "< 3.4s" },
  ];

  return (
    <Card className="p-6 bg-card border-border shadow-sm">
      <h3 className="text-xl font-semibold mb-6 text-foreground flex items-center gap-2">
        {title}
      </h3>

      {/* 4 Large Score Rings */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Desempenho", value: scores.performance },
          { label: "Acessibilidade", value: scores.accessibility },
          { label: "Práticas", value: scores.bestPractices },
          { label: "SEO", value: scores.seo },
        ].map((item) => (
          <div key={item.label} className="flex flex-col items-center gap-2 text-center">
            <div
              className={`w-16 h-16 rounded-full border-[3px] flex items-center justify-center font-bold text-2xl shadow-sm ${getScoreBadgeClass(
                item.value
              )}`}
            >
              {item.value}
            </div>
            <span className="text-sm font-medium text-muted-foreground">
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {/* Core Web Vitals Rows with Legible Font */}
      <div className="divide-y divide-border/80 border-t border-border/80 pt-3 text-sm">
        {metricRows.map((m) => (
          <div
            key={m.label}
            className="flex items-center justify-between py-2.5 gap-4"
          >
            <div>
              <span className="font-medium text-foreground block">{m.label}</span>
              <span className="text-xs text-muted-foreground">Meta: {m.target}</span>
            </div>
            <span className="text-base font-bold text-foreground font-mono">
              {m.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
