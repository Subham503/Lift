"use client";

import React from "react";
import { ConfidenceInterval } from "./ConfidenceInterval";
import { formatNumber } from "@/lib/format";

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  lo?: number;
  hi?: number;
  n?: number;
  tag?: string;
  badgeText?: string;
  badgeVariant?: "gain" | "loss" | "neutral" | "override";
  subtitle?: string;
  className?: string;
}

export function MetricCard({
  title,
  value,
  unit = "",
  lo,
  hi,
  n,
  tag = "SIMULATED",
  badgeText,
  badgeVariant = "neutral",
  subtitle,
  className = "",
}: MetricCardProps) {
  const badgeClasses = {
    gain: "bg-[#30D158]/10 text-[#30D158]",
    loss: "bg-[#FF453A]/10 text-[#FF453A]",
    override: "bg-[#FF9F0A]/10 text-[#FF9F0A]",
    neutral: "bg-[#1F1F22] text-[#8E8E93]",
  }[badgeVariant];

  const formattedValue =
    typeof value === "number" ? formatNumber(value) : value;

  return (
    <div
      className={`p-4 rounded-[10px] bg-[#161618] border border-[rgba(255,255,255,0.08)] flex flex-col justify-between ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-medium text-[#8E8E93]">{title}</span>
        {badgeText && (
          <span
            className={`text-[12px] font-medium tabular-nums px-1.5 py-0.5 rounded-[6px] ${badgeClasses}`}
          >
            {badgeText}
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-[28px] font-semibold text-[#F5F5F7] tabular-nums tracking-tight">
          {formattedValue}
        </span>
        {unit && unit !== "USD" && (
          <span className="text-[13px] font-normal text-[#8E8E93]">{unit}</span>
        )}
      </div>

      {lo !== undefined && hi !== undefined && n !== undefined ? (
        <ConfidenceInterval lo={lo} hi={hi} n={n} unit={unit} tag={tag} />
      ) : subtitle ? (
        <div className="text-[12px] text-[#8E8E93]">{subtitle}</div>
      ) : null}
    </div>
  );
}
