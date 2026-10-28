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

For the mutating GitHub Actions staging smoke, configure repository variables `STAGING_FRONTEND_HOST` and `STAGING_API_HOST` out-of-band before dispatch. Each value must be the exact approved lowercase DNS hostname only—no scheme, port, path or trailing dot. The workflow rejects a URL unless its hostname exactly matches the corresponding trusted variable; merely including a label such as `staging` or `preview` is not sufficient ownership evidence. If either variable is absent or mismatched, stop before network requests and do not configure staging credentials until the approved host is confirmed. The workflow also requires the separate `STAGING_ADMIN_EMAIL` and `STAGING_ADMIN_PASSWORD` staging-only secrets, an existing synthetic doctor fixture and the explicit disposable-staging confirmation.

The mutating smoke job is gated by the GitHub Actions environment `disposable-staging` and its workflow-level branch condition only permits dispatch from `dev` (the release-candidate branch). Repository administrators must configure this environment out-of-band with **required reviewers** and an allowed-deployment-branch policy restricted to the trusted protected `dev` branch; also store the staging admin secrets as environment secrets, not repository-level secrets. The YAML name alone does not create those protection rules. Until the environment protection rules and branch protection are independently verified, keep the mutating staging gate `BLOCKED`.

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


### Preflight automation test evidence

On exact candidate commit `b17bad713cccf231a6cb182a5ef46d8f9b472b20`, all five PR-triggered automated workflows passed:
- [Frontend CI #309](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647234) — 13/13 unit tests (8 API-client + 5 preflight), lint and production build passed.
- [Synthetic browser E2E #173](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647608) — 2/2 journeys passed; [report artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647608/artifacts/12751189274).
- [Accessibility browser acceptance #100](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647762) — 17 passed, 1 expected desktop-only skip; [reports/screenshots](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647762/artifacts/12751254193).
- [Real API + MongoDB #121](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647462) — 24/24 HTTP/unit tests, 4/4 MongoDB integration tests and 2/2 real-backend Chromium journeys passed; [artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647462/artifacts/12751239224).
- [Frontend dependency security audit #14](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647453) — passed with no high/critical published package advisories; [raw JSON report](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647453/artifacts/12752400971).

All five exact-head job logs were reviewed; the old PNPM_HOME migration warning is absent. This PASS is limited to the preflight code/unit tests and normal regression suite. No live public frontend/API URLs or deployed SHAs are available, so the real endpoint probe and overall deployment smoke remain BLOCKED/NOT STARTED.

Do not use the unit-test evidence above as a live preflight result; run the workflow against both real deployed URLs and record its run/deployed SHAs. Without those URLs, keep the live gate BLOCKED.

## Staging browser smoke (mutating; disposable staging only)

The manually dispatched [Staging browser smoke workflow](../.github/workflows/staging-smoke.yml) is the next release-evidence step after both services have been deployed. It first runs the read-only HTTPS/readiness/CORS preflight, then drives Chromium against the actual deployed frontend/API to verify the administrator session cookie attributes, rejected write without a CSRF token, patient create/edit persistence after reload, patient deletion, logout and server-side session revocation.

Before dispatching, configure environment-level secrets `STAGING_ADMIN_EMAIL` and `STAGING_ADMIN_PASSWORD` in the `disposable-staging` GitHub Actions environment for a dedicated staging-only administrator. Do not store these credentials as repository-level secrets. Supply the staging frontend HTTPS URL, API base URL ending in `/api/v1`, and the ID of an existing synthetic doctor fixture. Both hostnames must contain an explicit `staging`, `stage`, `stg`, `preview` or `test` label, and the confirmation input must exactly equal `I_CONFIRM_DISPOSABLE_STAGING`. The guard rejects non-HTTPS endpoints, non-public/reserved hostnames, unmarked hostnames, malformed API paths and invalid doctor IDs before any network request.

The browser test creates one randomly named synthetic patient, updates it, verifies database-backed persistence after reload, deletes it, and checks that the previous session is revoked after sign-out. Cleanup is armed before the patient-create request is sent, so an ambiguous timeout or server error after the database insert still triggers a cleanup attempt. If no record was created, the cleanup check confirms that the unique synthetic name is absent. If the UI/API cannot confirm cleanup, manually delete the clearly named synthetic record from the disposable staging database before rerunning. The workflow does not create or delete doctors. It disables Playwright traces, video and automatic screenshots to avoid publishing session cookies, administrator identifiers or CSRF material; only the test report is retained for seven days.

Do not run this workflow against production or a staging database containing real patient data. A successful run is deployed automated smoke evidence only; it does not replace manual 200% browser zoom, screen-reader/physical-device review, independent security sign-off, or performance measurement against an approved target. Record the workflow run, actual deployed frontend/API SHAs and tester/date in the evidence table above. Until valid URLs/secrets and a successful live run exist, deployment smoke remains `BLOCKED`.


### Additional staging-workflow hardening — 2026-10-28

The caller-supplied frontend URL is not published as the GitHub Environment deployment URL before approval/validation. The target allowlist guard must run before the staging credential check, the read-only deployment preflight must complete before the mutating browser journey, and all external `uses:` references in the staging-smoke and frontend-CI workflows are pinned to full immutable commit SHAs. Regression coverage enforces these rules.

The workflow has a non-mutating push-validation job that runs only the local target-guard regression tests; it has no staging credentials and makes no staging network requests. The mutating job is gated by both `workflow_dispatch` and `refs/heads/dev`. The default branch currently has no workflow directory, so the manual-dispatch bootstrap remains in draft PR [#25](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/25). Do not count the workflow as available for live staging until that bootstrap is reviewed/merged, the candidate stack is safely available on the protected `dev` branch, and environment protection (required reviewers and allowed deployment branches) is independently verified. No live staging request or mutation is authorized by these source changes.

### Exact-head automated acceptance — 2026-10-28

Source/test/docs head `abb4a79105ad8573edb81df22ed151fad75c685e` passed all five required automated workflows:
- [Frontend CI #40740353256](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40740353256) — PASS; unit tests, syntax checks, lint and production build succeeded. A pre-existing non-fatal React Hooks dependency warning remains.
- [Synthetic browser E2E #40740354768](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40740354768) — PASS; 2/2 journeys.
- [Accessibility browser acceptance #40740354279](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40740354279) — PASS within automated Chromium scope; 20 passed, 2 skipped.
- [Real API + MongoDB browser acceptance #40740353249](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40740353249) — PASS; 26/26 HTTP/unit, 4/4 MongoDB integration and 6/6 Chromium tests.
- [Dependency security audit #40740353584](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40740353584) — PASS; no high/critical published frontend dependency advisories.

The separate [staging workflow validation run #40740346984](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40740346984) also passed local target-guard regression tests. The mutating staging job was skipped because the event was a push, which confirms that a push does not run staging mutations.

This is automated candidate acceptance only. It does **not** prove that the GitHub `disposable-staging` environment has required reviewers/branch restrictions, that approved hostname variables and environment-only secrets are configured, or that the actual deployed frontend/API work. Live staging/manual acceptance, independent security review, physical-device/screen-reader/200%-zoom checks, and agreed-target performance evidence remain BLOCKED/NOT STARTED.

