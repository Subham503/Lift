"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PolicyResult, RunData } from "@/lib/types";
import { formatUSD, formatPercent, formatNumber } from "@/lib/format";
import fixtureRuns from "@/fixtures/runs.json";
import { DemoBadge } from "@/components/DemoBadge";
import { ConfidenceInterval } from "@/components/ConfidenceInterval";
import { ROCChart } from "@/components/ROCChart";
import { Check, ShieldCheck, CheckCircle2 } from "lucide-react";

function PoliciesContent() {
  const searchParams = useSearchParams();
  const highlightedPolicy = searchParams.get("policy");

  const [runs, setRuns] = useState<RunData[]>(fixtureRuns as RunData[]);

  useEffect(() => {
    fetch("/api/runs")
      .then((res) => res.json())
      .then((data: RunData[]) => {
        if (data && data.length > 0) setRuns(data);
      })
      .catch(() => {});
  }, []);

  const run = runs[0];
  const policies = run ? run.policies : [];

  // Default selection: compare Rules, ML Threshold, and ML Guarded
  const [selectedIds, setSelectedIds] = useState<string[]>(
    highlightedPolicy
      ? ["do_nothing", highlightedPolicy]
      : ["rules", "ml_threshold", "ml_guarded"]
  );

  const togglePolicy = (id: string) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter((p) => p !== id));
      }
    } else {
      if (selectedIds.length < 4) {
        setSelectedIds([...selectedIds, id]);
      }
    }
  };

  const selectedPolicies = useMemo(
    () => policies.filter((p) => selectedIds.includes(p.policy_id)),
    [policies, selectedIds]
  );

  const baseline = policies.find((p) => p.is_baseline) || policies[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(255,255,255,0.08)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[28px] font-semibold tracking-tight text-[#F5F5F7]">
              Policy comparisons
            </h1>
            <DemoBadge />
          </div>
          <p className="text-[13px] text-[#8E8E93]">
            Side-by-side trade-off analysis, ROC curves, and paired confidence intervals.
          </p>
        </div>

        <div className="text-[12px] font-mono text-[#8E8E93]">
          Run: {run?.run_id} &bull; n = {run?.sample_size_n.toLocaleString()}
        </div>
      </div>

      {/* Policy Selection Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[12px] font-medium text-[#8E8E93] mr-1">
          Select policies to compare:
        </span>
        {policies.map((p) => {
          const isSelected = selectedIds.includes(p.policy_id);
          return (
            <button
              key={p.policy_id}
              onClick={() => togglePolicy(p.policy_id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors border focus-visible:ring-2 focus-visible:ring-[#0A84FF] ${
                isSelected
                  ? "bg-[#0A84FF]/15 border-[#0A84FF] text-[#F5F5F7]"
                  : "bg-[#161618] border-[rgba(255,255,255,0.08)] text-[#8E8E93] hover:text-[#F5F5F7] hover:bg-[#1F1F22]"
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center ${
                  isSelected
                    ? "bg-[#0A84FF] border-[#0A84FF] text-white"
                    : "border-[#636366]"
                }`}
              >
                {isSelected && <Check className="w-2.5 h-2.5" />}
              </div>
              <span>{p.name}</span>
            </button>
          );
        })}
      </div>

      {/* ROC Overlay Chart */}
      <div className="space-y-2">
        <ROCChart policies={policies} selectedIds={selectedIds} />
      </div>

      {/* Side-by-Side Metric Diff Table */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-[#F5F5F7]">
            Side-by-side metric comparison
          </h3>
          <span className="text-[12px] text-[#8E8E93]">
            All metrics tagged SIMULATED &bull; 95% bootstrap CI
          </span>
        </div>

        <div className="overflow-x-auto rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#0E0E10]">
          <table className="w-full text-left text-[13px] tabular-nums">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)] bg-[#161618] text-[#8E8E93] text-[12px]">
                <th className="py-3 px-4 font-medium w-1/4">Metric</th>
                {selectedPolicies.map((p) => (
                  <th key={p.policy_id} className="py-3 px-4 font-medium">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#F5F5F7] font-semibold">{p.name}</span>
                      {p.is_baseline && (
                        <span className="px-1.5 py-0.2 rounded-[4px] bg-[#1F1F22] text-[#8E8E93] text-[10px]">
                          baseline
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
              {/* Merged Row: Net Simulated Lift Over Baseline */}
              <tr className="hover:bg-[#161618]/50">
                <td className="py-3 px-4 text-[#8E8E93] font-medium">
                  <div>Net simulated lift over baseline</div>
                  <div className="text-[11px] text-[#636366]">Paired difference vs do-nothing baseline (USD)</div>
                </td>
                {selectedPolicies.map((p) => {
                  const isGain = p.metrics.lift_vs_baseline.mean > 0;
                  return (
                    <td key={p.policy_id} className="py-3 px-4">
                      <div
                        className={`text-[15px] font-semibold ${
                          isGain ? "text-[#30D158]" : "text-[#F5F5F7]"
                        }`}
                      >
                        {p.is_baseline
                          ? "$0.00 (reference) (SIMULATED)"
                          : formatUSD(p.metrics.lift_vs_baseline.mean, true)}
                      </div>
                      <ConfidenceInterval
                        lo={p.metrics.lift_vs_baseline.lo}
                        hi={p.metrics.lift_vs_baseline.hi}
                        n={p.metrics.lift_vs_baseline.n}
                        unit="USD"
                        className="mt-1"
                      />
                    </td>
                  );
                })}
              </tr>

              {/* Row 3: Fraud Caught Rate */}
              <tr className="hover:bg-[#161618]/50">
                <td className="py-3 px-4 text-[#8E8E93] font-medium">
                  <div>Fraud caught rate (Recall)</div>
                  <div className="text-[11px] text-[#636366]">Share of true fraud identified</div>
                </td>
                {selectedPolicies.map((p) => (
                  <td key={p.policy_id} className="py-3 px-4">
                    <div className="text-[15px] font-semibold text-[#F5F5F7]">
                      {p.metrics.fraud_caught_rate.mean.toFixed(1)}%
                    </div>
                    <ConfidenceInterval
                      lo={p.metrics.fraud_caught_rate.lo}
                      hi={p.metrics.fraud_caught_rate.hi}
                      n={p.metrics.fraud_caught_rate.n}
                      unit="%"
                      className="mt-0.5"
                    />
                  </td>
                ))}
              </tr>

              {/* Row 4: False Positive Rate */}
              <tr className="hover:bg-[#161618]/50">
                <td className="py-3 px-4 text-[#8E8E93] font-medium">
                  <div>False positive rate (FPR)</div>
                  <div className="text-[11px] text-[#636366]">Innocent customers stopped/delayed</div>
                </td>
                {selectedPolicies.map((p) => {
                  const isHigh = p.metrics.false_positive_rate.mean > 2.0;
                  return (
                    <td key={p.policy_id} className="py-3 px-4">
                      <div
                        className={`text-[15px] font-semibold ${
                          isHigh ? "text-[#FF453A]" : "text-[#F5F5F7]"
                        }`}
                      >
                        {p.metrics.false_positive_rate.mean.toFixed(2)}%
                      </div>
                      <ConfidenceInterval
                        lo={p.metrics.false_positive_rate.lo}
                        hi={p.metrics.false_positive_rate.hi}
                        n={p.metrics.false_positive_rate.n}
                        unit="%"
                        className="mt-0.5"
                      />
                    </td>
                  );
                })}
              </tr>

              {/* Row 5: Review Queue Friction */}
              <tr className="hover:bg-[#161618]/50">
                <td className="py-3 px-4 text-[#8E8E93] font-medium">
                  <div>Review load friction</div>
                  <div className="text-[11px] text-[#636366]">Total manual review hours required</div>
                </td>
                {selectedPolicies.map((p) => (
                  <td key={p.policy_id} className="py-3 px-4">
                    <div className="text-[15px] font-medium text-[#F5F5F7]">
                      {p.metrics.review_load_hours.mean.toFixed(1)} hrs
                    </div>
                    <ConfidenceInterval
                      lo={p.metrics.review_load_hours.lo}
                      hi={p.metrics.review_load_hours.hi}
                      n={p.metrics.review_load_hours.n}
                      unit="hrs"
                      className="mt-0.5"
                    />
                  </td>
                ))}
              </tr>

              {/* Row 6: Guardrail Overrides */}
              <tr className="hover:bg-[#161618]/50">
                <td className="py-3 px-4 text-[#8E8E93] font-medium">
                  <div>Guardrail overrides</div>
                  <div className="text-[11px] text-[#636366]">Actions vetoed or adjusted by safety rails</div>
                </td>
                {selectedPolicies.map((p) => (
                  <td key={p.policy_id} className="py-3 px-4">
                    {p.metrics.guardrail_overrides > 0 ? (
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] bg-[#FF9F0A]/15 text-[#FF9F0A] font-semibold">
                        <span>{p.metrics.guardrail_overrides} overrides</span>
                      </div>
                    ) : (
                      <span className="text-[#636366] font-mono">0</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row 7: Attribution Invariant */}
              <tr className="hover:bg-[#161618]/50">
                <td className="py-3 px-4 text-[#8E8E93] font-medium">
                  <div>Attribution check (RULES.md §9)</div>
                  <div className="text-[11px] text-[#636366]">Invariant: lift &le; attributed benefit</div>
                </td>
                {selectedPolicies.map((p) => {
                  const pass = p.metrics.lift_vs_baseline.mean <= p.metrics.attributed_benefit;
                  return (
                    <td key={p.policy_id} className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-[12px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#30D158]" />
                        <span className="text-[#30D158] font-medium">
                          {pass ? "Verified" : "Failed"}
                        </span>
                        <span className="text-[#636366]">
                          (Attributed: {formatUSD(p.metrics.attributed_benefit, true)})
                        </span>
                      </div>
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function PoliciesPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-[#8E8E93] text-[13px]">
          Loading policy comparisons...
        </div>
      }
    >
      <PoliciesContent />
    </Suspense>
  );
}
