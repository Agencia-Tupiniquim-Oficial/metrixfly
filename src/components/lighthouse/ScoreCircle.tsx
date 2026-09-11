// src/components/lighthouse/ScoreCircle.tsx
import React from "react";

export default function ScoreCircle({ value = 0, label = "", size = 56 }: { value?: number; label?: string; size?: number }) {
  const v = Math.round(value ?? 0);
  const color = v >= 90 ? "text-green-600 ring-green-100" : v >= 50 ? "text-amber-500 ring-amber-100" : "text-red-500 ring-red-100";
  const diameter = Math.round(size * 0.5);

  return (
    <div className="flex flex-col items-center w-24">
      <div className={`rounded-full w-${diameter} h-${diameter} flex items-center justify-center ring-4 ${color} bg-white shadow-sm`} aria-hidden>
        <span className="font-semibold text-lg">{v}</span>
      </div>
      <div className="text-xs text-slate-600 mt-2 text-center">{label}</div>
    </div>
  );
}
