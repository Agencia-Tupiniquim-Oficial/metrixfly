// src/components/LighthouseCard.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ScoreCircle from "@/features/diagnostics/components/lighthouse/ScoreCircle";
import MetricTable from "@/features/diagnostics/components/lighthouse/MetricTable";
import type { Scores, Metrics } from "@/features/diagnostics/model/diagnose";

type Props = {
  title?: string;
  scores: Scores;
  metrics?: Metrics;
  className?: string;
};

export default function LighthouseCard({ title = "Device", scores, metrics, className = "" }: Props) {
  return (
    <Card className={`${className}`}>
      <CardHeader>
        <CardTitle className="text-sm">{title}</CardTitle>
      </CardHeader>

      <CardContent>
        {/* top row of circles */}
        <div className="mb-4 flex flex-wrap items-start gap-x-4 gap-y-3 sm:gap-6">
          <ScoreCircle value={scores.performance} label="Desempenho" />
          <ScoreCircle value={scores.accessibility} label="Acessibilidade" />
          <ScoreCircle value={scores.bestPractices} label="Práticas" />
          <ScoreCircle value={scores.seo} label="SEO" />
          <div className="ml-auto rounded-md bg-amber-50 px-2 py-1 text-sm text-amber-700 dark:bg-amber-950/50 dark:text-amber-200">{scores.navigation ?? "—"}</div>
        </div>

        <MetricTable metrics={metrics} />
      </CardContent>
    </Card>
  );
}
