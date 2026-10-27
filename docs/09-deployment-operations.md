# Deployment and Operations
Keep local, test, preview and production environments separate. Backend uses secrets for MongoDB and auth; frontend uses only public API base URL in NEXT_PUBLIC_API_BASE_URL. Never put secrets in NEXT_PUBLIC values.
Before deployment, run checks on the exact commit, configure secrets, deploy API, check health, set frontend API URL, deploy frontend, then smoke-test CORS/session and the core flow. Record URLs and deployed SHA.
Do not log patient details, cookies or tokens. Maintain health/5xx/latency monitoring. Define backup retention, encryption and restore ownership; test restoration. Document rollback and index/schema impact. Free hosting may sleep or have limits; verify cold start and live links rather than promise an SLA.


## Release acceptance checklist
Use [Manual Release Acceptance Runbook](14-manual-release-acceptance.md) to execute and record the human/device accessibility checks, responsive review, HTTPS/cookie/session security, dependency/security review, measured performance and deployed smoke. Do not treat this document or CI localhost URLs as live deployment evidence; record deployed SHAs and redacted evidence before changing any release gate to PASS.

## Read-only deployed endpoint preflight

After both public deployments exist, run the manually dispatched [Deployed environment preflight workflow](../.github/workflows/deployment-preflight.yml) with the exact public HTTPS frontend URL and API base URL ending in `/api/v1`. It verifies the frontend returns an HTTPS HTML page, API `/health` and `/ready` report healthy/ready, and an OPTIONS request for the exact frontend origin permits credentialed POST with `Content-Type` and `X-CSRF-Token`.

The probe is deliberately read-only: it sends GET and OPTIONS only; it does not log in, send cookies/tokens, create/delete records or deploy either service. It is a preflight, not a release-smoke PASS. Browser cookie delivery, session/logout/CSRF rejection, CRUD persistence, real-device accessibility, security review and measured performance remain separate gates. Do not supply placeholder/local URLs as deployment evidence. Until the frontend and API HTTPS URLs are provisioned, the live preflight is `BLOCKED` and deployment stays `NOT STARTED`.
