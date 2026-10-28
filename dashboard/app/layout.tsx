import "./globals.css";
import Link from "next/link";
import React from "react";

export const metadata = {
  title: "Lift - Simulation & Evaluation Dashboard",
  description: "Read-only inspection dashboard for Lift evaluation runs",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="dashboard-container">
          <aside className="sidebar">
            <h2>Lift Console</h2>
            <ul className="nav-links">
              <li><Link href="/">Overview</Link></li>
              <li><Link href="/runs">Runs</Link></li>
              <li><Link href="/policies">Policies</Link></li>
              <li><Link href="/transaction">Transactions</Link></li>
              <li><Link href="/report">Reports</Link></li>
            </ul>
          </aside>
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
