/**
 * Pure reader utility for Lift results and fixture files.
 * INVARIANT: Contains zero simulation or policy logic.
 * Server-only file reading.
 */

import fs from "fs";
import path from "path";
import { RunData, TransactionRecord, ReportItem } from "./types";

export * from "./types";

function getFixturesDir(): string {
  const cwd = process.cwd();
  const directPath = path.join(cwd, "fixtures");
  if (fs.existsSync(directPath)) return directPath;
  const dashboardPath = path.join(cwd, "dashboard", "fixtures");
  if (fs.existsSync(dashboardPath)) return dashboardPath;
  return path.resolve(cwd, "fixtures");
}

function getResultsDir(): string {
  const cwd = process.cwd();
  const directResults = path.join(cwd, "results");
  if (fs.existsSync(directResults)) return directResults;
  const parentResults = path.join(cwd, "..", "results");
  if (fs.existsSync(parentResults)) return parentResults;
  return path.join(cwd, "results");
}

export function listResults(): string[] {
  const dir = getResultsDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
}

export function getRuns(): RunData[] {
  // First check real results/
  const resultsDir = getResultsDir();
  const realRuns: RunData[] = [];

  if (fs.existsSync(resultsDir)) {
    const files = fs.readdirSync(resultsDir).filter((f) => f.endsWith(".json"));
    for (const f of files) {
      try {
        const raw = fs.readFileSync(path.join(resultsDir, f), "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed.run_id && parsed.policies) {
          realRuns.push({ ...parsed, is_demo: false });
        }
      } catch {
        // Skip malformed
      }
    }
  }

  if (realRuns.length > 0) {
    return realRuns;
  }

  // Fallback to fixture data
  const fixturesDir = getFixturesDir();
  const runsPath = path.join(fixturesDir, "runs.json");
  if (fs.existsSync(runsPath)) {
    try {
      const raw = fs.readFileSync(runsPath, "utf-8");
      const list = JSON.parse(raw) as RunData[];
      return list.map((r) => ({ ...r, is_demo: true }));
    } catch {
      return [];
    }
  }

  return [];
}

export function getRun(id: string): RunData | null {
  const runs = getRuns();
  return runs.find((r) => r.run_id === id) || null;
}

export function getTransactions(): TransactionRecord[] {
  const fixturesDir = getFixturesDir();
  const txPath = path.join(fixturesDir, "transactions.json");
  if (!fs.existsSync(txPath)) return [];
  try {
    const raw = fs.readFileSync(txPath, "utf-8");
    return JSON.parse(raw) as TransactionRecord[];
  } catch {
    return [];
  }
}

export function getTransaction(id: string): TransactionRecord | null {
  const list = getTransactions();
  return list.find((t) => t.id === id) || null;
}

export function getReports(): ReportItem[] {
  const fixturesDir = getFixturesDir();
  const reportsDir = path.join(fixturesDir, "reports");
  if (!fs.existsSync(reportsDir)) return [];

  const files = fs.readdirSync(reportsDir).filter((f) => f.endsWith(".md"));
  const reports: ReportItem[] = [];

  for (const f of files) {
    const full = path.join(reportsDir, f);
    const content = fs.readFileSync(full, "utf-8");
    const id = f.replace(/\.md$/, "");
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : id;
    const dateMatch = content.match(/- Date:\s*(.+)$/m);
    const date = dateMatch ? dateMatch[1].trim() : "2026-10-28";
    const scenarioMatch = content.match(/- Scenario:\s*(.+)$/m);
    const scenario = scenarioMatch ? scenarioMatch[1].trim() : "payments_fraud";

    reports.push({
      id,
      title,
      scenario,
      date,
      filename: f,
      content,
      is_demo: true,
    });
  }

  return reports;
}

export function getReport(id: string): ReportItem | null {
  const list = getReports();
  return list.find((r) => r.id === id) || null;
}
