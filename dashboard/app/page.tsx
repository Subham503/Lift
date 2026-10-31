import React from "react";
import Link from "next/link";
import { getRuns } from "@/lib/results";
import { formatUSD, formatNumber, formatPercent } from "@/lib/format";
import { DemoBadge } from "@/components/DemoBadge";
import { ConfidenceInterval } from "@/components/ConfidenceInterval";
import { MetricCard } from "@/components/MetricCard";
import { ParetoChart } from "@/components/ParetoChart";
import { ArrowUpRight, ShieldCheck, CheckCircle2 } from "lucide-react";

export default function OverviewPage() {
  const runs = getRuns();
  const run = runs[0]; // Primary baseline run

  if (!run) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-[20px] font-semibold text-[#F5F5F7] mb-2">No runs yet</h2>
        <p className="text-[13px] text-[#8E8E93] mb-4">
          Run python scripts/dev.py simulate to generate your first evaluation.
        </p>
      </div>
    );
  }

  const bestPolicy = run.policies.find((p) => p.policy_id === "ml_guarded") || run.policies[run.policies.length - 1];
  const baseline = run.policies.find((p) => p.is_baseline) || run.policies[0];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[rgba(255,255,255,0.08)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[28px] font-semibold tracking-tight text-[#F5F5F7]">
              Simulation overview
            </h1>
            <DemoBadge />
          </div>
          <p className="text-[13px] text-[#8E8E93]">
            Paired evaluation of fraud decision policies against do-nothing and tuned rule baselines.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[12px] font-mono text-[#8E8E93]">
          <span className="px-2 py-1 rounded-[6px] bg-[#161618] border border-[rgba(255,255,255,0.08)]">
            Run: {run.run_id}
          </span>
          <span className="px-2 py-1 rounded-[6px] bg-[#161618] border border-[rgba(255,255,255,0.08)]">
            Seed: {run.seed} ({run.seeds_evaluated} paired seeds)
          </span>
        </div>
      </div>

      {/* Headline Answer First */}
      <div className="p-5 rounded-[14px] bg-[#161618] border border-[rgba(255,255,255,0.08)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-[12px] font-medium text-[#0A84FF] uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              <span>Highest net benefit policy</span>
            </div>
            <h2 className="text-[20px] font-semibold text-[#F5F5F7] mt-0.5">
              {bestPolicy.name}
            </h2>
            <p className="text-[13px] text-[#8E8E93] mt-1">
              {bestPolicy.description}
            </p>
          </div>

          <Link
            href="/policies"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-[#0A84FF] hover:underline self-start sm:self-center"
          >
            <span>Compare all policies</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* 4 Metric cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <MetricCard
            title="Measured net lift"
            value={formatUSD(bestPolicy.metrics.lift_vs_baseline.mean, true)}
            unit="USD"
            lo={bestPolicy.metrics.lift_vs_baseline.lo}
            hi={bestPolicy.metrics.lift_vs_baseline.hi}
            n={bestPolicy.metrics.lift_vs_baseline.n}
            badgeText="vs baseline"
            badgeVariant="gain"
          />

          <MetricCard
            title="Fraud caught rate"
            value={formatPercent(bestPolicy.metrics.fraud_caught_rate.mean)}
            unit="%"
            lo={bestPolicy.metrics.fraud_caught_rate.lo}
            hi={bestPolicy.metrics.fraud_caught_rate.hi}
            n={bestPolicy.metrics.fraud_caught_rate.n}
            badgeText="Top recall"
            badgeVariant="gain"
          />

          <MetricCard
            title="False positive rate"
            value={formatPercent(bestPolicy.metrics.false_positive_rate.mean, 2)}
            unit="%"
            lo={bestPolicy.metrics.false_positive_rate.lo}
            hi={bestPolicy.metrics.false_positive_rate.hi}
            n={bestPolicy.metrics.false_positive_rate.n}
            badgeText="Low friction"
            badgeVariant="neutral"
          />

          <MetricCard
            title="Guardrail overrides"
            value={formatNumber(bestPolicy.metrics.guardrail_overrides)}
            subtitle={`${((bestPolicy.metrics.guardrail_overrides / bestPolicy.metrics.lift_vs_baseline.n) * 100).toFixed(2)}% of transactions intercepted`}
            badgeText="Active rail"
            badgeVariant="override"
          />
        </div>
      </div>

      {/* Hero: Pareto Frontier Chart */}
      <div className="space-y-2">
        <ParetoChart points={run.pareto_frontier} policies={run.policies} />
      </div>

      {/* Compact Run Summary */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[15px] font-semibold text-[#F5F5F7]">
            Candidate policies evaluated (n = {formatNumber(run.sample_size_n)} transactions per seed)
          </h3>
          <span className="text-[12px] font-mono text-[#8E8E93]">
            Scenario: {run.scenario}
          </span>
        </div>

        <div className="overflow-x-auto rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#0E0E10]">
          <table className="w-full text-left text-[13px] tabular-nums">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)] bg-[#161618] text-[#8E8E93] text-[12px]">
                <th className="py-2.5 px-3 font-medium">Policy</th>
                <th className="py-2.5 px-3 font-medium">Type</th>
                <th className="py-2.5 px-3 font-medium">Net benefit (USD)</th>
                <th className="py-2.5 px-3 font-medium">Fraud caught (%)</th>
                <th className="py-2.5 px-3 font-medium">False positive rate (%)</th>
                <th className="py-2.5 px-3 font-medium">Review load</th>
                <th className="py-2.5 px-3 font-medium text-right">Overrides</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
              {run.policies.map((p) => {
                const isWinner = p.policy_id === "ml_guarded";
                return (
                  <tr
                    key={p.policy_id}
                    className={`hover:bg-[#161618]/70 transition-colors ${
                      isWinner ? "bg-[#0A84FF]/5" : ""
                    }`}
                  >
                    <td className="py-3 px-3 font-medium text-[#F5F5F7]">
                      <div className="flex items-center gap-2">
                        {isWinner && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#30D158] shrink-0" />
                        )}
                        <span>{p.name}</span>
                        {p.is_baseline && (
                          <span className="px-1.5 py-0.2 rounded-[4px] bg-[#1F1F22] text-[#8E8E93] text-[11px]">
                            baseline
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[#8E8E93] text-[12px] capitalize">
                      {p.type}
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-[#F5F5F7]">
                        {formatUSD(p.metrics.net_benefit.mean, p.metrics.net_benefit.mean > 0)}
                      </div>
                      <div className="text-[11px] text-[#636366]">
                        95% CI [{formatUSD(p.metrics.net_benefit.lo, p.metrics.net_benefit.lo > 0)}, {formatUSD(p.metrics.net_benefit.hi, p.metrics.net_benefit.hi > 0)}] (SIMULATED)
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-[#F5F5F7]">
                        {formatPercent(p.metrics.fraud_caught_rate.mean)}
                      </div>
                      <div className="text-[11px] text-[#636366]">
                        [{formatPercent(p.metrics.fraud_caught_rate.lo)}, {formatPercent(p.metrics.fraud_caught_rate.hi)}]
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-[#F5F5F7]">
                        {formatPercent(p.metrics.false_positive_rate.mean, 2)}
                      </div>
                      <div className="text-[11px] text-[#636366]">
                        [{formatPercent(p.metrics.false_positive_rate.lo, 2)}, {formatPercent(p.metrics.false_positive_rate.hi, 2)}]
                      </div>
                    </td>
                    <td className="py-3 px-3 text-[#8E8E93]">
                      {p.metrics.review_load_hours.mean.toFixed(1)} hrs
                    </td>
                    <td className="py-3 px-3 text-right">
                      {p.metrics.guardrail_overrides > 0 ? (
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#FF9F0A]/15 text-[#FF9F0A] font-mono text-[12px] font-medium">
                          {p.metrics.guardrail_overrides}
                        </span>
                      ) : (
                        <span className="text-[#636366] font-mono text-[12px]">0</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
