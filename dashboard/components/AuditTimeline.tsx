"use client";

import React, { useState } from "react";
import {
  ArrowDownCircle,
  Cpu,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Database,
} from "lucide-react";
import { AuditStep, TransactionRecord } from "@/lib/types";

interface AuditTimelineProps {
  transaction: TransactionRecord;
}

function toSentenceCase(str: string): string {
  const clean = str.replace(/_/g, " ").toLowerCase();
  return clean.charAt(0).toUpperCase() + clean.slice(1);
}

export function AuditTimeline({ transaction }: AuditTimelineProps) {
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({
    3: true,
    4: true,
    5: true,
  });

  const toggleStep = (stepNum: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepNum]: !prev[stepNum],
    }));
  };

  const getStepIcon = (phase: string, override?: boolean) => {
    switch (phase) {
      case "INPUT_RECEIVED":
        return <ArrowDownCircle className="w-4 h-4 text-[#0A84FF]" />;
      case "FEATURES_EXTRACTED":
        return <Database className="w-4 h-4 text-[#8E8E93]" />;
      case "POLICY_EVALUATED":
        return <Cpu className="w-4 h-4 text-[#0A84FF]" />;
      case "GUARDRAIL_APPLIED":
        return override ? (
          <ShieldAlert className="w-4 h-4 text-[#FF9F0A]" />
        ) : (
          <ShieldCheck className="w-4 h-4 text-[#30D158]" />
        );
      case "FINAL_ACTION":
        return <CheckCircle2 className="w-4 h-4 text-[#0A84FF]" />;
      case "OUTCOME_RESOLVED":
        return transaction.outcome.is_positive ? (
          <AlertTriangle className="w-4 h-4 text-[#FF9F0A]" />
        ) : (
          <CheckCircle2 className="w-4 h-4 text-[#30D158]" />
        );
      default:
        return <Cpu className="w-4 h-4 text-[#8E8E93]" />;
    }
  };

  return (
    <div className="space-y-3">
      {transaction.audit_steps.map((step) => {
        const isExpanded = !!expandedSteps[step.step];
        const isOverride = !!step.override;

        return (
          <div
            key={step.step}
            className={`rounded-[10px] border transition-colors ${
              isOverride
                ? "bg-[#161618] border-[#FF9F0A]/40"
                : "bg-[#161618] border-[rgba(255,255,255,0.08)]"
            }`}
          >
            {/* Header */}
            <button
              onClick={() => toggleStep(step.step)}
              className="w-full flex items-center justify-between p-3 text-left focus-visible:ring-2 focus-visible:ring-[#0A84FF] rounded-[10px]"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-[6px] flex items-center justify-center ${
                    isOverride
                      ? "bg-[#FF9F0A]/15 text-[#FF9F0A]"
                      : "bg-[#1F1F22] text-[#8E8E93]"
                  }`}
                >
                  {getStepIcon(step.phase, step.override)}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#636366]">
                      Step {step.step}: {toSentenceCase(step.phase)}
                    </span>
                    {isOverride && (
                      <span className="px-1.5 py-0.2 rounded-[4px] bg-[#FF9F0A]/20 text-[#FF9F0A] text-[11px] font-medium">
                        Guardrail override
                      </span>
                    )}
                  </div>
                  <div className="text-[13px] font-medium text-[#F5F5F7] mt-0.5">
                    {step.title}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[#8E8E93]">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </div>
            </button>

            {/* Expanded Body */}
            {isExpanded && (
              <div className="px-3 pb-3 pt-1 border-t border-[rgba(255,255,255,0.05)] text-[12px]">
                <p className="text-[#8E8E93] mb-2">{step.detail}</p>

                {isOverride && (
                  <div className="p-2.5 rounded-[6px] bg-[#FF9F0A]/10 border border-[#FF9F0A]/30 text-[#F5F5F7] mb-2">
                    <div className="text-[11px] font-semibold text-[#FF9F0A] mb-1">
                      Override reason and veto log
                    </div>
                    <div>{transaction.guardrail.reason}</div>
                    <div className="text-[11px] text-[#8E8E93] mt-1 font-mono">
                      Rule: {transaction.guardrail.rule_name} &bull; Verdict:{" "}
                      {transaction.guardrail.verdict}
                    </div>
                  </div>
                )}

                {step.data && (
                  <div className="mt-1">
                    <div className="text-[11px] font-mono text-[#636366] mb-1">
                      Payload data:
                    </div>
                    <pre className="p-2 rounded-[6px] bg-[#0E0E10] border border-[rgba(255,255,255,0.05)] text-[#8E8E93] font-mono text-[11px] overflow-x-auto max-h-[160px]">
                      {JSON.stringify(step.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
