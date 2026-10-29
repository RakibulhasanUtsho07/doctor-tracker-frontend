# Security Policy
Doctor Tracker contains doctor records and sensitive patient-related information. Use synthetic data for development, tests, screenshots and issues.
## Required controls
- Treat UI as a presentation layer, not an authorization boundary; protected actions require API authorization.
- Validate all data server-side and show safe, useful errors without exposing internal details.
- Never store long-lived credentials in localStorage. Session mechanism must be designed with the API; cookie auth requires CSRF protection.
- Do not place secrets in NEXT_PUBLIC variables.
- Avoid unsafe HTML rendering; escape record values and use semantic accessible controls.
- Do not expose patient details in URLs, browser telemetry, screenshots or frontend error logs.
- Test unauthorized, expired-session and cross-record scenarios against the API.
Report suspected vulnerabilities privately through GitHub private vulnerability reporting if enabled, or directly to the maintainer. Do not publish personal data or live exploit details. This policy is not compliance certification.

- Production API calls must use HTTPS. The frontend rejects non-loopback HTTP API URLs before sending credentials or request data and refuses to follow API redirects.
- The frontend sets baseline response hardening headers, including CSP, clickjacking protection, MIME-sniffing protection, referrer policy and permissions policy. The production CSP restricts cross-origin connections to the configured HTTPS API origin.
- The loopback HTTP exception exists for the isolated production-mode CI browser harness only. It does not allow public HTTP deployment targets; staging preflight must use public HTTPS.
- The frontend now uses a fresh per-response CSP nonce for Next.js scripts/styles and does not allow `unsafe-inline`. The root page is dynamically rendered to make the nonce available; this trades away the prior static/PPR caching path and requires performance review. CI browser tests verify nonce matching/rotation, but live deployment headers and independent security review remain open gates.
