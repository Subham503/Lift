"use client";

import React from "react";

interface DemoBadgeProps {
  className?: string;
  detail?: string;
}

export function DemoBadge({ className = "", detail }: DemoBadgeProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-[#161618] border border-[rgba(255,255,255,0.08)] text-[12px] font-medium text-[#8E8E93] tabular-nums select-none ${className}`}
      title="Demo data: simulated fixture. Not real production results."
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#FF9F0A] animate-pulse" />
      <span>Demo data</span>
      {detail && <span className="text-[#636366]">({detail})</span>}
    </div>
  );
}

