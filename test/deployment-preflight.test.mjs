import assert from "node:assert/strict";
import { EventEmitter } from "node:events";
import test from "node:test";

import { createPinnedHttpsFetch, createPinnedLookup, parsePublicHttpsUrl, runDeploymentPreflight } from "../scripts/deployment-preflight.mjs";

const publicLookup = async () => [{ address: "93.184.216.34", family: 4 }];

test("public deployment URLs require HTTPS on the default port and a public DNS hostname", () => {
  assert.equal(parsePublicHttpsUrl("https://frontend.candidate-host.com", "Frontend URL").origin, "https://frontend.candidate-host.com");
  assert.equal(parsePublicHttpsUrl("https://frontend.candidate-host.com:443", "Frontend URL").origin, "https://frontend.candidate-host.com");
  assert.throws(
    () => parsePublicHttpsUrl("https://frontend.candidate-host.com:8443", "Frontend URL"),
    /must use the default HTTPS port \(443\)/
  );
  assert.throws(
    () => parsePublicHttpsUrl("https://api.candidate-host.com:444/api/v1", "API base URL", { requireApiBase: true }),
    /must use the default HTTPS port \(443\)/
  );
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
    requests.push({ url: url.href, method, headers: init.headers || {}, redirect: init.redirect, pinnedAddresses: init.pinnedAddresses });

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
  assert.ok(requests.every((request) => request.pinnedAddresses?.length === 1 && request.pinnedAddresses[0].address === "93.184.216.34"), "every request receives the exact DNS answers that were validated");
  assert.equal(requests[3].headers.Origin, "https://frontend.candidate-host.com");
  assert.equal(requests[3].headers["Access-Control-Request-Method"], "POST");
  assert.equal(requests[3].headers["Access-Control-Request-Headers"], "content-type,x-csrf-token");
});



test("pinned DNS lookup only returns the prevalidated addresses for the expected host", async () => {
  const lookup = createPinnedLookup("api.candidate-host.com", [
    { address: "93.184.216.34", family: 4 },
    { address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 }
  ]);

  const all = await new Promise((resolve, reject) => {
    lookup("api.candidate-host.com", { all: true, verbatim: true }, (error, addresses) => {
      if (error) reject(error);
      else resolve(addresses);
    });
  });
  assert.deepEqual(all, [
    { address: "93.184.216.34", family: 4 },
    { address: "2606:2800:220:1:248:1893:25c8:1946", family: 6 }
  ]);

  const ipv4 = await new Promise((resolve, reject) => {
    lookup("api.candidate-host.com", { family: 4 }, (error, address, family) => {
      if (error) reject(error);
      else resolve({ address, family });
    });
  });
  assert.deepEqual(ipv4, { address: "93.184.216.34", family: 4 });

  await new Promise((resolve) => {
    lookup("attacker.candidate-host.com", { family: 4 }, (error) => {
      assert.match(error.message, /unexpected hostname/);
      resolve();
    });
  });

  await new Promise((resolve) => {
    lookup("api.candidate-host.com", { family: 2 }, (error) => {
      assert.match(error.message, /No pinned DNS address/);
      resolve();
    });
  });
});

test("pinned HTTPS fetch connects using the validated address while preserving TLS hostname", async () => {
  let capturedOptions;
  let lookupResult;
  let requestCount = 0;
  const requestImpl = (url, options) => {
    capturedOptions = { url: new URL(url.href), options };
    const request = new EventEmitter();
    request.end = () => {
      requestCount += 1;
      options.lookup(url.hostname, { family: 4 }, (error, address, family) => {
        if (error) {
          request.emit("error", error);
          return;
        }
        lookupResult = { address, family };
        const response = new EventEmitter();
        response.statusCode = 200;
        response.statusMessage = "OK";
        response.headers = { "content-type": "text/plain; charset=utf-8" };
        process.nextTick(() => {
          request.emit("response", response);
          response.emit("data", Buffer.from("pinned"));
          response.emit("end");
        });
      });
    };
    return request;
  };

  const fetchImpl = createPinnedHttpsFetch(requestImpl);
  const response = await fetchImpl("https://api.candidate-host.com/api/v1/health", {
    method: "GET",
    redirect: "error",
    signal: AbortSignal.timeout(1_000),
    pinnedAddresses: [{ address: "93.184.216.34", family: 4 }]
  });

  assert.equal(requestCount, 1);
  assert.equal(response.status, 200);
  assert.equal(await response.text(), "pinned");
  assert.equal(capturedOptions.url.hostname, "api.candidate-host.com");
  assert.equal(capturedOptions.options.servername, "api.candidate-host.com");
  assert.equal(capturedOptions.options.rejectUnauthorized, true);
  assert.equal(capturedOptions.options.autoSelectFamily, true);
  assert.deepEqual(lookupResult, { address: "93.184.216.34", family: 4 });
});

test("pinned HTTPS fetch supplies a default abort timeout when callers omit a signal", async () => {
  let capturedSignal;
  const requestImpl = (url, options) => {
    capturedSignal = options.signal;
    const request = new EventEmitter();
    request.end = () => {
      const response = new EventEmitter();
      response.statusCode = 200;
      response.statusMessage = "OK";
      response.headers = { "content-type": "text/plain" };
      process.nextTick(() => {
        request.emit("response", response);
        response.emit("data", Buffer.from("ok"));
        response.emit("end");
      });
    };
    return request;
  };

  const fetchImpl = createPinnedHttpsFetch(requestImpl);
  const response = await fetchImpl("https://api.candidate-host.com/api/v1/health", {
    method: "GET",
    redirect: "error",
    pinnedAddresses: [{ address: "93.184.216.34", family: 4 }]
  });

  assert.equal(response.status, 200);
  assert.ok(capturedSignal instanceof AbortSignal);
  assert.equal(capturedSignal.aborted, false);
});

test("pinned HTTPS fetch aborts and rejects a response body larger than the safety limit", async () => {
  const maxResponseBytes = 2 * 1024 * 1024;
  let destroyed = false;
  const requestImpl = () => {
    const request = new EventEmitter();
    request.destroy = (error) => {
      destroyed = true;
      if (error) process.nextTick(() => request.emit("error", error));
      return request;
    };
    request.end = () => {
      const response = new EventEmitter();
      response.statusCode = 200;
      response.statusMessage = "OK";
      response.headers = { "content-type": "text/html" };
      process.nextTick(() => {
        request.emit("response", response);
        response.emit("data", Buffer.alloc(maxResponseBytes));
        response.emit("data", Buffer.from("x"));
        response.emit("end");
      });
    };
    return request;
  };

  const fetchImpl = createPinnedHttpsFetch(requestImpl);
  await assert.rejects(
    fetchImpl("https://frontend.candidate-host.com/", {
      method: "GET",
      redirect: "error",
      signal: AbortSignal.timeout(1_000),
      pinnedAddresses: [{ address: "93.184.216.34", family: 4 }]
    }),
    /HTTPS response exceeded 2097152 bytes/
  );
  assert.equal(destroyed, true, "oversized response should destroy the HTTPS request");
});

test("pinned HTTPS transport allows only read-only methods and credential-free preflight headers", async () => {
  let requestCount = 0;
  let capturedOptions;
  const requestImpl = (_url, options) => {
    requestCount += 1;
    capturedOptions = options;
    const request = new EventEmitter();
    request.end = () => {
      const response = new EventEmitter();
      response.statusCode = 204;
      response.statusMessage = "No Content";
      response.headers = {};
      process.nextTick(() => {
        request.emit("response", response);
        response.emit("end");
      });
    };
    return request;
  };
  const fetchImpl = createPinnedHttpsFetch(requestImpl);
  const url = "https://api.candidate-host.com/api/v1/health";
  const validPins = [{ address: "93.184.216.34", family: 4 }];
  const baseInit = { redirect: "error", pinnedAddresses: validPins };

  for (const method of ["POST", "PATCH", "PUT", "DELETE", "TRACE", "CONNECT"]) {
    await assert.rejects(
      fetchImpl(url, { ...baseInit, method }),
      /only permits GET and OPTIONS requests/,
      method
    );
  }
  await assert.rejects(
    fetchImpl(url, { ...baseInit, method: "GET", body: "mutation payload" }),
    /does not permit request bodies/
  );
  for (const headers of [
    { authorization: "Bearer synthetic-token" },
    { cookie: "session=synthetic-cookie" },
    { "proxy-authorization": "Basic synthetic-token" },
    { "x-api-key": "synthetic-key" },
    { "x-custom-header": "unreviewed-value" }
  ]) {
    await assert.rejects(
      fetchImpl(url, { ...baseInit, method: "GET", headers }),
      /only permits credential-free preflight headers/
    );
  }
  await assert.rejects(
    fetchImpl(url, { ...baseInit, headers: { "accept-encoding": "gzip" } }),
    /only permits identity response encoding/
  );
  assert.equal(requestCount, 0, "rejected calls must not create an HTTPS request");

  const response = await fetchImpl(url, {
    ...baseInit,
    method: "OPTIONS",
    headers: {
      Origin: "https://frontend.candidate-host.com",
      "Access-Control-Request-Method": "POST",
      "Access-Control-Request-Headers": "content-type,x-csrf-token"
    }
  });
  assert.equal(response.status, 204);
  assert.equal(requestCount, 1, "a valid credential-free OPTIONS preflight is allowed");
  assert.equal(capturedOptions.method, "OPTIONS");
  assert.equal(capturedOptions.headers.origin, "https://frontend.candidate-host.com");
  assert.equal(capturedOptions.headers["access-control-request-method"], "POST");
  assert.equal(capturedOptions.headers["access-control-request-headers"], "content-type,x-csrf-token");
  assert.equal(capturedOptions.headers["accept-encoding"], "identity");
});

test("pinned HTTPS fetch refuses missing DNS pins, HTTP URLs and redirect-follow mode", async () => {
  let requestCount = 0;
  const requestImpl = () => {
    requestCount += 1;
    const request = new EventEmitter();
    request.end = () => {};
    return request;
  };
  const fetchImpl = createPinnedHttpsFetch(requestImpl);

  await assert.rejects(
    fetchImpl("https://api.candidate-host.com/api/v1/health", { redirect: "error" }),
    /Pinned public DNS addresses are required/
  );
  await assert.rejects(
    fetchImpl("http://api.candidate-host.com/api/v1/health", { redirect: "error", pinnedAddresses: [{ address: "93.184.216.34", family: 4 }] }),
    /only permits HTTPS/
  );
  await assert.rejects(
    fetchImpl("https://api.candidate-host.com/api/v1/health", { redirect: "follow", pinnedAddresses: [{ address: "93.184.216.34", family: 4 }] }),
    /requires redirect: error/
  );
  await assert.rejects(
    fetchImpl("https://api.candidate-host.com/api/v1/health", { redirect: "error", pinnedAddresses: [{ address: "127.0.0.1", family: 4 }] }),
    /Pinned addresses must be public IPs/
  );
  await assert.rejects(
    fetchImpl("https://api.candidate-host.com/api/v1/health", { redirect: "error", pinnedAddresses: [{ address: "93.184.216.34", family: 6 }] }),
    /Pinned addresses must be public IPs/
  );
  await assert.rejects(
    fetchImpl("https://127.0.0.1/api/v1/health", { redirect: "error", pinnedAddresses: [{ address: "93.184.216.34", family: 4 }] }),
    /must use a public DNS hostname/
  );
  await assert.rejects(
    fetchImpl("https://api.candidate-host.com:8443/api/v1/health", { redirect: "error", pinnedAddresses: [{ address: "93.184.216.34", family: 4 }] }),
    /must use the default HTTPS port \(443\)/
  );
  assert.equal(requestCount, 0, "invalid transport configuration must fail before opening a socket");
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
    ["IPv4 unspecified", [{ address: "0.0.0.0", family: 4 }]],
    ["IPv4 loopback", [{ address: "127.0.0.1", family: 4 }]],
    ["IPv4 private", [{ address: "10.20.30.40", family: 4 }]],
    ["IPv4 link-local", [{ address: "169.254.1.2", family: 4 }]],
    ["IPv4 shared address space", [{ address: "100.64.0.1", family: 4 }]],
    ["IPv4 multicast", [{ address: "224.0.0.1", family: 4 }]],
    ["IPv4 limited broadcast", [{ address: "255.255.255.255", family: 4 }]],
    ["IPv4 IANA protocol-assignment block", [{ address: "192.0.0.170", family: 4 }]],
    ["IPv6 unspecified", [{ address: "::", family: 6 }]],
    ["IPv6 loopback", [{ address: "::1", family: 6 }]],
    ["IPv6 IPv4-mapped loopback", [{ address: "::ffff:127.0.0.1", family: 6 }]],
    ["IPv6 unique-local", [{ address: "fc00::1", family: 6 }]],
    ["IPv6 link-local", [{ address: "fe80::1", family: 6 }]],
    ["IPv6 discard-only block", [{ address: "100::1", family: 6 }]],
    ["IPv6 IANA dummy prefix", [{ address: "100:0:0:1::1", family: 6 }]],
    ["IPv6 IANA SRv6 SID prefix", [{ address: "5f00::1", family: 6 }]],
    ["IPv6 IANA benchmarking range", [{ address: "2001:2::1", family: 6 }]],
    ["IPv6 deprecated ORCHID range", [{ address: "2001:10::1", family: 6 }]],
    ["IPv6 documentation range", [{ address: "2001:db8::1", family: 6 }]],
    ["IPv6 6to4 range", [{ address: "2002::1", family: 6 }]],
    ["IPv6 documentation prefix", [{ address: "3fff::1", family: 6 }]],
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

test("deployment preflight accepts a globally routed IPv6 address when every DNS answer is public", async () => {
  const { fetchImpl, requests } = healthyFetch();
  const lookupImpl = async (hostname) => hostname === "frontend.candidate-host.com"
    ? [{ address: "2606:4700:4700::1111", family: 6 }]
    : [{ address: "93.184.216.34", family: 4 }];

  const report = await runDeploymentPreflight({
    frontendUrl: "https://frontend.candidate-host.com",
    apiBaseUrl: "https://api.candidate-host.com/api/v1",
    fetchImpl,
    lookupImpl,
    timeoutMs: 1_000
  });

  assert.equal(report.passed, true);
  assert.ok(report.checks.every((check) => check.passed));
  assert.equal(requests.length, 4);
  assert.deepEqual(
    requests[0].pinnedAddresses,
    [{ address: "2606:4700:4700::1111", family: 6 }]
  );
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


test("deployment URL validator rejects IANA special-use DNS names and their subdomains", () => {
  const cases = [
    "https://api.example.com",
    "https://status.example.net",
    "https://frontend.example.org",
    "https://service.onion",
    "https://service.home.arpa",
    "https://deployment.alt"
  ];

  for (const value of cases) {
    assert.throws(
      () => parsePublicHttpsUrl(value, "Frontend URL"),
      /must use a public DNS hostname/,
      value
    );
  }
});
