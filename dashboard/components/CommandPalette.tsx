"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  PlayCircle,
  Scale,
  ListFilter,
  FileText,
  Search,
  ExternalLink,
} from "lucide-react";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  // Keyboard shortcut Cmd/Ctrl + K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "K") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
      if (e.key === "Escape" && open) {
        e.preventDefault();
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const runItem = (action: () => void) => {
    onOpenChange(false);
    action();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />

          {/* Palette Dialog */}
          <motion.div
            initial={{ scale: 0.96, opacity: 0, y: -8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.96, opacity: 0, y: -8 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 34,
            }}
            className="relative w-full max-w-[560px] rounded-[14px] bg-[#161618] border border-[rgba(255,255,255,0.12)] shadow-2xl overflow-hidden"
          >
            <Command
              className="w-full text-[#F5F5F7]"
              loop
            >
              <div className="flex items-center px-3.5 border-b border-[rgba(255,255,255,0.08)]">
                <Search className="w-4 h-4 text-[#8E8E93] mr-2 shrink-0" />
                <Command.Input
                  autoFocus
                  placeholder="Type a command, run ID, policy, or transaction..."
                  className="w-full bg-transparent py-3.5 text-[15px] text-[#F5F5F7] placeholder-[#636366] outline-none"
                />
                <kbd className="px-1.5 py-0.5 rounded-[4px] bg-[#0E0E10] border border-[rgba(255,255,255,0.08)] text-[11px] font-mono text-[#8E8E93]">
                  esc
                </kbd>
              </div>

              <Command.List className="max-h-[360px] overflow-y-auto p-2 space-y-1">
                <Command.Empty className="py-6 text-center text-[13px] text-[#8E8E93]">
                  No matching results found.
                </Command.Empty>

                {/* Primary Navigation */}
                <Command.Group heading="Navigation" className="text-[12px] font-medium text-[#636366] px-2 py-1">
                  <Command.Item
                    onSelect={() => runItem(() => router.push("/"))}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] text-[13px] text-[#F5F5F7] aria-selected:bg-[#0A84FF] aria-selected:text-white cursor-pointer select-none"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Overview & Pareto frontier</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runItem(() => router.push("/runs"))}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] text-[13px] text-[#F5F5F7] aria-selected:bg-[#0A84FF] aria-selected:text-white cursor-pointer select-none"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Simulation runs</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runItem(() => router.push("/policies"))}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] text-[13px] text-[#F5F5F7] aria-selected:bg-[#0A84FF] aria-selected:text-white cursor-pointer select-none"
                  >
                    <Scale className="w-4 h-4" />
                    <span>Policy comparisons & ROC curves</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runItem(() => router.push("/transaction"))}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] text-[13px] text-[#F5F5F7] aria-selected:bg-[#0A84FF] aria-selected:text-white cursor-pointer select-none"
                  >
                    <ListFilter className="w-4 h-4" />
                    <span>Transaction inspector & audit logs</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runItem(() => router.push("/report"))}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-[6px] text-[13px] text-[#F5F5F7] aria-selected:bg-[#0A84FF] aria-selected:text-white cursor-pointer select-none"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Evaluation reports</span>
                  </Command.Item>
                </Command.Group>

                {/* Runs */}
                <Command.Group heading="Runs" className="text-[12px] font-medium text-[#636366] px-2 py-1 mt-2">
                  <Command.Item
                    onSelect={() => runItem(() => router.push("/runs?run=run_20261028_01"))}
                    className="flex items-center justify-between px-2.5 py-2 rounded-[6px] text-[13px] text-[#F5F5F7] aria-selected:bg-[#0A84FF] aria-selected:text-white cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <PlayCircle className="w-4 h-4 text-[#8E8E93]" />
                      <span className="font-mono text-[12px]">run_20261028_01</span>
                      <span className="text-[#8E8E93] text-[12px]">(Synthetic baseline)</span>
                    </div>
                    <span className="text-[11px] text-[#8E8E93] tabular-nums">20 seeds &bull; n=2000</span>
                  </Command.Item>

                  <Command.Item
                    onSelect={() => runItem(() => router.push("/runs?run=run_20261029_02"))}
                    className="flex items-center justify-between px-2.5 py-2 rounded-[6px] text-[13px] text-[#F5F5F7] aria-selected:bg-[#0A84FF] aria-selected:text-white cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <PlayCircle className="w-4 h-4 text-[#8E8E93]" />
                      <span className="font-mono text-[12px]">run_20261029_02</span>
                      <span className="text-[#8E8E93] text-[12px]">(Adversarial stress ring)</span>
                    </div>
                    <span className="text-[11px] text-[#8E8E93] tabular-nums">20 seeds &bull; n=2000</span>
                  </Command.Item>
                </Command.Group>

                {/* Policies */}
                <Command.Group heading="Policies" className="text-[12px] font-medium text-[#636366] px-2 py-1 mt-2">
                  <Command.Item
                    onSelect={() => runItem(() => router.push("/policies?policy=ml_guarded"))}
                    className="flex items-center justify-between px-2.5 py-2 rounded-[6px] text-[13px] text-[#F5F5F7] aria-selected:bg-[#0A84FF] aria-selected:text-white cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#0A84FF]" />
                      <span>ThresholdModel + HighValueGuardrail</span>
                    </div>
                    <span className="text-[11px] text-[#30D158] font-mono">+92.4% caught</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runItem(() => router.push("/policies?policy=ml_threshold"))}
                    className="flex items-center justify-between px-2.5 py-2 rounded-[6px] text-[13px] text-[#F5F5F7] aria-selected:bg-[#0A84FF] aria-selected:text-white cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#30D158]" />
                      <span>ThresholdModelFraudPolicy</span>
                    </div>
                    <span className="text-[11px] text-[#8E8E93] font-mono">88.6% caught</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runItem(() => router.push("/policies?policy=rules"))}
                    className="flex items-center justify-between px-2.5 py-2 rounded-[6px] text-[13px] text-[#F5F5F7] aria-selected:bg-[#0A84FF] aria-selected:text-white cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#BF5AF2]" />
                      <span>RuleBasedFraudPolicy</span>
                    </div>
                    <span className="text-[11px] text-[#8E8E93] font-mono">74.2% caught</span>
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runItem(() => router.push("/policies?policy=do_nothing"))}
                    className="flex items-center justify-between px-2.5 py-2 rounded-[6px] text-[13px] text-[#F5F5F7] aria-selected:bg-[#0A84FF] aria-selected:text-white cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#636366]" />
                      <span>DoNothingPolicy (Baseline)</span>
                    </div>
                    <span className="text-[11px] text-[#8E8E93] font-mono">0.0% caught</span>
                  </Command.Item>
                </Command.Group>

                {/* Inspect Transaction */}
                <Command.Group heading="Quick Transaction Jump" className="text-[12px] font-medium text-[#636366] px-2 py-1 mt-2">
                  <Command.Item
                    onSelect={() => runItem(() => router.push("/transaction?id=tx_0012"))}
                    className="flex items-center justify-between px-2.5 py-2 rounded-[6px] text-[13px] text-[#F5F5F7] aria-selected:bg-[#0A84FF] aria-selected:text-white cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px]">tx_0012</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded-[4px] bg-[#FF9F0A]/10 text-[#FF9F0A]">Guardrail override</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#8E8E93]" />
                  </Command.Item>
                  <Command.Item
                    onSelect={() => runItem(() => router.push("/transaction?id=tx_0045"))}
                    className="flex items-center justify-between px-2.5 py-2 rounded-[6px] text-[13px] text-[#F5F5F7] aria-selected:bg-[#0A84FF] aria-selected:text-white cursor-pointer select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[12px]">tx_0045</span>
                      <span className="text-[11px] px-1.5 py-0.5 rounded-[4px] bg-[#30D158]/10 text-[#30D158]">Fraud detected</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-[#8E8E93]" />
                  </Command.Item>
                </Command.Group>
              </Command.List>

              <div className="p-2 border-t border-[rgba(255,255,255,0.08)] bg-[#0E0E10] flex items-center justify-between text-[11px] text-[#636366] px-3">
                <span>Navigate with &uarr; &darr; or j / k</span>
                <span>Press Enter to select</span>
              </div>
            </Command>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

