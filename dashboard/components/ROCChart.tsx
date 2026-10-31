"use client";

import React from "react";
import { PolicyResult } from "@/lib/types";

interface ROCChartProps {
  policies: PolicyResult[];
  selectedIds: string[];
}

// Consistent Apple dark palette policy colors (Amber reserved for overrides)
const policyColors: Record<string, string> = {
  do_nothing: "#636366",
  rules: "#BF5AF2",       // Purple
  ml_threshold: "#30D158",// Green
  ml_guarded: "#0A84FF",  // Blue
};

export function ROCChart({ policies, selectedIds }: ROCChartProps) {
  const width = 640;
  const height = 320;
  const margin = { top: 28, right: 32, bottom: 50, left: 64 };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Zoomed relevant operating range for fraud: 0% to 10% FPR
  const maxFpr = 10;
  const maxTpr = 100;

  const scaleX = (fpr: number) =>
    margin.left + (Math.min(fpr, maxFpr) / maxFpr) * innerWidth;
  const scaleY = (tpr: number) =>
    margin.top + innerHeight - (Math.min(tpr, maxTpr) / maxTpr) * innerHeight;

  const filtered = policies.filter((p) => selectedIds.includes(p.policy_id));

  return (
    <div className="w-full bg-[#0E0E10] border border-[rgba(255,255,255,0.08)] rounded-[10px] p-3 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2 px-1">
        <span className="text-[13px] font-medium text-[#8E8E93]">
          ROC overlay: true positive rate vs false positive rate
        </span>
        <span className="text-[11px] font-mono text-[#636366]">
          Clipped at 10% FPR axis max &bull; No vertical closure
        </span>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible font-sans"
      >
        <defs>
          <clipPath id="roc-chart-area">
            <rect
              x={margin.left}
              y={margin.top}
              width={innerWidth}
              height={innerHeight}
            />
          </clipPath>
        </defs>

        {/* Y-axis Grid lines & tick labels (fixed 12px) */}
        {[0, 25, 50, 75, 100].map((tpr) => (
          <g key={tpr}>
            <line
              x1={margin.left}
              y1={scaleY(tpr)}
              x2={width - margin.right}
              y2={scaleY(tpr)}
              stroke="rgba(255,255,255,0.05)"
              strokeDasharray="4 4"
            />
            <text
              x={margin.left - 10}
              y={scaleY(tpr) + 4}
              textAnchor="end"
              className="fill-[#636366] font-mono tabular-nums"
              style={{ fontSize: "12px" }}
            >
              {tpr}%
            </text>
          </g>
        ))}

        {/* X-axis Grid lines & tick labels */}
        {[0, 2, 4, 6, 8, 10].map((fpr) => (
          <g key={fpr}>
            <line
              x1={scaleX(fpr)}
              y1={margin.top}
              x2={scaleX(fpr)}
              y2={margin.top + innerHeight}
              stroke="rgba(255,255,255,0.05)"
              strokeDasharray="4 4"
            />
            <text
              x={scaleX(fpr)}
              y={margin.top + innerHeight + 20}
              textAnchor="middle"
              className="fill-[#636366] font-mono tabular-nums"
              style={{ fontSize: "12px" }}
            >
              {fpr}%
            </text>
          </g>
        ))}

        {/* Axis Labels */}
        <text
          x={margin.left + innerWidth / 2}
          y={height - 8}
          textAnchor="middle"
          className="fill-[#8E8E93] font-medium"
          style={{ fontSize: "12px" }}
        >
          False positive rate (%)
        </text>
        <text
          transform={`rotate(-90)`}
          x={-(margin.top + innerHeight / 2)}
          y={20}
          textAnchor="middle"
          className="fill-[#8E8E93] font-medium"
          style={{ fontSize: "12px" }}
        >
          True positive rate (%)
        </text>

        {/* Curves clipped at chart area */}
        <g clipPath="url(#roc-chart-area)">
          {filtered.map((policy) => {
            const color = policyColors[policy.policy_id] || "#0A84FF";
            const rawPoints = policy.roc_curve || [];

            // Clip points cleanly at maxFpr without drawing a vertical line to (100, 100)
            const clippedPoints: Array<{ fpr: number; tpr: number }> = [];

            for (let i = 0; i < rawPoints.length; i++) {
              const pt = rawPoints[i];
              if (pt.fpr <= maxFpr) {
                clippedPoints.push(pt);
              } else {
                // If previous point was <= maxFpr, interpolate at maxFpr
                if (i > 0) {
                  const prev = rawPoints[i - 1];
                  if (prev.fpr < maxFpr) {
                    const ratio = (maxFpr - prev.fpr) / (pt.fpr - prev.fpr);
                    const interpTpr = prev.tpr + ratio * (pt.tpr - prev.tpr);
                    clippedPoints.push({ fpr: maxFpr, tpr: interpTpr });
                  }
                }
                // Stop! Do not add any points beyond maxFpr
                break;
              }
            }

            if (clippedPoints.length === 0) return null;

            let pathD = `M ${scaleX(clippedPoints[0].fpr)} ${scaleY(clippedPoints[0].tpr)}`;
            for (let i = 1; i < clippedPoints.length; i++) {
              pathD += ` L ${scaleX(clippedPoints[i].fpr)} ${scaleY(clippedPoints[i].tpr)}`;
            }

            // Operating point
            const opFpr = policy.metrics.false_positive_rate.mean;
            const opTpr = policy.metrics.fraud_caught_rate.mean;

            return (
              <g key={policy.policy_id}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={color}
                  strokeWidth={policy.is_baseline ? "1.5" : "2.5"}
                  strokeDasharray={policy.is_baseline ? "4 4" : undefined}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {!policy.is_baseline && opFpr <= maxFpr && (
                  <circle
                    cx={scaleX(opFpr)}
                    cy={scaleY(opTpr)}
                    r="5"
                    fill={color}
                    stroke="#F5F5F7"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-5 mt-3 pt-2.5 border-t border-[rgba(255,255,255,0.05)] text-[12px]">
        {filtered.map((p) => (
          <div key={p.policy_id} className="flex items-center gap-1.5">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: policyColors[p.policy_id] || "#0A84FF" }}
            />
            <span className="text-[#F5F5F7] font-medium">{p.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
