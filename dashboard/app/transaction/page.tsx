"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Filter,
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  Database,
  Lock,
  Layers,
} from "lucide-react";
import { TransactionRecord } from "@/lib/types";
import { formatUSD, formatNumber } from "@/lib/format";
import { DemoBadge } from "@/components/DemoBadge";
import { AuditTimeline } from "@/components/AuditTimeline";

function TransactionContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id");

  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [totalCount, setTotalCount] = useState<number>(2000);
  const [selectedId, setSelectedId] = useState<string | null>(initialId);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDecision, setFilterDecision] = useState("all");
  const [overrideOnly, setOverrideOnly] = useState(false);

  // Load transactions
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (filterDecision !== "all") params.set("status", filterDecision);
    if (overrideOnly) params.set("override", "true");
    params.set("limit", "150");

    fetch(`/api/transactions?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setTransactions(data.items || []);
        if (data.total !== undefined) {
          setTotalCount(data.total);
        }
        if (data.items && data.items.length > 0) {
          if (initialId && data.items.some((t: TransactionRecord) => t.id === initialId)) {
            setSelectedId(initialId);
          } else if (!selectedId) {
            setSelectedId(data.items[0].id);
          }
        }
      })
      .catch(() => {
        // Fallback
      });
  }, [searchQuery, filterDecision, overrideOnly, initialId]);

  const selectTransaction = (id: string) => {
    setSelectedId(id);
    router.replace(`/transaction?id=${id}`, { scroll: false });
  };

  // Keyboard navigation: j/k move, Enter select
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (transactions.length === 0) return;
      const currentIndex = transactions.findIndex((t) => t.id === selectedId);

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = currentIndex < transactions.length - 1 ? currentIndex + 1 : 0;
        selectTransaction(transactions[nextIndex].id);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : transactions.length - 1;
        selectTransaction(transactions[prevIndex].id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [transactions, selectedId]);

  const selectedTx = useMemo(
    () => transactions.find((t) => t.id === selectedId) || transactions[0] || null,
    [transactions, selectedId]
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[rgba(255,255,255,0.08)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[28px] font-semibold tracking-tight text-[#F5F5F7]">
              Transaction inspector
            </h1>
            <DemoBadge detail="2,000 transactions" />
          </div>
          <p className="text-[13px] text-[#8E8E93]">
            Step-by-step audit timelines, observable feature separation, and guardrail veto tracking.
          </p>
        </div>
        <div className="text-[12px] font-mono text-[#636366]">
          Shortcuts: j / k navigate &bull; enter select
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-[10px] bg-[#161618] border border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <Search className="w-4 h-4 text-[#8E8E93] shrink-0" />
          <input
            type="text"
            placeholder="Search by ID (tx_0012), customer, payment method, amount..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-transparent text-[13px] text-[#F5F5F7] placeholder-[#636366] outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Decision Filter */}
          <div className="flex items-center gap-1 text-[12px]">
            {["all", "ALLOW", "BLOCK", "REVIEW"].map((dec) => (
              <button
                key={dec}
                onClick={() => setFilterDecision(dec)}
                className={`px-2.5 py-1 rounded-[6px] transition-colors ${
                  filterDecision === dec
                    ? "bg-[#0A84FF] text-white font-medium"
                    : "bg-[#0E0E10] text-[#8E8E93] hover:text-[#F5F5F7]"
                }`}
              >
                {dec}
              </button>
            ))}
          </div>

          {/* Overrides Only Toggle */}
          <button
            onClick={() => setOverrideOnly(!overrideOnly)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[12px] font-medium border transition-colors ${
              overrideOnly
                ? "bg-[#FF9F0A]/20 border-[#FF9F0A] text-[#FF9F0A]"
                : "bg-[#0E0E10] border-[rgba(255,255,255,0.08)] text-[#8E8E93] hover:text-[#F5F5F7]"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Overrides only</span>
          </button>
        </div>
      </div>

      {/* Two-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Transaction Master List */}
        <div className="lg:col-span-5 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#0E0E10] overflow-hidden max-h-[720px] flex flex-col">
          <div className="p-3 border-b border-[rgba(255,255,255,0.05)] bg-[#161618] text-[12px] font-medium text-[#8E8E93] flex justify-between items-center">
            <span>Showing {formatNumber(transactions.length)} of {formatNumber(totalCount)}</span>
            <span className="font-mono text-[#636366]">Sample size n = {formatNumber(totalCount)}</span>
          </div>

          <div className="divide-y divide-[rgba(255,255,255,0.05)] overflow-y-auto flex-1">
            {transactions.map((tx) => {
              const isSelected = tx.id === selectedTx?.id;
              const hasOverride = tx.guardrail.override;

              return (
                <div
                  key={tx.id}
                  onClick={() => selectTransaction(tx.id)}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#0A84FF]/15 border-l-2 border-[#0A84FF]"
                      : "hover:bg-[#161618]/70"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[13px] font-semibold text-[#F5F5F7]">
                        {tx.id}
                      </span>
                      {hasOverride && (
                        <span className="px-1.5 py-0.2 rounded-[4px] bg-[#FF9F0A]/20 text-[#FF9F0A] text-[10px] font-medium">
                          Override
                        </span>
                      )}
                    </div>
                    <span className="text-[13px] font-semibold text-[#F5F5F7] tabular-nums">
                      {formatUSD(tx.amount, false, true)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[12px] text-[#8E8E93]">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span>{tx.customer_tier}</span>
                      <span className="text-[#636366]">&bull;</span>
                      <span className="uppercase">{tx.payment_method}</span>
                      <span className="text-[#636366]">&bull;</span>
                      <span>{tx.ip_country}</span>
                    </div>

                    <span
                      className={`px-1.5 py-0.2 rounded-[4px] text-[11px] font-medium ${
                        tx.final_decision === "ALLOW"
                          ? "bg-[#30D158]/10 text-[#30D158]"
                          : tx.final_decision === "BLOCK"
                          ? "bg-[#FF453A]/10 text-[#FF453A]"
                          : "bg-[#0A84FF]/10 text-[#0A84FF]"
                      }`}
                    >
                      {tx.final_decision}
                    </span>
                  </div>
                </div>
              );
            })}

            {transactions.length === 0 && (
              <div className="p-8 text-center text-[#8E8E93] text-[13px]">
                No transactions matched your filters.
              </div>
            )}
          </div>
        </div>

        {/* Right: Detailed Audit Inspector */}
        <div className="lg:col-span-7 space-y-4">
          {selectedTx ? (
            <div className="rounded-[14px] bg-[#161618] border border-[rgba(255,255,255,0.08)] p-5 space-y-5">
              {/* Top Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[rgba(255,255,255,0.08)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[18px] font-semibold text-[#F5F5F7]">
                      {selectedTx.id}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-[4px] text-[12px] font-semibold ${
                        selectedTx.final_decision === "ALLOW"
                          ? "bg-[#30D158]/15 text-[#30D158]"
                          : selectedTx.final_decision === "BLOCK"
                          ? "bg-[#FF453A]/15 text-[#FF453A]"
                          : "bg-[#0A84FF]/15 text-[#0A84FF]"
                      }`}
                    >
                      Final: {selectedTx.final_decision}
                    </span>
                  </div>
                  <div className="text-[12px] text-[#8E8E93] mt-1 font-mono">
                    Timestamp: {selectedTx.timestamp} &bull; Customer: {selectedTx.customer_id}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[20px] font-semibold text-[#F5F5F7] tabular-nums">
                    {formatUSD(selectedTx.amount, false, true)}
                  </div>
                  <div className="text-[11px] text-[#8E8E93]">
                    {selectedTx.outcome.is_positive ? (
                      <span className="text-[#FF9F0A] font-medium">True fraud transaction</span>
                    ) : (
                      <span className="text-[#30D158]">Legitimate customer</span>
                    )}
                  </div>
                </div>
              </div>

              {/* State Isolation Boxes: Observable vs Hidden */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Observable (visible to policies) */}
                <div className="p-3 rounded-[8px] bg-[#0E0E10] border border-[rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#0A84FF] mb-2">
                    <Database className="w-3.5 h-3.5" />
                    <span>Observable state (policy input)</span>
                  </div>
                  <pre className="text-[11px] font-mono text-[#8E8E93] overflow-x-auto">
                    {JSON.stringify(selectedTx.observable, null, 2)}
                  </pre>
                </div>

                {/* Hidden (ground truth, masked) */}
                <div className="p-3 rounded-[8px] bg-[#0E0E10] border border-[rgba(255,255,255,0.05)]">
                  <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#FF9F0A] mb-2">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Hidden ground truth (masked from policy)</span>
                  </div>
                  <pre className="text-[11px] font-mono text-[#8E8E93] overflow-x-auto">
                    {JSON.stringify(selectedTx.hidden, null, 2)}
                  </pre>
                </div>
              </div>

              {/* Policy Decision Matrix */}
              <div className="p-3 rounded-[8px] bg-[#0E0E10] border border-[rgba(255,255,255,0.05)]">
                <div className="text-[12px] font-medium text-[#F5F5F7] mb-2 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#8E8E93]" />
                  <span>Paired policy decisions on this event</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[12px] font-mono">
                  <div className="p-2 rounded-[6px] bg-[#161618]">
                    <div className="text-[#636366] text-[10px]">do_nothing</div>
                    <div className="text-[#F5F5F7] font-medium">ALLOW</div>
                  </div>
                  <div className="p-2 rounded-[6px] bg-[#161618]">
                    <div className="text-[#636366] text-[10px]">rules</div>
                    <div className="text-[#F5F5F7] font-medium">
                      {(selectedTx.policies.rules as any)?.decision || "ALLOW"}
                    </div>
                  </div>
                  <div className="p-2 rounded-[6px] bg-[#161618]">
                    <div className="text-[#636366] text-[10px]">ml_threshold</div>
                    <div className="text-[#F5F5F7] font-medium">
                      {(selectedTx.policies.ml_threshold as any)?.decision || "ALLOW"}
                    </div>
                  </div>
                  <div className="p-2 rounded-[6px] bg-[#161618] border border-[#0A84FF]/30">
                    <div className="text-[#0A84FF] text-[10px]">ml_guarded</div>
                    <div className="text-[#F5F5F7] font-medium">
                      {selectedTx.final_decision}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chronological Audit Timeline */}
              <div>
                <div className="text-[14px] font-semibold text-[#F5F5F7] mb-3">
                  Chronological audit trace (RULES.md §8)
                </div>
                <AuditTimeline transaction={selectedTx} />
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-[#8E8E93] text-[13px] rounded-[14px] bg-[#161618] border border-[rgba(255,255,255,0.08)]">
              Select a transaction to inspect its audit trace.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TransactionPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-[#8E8E93] text-[13px]">
          Loading transaction inspector...
        </div>
      }
    >
      <TransactionContent />
    </Suspense>
  );
}
