import { BlockList, isIP } from "node:net";
import { lookup } from "node:dns/promises";
import { request as httpsRequest } from "node:https";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const FORBIDDEN_SUFFIXES = [".localhost", ".local", ".internal", ".test", ".invalid", ".example"];
const RESERVED_HOSTS = new Set(["localhost", "example.com", "example.net", "example.org"]);
const DNS_LABEL_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

const NON_PUBLIC_IPV4 = new BlockList();
for (const [subnet, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.88.99.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4]
]) {
  NON_PUBLIC_IPV4.addSubnet(subnet, prefix, "ipv4");
}

const GLOBAL_IPV6 = new BlockList();
GLOBAL_IPV6.addSubnet("2000::", 3, "ipv6");
const NON_PUBLIC_IPV6 = new BlockList();
for (const [subnet, prefix] of [
  ["2001::", 23],
  ["2001:db8::", 32],
  ["2002::", 16],
  ["3fff::", 20],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8]
]) {
  NON_PUBLIC_IPV6.addSubnet(subnet, prefix, "ipv6");
}

export function parsePublicHttpsUrl(value, label, { requireApiBase = false } = {}) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(label + " is required.");
  }

  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error(label + " must be a valid URL.");
  }

  const hostname = url.hostname.toLowerCase();
  // Reject non-canonical FQDN spelling so reserved/local-host checks cannot be bypassed.
  if (hostname.endsWith(".")) {
    throw new Error(label + " must not use a trailing-dot hostname.");
  }
  if (url.protocol !== "https:") {
    throw new Error(label + " must use HTTPS.");
  }
  if (url.username || url.password) {
    throw new Error(label + " must not contain credentials.");
  }
  if (url.search || url.hash) {
    throw new Error(label + " must not contain a query string or fragment.");
  }
  const labels = hostname.split(".");
  const invalidDnsName = hostname.length > 253 ||
    labels.some((label) => label.length > 63 || !DNS_LABEL_PATTERN.test(label));

  if (
    RESERVED_HOSTS.has(hostname) ||
    FORBIDDEN_SUFFIXES.some((suffix) => hostname.endsWith(suffix)) ||
    !hostname.includes(".") ||
    invalidDnsName ||
    isIP(hostname) !== 0
  ) {
    throw new Error(label + " must use a public DNS hostname, not a local, reserved, or IP-literal host.");
  }
  if (requireApiBase && !/\/api\/v1\/?$/i.test(url.pathname)) {
    throw new Error("API base URL must end with /api/v1.");
  }

  url.pathname = url.pathname.replace(/\/+$/, "") || "/";
  return url;
}

function isPublicIpAddress(address) {
  const family = isIP(address);
  if (family === 4) {
    return !NON_PUBLIC_IPV4.check(address, "ipv4");
  }
  if (family === 6) {
    return GLOBAL_IPV6.check(address, "ipv6") &&
      !NON_PUBLIC_IPV6.check(address, "ipv6");
  }
  return false;
}

function createPublicHostnameGuard(lookupImpl) {
  const resolutions = new Map();
  return async (hostname) => {
    if (!resolutions.has(hostname)) {
      resolutions.set(hostname, (async () => {
        const addresses = await lookupImpl(hostname, { all: true, verbatim: true });
        if (!Array.isArray(addresses) || addresses.length === 0) {
          throw new Error("Hostname did not resolve to any IP address.");
        }
        if (addresses.some((entry) => !entry || !isPublicIpAddress(entry.address))) {
          throw new Error("Hostname must resolve only to globally routable IP addresses.");
        }
        return addresses.map((entry) => ({
          address: entry.address,
          family: entry.family || isIP(entry.address)
        }));
      })());
    }
    return resolutions.get(hostname);
  };
}

/**
 * Build a Node DNS lookup callback that pins a request to the addresses
 * already validated by the public-hostname guard. The URL hostname remains
 * unchanged, so HTTPS SNI and certificate verification still use the hostname.
 */
export function createPinnedLookup(hostname, addresses) {
  const expectedHostname = hostname.toLowerCase();
  const pinnedAddresses = addresses.map((entry) => ({
    address: entry.address,
    family: entry.family || isIP(entry.address)
  }));

  return (requestedHostname, options, callback) => {
    if (typeof options === "function") {
      callback = options;
      options = {};
    }
    const requestedName = String(requestedHostname).toLowerCase();
    const requestedFamily = typeof options === "number" ? options : (options?.family || 0);
    const wantsAll = typeof options === "object" && options !== null && options.all === true;

    process.nextTick(() => {
      if (requestedName !== expectedHostname) {
        callback(new Error("Pinned DNS lookup rejected an unexpected hostname."));
        return;
      }

      const candidates = pinnedAddresses.filter((entry) =>
        requestedFamily === 0 || entry.family === requestedFamily
      );
      if (candidates.length === 0) {
        callback(new Error("No pinned DNS address matches the requested address family."));
        return;
      }

      if (wantsAll) {
        callback(null, candidates);
        return;
      }
      callback(null, candidates[0].address, candidates[0].family);
    });
  };
}

/**
 * HTTPS fetch adapter with connection-level DNS pinning.
 * It intentionally does not follow redirects. Inject requestImpl only in tests.
 */
export function createPinnedHttpsFetch(requestImpl = httpsRequest) {
  return async (input, init = {}) => {
    const url = new URL(String(input));
    if (url.protocol !== "https:") {
      throw new Error("Pinned preflight transport only permits HTTPS.");
    }
    if (init.redirect !== "error") {
      throw new Error("Pinned preflight transport requires redirect: error.");
    }
    if (!Array.isArray(init.pinnedAddresses) || init.pinnedAddresses.length === 0) {
      throw new Error("Pinned public DNS addresses are required for HTTPS requests.");
    }

    const lookupPinned = createPinnedLookup(url.hostname, init.pinnedAddresses);
    const method = init.method || "GET";
    const headers = new Headers(init.headers || {});
    if (!headers.has("accept-encoding")) headers.set("accept-encoding", "identity");

    return new Promise((resolve, reject) => {
      let settled = false;
      const rejectOnce = (error) => {
        if (settled) return;
        settled = true;
        reject(error);
      };

      let request;
      try {
        request = requestImpl(url, {
          method,
          headers: Object.fromEntries(headers.entries()),
          lookup: lookupPinned,
          autoSelectFamily: true,
          rejectUnauthorized: true,
          servername: url.hostname,
          signal: init.signal
        });
      } catch (error) {
        rejectOnce(error);
        return;
      }

      request.once("error", rejectOnce);
      request.once("response", (incoming) => {
        const chunks = [];
        incoming.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
        incoming.once("aborted", () => rejectOnce(new Error("HTTPS response was aborted.")));
        incoming.once("error", rejectOnce);
        incoming.once("end", () => {
          if (settled) return;
          const status = incoming.statusCode;
          if (!Number.isInteger(status) || status < 200 || status > 599) {
            rejectOnce(new Error("HTTPS response returned an invalid status code."));
            return;
          }

          const responseHeaders = new Headers();
          for (const [name, value] of Object.entries(incoming.headers || {})) {
            if (value !== undefined) {
              responseHeaders.set(name, Array.isArray(value) ? value.join(", ") : String(value));
            }
          }

          const noBody = method.toUpperCase() === "HEAD" || [204, 205, 304].includes(status);
          try {
            const responseBody = noBody ? null : Buffer.concat(chunks);
            settled = true;
            resolve(new Response(responseBody, {
              status,
              statusText: incoming.statusMessage || "",
              headers: responseHeaders
            }));
          } catch (error) {
            rejectOnce(error);
          }
        });
      });
      request.end();
    });
  };
}

function addResult(results, name, passed, detail) {
  results.push({ name, passed, detail });
}

async function responseJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function getResponse(fetchImpl, url, { method = "GET", headers = {}, timeoutMs, assertPublicHostname }) {
  const pinnedAddresses = await assertPublicHostname(url.hostname);
  return fetchImpl(url, {
    method,
    headers,
    redirect: "error",
    signal: AbortSignal.timeout(timeoutMs),
    pinnedAddresses
  });
}

function stayedOnSameSecureOrigin(response, requestedUrl) {
  const finalUrl = response.url ? new URL(response.url) : requestedUrl;
  return finalUrl.protocol === "https:" && finalUrl.origin === requestedUrl.origin;
}

/**
 * Read-only preflight for a deployed Doctor Tracker frontend/API pair.
 * It only performs GETs and a CORS OPTIONS request; it never logs response bodies
 * or sends credentials, cookies, tokens, or mutation requests.
 */
export async function runDeploymentPreflight({
  frontendUrl,
  apiBaseUrl,
  fetchImpl = createPinnedHttpsFetch(),
  lookupImpl = lookup,
  timeoutMs = 10_000
}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required.");
  }
  if (typeof lookupImpl !== "function") {
    throw new Error("A DNS lookup implementation is required.");
  }

  const assertPublicHostname = createPublicHostnameGuard(lookupImpl);
  const frontend = parsePublicHttpsUrl(frontendUrl, "Frontend URL");
  const apiBase = parsePublicHttpsUrl(apiBaseUrl, "API base URL", { requireApiBase: true });
  const apiBaseWithSlash = new URL(apiBase.href.replace(/\/+$/, "") + "/");
  const results = [];

  const frontendResponseUrl = new URL(frontend.href);
  try {
    const response = await getResponse(fetchImpl, frontendResponseUrl, { timeoutMs, assertPublicHostname });
    const contentType = response.headers.get("content-type") || "";
    const ok = response.status === 200 &&
      contentType.toLowerCase().includes("text/html") &&
      stayedOnSameSecureOrigin(response, frontendResponseUrl);
    addResult(
      results,
      "Frontend HTTPS page",
      ok,
      ok ? "HTTP 200 HTML document served over the requested HTTPS origin." :
        "Unexpected frontend response (HTTP " + response.status + "); expected HTTP 200 HTML without an insecure or cross-origin redirect."
    );
  } catch (error) {
    addResult(results, "Frontend HTTPS page", false, "Request failed (" + (error instanceof Error ? error.name : "network error") + ").");
  }

  const healthUrl = new URL("health", apiBaseWithSlash);
  try {
    const response = await getResponse(fetchImpl, healthUrl, { timeoutMs, assertPublicHostname });
    const body = await responseJson(response);
    const ok = response.status === 200 &&
      body?.data?.status === "ok" &&
      body?.data?.service === "doctor-tracker-api" &&
      stayedOnSameSecureOrigin(response, healthUrl);
    addResult(
      results,
      "API liveness",
      ok,
      ok ? "API health endpoint returned the expected service status." :
        "Unexpected API liveness response (HTTP " + response.status + ")."
    );
  } catch (error) {
    addResult(results, "API liveness", false, "Request failed (" + (error instanceof Error ? error.name : "network error") + ").");
  }

  const readyUrl = new URL("ready", apiBaseWithSlash);
  try {
    const response = await getResponse(fetchImpl, readyUrl, { timeoutMs, assertPublicHostname });
    const body = await responseJson(response);
    const ok = response.status === 200 &&
      body?.data?.status === "ready" &&
      stayedOnSameSecureOrigin(response, readyUrl);
    addResult(
      results,
      "API readiness",
      ok,
      ok ? "API readiness endpoint reports a connected database." :
        "API is not ready or returned an unexpected response (HTTP " + response.status + ")."
    );
  } catch (error) {
    addResult(results, "API readiness", false, "Request failed (" + (error instanceof Error ? error.name : "network error") + ").");
  }

  const corsUrl = new URL("auth/login", apiBaseWithSlash);
  let corsResponse;
  try {
    corsResponse = await getResponse(fetchImpl, corsUrl, {
      method: "OPTIONS",
      headers: {
        Origin: frontend.origin,
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type,x-csrf-token"
      },
      timeoutMs,
      assertPublicHostname
    });
    const sameOrigin = stayedOnSameSecureOrigin(corsResponse, corsUrl);
    const preflightAccepted = (corsResponse.status === 200 || corsResponse.status === 204) && sameOrigin;
    addResult(
      results,
      "CORS preflight response",
      preflightAccepted,
      preflightAccepted ? "API accepted the OPTIONS preflight on the requested HTTPS origin." :
        "Unexpected CORS preflight response (HTTP " + corsResponse.status + ")."
    );
  } catch (error) {
    addResult(results, "CORS preflight response", false, "Request failed (" + (error instanceof Error ? error.name : "network error") + ").");
  }

  if (corsResponse) {
    const allowOrigin = corsResponse.headers.get("access-control-allow-origin");
    addResult(
      results,
      "CORS exact frontend origin",
      allowOrigin === frontend.origin,
      allowOrigin === frontend.origin ? "CORS allow-origin matches the supplied frontend origin exactly." :
        "CORS allow-origin is missing or does not match the supplied frontend origin."
    );

    const allowCredentials = corsResponse.headers.get("access-control-allow-credentials");
    addResult(
      results,
      "Credentialed CORS",
      allowCredentials?.toLowerCase() === "true",
      allowCredentials?.toLowerCase() === "true" ?
        "Credentialed cross-origin requests are explicitly allowed." :
        "CORS does not explicitly allow credentials."
    );

    const methods = (corsResponse.headers.get("access-control-allow-methods") || "")
      .split(",")
      .map((method) => method.trim().toUpperCase());
    addResult(
      results,
      "CORS login POST method",
      methods.includes("POST"),
      methods.includes("POST") ? "CORS permits the login POST method." :
        "CORS allow-methods does not include POST."
    );

    const allowedHeaders = (corsResponse.headers.get("access-control-allow-headers") || "")
      .split(",")
      .map((header) => header.trim().toLowerCase());
    const missingHeaders = ["content-type", "x-csrf-token"].filter((header) => !allowedHeaders.includes(header));
    addResult(
      results,
      "CORS request headers",
      missingHeaders.length === 0,
      missingHeaders.length === 0 ? "CORS permits Content-Type and X-CSRF-Token." :
        "CORS is missing required request header(s): " + missingHeaders.join(", ") + "."
    );
  } else {
    addResult(results, "CORS exact frontend origin", false, "CORS headers could not be inspected because the preflight request failed.");
    addResult(results, "Credentialed CORS", false, "CORS headers could not be inspected because the preflight request failed.");
    addResult(results, "CORS login POST method", false, "CORS headers could not be inspected because the preflight request failed.");
    addResult(results, "CORS request headers", false, "CORS headers could not be inspected because the preflight request failed.");
  }

  return {
    passed: results.every((result) => result.passed),
    frontendHost: frontend.hostname,
    apiHost: apiBase.hostname,
    checks: results
  };
}

async function main() {
  try {
    const report = await runDeploymentPreflight({
      frontendUrl: process.env.FRONTEND_URL,
      apiBaseUrl: process.env.API_BASE_URL
    });

    for (const result of report.checks) {
      process.stdout.write((result.passed ? "PASS" : "FAIL") + " " + result.name + ": " + result.detail + "\n");
    }
    process.stdout.write(
      "Checked frontend host " + report.frontendHost + " and API host " + report.apiHost +
      "; " + report.checks.filter((item) => item.passed).length + "/" + report.checks.length + " checks passed.\n"
    );

    if (!report.passed) process.exitCode = 1;
  } catch (error) {
    process.stderr.write("Deployment preflight cannot run: " + (error instanceof Error ? error.message : "invalid input") + "\n");
    process.exitCode = 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
