# Security Engineering Standard
## Identity and sessions
Use maintained password hashing and no hard-coded admin password. Use generic login failures and rate limits. Define admin provisioning/recovery before release. For JWTs, validate signature, algorithm allowlist, expiry, issuer and audience. Define logout, revocation and secret rotation.
## Authorization
Deny by default. Protect each non-public route and require admin authorization for management calls. Enforce resource access on the server. Use explicit mutation DTOs; clients must not set roles, timestamps or audit fields.
## Frontend/browser
Escape untrusted values; avoid unsafe HTML and sensitive data in URLs/analytics. Observe the server-issued session `expiresAt`, clear the in-memory session/dashboard state and unmount protected views at the deadline, and re-check when a background tab becomes visible. On protected-request 401, show a re-authentication notice and clear protected state. Logout must clear sensitive in-memory state; keep authentication tokens out of localStorage/sessionStorage. The server remains the authorization source of truth; client timers are UX/state-clearing controls only. Do not treat disabled/hidden controls as authorization.
## Data and secrets
Do not place secrets in NEXT_PUBLIC variables. Use placeholders in .env.example. Use synthetic data. Redact patient details from browser logs and error reports.
## Release gate
Auth and cross-record negative tests pass on the API, dependency/config review is complete and no unaccepted critical/high issue remains. Documentation alone does not implement a control.

## Browser response headers and transport

The frontend configures `Content-Security-Policy`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`, and `Cross-Origin-Opener-Policy`; HSTS is enabled for production targets except the local HTTP harness used in production-mode CI. Production CSP narrows `connect-src` to the site and configured HTTPS API origin. Public HTTP API URLs are rejected before a request is sent, and API redirects are not followed automatically.

The local HTTP exception is limited to loopback hostnames for the isolated browser-test harness; the deployment preflight still requires public HTTPS URLs. The app now creates a fresh unpredictable nonce per HTML response, forwards the nonce-bound CSP to Next.js, and verifies that rendered scripts use the matching nonce. Browser acceptance also verifies that the nonce changes on reload and that hydration completes without CSP console errors. The root page now calls `connection()` to force request-time rendering; this intentionally disables the prior cached static/Partial Prerendering route because a shared cached HTML response cannot safely reuse a nonce. This is a rendering/cache trade-off, not a performance PASS. Live deployed-header verification and independent security review remain release gates.
