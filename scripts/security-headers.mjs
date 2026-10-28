const BASE_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" }
];

const LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function isLoopbackHttpApi(value) {
  if (typeof value !== "string" || value.trim() === "") return false;
  try {
    const url = new URL(value.trim());
    return url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function productionApiOrigin(value) {
  if (typeof value !== "string" || value.trim() === "") return null;
  try {
    const url = new URL(value.trim());
    if (url.protocol === "https:") return url.origin;
    // Only the isolated local browser harness can use HTTP in production mode.
    if (url.protocol === "http:" && LOOPBACK_HOSTS.has(url.hostname.toLowerCase())) return url.origin;
    return null;
  } catch {
    return null;
  }
}

/**
 * Returns browser hardening headers for the frontend.
 * Production network access is restricted to this app and the configured HTTPS API origin.
 * The inline-script exception preserves Next's built-in hydration; it is not a nonce-based strict CSP.
 */
export function getSecurityHeaders({
  isProduction = process.env.NODE_ENV === "production",
  apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
} = {}) {
  const localHttpHarness = isProduction && isLoopbackHttpApi(apiBaseUrl);
  const connectSources = isProduction
    ? ["'self'", productionApiOrigin(apiBaseUrl)].filter(Boolean)
    : ["'self'", "http:", "https:", "ws:", "wss:"];
  const scriptSources = isProduction
    ? "'self' 'unsafe-inline'"
    : "'self' 'unsafe-inline' 'unsafe-eval'";
  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "script-src " + scriptSources,
    "connect-src " + connectSources.join(" "),
    ...(isProduction && !localHttpHarness ? ["upgrade-insecure-requests"] : [])
  ].join("; ");

  const headers = [
    ...BASE_HEADERS,
    { key: "Content-Security-Policy", value: csp }
  ];
  if (isProduction && !localHttpHarness) {
    // Do not include subdomains until the deployment owner confirms every subdomain is HTTPS-only.
    headers.push({ key: "Strict-Transport-Security", value: "max-age=31536000" });
  }

  return [{ source: "/:path*", headers }];
}
