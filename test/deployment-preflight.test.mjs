import assert from "node:assert/strict";
import test from "node:test";

import { parsePublicHttpsUrl, runDeploymentPreflight } from "../scripts/deployment-preflight.mjs";

const publicLookup = async () => [{ address: "93.184.216.34", family: 4 }];

test("public deployment URLs require HTTPS and a public DNS hostname", () => {
  assert.equal(parsePublicHttpsUrl("https://frontend.candidate-host.com", "Frontend URL").origin, "https://frontend.candidate-host.com");
  assert.throws(() => parsePublicHttpsUrl("http://frontend.candidate-host.com", "Frontend URL"), /must use HTTPS/);
  assert.throws(() => parsePublicHttpsUrl("https://localhost:3000", "Frontend URL"), /public DNS hostname/);
  assert.throws(() => parsePublicHttpsUrl("https://127.0.0.1", "Frontend URL"), /public DNS hostname/);
  assert.throws(() => parsePublicHttpsUrl("https://user:pass@frontend.candidate-host.com", "Frontend URL"), /must not contain credentials/);
  assert.throws(() => parsePublicHttpsUrl("https://frontend.candidate-host.com/?token=not-allowed", "Frontend URL"), /query string or fragment/);
  assert.throws(() => parsePublicHttpsUrl("https://frontend.candidate-host.com/#fragment", "Frontend URL"), /query string or fragment/);
});

test("deployment URL validator rejects trailing-dot hostnames", () => {
  const cases = [
    ["https://localhost.", "Frontend URL", false],
    ["https://example.com.", "Frontend URL", false],
    ["https://service.localhost.", "Frontend URL", false],
    ["https://frontend.candidate-host.com.", "Frontend URL", false],
    ["https://api.candidate-host.com./api/v1", "API base URL", true]
  ];

  for (const [value, label, requireApiBase] of cases) {
    assert.throws(
      () => parsePublicHttpsUrl(value, label, { requireApiBase }),
      /must not use a trailing-dot hostname/,
      value
    );
  }
});

test("deployment URL validator rejects malformed public DNS labels", () => {
  const cases = [
    "https://frontend..candidate-host.com",
    "https://-frontend.candidate-host.com",
    "https://frontend-.candidate-host.com",
    "https://front_end.candidate-host.com",
    "https://" + "a".repeat(64) + ".candidate-host.com",
    "https://" + [
      "a".repeat(63),
      "b".repeat(63),
      "c".repeat(63),
      "d".repeat(63)
    ].join(".")
  ];

  for (const value of cases) {
    assert.throws(
      () => parsePublicHttpsUrl(value, "Frontend URL"),
      /must use a public DNS hostname/,
      value
    );
  }
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
    requests.push({ url: url.href, method, headers: init.headers || {}, redirect: init.redirect });

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
    lookupImpl: publicLookup,
    timeoutMs: 1_000
  });

  assert.equal(report.passed, true);
  assert.equal(report.checks.length, 8);
  assert.ok(report.checks.every((check) => check.passed));
  assert.deepEqual(requests.map((request) => request.method), ["GET", "GET", "GET", "OPTIONS"]);
  assert.ok(requests.every((request) => ["GET", "OPTIONS"].includes(request.method)));
  assert.ok(requests.every((request) => request.redirect === "error"), "preflight must reject redirects for every request");
  assert.equal(requests[3].headers.Origin, "https://frontend.candidate-host.com");
  assert.equal(requests[3].headers["Access-Control-Request-Method"], "POST");
  assert.equal(requests[3].headers["Access-Control-Request-Headers"], "content-type,x-csrf-token");
});


test("deployment preflight fails closed when redirect:error rejects a redirected frontend request", async () => {
  const { fetchImpl: healthyFetchImpl } = healthyFetch();
  const requests = [];
  const fetchImpl = async (input, init = {}) => {
    const url = new URL(String(input));
    requests.push({ url: url.href, method: init.method || "GET", redirect: init.redirect });
    if (url.hostname === "frontend.candidate-host.com") {
      assert.equal(init.redirect, "error");
      throw new TypeError("fetch rejected a redirect in error mode");
    }
    return healthyFetchImpl(input, init);
  };

  const report = await runDeploymentPreflight({
    frontendUrl: "https://frontend.candidate-host.com",
    apiBaseUrl: "https://api.candidate-host.com/api/v1",
    fetchImpl,
    lookupImpl: publicLookup,
    timeoutMs: 1_000
  });

  assert.equal(report.passed, false);
  assert.equal(report.checks.find((check) => check.name === "Frontend HTTPS page").passed, false);
  assert.equal(requests.length, 4, "preflight should continue collecting independent read-only API/CORS evidence");
  assert.ok(requests.every((request) => request.redirect === "error"));
});


test("deployment preflight blocks hostname resolutions to non-public IP ranges before fetch", async () => {
  const cases = [
    ["IPv4 loopback", [{ address: "127.0.0.1", family: 4 }]],
    ["IPv4 private", [{ address: "10.20.30.40", family: 4 }]],
    ["IPv4 link-local", [{ address: "169.254.1.2", family: 4 }]],
    ["IPv4 shared address space", [{ address: "100.64.0.1", family: 4 }]],
    ["IPv6 loopback", [{ address: "::1", family: 6 }]],
    ["IPv6 unique-local", [{ address: "fc00::1", family: 6 }]],
    ["IPv6 link-local", [{ address: "fe80::1", family: 6 }]],
    ["IPv6 documentation range", [{ address: "2001:db8::1", family: 6 }]],
    ["mixed public and private answers", [
      { address: "93.184.216.34", family: 4 },
      { address: "192.168.1.10", family: 4 }
    ]]
  ];

  for (const [label, frontendAddresses] of cases) {
    const { fetchImpl, requests } = healthyFetch();
    const lookups = [];
    const lookupImpl = async (hostname) => {
      lookups.push(hostname);
      return hostname === "frontend.candidate-host.com"
        ? frontendAddresses
        : [{ address: "93.184.216.34", family: 4 }];
    };

    const report = await runDeploymentPreflight({
      frontendUrl: "https://frontend.candidate-host.com",
      apiBaseUrl: "https://api.candidate-host.com/api/v1",
      fetchImpl,
      lookupImpl,
      timeoutMs: 1_000
    });

    assert.equal(report.passed, false, label);
    assert.equal(
      report.checks.find((check) => check.name === "Frontend HTTPS page").passed,
      false,
      label
    );
    assert.equal(
      report.checks.find((check) => check.name === "API liveness").passed,
      true,
      label + ": independent API checks should continue"
    );
    assert.equal(requests.length, 3, label + ": do not fetch the non-public frontend hostname");
    assert.ok(requests.every((request) => new URL(request.url).hostname === "api.candidate-host.com"), label);
    assert.deepEqual(
      [...new Set(lookups)].sort(),
      ["api.candidate-host.com", "frontend.candidate-host.com"],
      label + ": cache DNS results per hostname during one preflight"
    );
  }
});

test("deployment preflight fails closed when DNS lookup fails or returns no addresses", async () => {
  for (const lookupImpl of [
    async () => { throw new Error("DNS unavailable"); },
    async () => []
  ]) {
    const { fetchImpl, requests } = healthyFetch();
    const report = await runDeploymentPreflight({
      frontendUrl: "https://frontend.candidate-host.com",
      apiBaseUrl: "https://api.candidate-host.com/api/v1",
      fetchImpl,
      lookupImpl,
      timeoutMs: 1_000
    });

    assert.equal(report.passed, false);
    assert.ok(report.checks.every((check) => !check.passed));
    assert.equal(requests.length, 0, "do not send requests when DNS cannot be verified");
  }
});

test("deployment preflight fails for a mismatched CORS origin", async () => {
  const { fetchImpl } = healthyFetch({ invalidCors: true });
  const report = await runDeploymentPreflight({
    frontendUrl: "https://frontend.candidate-host.com",
    apiBaseUrl: "https://api.candidate-host.com/api/v1",
    fetchImpl,
    lookupImpl: publicLookup,
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
    lookupImpl: publicLookup,
    timeoutMs: 1_000
  });

  assert.equal(report.passed, false);
  assert.equal(report.checks.find((check) => check.name === "API readiness").passed, false);
});
