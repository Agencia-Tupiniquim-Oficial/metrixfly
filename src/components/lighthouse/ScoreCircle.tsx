// src/components/lighthouse/ScoreCircle.tsx
import React from "react";

export default function ScoreCircle({ value = 0, label = "", size = 56 }: { value?: number; label?: string; size?: number }) {
  const v = Math.round(value ?? 0);
  const color = v >= 90 ? "text-green-600 ring-green-100" : v >= 50 ? "text-amber-500 ring-amber-100" : "text-red-500 ring-red-100";
  const diameter = size;
  const numberFont = Math.max(14, Math.round(diameter * 0.45));
  const labelFont = Math.max(10, Math.round(diameter * 0.15));

  return (
    <div style={{ minWidth: diameter }} className="flex flex-col items-center">
      <div
        aria-hidden
        className={`rounded-full flex items-center justify-center ring-4 ${color} bg-white shadow-sm`}
        style={{ width: diameter, height: diameter }}
      >
        <span style={{ fontSize: numberFont, lineHeight: 1 }} className="font-semibold">{v}</span>
      </div>
      <div style={{ fontSize: labelFont }} className="text-slate-600 mt-2 text-center">{label}</div>
    </div>
  );
}
