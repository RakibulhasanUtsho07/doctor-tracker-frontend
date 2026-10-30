# Threat Model
## Assets and trust boundaries
Assets: admin session, doctor/patient records and integrity of dashboard analytics. Boundaries: browser/API, hosted public internet, API/MongoDB and source control/runtime config.
## Risks and controls
- Session theft or credential abuse: secure session lifecycle, generic errors and rate limiting.
- Broken object-level authorization: server checks and negative tests; UI guards are supplementary.
- XSS: framework escaping and no unsafe HTML.
- CSRF/CORS errors: coherent cookie/CSRF policy and explicit origin allowlist.
- Data overexposure: API response allowlist, minimum fields and no patient details in client telemetry.
- Secret leakage: never expose secrets with NEXT_PUBLIC; scan diffs and rotate exposed values.
- Supply-chain risk: lockfile review, dependency audit and controlled package changes.
- Accessibility regression: keyboard, focus and reduced-motion testing.
Review whenever authentication, API data shape, hosting or third-party integrations change. Each mitigation needs implementation and test evidence.
