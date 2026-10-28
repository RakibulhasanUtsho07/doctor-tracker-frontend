import { appendFile } from "node:fs/promises";
import { isIP } from "node:net";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const RESERVED_HOSTS = new Set(["example.com", "example.net", "example.org"]);
const FORBIDDEN_SUFFIXES = [".localhost", ".local", ".internal", ".test", ".invalid", ".example"];

function parseInteger(value, fallback, label, { min, max }) {
  if (value === undefined || value === null || value === "") return fallback;
  if (!/^\d+$/.test(String(value))) {
    throw new Error(label + " must be an integer between " + min + " and " + max + ".");
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(label + " must be an integer between " + min + " and " + max + ".");
  }
  return parsed;
}

/**
 * Accepts only the frontend root document, not credential-bearing or arbitrary paths.
 * Public endpoints must use HTTPS; plain HTTP is allowed only for local loopback CI.
 */
export function parseBenchmarkTarget(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("PERF_BASE_URL is required.");
  }

  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("PERF_BASE_URL must be a valid URL.");
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("PERF_BASE_URL must use HTTPS, or HTTP on a loopback host for CI.");
  }
  if (url.username || url.password) {
    throw new Error("PERF_BASE_URL must not contain credentials.");
  }
  if (url.search || url.hash) {
    throw new Error("PERF_BASE_URL must not contain a query string or fragment.");
  }
  if (url.pathname !== "/") {
    throw new Error("PERF_BASE_URL must target the frontend root path only.");
  }

  const hostname = url.hostname.toLowerCase();
  if (url.protocol === "http:" && !LOOPBACK_HOSTS.has(hostname)) {
    throw new Error("PERF_BASE_URL must use HTTPS for non-loopback hosts.");
  }
  if (url.protocol === "https:" && (
    LOOPBACK_HOSTS.has(hostname) ||
    isIP(hostname.replace(/^\\[|\\]$/g, "")) !== 0 ||
    !hostname.includes(".") ||
    RESERVED_HOSTS.has(hostname) ||
    FORBIDDEN_SUFFIXES.some((suffix) => hostname.endsWith(suffix))
  )) {
    throw new Error("HTTPS benchmark targets must use a public DNS hostname.");
  }

  return url;
}

function percentile(sorted, percent) {
  const index = Math.max(0, Math.ceil((percent / 100) * sorted.length) - 1);
  return sorted[index];
}

function round(value, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function summarizeSamples(values) {
  if (!Array.isArray(values) || values.length === 0 || values.some((value) => !Number.isFinite(value) || value < 0)) {
    throw new Error("At least one finite, non-negative measurement is required.");
  }
  const sorted = [...values].sort((a, b) => a - b);
  return {
    min: round(sorted[0]),
    p50: round(percentile(sorted, 50)),
    p95: round(percentile(sorted, 95)),
    max: round(sorted[sorted.length - 1])
  };
}

export async function measureDocument({
  targetUrl,
  fetchImpl = globalThis.fetch,
  timeoutMs = 5_000,
  now = () => performance.now()
}) {
  if (typeof fetchImpl !== "function") throw new Error("A fetch implementation is required.");
  const url = targetUrl instanceof URL ? targetUrl : parseBenchmarkTarget(targetUrl);
  const startedAt = now();
  let response;

  try {
    response = await fetchImpl(url, {
      method: "GET",
      headers: { Accept: "text/html" },
      redirect: "error",
      signal: AbortSignal.timeout(timeoutMs)
    });
  } catch {
    throw new Error("Frontend root request failed before response headers (network, timeout or redirect policy).");
  }

  const headersAt = now();
  const contentType = response.headers.get("content-type") || "";
  if (response.status !== 200) {
    await response.body?.cancel().catch(() => {});
    throw new Error("Frontend root returned HTTP " + response.status + "; expected HTTP 200 HTML.");
  }
  if (!contentType.toLowerCase().includes("text/html")) {
    await response.body?.cancel().catch(() => {});
    throw new Error("Frontend root did not return a text/html document.");
  }

  let body;
  try {
    body = await response.arrayBuffer();
  } catch {
    throw new Error("Frontend root response body could not be read.");
  }
  const completedAt = now();

  return {
    status: response.status,
    headerLatencyMs: round(Math.max(0, headersAt - startedAt)),
    totalResponseMs: round(Math.max(0, completedAt - startedAt)),
    responseBytes: body.byteLength
  };
}

export async function runPerformanceBaseline({
  targetUrl = "http://127.0.0.1:3000/",
  runs = 25,
  warmupRuns = 3,
  timeoutMs = 5_000,
  fetchImpl = globalThis.fetch,
  now = () => performance.now(),
  measuredAt = () => new Date().toISOString(),
  label = "frontend root response"
} = {}) {
  const url = targetUrl instanceof URL ? targetUrl : parseBenchmarkTarget(targetUrl);
  if (!Number.isInteger(runs) || runs < 5 || runs > 200) {
    throw new Error("PERF_RUNS must be an integer between 5 and 200.");
  }
  if (!Number.isInteger(warmupRuns) || warmupRuns < 0 || warmupRuns > 20) {
    throw new Error("PERF_WARMUP_RUNS must be an integer between 0 and 20.");
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs < 500 || timeoutMs > 30_000) {
    throw new Error("PERF_TIMEOUT_MS must be an integer between 500 and 30000.");
  }

  for (let i = 0; i < warmupRuns; i += 1) {
    await measureDocument({ targetUrl: url, fetchImpl, timeoutMs, now });
  }

  const samples = [];
  for (let i = 0; i < runs; i += 1) {
    samples.push(await measureDocument({ targetUrl: url, fetchImpl, timeoutMs, now }));
  }

  return {
    schemaVersion: 1,
    measuredAt: measuredAt(),
    targetOrigin: url.origin,
    label,
    request: {
      method: "GET",
      path: "/",
      credentials: "omitted",
      redirects: "error",
      warmupRuns,
      measuredRuns: runs,
      timeoutMs
    },
    sampleCount: samples.length,
    metrics: {
      responseHeadersMs: summarizeSamples(samples.map((sample) => sample.headerLatencyMs)),
      totalResponseMs: summarizeSamples(samples.map((sample) => sample.totalResponseMs)),
      responseBytes: summarizeSamples(samples.map((sample) => sample.responseBytes))
    },
    samples,
    acceptance: {
      status: "OBSERVATIONAL_ONLY",
      thresholdDefined: false,
      note: "No numeric SRS performance target is configured; this report is not a performance acceptance PASS."
    }
  };
}

export function comparePerformanceReports(baseline, candidate) {
  const metricNames = ["responseHeadersMs", "totalResponseMs", "responseBytes"];
  if (!baseline || !candidate || !Number.isInteger(baseline.sampleCount) || !Number.isInteger(candidate.sampleCount) ||
      baseline.sampleCount < 1 || candidate.sampleCount < 1) {
    throw new Error("Both benchmark reports must contain at least one measured sample.");
  }

  const metrics = {};
  for (const name of metricNames) {
    const before = baseline.metrics?.[name];
    const after = candidate.metrics?.[name];
    if (!before || !after || !Number.isFinite(before.p50) || !Number.isFinite(before.p95) ||
        !Number.isFinite(after.p50) || !Number.isFinite(after.p95)) {
      throw new Error("Both benchmark reports must contain p50 and p95 for " + name + ".");
    }
    const p50Delta = round(after.p50 - before.p50);
    const p95Delta = round(after.p95 - before.p95);
    metrics[name] = {
      baselineP50: before.p50,
      candidateP50: after.p50,
      p50Delta: p50Delta,
      p50ChangePercent: before.p50 === 0 ? null : round((p50Delta / before.p50) * 100),
      baselineP95: before.p95,
      candidateP95: after.p95,
      p95Delta: p95Delta,
      p95ChangePercent: before.p95 === 0 ? null : round((p95Delta / before.p95) * 100)
    };
  }

  return {
    schemaVersion: 1,
    measuredAt: new Date().toISOString(),
    baseline: {
      label: baseline.label ?? "baseline",
      targetOrigin: baseline.targetOrigin,
      measuredAt: baseline.measuredAt,
      sampleCount: baseline.sampleCount
    },
    candidate: {
      label: candidate.label ?? "candidate",
      targetOrigin: candidate.targetOrigin,
      measuredAt: candidate.measuredAt,
      sampleCount: candidate.sampleCount
    },
    metrics,
    acceptance: {
      status: "OBSERVATIONAL_ONLY",
      thresholdDefined: false,
      note: "Positive latency deltas mean the candidate was slower in this CI sample; no numeric SRS threshold is configured, so this comparison is not a performance acceptance PASS."
    }
  };
}

export function comparisonMarkdown(report) {
  const signed = (value) => value > 0 ? "+" + value : String(value);
  const change = (value) => value === null ? "n/a" : signed(value) + "%";
  const row = (label, metric, unit) => {
    const m = report.metrics[metric];
    return "| " + label + " | " + m.baselineP50 + " " + unit + " | " + m.candidateP50 + " " + unit +
      " | " + signed(m.p50Delta) + " " + unit + " (" + change(m.p50ChangePercent) + ") | " +
      m.baselineP95 + " " + unit + " | " + m.candidateP95 + " " + unit + " | " +
      signed(m.p95Delta) + " " + unit + " (" + change(m.p95ChangePercent) + ") |";
  };
  return [
    "## Frontend performance comparison (observational only)",
    "",
    "- Baseline: " + report.baseline.label + " (" + report.baseline.targetOrigin + "; n=" + report.baseline.sampleCount + ")",
    "- Candidate: " + report.candidate.label + " (" + report.candidate.targetOrigin + "; n=" + report.candidate.sampleCount + ")",
    "- Positive latency deltas mean the candidate was slower in this local CI sample; results are not adjusted for runner noise.",
    "",
    "| Metric | Baseline p50 | Candidate p50 | p50 delta | Baseline p95 | Candidate p95 | p95 delta |",
    "|---|---:|---:|---:|---:|---:|---:|",
    row("Response headers (TTFB approximation)", "responseHeadersMs", "ms"),
    row("Full response", "totalResponseMs", "ms"),
    row("Decoded HTML body size", "responseBytes", "bytes"),
    "",
    "**Acceptance status: OBSERVATIONAL_ONLY.** No numeric SRS performance threshold is defined; this comparison must not be reported as a performance PASS."
  ].join("\n");
}

export function reportMarkdown(report) {
  const metricRow = (name, values, unit) =>
    "| " + name + " | " + values.min + " " + unit + " | " + values.p50 + " " + unit +
    " | " + values.p95 + " " + unit + " | " + values.max + " " + unit + " |";
  return [
    "## Frontend document response baseline: " + report.label + " (observational)",
    "",
    "- Target origin: " + report.targetOrigin,
    "- Measured at: " + report.measuredAt,
    "- Warm-ups excluded: " + report.request.warmupRuns,
    "- Measured GET requests: " + report.sampleCount,
    "- Redirects: error; credentials: omitted; only the root HTML document is requested.",
    "",
    "| Metric | Min | p50 | p95 | Max |",
    "|---|---:|---:|---:|---:|",
    metricRow("Response headers (TTFB approximation)", report.metrics.responseHeadersMs, "ms"),
    metricRow("Full response", report.metrics.totalResponseMs, "ms"),
    metricRow("Decoded HTML body size", report.metrics.responseBytes, "bytes"),
    "",
    "**Acceptance status: OBSERVATIONAL_ONLY.** No numeric SRS performance target is defined, so these values are a reproducible baseline only and must not be reported as performance PASS."
  ].join("\n");
}

function configFromEnvironment(env = process.env) {
  return {
    targetUrl: env.PERF_BASE_URL ?? "http://127.0.0.1:3000/",
    label: env.PERF_LABEL ?? "frontend root response",
    runs: parseInteger(env.PERF_RUNS, 25, "PERF_RUNS", { min: 5, max: 200 }),
    warmupRuns: parseInteger(env.PERF_WARMUP_RUNS, 3, "PERF_WARMUP_RUNS", { min: 0, max: 20 }),
    timeoutMs: parseInteger(env.PERF_TIMEOUT_MS, 5_000, "PERF_TIMEOUT_MS", { min: 500, max: 30_000 })
  };
}

async function main() {
  const report = await runPerformanceBaseline(configFromEnvironment());
  const json = JSON.stringify(report, null, 2);
  process.stdout.write(json + "\n");

  if (process.env.GITHUB_STEP_SUMMARY) {
    await appendFile(process.env.GITHUB_STEP_SUMMARY, reportMarkdown(report) + "\n");
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write("Performance baseline failed: " + (error instanceof Error ? error.message : "unexpected error") + "\n");
    process.exitCode = 1;
  });
}
