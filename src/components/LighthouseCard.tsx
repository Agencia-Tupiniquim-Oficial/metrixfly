// src/components/LighthouseCard.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import ScoreCircle from "@/components/lighthouse/ScoreCircle";
import MetricTable from "@/components/lighthouse/MetricTable";
import type { Scores, Metrics } from "@/types/diagnose";

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
        <div className="flex gap-6 items-center mb-4">
          <ScoreCircle value={scores.performance} label="Desempenho" />
          <ScoreCircle value={scores.accessibility} label="Acessibilidade" />
          <ScoreCircle value={scores.bestPractices} label="Práticas" />
          <ScoreCircle value={scores.seo} label="SEO" />
          <div className="ml-auto text-sm bg-amber-50 px-2 py-1 rounded-md text-amber-700">{scores.navigation ?? "—"}</div>
        </div>

        <MetricTable metrics={metrics} />
      </CardContent>
    </Card>
  );
}
