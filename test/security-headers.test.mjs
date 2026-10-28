import assert from "node:assert/strict";
import test from "node:test";

import { getSecurityHeaders } from "../scripts/security-headers.mjs";

const NONCE = "dGVzdC1ub25jZQ==";

function headerMap(config) {
  return new Map(config[0].headers.map(({ key, value }) => [key.toLowerCase(), value]));
}

function cspDirectives(value) {
  return new Map(value.split(";").map((part) => {
    const [name, ...values] = part.trim().split(/\s+/);
    return [name, values.join(" ")];
  }));
}

test("production security headers apply nonce-bound script/style policy and baseline protections", () => {
  const rules = getSecurityHeaders({
    isProduction: true,
    apiBaseUrl: "https://api.candidate-host.com/api/v1",
    nonce: NONCE
  });
  assert.equal(rules.length, 1);
  assert.equal(rules[0].source, "/:path*");
  const headers = headerMap(rules);
  assert.equal(headers.get("x-content-type-options"), "nosniff");
  assert.equal(headers.get("x-frame-options"), "DENY");
  assert.equal(headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.equal(headers.get("permissions-policy"), "camera=(), microphone=(), geolocation=(), browsing-topics=()");
  assert.equal(headers.get("cross-origin-opener-policy"), "same-origin");
  assert.equal(headers.get("strict-transport-security"), "max-age=31536000");

  const csp = cspDirectives(headers.get("content-security-policy"));
  assert.equal(csp.get("default-src"), "'self'");
  assert.equal(csp.get("object-src"), "'none'");
  assert.equal(csp.get("base-uri"), "'self'");
  assert.equal(csp.get("frame-ancestors"), "'none'");
  assert.equal(csp.get("form-action"), "'self'");
  assert.equal(csp.get("connect-src"), "'self' https://api.candidate-host.com");
  assert.equal(csp.get("script-src"), "'self' 'nonce-" + NONCE + "' 'strict-dynamic'");
  assert.equal(csp.get("style-src"), "'self' 'nonce-" + NONCE + "'");
  assert.equal(csp.has("upgrade-insecure-requests"), true);
  assert.doesNotMatch(headers.get("content-security-policy"), /unsafe-inline|unsafe-eval/);
  assert.doesNotMatch(csp.get("connect-src"), /\bhttp:/);
  assert.doesNotMatch(csp.get("connect-src"), /\bhttps:$/);
});

test("CSP generation fails closed if nonce is missing or malformed", () => {
  assert.throws(
    () => getSecurityHeaders({ isProduction: true, apiBaseUrl: "https://api.candidate-host.com/api/v1" }),
    /per-response CSP nonce is required/
  );
  for (const nonce of ["", "not a nonce", "nonce'; script-src *"]) {
    assert.throws(
      () => getSecurityHeaders({ isProduction: true, apiBaseUrl: "https://api.candidate-host.com/api/v1", nonce }),
      /per-response CSP nonce is required/
    );
  }
});

test("production CSP does not grant a remote API origin to a missing or insecure URL", () => {
  for (const apiBaseUrl of ["", "http://api.candidate-host.com/api/v1", "not a URL"]) {
    const headers = headerMap(getSecurityHeaders({ isProduction: true, apiBaseUrl, nonce: NONCE }));
    const csp = cspDirectives(headers.get("content-security-policy"));
    assert.equal(csp.get("connect-src"), "'self'");
  }
});

test("production-mode loopback acceptance is scoped to the exact local API origin and skips HSTS upgrade", () => {
  const headers = headerMap(getSecurityHeaders({
    isProduction: true,
    apiBaseUrl: "http://127.0.0.1:4000/api/v1",
    nonce: NONCE
  }));
  const csp = cspDirectives(headers.get("content-security-policy"));
  assert.equal(csp.get("connect-src"), "'self' http://127.0.0.1:4000");
  assert.equal(csp.get("script-src"), "'self' 'nonce-" + NONCE + "' 'strict-dynamic'");
  assert.equal(csp.get("style-src"), "'self' 'nonce-" + NONCE + "'");
  assert.equal(csp.has("upgrade-insecure-requests"), false);
  assert.equal(headers.has("strict-transport-security"), false);
});

test("development CSP allows hot reload and eval but still requires nonces instead of unsafe-inline", () => {
  const headers = headerMap(getSecurityHeaders({
    isProduction: false,
    apiBaseUrl: "http://localhost:4000/api/v1",
    nonce: NONCE
  }));
  const csp = cspDirectives(headers.get("content-security-policy"));
  assert.equal(csp.get("connect-src"), "'self' http: https: ws: wss:");
  assert.equal(headers.has("strict-transport-security"), false);
  assert.equal(csp.get("script-src"), "'self' 'nonce-" + NONCE + "' 'strict-dynamic' 'unsafe-eval'");
  assert.equal(csp.get("style-src"), "'self' 'nonce-" + NONCE + "'");
  assert.doesNotMatch(headers.get("content-security-policy"), /unsafe-inline/);
});

test("static Next config can add baseline headers without emitting a nonce-less CSP", () => {
  const headers = headerMap(getSecurityHeaders({
    isProduction: true,
    apiBaseUrl: "https://api.candidate-host.com/api/v1",
    includeCsp: false
  }));
  assert.equal(headers.has("content-security-policy"), false);
  assert.equal(headers.get("strict-transport-security"), "max-age=31536000");
  assert.equal(headers.get("x-content-type-options"), "nosniff");
});
