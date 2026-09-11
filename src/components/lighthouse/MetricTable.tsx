// src/components/lighthouse/MetricTable.tsx
import React from "react";
import type { Metrics } from "@/types/diagnose";

export default function MetricTable({ metrics }: { metrics?: Metrics }) {
  return (
    <div className="border-t border-slate-100 pt-4">
      <div className="grid grid-cols-2 gap-x-6">
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
  );
}
