# Deployment and Operations
Keep local, test, preview and production environments separate. Backend uses secrets for MongoDB and auth; frontend uses only public API base URL in NEXT_PUBLIC_API_BASE_URL. Never put secrets in NEXT_PUBLIC values.
Before deployment, run checks on the exact commit, configure secrets, deploy API, check health, set frontend API URL, deploy frontend, then smoke-test CORS/session and the core flow. Record URLs and deployed SHA.
Do not log patient details, cookies or tokens. Maintain health/5xx/latency monitoring. Define backup retention, encryption and restore ownership; test restoration. Document rollback and index/schema impact. Free hosting may sleep or have limits; verify cold start and live links rather than promise an SLA.


## Release acceptance checklist
Use [Manual Release Acceptance Runbook](14-manual-release-acceptance.md) to execute and record the human/device accessibility checks, responsive review, HTTPS/cookie/session security, dependency/security review, measured performance and deployed smoke. Do not treat this document or CI localhost URLs as live deployment evidence; record deployed SHAs and redacted evidence before changing any release gate to PASS.
