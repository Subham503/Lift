import "./globals.css";
import React from "react";
import { AppShell } from "@/components/AppShell";

export const metadata = {
  title: "Lift Console - Safety Guardrails & Decision Simulation",
  description: "Read-only inspection console for Lift evaluation runs and safety guardrails",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="bg-[#000000] text-[#F5F5F7] min-h-screen selection:bg-[#0A84FF] selection:text-white">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
