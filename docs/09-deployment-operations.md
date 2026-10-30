# Deployment and Operations
Keep local, test, preview and production environments separate. Backend uses secrets for MongoDB and auth; frontend uses only public API base URL in NEXT_PUBLIC_API_BASE_URL. Never put secrets in NEXT_PUBLIC values.
Before deployment, run checks on the exact commit, configure secrets, deploy API, check health, set frontend API URL, deploy frontend, then smoke-test CORS/session and the core flow. Record URLs and deployed SHA.
Do not log patient details, cookies or tokens. Maintain health/5xx/latency monitoring. Define backup retention, encryption and restore ownership; test restoration. Document rollback and index/schema impact. Free hosting may sleep or have limits; verify cold start and live links rather than promise an SLA.


## Release acceptance checklist
Use [Manual Release Acceptance Runbook](14-manual-release-acceptance.md) to execute and record the human/device accessibility checks, responsive review, HTTPS/cookie/session security, dependency/security review, measured performance and deployed smoke. Do not treat this document or CI localhost URLs as live deployment evidence; record deployed SHAs and redacted evidence before changing any release gate to PASS.

## Read-only deployed endpoint preflight

After both public deployments exist, run the manually dispatched [Deployed environment preflight workflow](../.github/workflows/deployment-preflight.yml) with the exact public HTTPS frontend URL and API base URL ending in `/api/v1`. It verifies the frontend returns an HTTPS HTML page, API `/health` and `/ready` report healthy/ready, and an OPTIONS request for the exact frontend origin permits credentialed POST with `Content-Type` and `X-CSRF-Token`.

The probe is deliberately read-only: it sends GET and OPTIONS only; it does not log in, send cookies/tokens, create/delete records or deploy either service. It is a preflight, not a release-smoke PASS. Browser cookie delivery, session/logout/CSRF rejection, CRUD persistence, real-device accessibility, security review and measured performance remain separate gates. Do not supply placeholder/local URLs as deployment evidence. Until the frontend and API HTTPS URLs are provisioned, the live preflight is `BLOCKED` and deployment stays `NOT STARTED`.


On exact candidate commit `b17bad713cccf231a6cb182a5ef46d8f9b472b20`, all five PR-triggered automated workflows passed:
- [Frontend CI #309](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647234) — 13/13 unit tests (8 API-client + 5 preflight), lint and production build passed.
- [Synthetic browser E2E #173](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647608) — 2/2 journeys passed; [report artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647608/artifacts/12751189274).
- [Accessibility browser acceptance #100](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647762) — 17 passed, 1 expected desktop-only skip; [reports/screenshots](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647762/artifacts/12751254193).
- [Real API + MongoDB #121](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647462) — 24/24 HTTP/unit tests, 4/4 MongoDB integration tests and 2/2 real-backend Chromium journeys passed; [artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647462/artifacts/12751239224).
- [Frontend dependency security audit #14](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647453) — passed with no high/critical published package advisories; [raw JSON report](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647453/artifacts/12752400971).

All five exact-head job logs were reviewed; the old PNPM_HOME migration warning is absent. This PASS is limited to the preflight code/unit tests and normal regression suite. No live public frontend/API URLs or deployed SHAs are available, so the real endpoint probe and overall deployment smoke remain BLOCKED/NOT STARTED.
