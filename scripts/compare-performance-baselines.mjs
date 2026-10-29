import { appendFile, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { comparePerformanceReports, comparisonMarkdown } from "./performance-baseline.mjs";

export async function compareReportFiles({
  baselinePath = "performance-baseline-ppr.json",
  candidatePath = "performance-baseline-nonce.json",
  readJson = async (path) => JSON.parse(await readFile(path, "utf8"))
} = {}) {
  let baseline;
  let candidate;
  try {
    baseline = await readJson(baselinePath);
    candidate = await readJson(candidatePath);
  } catch {
    throw new Error("Both performance report files must exist and contain valid JSON.");
  }
  return comparePerformanceReports(baseline, candidate);
}

async function main() {
  const report = await compareReportFiles({
    baselinePath: process.argv[2] ?? "performance-baseline-ppr.json",
    candidatePath: process.argv[3] ?? "performance-baseline-nonce.json"
  });
  process.stdout.write(JSON.stringify(report, null, 2) + "\n");
  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, comparisonMarkdown(report) + "\n");
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write("Performance report comparison failed: " + (error instanceof Error ? error.message : "unexpected error") + "\n");
    process.exitCode = 1;
  });
}
