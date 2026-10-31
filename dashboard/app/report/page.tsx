"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, Calendar, GitCommit, CheckCircle2, ChevronRight, ShieldCheck } from "lucide-react";
import { ReportItem } from "@/lib/types";
import { DemoBadge } from "@/components/DemoBadge";
import { MarkdownViewer } from "@/components/MarkdownViewer";
import { verifyReportDigest } from "@/lib/report-verify";

function ReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialReportId = searchParams.get("id");

  const [reports, setReports] = useState<ReportItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(initialReportId);
  const [isVerified, setIsVerified] = useState<boolean>(false);

  useEffect(() => {
    fetch("/api/reports")
      .then((res) => res.json())
      .then((data: ReportItem[]) => {
        setReports(data);
        if (data.length > 0) {
          if (initialReportId && data.some((r) => r.id === initialReportId)) {
            setSelectedId(initialReportId);
          } else if (!selectedId) {
            setSelectedId(data[0].id);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load reports", err);
      });
  }, [initialReportId, selectedId]);

  const selectReport = (id: string) => {
    setSelectedId(id);
    router.replace(`/report?id=${id}`, { scroll: false });
  };

  const currentReport = useMemo(
    () => reports.find((r) => r.id === selectedId) || reports[0] || null,
    [reports, selectedId]
  );

  // Recompute and verify digest whenever active report changes
  useEffect(() => {
    if (currentReport) {
      verifyReportDigest(currentReport.content).then((res) => {
        setIsVerified(res.isVerified);
      });
    } else {
      setIsVerified(false);
    }
  }, [currentReport]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-[rgba(255,255,255,0.08)]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-[28px] font-semibold tracking-tight text-[#F5F5F7]">
              Evaluation reports
            </h1>
            <DemoBadge />
          </div>
          <p className="text-[13px] text-[#8E8E93]">
            Auto-generated markdown reports carrying cryptographic hashes, seed lists, and paired confidence bounds.
          </p>
        </div>
        <div className="text-[12px] font-mono text-[#636366]">
          Format: core/RULES.md §11
        </div>
      </div>

      {/* Two-Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column: List of Reports */}
        <div className="lg:col-span-4 rounded-[10px] border border-[rgba(255,255,255,0.08)] bg-[#0E0E10] overflow-hidden">
          <div className="p-3 bg-[#161618] border-b border-[rgba(255,255,255,0.05)] text-[12px] font-medium text-[#8E8E93]">
            Generated reports ({reports.length})
          </div>

          <div className="divide-y divide-[rgba(255,255,255,0.05)]">
            {reports.map((r) => {
              const isSelected = r.id === currentReport?.id;
              return (
                <div
                  key={r.id}
                  onClick={() => selectReport(r.id)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#0A84FF]/15 border-l-2 border-[#0A84FF]"
                      : "hover:bg-[#161618]/70"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[13px] font-semibold text-[#F5F5F7]">
                      {r.id}
                    </span>
                    <ChevronRight
                      className={`w-4 h-4 ${
                        isSelected ? "text-[#0A84FF]" : "text-[#636366]"
                      }`}
                    />
                  </div>
                  <div className="text-[12px] text-[#8E8E93] line-clamp-1 mb-1.5">
                    {r.title}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-mono text-[#636366]">
                    <span>{r.scenario}</span>
                    <span>&bull;</span>
                    <span>{r.date}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Rendered Markdown Document */}
        <div className="lg:col-span-8 rounded-[14px] bg-[#161618] border border-[rgba(255,255,255,0.08)] p-6">
          {currentReport ? (
            <div>
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-[rgba(255,255,255,0.08)] text-[12px]">
                <div className="flex items-center gap-2 text-[#8E8E93]">
                  <FileText className="w-4 h-4 text-[#0A84FF]" />
                  <span className="font-mono text-[#F5F5F7]">{currentReport.filename}</span>
                </div>

                {/* Verified vs Generated status badge */}
                {isVerified ? (
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#30D158]/15 text-[#30D158] font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Verified report</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-[4px] bg-[#1F1F22] text-[#8E8E93] font-medium flex items-center gap-1.5 border border-[rgba(255,255,255,0.06)]">
                    <FileText className="w-3.5 h-3.5" />
                    <span>Generated</span>
                  </span>
                )}
              </div>

              <MarkdownViewer content={currentReport.content} />
            </div>
          ) : (
            <div className="py-16 text-center text-[#8E8E93] text-[13px]">
              No report selected.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-[#8E8E93] text-[13px]">
          Loading evaluation report...
        </div>
      }
    >
      <ReportContent />
    </Suspense>
  );
}
