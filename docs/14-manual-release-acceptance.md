# Manual Release Acceptance Runbook

## Purpose and status boundary

Use this runbook after the exact candidate commit has passed required automated workflows and before any release promotion. It operationalizes SRS requirements for accessibility, responsive UI, security, performance and deployment. A written checklist or successful CI run is not a manual acceptance result.

Allowed status values: `NOT STARTED`, `IN PROGRESS`, `PASS`, `FAIL`, `PARTIAL`, `BLOCKED`. A `PASS` requires a dated evidence record tied to the tested application SHA, deployed SHA and environment. Keep the overall release `PARTIAL` until every required gate has evidence.

## 1. Pre-flight and safety

Record before testing:

| Field | Value to record |
|---|---|
| Frontend candidate SHA | Full 40-character commit SHA |
| Backend/API SHA | Full 40-character commit SHA |
| Frontend URL and environment | Exact HTTPS URL; mark staging/production |
| API URL and environment | Exact HTTPS URL; mark staging/production |
| Tester and date/time | Reviewer name/role and timezone |
| Browser/OS/device | Version and physical/emulated device |
| Required workflow runs | Links and conclusions for CI, synthetic E2E, accessibility and real API/MongoDB |
| Evidence location | Artifact/report location with sensitive values redacted |

Use only synthetic administrator/doctor/patient records. Never put real patient data, passwords, session cookies, CSRF tokens or secrets in screenshots, issue comments, test reports or logs. Do not run destructive, load or fault-injection tests against production unless explicitly authorized; do them in a disposable staging environment.

## 2. Manual accessibility and keyboard gate

Run the flow without a mouse first on desktop. Use at least one desktop screen reader available to the reviewer (for example NVDA with Firefox/Chrome on Windows or VoiceOver with Safari on macOS). For mobile, test a physical iOS/VoiceOver/Safari or Android/TalkBack/Chrome device when available. Record unavailable combinations as `BLOCKED` or `NOT TESTED`, not PASS.

- Sign-in: the page title/landmark and inputs have understandable names; the skip link works; invalid credentials give a useful, non-sensitive message; focus remains visible.
- Navigation: every navigation control is keyboard-operable and named; the mobile menu opens/closes with keyboard, Escape returns focus to the menu trigger, and focus does not move behind an open menu.
- Forms: Doctor and Patient create/edit fields announce labels, required state and validation errors. Invalid inputs reference their error text; error updates are announced and the user can move directly to the affected field. Verify duplicate-email and API-validation states.
- Confirmation dialogs: opening Delete/Detach moves focus into the dialog; dialog name and description are announced; Tab/Shift+Tab remain inside while open; Escape and Cancel close it and restore focus to the initiating control.
- Failed destructive action: in a disposable test/staging environment, reproduce a DELETE failure only if a safe test mechanism exists. Verify the alert is announced, the dialog remains actionable and the record remains unchanged. Without a safe manual fault mechanism, use the automated synthetic test as evidence and leave this *manual failure injection* sub-check `BLOCKED`.
- Successful actions: Delete removes the patient from the refreshed directory; Detach removes only the doctor association and preserves the patient; after a confirmed mutation, focus goes to a stable heading/status rather than a removed row control.
- Data tables, totals, loading/empty/error messages and pagination are understandable with the screen reader. Announced counts match the visible directory.
- Reduced motion: enable the operating system/browser reduced-motion preference. Confirm smooth scrolling and decorative transitions are reduced without losing feedback or focus.

Attach concise observations, browser/screen-reader versions and redacted screenshots or recordings. Record each failed item and reproducible steps; do not turn a known failure into a PASS because axe is clean.

## 3. Responsive desktop/tablet/mobile gate

Test a desktop viewport (for example 1440×900), tablet-sized viewport (768×1024), phone-sized viewport (390×844) and a narrow viewport (320×800). Also test real touch/physical devices when available.

- No horizontal page overflow or clipped primary actions, dialog buttons, table controls, error messages or labels.
- Sign-in, dashboard, doctor and patient views remain usable; data tables have a usable narrow-screen treatment.
- Zoom to 200% and verify text/actions remain available without overlapping or loss of content.
- Touch targets can be used accurately; opening/closing a dialog and menu does not leave the page inert or focus stranded.
- Repeat the patient Delete/Detach flow at the narrow and tablet layouts.

Record actual browser window/device dimensions and whether the device was physical or emulated. Emulation is not physical-device acceptance.

## 4. Deployed HTTPS, cookie, CORS and session gate

Use the actual deployed HTTPS frontend/API URLs. If either deployment does not exist, mark this gate `BLOCKED` and keep deployment `NOT STARTED`.

- TLS certificate is valid, no HTTP mixed content or unexpected redirect to insecure URLs occurs.
- In browser DevTools, inspect only cookie *attributes*: session cookie must be HttpOnly and Secure in HTTPS deployment, with SameSite policy appropriate for the actual cross-origin topology. Do not copy or attach cookie values.
- Credentialed requests use the expected frontend origin and API CORS policy; do not allow arbitrary origins with credentials.
- Sign-in works; the authenticated session survives a reload as designed; logout revokes the session and the previous session cannot access protected APIs afterward.
- Exercise a safe negative CSRF check on a disposable/staging test account: an unauthorized/missing-CSRF write is rejected and the record remains unchanged.
- Verify expiry behavior using the documented test setup or a controlled short-lived staging session; do not wait for or manipulate a production user session.
- Confirm client/server logs and error screens do not expose passwords, cookies, CSRF tokens or patient details.

Capture only redacted response headers/statuses, environment, deployed SHAs and test results.

## 5. Security and performance review gate

### Security

- Run the configured dependency/security checks on the candidate; record command, tool/version, date, output and any advisory exceptions.
- Review authentication/session, authorization on each mutation, cross-record access denial, CSRF/CORS, server-side validation, mass assignment, XSS rendering, secret exposure and sensitive-data logging.
- Confirm no unaccepted critical/high severity finding remains. For any accepted risk, record severity, impact, mitigation, owner and expiry/review date.
- Do not run intrusive scans or destructive tests against production without explicit authorization.

### Performance

The SRS requires measured query/search/aggregate latency but does not define numeric latency or throughput targets. Therefore, capture measurements and get an agreed target before marking a performance gate PASS; do not invent an SLA after observing results.

- Use a documented synthetic dataset (at minimum record dataset size, indexes, environment and machine/runner specs).
- Measure doctor/patient search, filter, pagination and dashboard aggregation with warm-up followed by repeated runs. Report sample count, median (p50), p95, errors/timeouts and payload sizes.
- Inspect the API/database query plans for the measured query patterns and note collection scans or regressions.
- Compare results with an explicitly agreed target. If no target has been approved, mark performance `PARTIAL`, even if the measured latency looks acceptable.

## 6. Deployed end-to-end smoke gate

With an approved synthetic test administrator and the exact deployed SHAs:

1. Sign in and verify dashboard doctor/patient totals against the empty or seeded test environment.
2. Create a synthetic doctor; find it using search/filter and pagination; reload and verify persistence.
3. Create a synthetic patient associated with that doctor; edit/search/filter it; reload and verify persistence.
4. Detach the patient. Verify the patient remains searchable and is shown as Unassigned. Reload and verify the relationship change persisted.
5. Reassign the synthetic patient to a doctor if supported by the UI, then confirm permanent Delete. Verify the row is absent after directory refresh/reload and dashboard totals reconcile.
6. Sign out and verify protected routes/API access are denied with the old session.
7. Delete any remaining synthetic test records, verify cleanup, and ensure no real patient data was created or exposed.

Capture start/end UTC times, exact URLs and SHAs, request/status summaries and redacted screenshots. If live URLs or an approved test environment are absent, do not substitute CI localhost URLs: record `BLOCKED`.

## 7. Evidence record and release decision

Create one record per gate with:

| Field | Required evidence |
|---|---|
| Gate/status | Accessibility, responsive/device, HTTPS/session, security, performance or deployed smoke; allowed status |
| Candidate identity | Frontend SHA, API SHA, deployed SHA(s), URL/environment |
| Test environment | Browser/OS/device/screen reader, dataset shape, configuration |
| Procedure/result | Steps executed, pass/fail counts, observations and reproducible defects |
| Evidence | Links to redacted screenshots, recordings, CI logs, reports or measurements |
| Review | Tester/reviewer, date/time, owner for each issue, mitigation and retest SHA |

Do not mark the entire release PASS while any required gate is `NOT STARTED`, `BLOCKED`, `FAIL` or `PARTIAL`. Parent/stacked PR review and exact-head CI are also required before branch promotion.

## Automated endpoint preflight (supporting evidence only)

Once public deployments are provisioned, use the manually dispatched [Deployed environment preflight workflow](../.github/workflows/deployment-preflight.yml) with the exact frontend HTTPS URL and API base URL ending in `/api/v1`. It checks the frontend HTML response, API liveness/readiness and credentialed CORS preflight for the supplied exact frontend origin. It sends only GET and OPTIONS requests and contains no credentials or record mutations.

Record the workflow URL, exact source/deployed SHAs and supplied public hosts in the release evidence. A successful preflight is only network/configuration evidence: it does not validate browser cookie restrictions, sign-in/logout, session revocation, CSRF rejection, CRUD persistence, screen-reader/physical-device behavior, production security or performance. The manual and deployed end-to-end gates in this runbook must still be executed independently. Until actual frontend/API URLs are available, mark this preflight `BLOCKED`, not PASS.
