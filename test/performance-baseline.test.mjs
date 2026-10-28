import assert from "node:assert/strict";
import test from "node:test";

import { compareReportFiles } from "../scripts/compare-performance-baselines.mjs";

import {
  comparePerformanceReports,
  comparisonMarkdown,
  measureDocument,
  parseBenchmarkTarget,
  reportMarkdown,
  runPerformanceBaseline,
  summarizeSamples
} from "../scripts/performance-baseline.mjs";

test("benchmark target accepts HTTPS roots and loopback HTTP only", () => {
  assert.equal(parseBenchmarkTarget("https://frontend.candidate-host.com/").origin, "https://frontend.candidate-host.com");
  assert.equal(parseBenchmarkTarget("http://127.0.0.1:3100/").origin, "http://127.0.0.1:3100");
  assert.equal(parseBenchmarkTarget("http://localhost:3100/").hostname, "localhost");

  for (const value of [
    "",
    "not a url",
    "ftp://frontend.candidate-host.com/",
    "http://frontend.candidate-host.com/",
    "https://localhost/",
    "https://127.0.0.1/",
    "https://user:secret@frontend.candidate-host.com/",
    "https://frontend.candidate-host.com/?token=secret",
    "https://frontend.candidate-host.com/#fragment",
    "https://frontend.candidate-host.com/patient/123"
  ]) {
    assert.throws(() => parseBenchmarkTarget(value));
  }
});

test("percentile summary is deterministic and rejects invalid samples", () => {
  assert.deepEqual(summarizeSamples([9, 1, 5, 3, 7, 2, 4, 6, 8, 10]), {
    min: 1,
    p50: 5,
    p95: 10,
    max: 10
  });
  assert.throws(() => summarizeSamples([]), /measurement is required/);
  assert.throws(() => summarizeSamples([1, Number.NaN]), /measurement is required/);
  assert.throws(() => summarizeSamples([-1, 2]), /measurement is required/);
});

test("single document measurement sends a credential-free GET and records headers/body timing", async () => {
  const calls = [];
  const clockValues = [10, 13, 19];
  const result = await measureDocument({
    targetUrl: "https://frontend.candidate-host.com/",
    fetchImpl: async (url, init) => {
      calls.push({ url: String(url), init });
      return new Response("<!doctype html><title>Doctor Tracker</title>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" }
      });
    },
    timeoutMs: 2_000,
    now: () => clockValues.shift()
  });

  assert.deepEqual(calls.map(({ url }) => url), ["https://frontend.candidate-host.com/"]);
  assert.equal(calls[0].init.method, "GET");
  assert.equal(calls[0].init.redirect, "error");
  assert.equal(calls[0].init.headers.Accept, "text/html");
  assert.equal(calls[0].init.credentials, undefined, "the benchmark never sends an explicit credential mode or cookies");
  assert.equal(result.status, 200);
  assert.equal(result.headerLatencyMs, 3);
  assert.equal(result.totalResponseMs, 9);
  assert.equal(result.responseBytes, Buffer.byteLength("<!doctype html><title>Doctor Tracker</title>"));
  assert.equal("body" in result, false);
});

test("measurement fails closed for unexpected status, non-HTML and redirect/network failures", async () => {
  await assert.rejects(
    measureDocument({
      targetUrl: "https://frontend.candidate-host.com/",
      fetchImpl: async () => new Response("not found", { status: 404, headers: { "content-type": "text/html" } })
    }),
    /returned HTTP 404/
  );
  await assert.rejects(
    measureDocument({
      targetUrl: "https://frontend.candidate-host.com/",
      fetchImpl: async () => new Response("json", { status: 200, headers: { "content-type": "application/json" } })
    }),
    /did not return a text\/html/
  );
  await assert.rejects(
    measureDocument({
      targetUrl: "https://frontend.candidate-host.com/",
      fetchImpl: async () => { throw new Error("network detail must not be exposed"); }
    }),
    /network, timeout or redirect policy/
  );
});

test("baseline warms up, measures the configured number of root requests, and never invents a performance PASS", async () => {
  let fetchCalls = 0;
  let clock = 0;
  const report = await runPerformanceBaseline({
    targetUrl: "http://127.0.0.1:3100/",
    runs: 5,
    warmupRuns: 2,
    timeoutMs: 2_000,
    fetchImpl: async () => {
      fetchCalls += 1;
      return new Response("<html>synthetic</html>", {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" }
      });
    },
    now: () => { clock += 2; return clock; },
    measuredAt: () => "2026-10-28T00:00:00.000Z"
  });

  assert.equal(fetchCalls, 7);
  assert.equal(report.targetOrigin, "http://127.0.0.1:3100");
  assert.equal(report.sampleCount, 5);
  assert.equal(report.request.warmupRuns, 2);
  assert.equal(report.request.measuredRuns, 5);
  assert.equal(report.request.credentials, "omitted");
  assert.equal(report.acceptance.status, "OBSERVATIONAL_ONLY");
  assert.equal(report.acceptance.thresholdDefined, false);
  assert.equal(report.metrics.responseHeadersMs.p50, 2);
  assert.equal(report.metrics.totalResponseMs.p95, 4);
  assert.equal(report.samples.length, 5);

  const markdown = reportMarkdown(report);
  assert.match(markdown, /TTFB approximation/);
  assert.match(markdown, /p95/);
  assert.match(markdown, /OBSERVATIONAL_ONLY/);
  assert.match(markdown, /not be reported as performance PASS/);
});

test("comparison reports p50/p95 deltas without converting the result into a PASS", () => {
  const baseline = {
    label: "cached PPR",
    targetOrigin: "http://127.0.0.1:3100",
    measuredAt: "2026-10-28T00:00:00.000Z",
    sampleCount: 30,
    metrics: {
      responseHeadersMs: { p50: 4, p95: 8 },
      totalResponseMs: { p50: 7, p95: 13 },
      responseBytes: { p50: 1000, p95: 1100 }
    }
  };
  const candidate = {
    label: "nonce dynamic",
    targetOrigin: "http://127.0.0.1:3101",
    measuredAt: "2026-10-28T00:01:00.000Z",
    sampleCount: 30,
    metrics: {
      responseHeadersMs: { p50: 5, p95: 10 },
      totalResponseMs: { p50: 9, p95: 15 },
      responseBytes: { p50: 1200, p95: 1350 }
    }
  };

  const comparison = comparePerformanceReports(baseline, candidate);
  assert.equal(comparison.metrics.responseHeadersMs.p50Delta, 1);
  assert.equal(comparison.metrics.responseHeadersMs.p50ChangePercent, 25);
  assert.equal(comparison.metrics.totalResponseMs.p95Delta, 2);
  assert.equal(comparison.metrics.responseBytes.p50Delta, 200);
  assert.equal(comparison.acceptance.status, "OBSERVATIONAL_ONLY");
  assert.equal(comparison.acceptance.thresholdDefined, false);

  const markdown = comparisonMarkdown(comparison);
  assert.match(markdown, /cached PPR/);
  assert.match(markdown, /nonce dynamic/);
  assert.match(markdown, /Positive latency deltas mean the candidate was slower/);
  assert.match(markdown, /not be reported as a performance PASS/);

  assert.throws(() => comparePerformanceReports({ sampleCount: 0 }, candidate), /at least one measured sample/);
  assert.throws(() => comparePerformanceReports(baseline, { ...candidate, metrics: {} }), /must contain p50 and p95/);
});

test("comparison CLI helper reads two JSON reports without touching the network", async () => {
  const reports = {
    "baseline.json": {
      label: "PPR baseline", targetOrigin: "http://127.0.0.1:3100", measuredAt: "t1", sampleCount: 5,
      metrics: {
        responseHeadersMs: { p50: 4, p95: 7 },
        totalResponseMs: { p50: 8, p95: 12 },
        responseBytes: { p50: 100, p95: 110 }
      }
    },
    "candidate.json": {
      label: "nonce candidate", targetOrigin: "http://127.0.0.1:3101", measuredAt: "t2", sampleCount: 5,
      metrics: {
        responseHeadersMs: { p50: 5, p95: 8 },
        totalResponseMs: { p50: 9, p95: 14 },
        responseBytes: { p50: 120, p95: 130 }
      }
    }
  };
  const requested = [];
  const comparison = await compareReportFiles({
    baselinePath: "baseline.json",
    candidatePath: "candidate.json",
    readJson: async (path) => {
      requested.push(path);
      return reports[path];
    }
  });
  assert.deepEqual(requested, ["baseline.json", "candidate.json"]);
  assert.equal(comparison.metrics.responseHeadersMs.p50Delta, 1);
  assert.equal(comparison.acceptance.status, "OBSERVATIONAL_ONLY");

  await assert.rejects(
    compareReportFiles({ readJson: async () => { throw new Error("private file path"); } }),
    /must exist and contain valid JSON/
  );
});

test("baseline validates run counts and timeout limits", async () => {
  const validFetch = async () => new Response("<html/>", {
    status: 200,
    headers: { "content-type": "text/html" }
  });
  await assert.rejects(runPerformanceBaseline({ targetUrl: "https://frontend.candidate-host.com/", runs: 4, fetchImpl: validFetch }), /PERF_RUNS/);
  await assert.rejects(runPerformanceBaseline({ targetUrl: "https://frontend.candidate-host.com/", runs: 5, warmupRuns: 21, fetchImpl: validFetch }), /PERF_WARMUP_RUNS/);
  await assert.rejects(runPerformanceBaseline({ targetUrl: "https://frontend.candidate-host.com/", runs: 5, timeoutMs: 100, fetchImpl: validFetch }), /PERF_TIMEOUT_MS/);
});
