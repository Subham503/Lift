"use client";

import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { CommandPalette } from "./CommandPalette";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#000000] text-[#F5F5F7] font-sans antialiased">
      <Sidebar onOpenCommandPalette={() => setCommandPaletteOpen(true)} />
      <main className="flex-1 flex flex-col min-w-0 bg-[#000000] overflow-y-auto">
        <div className="w-full max-w-[1280px] mx-auto p-6 md:p-8">
          {children}
        </div>
      </main>
      <CommandPalette
        open={commandPaletteOpen}
        onOpenChange={setCommandPaletteOpen}
      />
    </div>
  );
}

