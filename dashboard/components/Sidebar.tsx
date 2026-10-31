"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlayCircle,
  Scale,
  ListFilter,
  FileText,
  Search,
  ShieldAlert,
} from "lucide-react";
import { DemoBadge } from "./DemoBadge";

interface SidebarProps {
  onOpenCommandPalette?: () => void;
}

export function Sidebar({ onOpenCommandPalette }: SidebarProps) {
  const pathname = usePathname();
  const [searchHint, setSearchHint] = useState("Ctrl K");

  // OS detection for keyboard shortcut hint
  useEffect(() => {
    if (typeof navigator !== "undefined") {
      const isMac = /Mac|iPhone|iPod|iPad/i.test(navigator.userAgent);
      setSearchHint(isMac ? "\u2318K" : "Ctrl K");
    }
  }, []);

  const navItems = [
    {
      name: "Overview",
      href: "/",
      icon: LayoutDashboard,
      active: pathname === "/",
    },
    {
      name: "Runs",
      href: "/runs",
      icon: PlayCircle,
      active: pathname.startsWith("/runs"),
    },
    {
      name: "Policies",
      href: "/policies",
      icon: Scale,
      active: pathname.startsWith("/policies"),
    },
    {
      name: "Transactions",
      href: "/transaction",
      icon: ListFilter,
      active: pathname.startsWith("/transaction") || pathname.startsWith("/transactions"),
    },
    {
      name: "Reports",
      href: "/report",
      icon: FileText,
      active: pathname.startsWith("/report") || pathname.startsWith("/reports"),
    },
  ];

  return (
    <aside className="w-[240px] shrink-0 bg-[#0E0E10]/85 backdrop-blur-md border-r border-[rgba(255,255,255,0.08)] flex flex-col justify-between h-screen sticky top-0 z-30 select-none">
      <div>
        {/* App Title / Header */}
        <div className="p-4 flex items-center justify-between border-b border-[rgba(255,255,255,0.05)]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-[6px] bg-[#0A84FF] flex items-center justify-center text-white">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[15px] font-semibold text-[#F5F5F7] tracking-tight">
                Lift Console
              </span>
            </div>
          </div>
        </div>

        {/* Search / Command Palette Trigger */}
        <div className="px-3 pt-3">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-[6px] bg-[#161618] hover:bg-[#1F1F22] border border-[rgba(255,255,255,0.08)] text-[#8E8E93] hover:text-[#F5F5F7] transition-colors focus-visible:ring-2 focus-visible:ring-[#0A84FF]"
          >
            <div className="flex items-center gap-2 text-[13px]">
              <Search className="w-3.5 h-3.5 text-[#636366]" />
              <span>Search or jump...</span>
            </div>
            <kbd className="px-1.5 py-0.5 rounded-[4px] bg-[#000000] border border-[rgba(255,255,255,0.1)] text-[11px] font-mono text-[#8E8E93]">
              {searchHint}
            </kbd>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="p-3">
          <div className="text-[12px] font-medium text-[#636366] px-2.5 py-1">
            Navigation
          </div>
          <ul className="space-y-0.5 mt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-[6px] text-[13px] font-medium transition-colors ${
                      item.active
                        ? "bg-[#0A84FF] text-white"
                        : "text-[#8E8E93] hover:text-[#F5F5F7] hover:bg-[#161618]"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Footer info & demo badge */}
      <div className="p-3 border-t border-[rgba(255,255,255,0.05)] bg-[#0E0E10]">
        <div className="mb-2">
          <DemoBadge detail="offline mode" className="w-full justify-center" />
        </div>
        <div className="px-2 text-[12px] text-[#636366] flex items-center justify-between">
          <span>Pack: payments_fraud</span>
          <span className="font-mono text-[11px]">v0.1.0</span>
        </div>
      </div>
    </aside>
  );
}
