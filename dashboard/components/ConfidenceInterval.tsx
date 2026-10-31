"use client";

import React from "react";
import { formatUSD, formatNumber, formatPercent } from "@/lib/format";

interface ConfidenceIntervalProps {
  lo: number;
  hi: number;
  n: number;
  unit?: string;
  tag?: string;
  className?: string;
}

export function ConfidenceInterval({
  lo,
  hi,
  n,
  unit = "",
  tag = "SIMULATED",
  className = "",
}: ConfidenceIntervalProps) {
  const formatVal = (v: number) => {
    if (unit === "USD") {
      return formatUSD(v, v !== 0);
    }
    if (unit === "%") {
      return formatPercent(v, 1);
    }
    if (unit === "hrs") {
      return `${v.toFixed(1)} hrs`;
    }
    if (unit === "ratio") {
      return v.toFixed(3);
    }
    return `${formatNumber(v)} ${unit}`.trim();
  };

  return (
    <div
      className={`flex flex-col gap-0.5 text-[12px] font-normal text-[#8E8E93] tabular-nums ${className}`}
    >
      <div className="whitespace-nowrap">
        95% CI [{formatVal(lo)}, {formatVal(hi)}]
      </div>
      <div className="flex items-center gap-1.5 text-[11px]">
        <span className="whitespace-nowrap text-[#8E8E93]">
          n = {formatNumber(n)}
        </span>
        <span className="text-[#636366]">&bull;</span>
        <span className="px-1 py-0.2 rounded-[4px] bg-[#1F1F22] text-[#8E8E93] font-mono">
          {tag}
        </span>
      </div>
    </div>
  );
}
