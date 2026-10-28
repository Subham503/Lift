/**
 * Pure reader utility for results/ directory.
 * INVARIANT: Contains zero simulation or policy logic.
 */

import fs from "fs";
import path from "path";

export interface EvaluationResult {
  run_id: string;
  pack: string;
  policy: string;
  metrics: Record<string, number>;
}

export function listResults(resultsDir: string = "../../results"): string[] {
  const resolved = path.resolve(process.cwd(), resultsDir);
  if (!fs.existsSync(resolved)) {
    return [];
  }
  return fs.readdirSync(resolved).filter((f) => f.endsWith(".json"));
}

export function loadResult(filePath: string): EvaluationResult | null {
  try {
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
