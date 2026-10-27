import assert from "node:assert/strict";
import test from "node:test";

import { parsePublicHttpsUrl, runDeploymentPreflight } from "../scripts/deployment-preflight.mjs";

test("public deployment URLs require HTTPS and a public DNS hostname", () => {
  assert.equal(parsePublicHttpsUrl("https://frontend.candidate-host.com", "Frontend URL").origin, "https://frontend.candidate-host.com");
  assert.throws(() => parsePublicHttpsUrl("http://frontend.candidate-host.com", "Frontend URL"), /must use HTTPS/);
  assert.throws(() => parsePublicHttpsUrl("https://localhost:3000", "Frontend URL"), /public DNS hostname/);
  assert.throws(() => parsePublicHttpsUrl("https://127.0.0.1", "Frontend URL"), /public DNS hostname/);
  assert.throws(() => parsePublicHttpsUrl("https://user:pass@frontend.candidate-host.com", "Frontend URL"), /must not contain credentials/);
  assert.throws(() => parsePublicHttpsUrl("https://frontend.candidate-host.com/?token=not-allowed", "Frontend URL"), /query string or fragment/);
  assert.throws(() => parsePublicHttpsUrl("https://frontend.candidate-host.com/#fragment", "Frontend URL"), /query string or fragment/);
});

test("API base URL must identify the versioned API prefix", () => {
  assert.equal(
    parsePublicHttpsUrl("https://api.candidate-host.com/api/v1/", "API base URL", { requireApiBase: true }).pathname,
    "/api/v1"
  );
  assert.throws(
    () => parsePublicHttpsUrl("https://api.candidate-host.com", "API base URL", { requireApiBase: true }),
    /must end with \/api\/v1/
  );
});

function fakeResponse(status, body, headers = {}) {
  return new Response(body === null ? null : JSON.stringify(body), { status, headers });
}

function healthyFetch({ invalidCors = false, notReady = false } = {}) {
  const requests = [];
  const fetchImpl = async (input, init = {}) => {
    const url = new URL(String(input));
    const method = init.method || "GET";
    requests.push({ url: url.href, method, headers: init.headers || {} });

    if (url.hostname === "frontend.candidate-host.com") {
      return fakeResponse(200, "<!doctype html>", { "content-type": "text/html; charset=utf-8" });
    }
    if (url.pathname === "/api/v1/health" && method === "GET") {
      return fakeResponse(200, { data: { status: "ok", service: "doctor-tracker-api" } }, { "content-type": "application/json" });
    }
    if (url.pathname === "/api/v1/ready" && method === "GET") {
      return notReady
        ? fakeResponse(503, { data: { status: "not_ready" } }, { "content-type": "application/json" })
        : fakeResponse(200, { data: { status: "ready" } }, { "content-type": "application/json" });
    }
    if (url.pathname === "/api/v1/auth/login" && method === "OPTIONS") {
      return fakeResponse(204, null, {
        "access-control-allow-origin": invalidCors ? "https://wrong.candidate-host.com" : "https://frontend.candidate-host.com",
        "access-control-allow-credentials": "true",
        "access-control-allow-methods": "GET, POST, PATCH, DELETE, OPTIONS",
        "access-control-allow-headers": "Content-Type, X-CSRF-Token"
      });
    }
    throw new Error("Unexpected request in preflight test.");
  };
  return { fetchImpl, requests };
}

test("deployment preflight passes with healthy HTTPS frontend, API, readiness and exact-origin CORS", async () => {
  const { fetchImpl, requests } = healthyFetch();
  const report = await runDeploymentPreflight({
    frontendUrl: "https://frontend.candidate-host.com",
    apiBaseUrl: "https://api.candidate-host.com/api/v1",
    fetchImpl,
    timeoutMs: 1_000
  });

  assert.equal(report.passed, true);
  assert.equal(report.checks.length, 8);
  assert.ok(report.checks.every((check) => check.passed));
  assert.deepEqual(requests.map((request) => request.method), ["GET", "GET", "GET", "OPTIONS"]);
  assert.ok(requests.every((request) => ["GET", "OPTIONS"].includes(request.method)));
  assert.equal(requests[3].headers.Origin, "https://frontend.candidate-host.com");
  assert.equal(requests[3].headers["Access-Control-Request-Method"], "POST");
  assert.equal(requests[3].headers["Access-Control-Request-Headers"], "content-type,x-csrf-token");
});

test("deployment preflight fails for a mismatched CORS origin", async () => {
  const { fetchImpl } = healthyFetch({ invalidCors: true });
  const report = await runDeploymentPreflight({
    frontendUrl: "https://frontend.candidate-host.com",
    apiBaseUrl: "https://api.candidate-host.com/api/v1",
    fetchImpl,
    timeoutMs: 1_000
  });

  assert.equal(report.passed, false);
  assert.equal(report.checks.find((check) => check.name === "CORS exact frontend origin").passed, false);
});

test("deployment preflight fails when API readiness is unavailable", async () => {
  const { fetchImpl } = healthyFetch({ notReady: true });
  const report = await runDeploymentPreflight({
    frontendUrl: "https://frontend.candidate-host.com",
    apiBaseUrl: "https://api.candidate-host.com/api/v1",
    fetchImpl,
    timeoutMs: 1_000
  });

  assert.equal(report.passed, false);
  assert.equal(report.checks.find((check) => check.name === "API readiness").passed, false);
});
