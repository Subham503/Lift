"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table";
import { motion, AnimatePresence } from "framer-motion";
import {
  PlayCircle,
  X,
  ShieldCheck,
  Hash,
  Sliders,
  Calendar,
  Layers,
  CheckCircle2,
  ChevronRight,
  ArrowUpDown,
} from "lucide-react";
import { RunData } from "@/lib/types";
import { formatUSD, formatNumber } from "@/lib/format";
import fixtureRuns from "@/fixtures/runs.json";
import { DemoBadge } from "@/components/DemoBadge";
import { ConfidenceInterval } from "@/components/ConfidenceInterval";

const columnHelper = createColumnHelper<RunData>();

function RunsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRunId = searchParams.get("run");

  const [runs, setRuns] = useState<RunData[]>(fixtureRuns as RunData[]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(
    initialRunId || (fixtureRuns[0] ? fixtureRuns[0].run_id : null)
  );
  const [sorting, setSorting] = useState<SortingState>([
    { id: "created_at", desc: true },
  ]);

  // Load runs from API or lib
  useEffect(() => {
    fetch("/api/runs")
      .then((res) => res.json())
      .then((data: RunData[]) => {
        setRuns(data);
        if (data.length > 0 && !selectedRunId) {
          if (initialRunId && data.some((r) => r.run_id === initialRunId)) {
            setSelectedRunId(initialRunId);
          } else {
            setSelectedRunId(data[0].run_id);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load runs", err);
      });
  }, [initialRunId, selectedRunId]);

  // Handle URL sync
  const selectRun = (id: string | null) => {
    setSelectedRunId(id);
    if (id) {
      router.replace(`/runs?run=${id}`, { scroll: false });
    } else {
      router.replace(`/runs`, { scroll: false });
    }
  };

  // Keyboard navigation: j/k move, Enter select, Esc close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if inside input
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === "Escape") {
        selectRun(null);
        return;
      }

      if (runs.length === 0) return;

      const currentIndex = runs.findIndex((r) => r.run_id === selectedRunId);

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = currentIndex < runs.length - 1 ? currentIndex + 1 : 0;
        selectRun(runs[nextIndex].run_id);
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : runs.length - 1;
        selectRun(runs[prevIndex].run_id);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [runs, selectedRunId]);

  const selectedRun = useMemo(
    () => runs.find((r) => r.run_id === selectedRunId) || null,
    [runs, selectedRunId]
  );

  // Table columns
  const columns = useMemo(
    () => [
      columnHelper.accessor("run_id", {
        header: ({ column }) => (
          <button
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="flex items-center gap-1 hover:text-[#F5F5F7] transition-colors"
          >
            <span>Run ID</span>
            <ArrowUpDown className="w-3 h-3 text-[#636366]" />
          </button>
        ),
        cell: (info) => (
          <div className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-[#0A84FF] shrink-0" />
            <span className="font-mono text-[12px] font-medium text-[#F5F5F7]">
              {info.getValue()}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor("scenario", {
        header: "Scenario",
        cell: (info) => (
          <span className="text-[12px] text-[#8E8E93] font-mono">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor("created_at", {
        header: "Date",
        cell: (info) => {
          const d = new Date(info.getValue());
          return (
            <span className="text-[12px] text-[#8E8E93]">
              {d.toLocaleDateString()} {d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          );
        },
      }),
      columnHelper.accessor("sample_size_n", {
        header: "Sample (n)",
        cell: (info) => (
          <span className="text-[12px] text-[#8E8E93] tabular-nums font-mono whitespace-nowrap">
            {formatNumber(info.getValue())} / seed
          </span>
        ),
      }),
      columnHelper.display({
        id: "best_policy",
        header: "Top Policy",
        cell: (info) => {
          const run = info.row.original;
          const top = run.policies.find((p) => p.policy_id === "ml_guarded") || run.policies[run.policies.length - 1];
          const benefitStr = formatUSD(top.metrics.net_benefit.mean, true);
          return (
            <div
              className="flex items-center gap-1.5 max-w-[220px]"
              title={`${top.name} (${benefitStr})`}
            >
              <span className="text-[12px] text-[#30D158] font-medium whitespace-nowrap">
                {benefitStr}
              </span>
              <span className="text-[11px] text-[#8E8E93] truncate">
                ({top.name})
              </span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: "overrides",
        header: "Overrides",
        cell: (info) => {
          const run = info.row.original;
          const top = run.policies.find((p) => p.policy_id === "ml_guarded");
          const count = top ? top.metrics.guardrail_overrides : 0;
          return count > 0 ? (
            <span className="px-1.5 py-0.5 rounded-[4px] bg-[#FF9F0A]/15 text-[#FF9F0A] text-[11px] font-mono font-medium">
              {count}
            </span>
          ) : (
            <span className="text-[#636366] text-[11px] font-mono">0</span>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: runs,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[rgba(255,255,255,0.08)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[28px] font-semibold tracking-tight text-[#F5F5F7]">
              Simulation runs
            </h1>
            <DemoBadge />
          </div>
          <p className="text-[13px] text-[#8E8E93]">
            Inspection browser for serialized evaluation runs, configs, and cryptographic digests.
          </p>
        </div>
        <div className="text-[12px] text-[#636366] font-mono">
          Shortcuts: j / k navigate &bull; esc close
        </div>
      </div>

      {/* Three-Pane Finder Layout: List on left, Slide-in detail on right */}
      <div className="flex gap-4 items-start relative min-h-[560px]">
        {/* Runs List Table */}
        <div
          className={`transition-all duration-200 ${
            selectedRun ? "w-full lg:w-1/2" : "w-full"
          }`}
        >
          <div className="rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#0E0E10] overflow-hidden">
            <table className="w-full text-left text-[13px] tabular-nums">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    key={headerGroup.id}
                    className="border-b border-[rgba(255,255,255,0.08)] bg-[#161618] text-[#8E8E93] text-[12px]"
                  >
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="py-2.5 px-3 font-medium">
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </th>
                    ))}
                    <th className="py-2.5 px-3 font-medium text-right w-8" />
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.05)]">
                {table.getRowModel().rows.map((row) => {
                  const isSelected = row.original.run_id === selectedRunId;
                  return (
                    <tr
                      key={row.id}
                      onClick={() => selectRun(row.original.run_id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-[#0A84FF]/15 border-l-2 border-[#0A84FF]"
                          : "hover:bg-[#161618]/70"
                      }`}
                    >
                      {row.getVisibleCells().map((cell) => (
                        <td key={cell.id} className="py-3 px-3">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </td>
                      ))}
                      <td className="py-3 px-3 text-right">
                        <ChevronRight
                          className={`w-4 h-4 transition-transform ${
                            isSelected
                              ? "text-[#0A84FF] translate-x-0.5"
                              : "text-[#636366]"
                          }`}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Slide-in Detail Pane (Finder-style) */}
        <AnimatePresence mode="wait">
          {selectedRun && (
            <motion.div
              key={selectedRun.run_id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 34,
              }}
              className="w-full lg:w-1/2 rounded-[14px] bg-[#161618] border border-[rgba(255,255,255,0.1)] p-5 space-y-5 sticky top-6 max-h-[calc(100vh-100px)] overflow-y-auto"
            >
              {/* Detail Header */}
              <div className="flex items-start justify-between pb-3 border-b border-[rgba(255,255,255,0.08)]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[14px] font-semibold text-[#F5F5F7]">
                      {selectedRun.run_id}
                    </span>
                    <span className="px-2 py-0.5 rounded-[4px] bg-[#0A84FF]/15 text-[#0A84FF] text-[11px] font-mono">
                      {selectedRun.pack}
                    </span>
                  </div>
                  <div className="text-[12px] text-[#8E8E93] mt-1">
                    {selectedRun.scenario_description}
                  </div>
                </div>

                <button
                  onClick={() => selectRun(null)}
                  className="p-1.5 rounded-[6px] hover:bg-[#1F1F22] text-[#8E8E93] hover:text-[#F5F5F7] transition-colors focus-visible:ring-2 focus-visible:ring-[#0A84FF]"
                  title="Close panel (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Meta Grid */}
              <div className="grid grid-cols-2 gap-3 text-[12px]">
                <div className="p-3 rounded-[8px] bg-[#0E0E10] border border-[rgba(255,255,255,0.05)]">
                  <div className="text-[#636366] flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Evaluated at</span>
                  </div>
                  <div className="text-[#F5F5F7] font-medium font-mono">
                    {new Date(selectedRun.created_at).toLocaleString()}
                  </div>
                </div>

                <div className="p-3 rounded-[8px] bg-[#0E0E10] border border-[rgba(255,255,255,0.05)]">
                  <div className="text-[#636366] flex items-center gap-1.5 mb-1">
                    <Layers className="w-3.5 h-3.5" />
                    <span>Paired sample size</span>
                  </div>
                  <div className="text-[#F5F5F7] font-medium font-mono tabular-nums">
                    {formatNumber(selectedRun.sample_size_n)} txs &bull; {selectedRun.seeds_evaluated} seeds
                  </div>
                </div>
              </div>

              {/* Cryptographic Events Digest */}
              <div className="p-3 rounded-[8px] bg-[#0E0E10] border border-[rgba(255,255,255,0.05)]">
                <div className="text-[#636366] flex items-center gap-1.5 mb-1 text-[12px]">
                  <Hash className="w-3.5 h-3.5" />
                  <span>Events input digest (SHA-256)</span>
                </div>
                <div className="text-[11px] font-mono text-[#8E8E93] break-all select-all">
                  {selectedRun.events_digest}
                </div>
              </div>

              {/* Policy Results with CI */}
              <div>
                <div className="text-[13px] font-medium text-[#F5F5F7] mb-2">
                  Policy performance & confidence intervals
                </div>
                <div className="space-y-2">
                  {selectedRun.policies.map((p) => (
                    <div
                      key={p.policy_id}
                      className="p-3 rounded-[8px] bg-[#0E0E10] border border-[rgba(255,255,255,0.05)] space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-medium text-[#F5F5F7]">
                            {p.name}
                          </span>
                          {p.is_baseline && (
                            <span className="px-1.5 py-0.2 rounded-[4px] bg-[#1F1F22] text-[#8E8E93] text-[10px]">
                              baseline
                            </span>
                          )}
                        </div>
                        <span className="text-[13px] font-semibold text-[#30D158] tabular-nums">
                          {formatUSD(p.metrics.net_benefit.mean, p.metrics.net_benefit.mean > 0)}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[12px] pt-1 border-t border-[rgba(255,255,255,0.05)]">
                        <div>
                          <span className="text-[#636366]">Fraud caught: </span>
                          <span className="text-[#F5F5F7] tabular-nums font-medium">
                            {p.metrics.fraud_caught_rate.mean.toFixed(1)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[#636366]">FPR: </span>
                          <span className="text-[#F5F5F7] tabular-nums font-medium">
                            {p.metrics.false_positive_rate.mean.toFixed(2)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-[#636366]">Overrides: </span>
                          <span className="text-[#FF9F0A] tabular-nums font-medium">
                            {p.metrics.guardrail_overrides}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#636366]">Review queue: </span>
                          <span className="text-[#8E8E93] tabular-nums">
                            {p.metrics.review_load_hours.mean.toFixed(1)} hrs
                          </span>
                        </div>
                      </div>

                      {/* CI string */}
                      <ConfidenceInterval
                        lo={p.metrics.net_benefit.lo}
                        hi={p.metrics.net_benefit.hi}
                        n={p.metrics.net_benefit.n}
                        unit="USD"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Execution Config */}
              <div>
                <div className="text-[13px] font-medium text-[#F5F5F7] mb-2 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#8E8E93]" />
                  <span>Evaluation configuration</span>
                </div>
                <pre className="p-3 rounded-[8px] bg-[#0E0E10] border border-[rgba(255,255,255,0.05)] text-[#8E8E93] font-mono text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedRun.config, null, 2)}
                </pre>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function RunsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-[#8E8E93] text-[13px]">
          Loading runs...
        </div>
      }
    >
      <RunsContent />
    </Suspense>
  );
}
