import { isIP } from "node:net";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const FORBIDDEN_SUFFIXES = [".localhost", ".local", ".internal", ".test", ".invalid", ".example"];
const RESERVED_HOSTS = new Set(["localhost", "example.com", "example.net", "example.org"]);

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
  if (url.protocol !== "https:") {
    throw new Error(label + " must use HTTPS.");
  }
  if (url.username || url.password) {
    throw new Error(label + " must not contain credentials.");
  }
  if (url.search || url.hash) {
    throw new Error(label + " must not contain a query string or fragment.");
  }
  if (
    RESERVED_HOSTS.has(hostname) ||
    FORBIDDEN_SUFFIXES.some((suffix) => hostname.endsWith(suffix)) ||
    !hostname.includes(".") ||
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

async function getResponse(fetchImpl, url, { method = "GET", headers = {}, timeoutMs }) {
  return fetchImpl(url, {
    method,
    headers,
    redirect: "error",
    signal: AbortSignal.timeout(timeoutMs)
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
  fetchImpl = globalThis.fetch,
  timeoutMs = 10_000
}) {
  if (typeof fetchImpl !== "function") {
    throw new Error("A fetch implementation is required.");
  }

  const frontend = parsePublicHttpsUrl(frontendUrl, "Frontend URL");
  const apiBase = parsePublicHttpsUrl(apiBaseUrl, "API base URL", { requireApiBase: true });
  const apiBaseWithSlash = new URL(apiBase.href.replace(/\/+$/, "") + "/");
  const results = [];

  const frontendResponseUrl = new URL(frontend.href);
  try {
    const response = await getResponse(fetchImpl, frontendResponseUrl, { timeoutMs });
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
    const response = await getResponse(fetchImpl, healthUrl, { timeoutMs });
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
    const response = await getResponse(fetchImpl, readyUrl, { timeoutMs });
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
      timeoutMs
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
