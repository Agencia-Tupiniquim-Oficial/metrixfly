// src/components/LighthouseCard.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export type Scores = {
  performance: number;
  accessibility: number;
  bestPractices: number;
  seo: number;
  navigation?: string;
};

export type Metrics = {
  fcp?: string;
  lcp?: string;
  tbt?: string;
  cls?: string | number;
  si?: string;
};

type Props = {
  title?: string;
  scores: Scores;
  metrics?: Metrics;
  className?: string;
};

function ScoreCircle({ value, label }: { value: number; label: string }) {
  const v = Math.round(value ?? 0);
  const color =
    v >= 90 ? "text-green-600 ring-green-100" : v >= 50 ? "text-amber-500 ring-amber-100" : "text-red-500 ring-red-100";

  return (
    <div className="flex flex-col items-center w-24">
      <div
        className={`rounded-full w-14 h-14 flex items-center justify-center ring-4 ${color} bg-white shadow-sm`}
        aria-hidden
      >
        <span className="font-semibold text-lg">{v}</span>
      </div>
      <div className="text-xs text-slate-600 mt-2 text-center">{label}</div>
    </div>
  );
}

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

        <div className="border-t border-slate-100 pt-4">
          <div className="grid grid-cols-2 gap-x-6">
            {/* Left column */}
            <div className="space-y-2">
              <div className="flex justify-between items-center border-b border-slate-100 py-2">
                <span className="text-sm text-slate-600">FCP</span>
                <span className="font-semibold text-sm">{metrics?.fcp ?? "—"}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 py-2">
                <span className="text-sm text-slate-600">TBT</span>
                <span className="font-semibold text-sm">{metrics?.tbt ?? "—"}</span>
              </div>

              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-slate-600">SI</span>
                <span className="font-semibold text-sm">{metrics?.si ?? "—"}</span>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-2">
              <div className="flex justify-between items-center border-b border-slate-100 py-2">
                <span className="text-sm text-slate-600">LCP</span>
                <span className="font-semibold text-sm">{metrics?.lcp ?? "—"}</span>
              </div>

              <div className="flex justify-between items-center border-b border-slate-100 py-2">
                <span className="text-sm text-slate-600">CLS</span>
                <span className="font-semibold text-sm">{metrics?.cls ?? "—"}</span>
              </div>

              <div className="py-2" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
