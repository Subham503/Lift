"use client";

import React, { useState, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { PolicyResult } from "@/lib/types";
import { formatUSD, formatPercent } from "@/lib/format";

interface ParetoPoint {
  policy_id: string;
  cost: number;
  fraud_caught: number;
  label: string;
}

interface ParetoChartProps {
  points: ParetoPoint[];
  policies: PolicyResult[];
}

// Consistent Apple dark palette policy colors (Amber reserved for overrides)
const policyColors: Record<string, string> = {
  do_nothing: "#636366",
  rules: "#BF5AF2",       // Purple
  ml_threshold: "#30D158",// Green
  ml_guarded: "#0A84FF",  // Blue
};

export function ParetoChart({ points, policies }: ParetoChartProps) {
  const shouldReduceMotion = useReducedMotion();
  const [hoveredPoint, setHoveredPoint] = useState<ParetoPoint | null>(null);

  // SVG dimensions with ample margins so labels never clip or overlap ticks
  const width = 720;
  const height = 340;
  const margin = { top: 32, right: 48, bottom: 54, left: 72 };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const maxX = 2200;
  const maxY = 100;

  const scaleX = (val: number) => margin.left + (val / maxX) * innerWidth;
  const scaleY = (val: number) => margin.top + innerHeight - (val / maxY) * innerHeight;

  // Compute Pareto domination for each point
  // A point P is dominated by Q if cost(Q) <= cost(P) and caught(Q) >= caught(P) with at least one strict
  const { nonDominated, dominatedByMap } = useMemo(() => {
    const nonDom: ParetoPoint[] = [];
    const domBy: Record<string, string> = {};

    for (const p of points) {
      let isDominated = false;
      let dominator: ParetoPoint | null = null;

      for (const q of points) {
        if (p.policy_id === q.policy_id) continue;
        if (
          q.cost <= p.cost &&
          q.fraud_caught >= p.fraud_caught &&
          (q.cost < p.cost || q.fraud_caught > p.fraud_caught)
        ) {
          isDominated = true;
          dominator = q;
          break;
        }
      }

      if (isDominated && dominator) {
        domBy[p.policy_id] = dominator.label;
      } else {
        nonDom.push(p);
      }
    }

    return { nonDominated: nonDom, dominatedByMap: domBy };
  }, [points]);

  // Sort non-dominated points by cost to draw the Pareto frontier line ONLY through them
  const frontierSorted = useMemo(() => {
    return [...nonDominated].sort((a, b) => a.cost - b.cost);
  }, [nonDominated]);

  // Build SVG path string only through non-dominated points
  let pathD = "";
  if (frontierSorted.length > 0) {
    pathD = `M ${scaleX(frontierSorted[0].cost)} ${scaleY(frontierSorted[0].fraud_caught)}`;
    for (let i = 1; i < frontierSorted.length; i++) {
      const p = frontierSorted[i];
      pathD += ` L ${scaleX(p.cost)} ${scaleY(p.fraud_caught)}`;
    }
  }

  const getPolicyDetails = (id: string) => {
    return policies.find((p) => p.policy_id === id);
  };

  return (
    <div className="relative w-full overflow-hidden select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div className="text-[13px] font-medium text-[#8E8E93]">
          Pareto frontier: review friction cost vs fraud caught (%)
        </div>
        <div className="flex items-center gap-4 text-[12px] text-[#8E8E93]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-[#0A84FF]" />
            <span>Non-dominated frontier</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full border border-dashed border-[#636366] opacity-60" />
            <span>Dominated policy</span>
          </div>
        </div>
      </div>

      <div className="relative border border-[rgba(255,255,255,0.08)] bg-[#0E0E10] rounded-[10px] p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible font-sans"
        >
          {/* Y-axis Grid lines & tick labels (12px fixed font size, no clipping) */}
          {[0, 25, 50, 75, 100].map((yVal) => (
            <g key={yVal}>
              <line
                x1={margin.left}
                y1={scaleY(yVal)}
                x2={width - margin.right}
                y2={scaleY(yVal)}
                stroke="rgba(255,255,255,0.05)"
                strokeDasharray="4 4"
              />
              <text
                x={margin.left - 12}
                y={scaleY(yVal) + 4}
                textAnchor="end"
                className="fill-[#636366] font-mono tabular-nums"
                style={{ fontSize: "12px" }}
              >
                {yVal}%
              </text>
            </g>
          ))}

          {/* X-axis Grid lines & tick labels */}
          {[0, 500, 1000, 1500, 2000].map((xVal) => (
            <g key={xVal}>
              <line
                x1={scaleX(xVal)}
                y1={margin.top}
                x2={scaleX(xVal)}
                y2={margin.top + innerHeight}
                stroke="rgba(255,255,255,0.05)"
                strokeDasharray="4 4"
              />
              <text
                x={scaleX(xVal)}
                y={margin.top + innerHeight + 22}
                textAnchor="middle"
                className="fill-[#636366] font-mono tabular-nums"
                style={{ fontSize: "12px" }}
              >
                ${xVal}
              </text>
            </g>
          ))}

          {/* X Axis Label */}
          <text
            x={margin.left + innerWidth / 2}
            y={height - 8}
            textAnchor="middle"
            className="fill-[#8E8E93] font-medium"
            style={{ fontSize: "12px" }}
          >
            Review friction cost per 1,000 transactions (USD)
          </text>

          {/* Y Axis Label */}
          <text
            transform={`rotate(-90)`}
            x={-(margin.top + innerHeight / 2)}
            y={22}
            textAnchor="middle"
            className="fill-[#8E8E93] font-medium"
            style={{ fontSize: "12px" }}
          >
            Fraud caught rate (%)
          </text>

          {/* ONE load moment: Frontier path draws in ONLY through non-dominated points */}
          <motion.path
            d={pathD}
            fill="none"
            stroke="#0A84FF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={shouldReduceMotion ? false : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 34,
              duration: 0.6,
            }}
          />

          {/* Policy Dots */}
          {points.map((pt, idx) => {
            const isDominated = !!dominatedByMap[pt.policy_id];
            const isBaseline = pt.policy_id === "do_nothing";
            const isBest = pt.policy_id === "ml_guarded";
            const cx = scaleX(pt.cost);
            const cy = scaleY(pt.fraud_caught);
            const color = policyColors[pt.policy_id] || "#0A84FF";

            return (
              <g
                key={pt.policy_id}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer"
                opacity={isDominated ? 0.4 : 1}
              >
                {/* Outer ring for top policy */}
                {isBest && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r="10"
                    fill="none"
                    stroke="#0A84FF"
                    strokeWidth="1.5"
                    strokeOpacity="0.4"
                  />
                )}

                {/* Point dot landing */}
                <motion.circle
                  cx={cx}
                  cy={cy}
                  r={isBaseline ? "5" : isBest ? "6.5" : "5"}
                  fill={isDominated ? "#161618" : color}
                  stroke={isDominated ? color : "#F5F5F7"}
                  strokeWidth={isDominated ? "2" : "1.5"}
                  strokeDasharray={isDominated ? "3 3" : undefined}
                  initial={
                    shouldReduceMotion
                      ? false
                      : { scale: 0, opacity: 0 }
                  }
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 400,
                    damping: 34,
                    delay: shouldReduceMotion ? 0 : 0.2 + idx * 0.08,
                  }}
                />

                {/* Label text */}
                <text
                  x={cx + (isBaseline ? 12 : isBest ? -12 : 10)}
                  y={cy + (isBaseline ? 4 : isBest ? -12 : -8)}
                  textAnchor={isBest ? "end" : "start"}
                  className="font-medium"
                  style={{
                    fontSize: "12px",
                    fill: isDominated ? "#8E8E93" : "#F5F5F7",
                  }}
                >
                  {isBest ? `\u2605 ${pt.label}` : pt.label}
                  {isDominated && " (dominated)"}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint && (() => {
          const details = getPolicyDetails(hoveredPoint.policy_id);
          const isDominated = !!dominatedByMap[hoveredPoint.policy_id];
          const dominatorName = dominatedByMap[hoveredPoint.policy_id];

          if (!details) return null;
          return (
            <div className="absolute top-4 right-4 p-3 rounded-[8px] bg-[#161618] border border-[rgba(255,255,255,0.12)] shadow-xl max-w-[300px] pointer-events-none z-20">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] font-semibold text-[#F5F5F7]">
                  {details.name}
                </span>
                {isDominated ? (
                  <span className="px-1.5 py-0.2 rounded-[4px] bg-[#FF453A]/15 text-[#FF453A] text-[11px] font-medium">
                    Dominated
                  </span>
                ) : (
                  <span className="px-1.5 py-0.2 rounded-[4px] bg-[#30D158]/15 text-[#30D158] text-[11px] font-medium">
                    Pareto-optimal
                  </span>
                )}
              </div>

              {isDominated && (
                <div className="text-[11px] text-[#FF453A] font-medium mb-1.5">
                  Dominated by {dominatorName}
                </div>
              )}

              <div className="text-[12px] text-[#8E8E93] mb-2 leading-snug">
                {details.description}
              </div>

              <div className="space-y-1 text-[12px] tabular-nums">
                <div className="flex justify-between">
                  <span className="text-[#8E8E93]">Fraud caught:</span>
                  <span className="text-[#F5F5F7] font-medium">
                    {formatPercent(details.metrics.fraud_caught_rate.mean)} [
                    {formatPercent(details.metrics.fraud_caught_rate.lo)},{" "}
                    {formatPercent(details.metrics.fraud_caught_rate.hi)}]
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E8E93]">Net simulated benefit:</span>
                  <span className="text-[#30D158] font-medium">
                    {formatUSD(details.metrics.net_benefit.mean, true)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8E8E93]">Overrides:</span>
                  <span className="text-[#FF9F0A] font-medium">
                    {details.metrics.guardrail_overrides} actions
                  </span>
                </div>
                <div className="flex justify-between text-[#636366] text-[11px] pt-1.5 border-t border-[rgba(255,255,255,0.05)]">
                  <span>Sample size:</span>
                  <span className="whitespace-nowrap">
                    n = {details.metrics.net_benefit.n} (SIMULATED)
                  </span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
