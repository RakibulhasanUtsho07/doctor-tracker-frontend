# Test and Quality Plan

## Planned test layers
- Static checks: lint, typecheck, production build and dependency audit.
- Unit/component tests: validation, filter states, forms, empty/error states, accessible chart labelling and reduced motion.
- Integration: API auth middleware, doctor/patient CRUD, filters/pagination, relationship constraints, aggregate responses and errors.
- E2E: sign in → dashboard → create/search doctor → add patient → edit/filter/delete patient → verify dashboard numbers.
- Security: missing/expired session, cross-record access, role bypass, XSS rendering, CORS/CSRF where applicable, mass assignment and sensitive-data leakage.
- Performance: documented synthetic dataset, latency measurements and query plan.
- Release smoke: deployed HTTPS, auth/API connectivity and CRUD with synthetic records.

Use disposable test data, never production. Record exact commit SHA, commands, CI URL, pass/fail counts, environment and gaps. If CI is absent, report NOT CONFIGURED, not PASS. A plan is not a result; requirement status changes only with evidence.

## Browser E2E harness (Step 10)
A pinned Playwright runner starts the production Next.js server and exercises Chromium journeys against a route-intercepted synthetic API. Coverage includes invalid sign-in, sign-in/dashboard, doctor create, doctor-associated patient listing, patient create/edit/filter, detach-versus-delete semantics, CSRF headers, sign-out and empty browser storage.

Latest tested head `8d317e9b3ff4f082ca65e2726e75cbc11d7af684`: [synthetic browser run #91](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40515284380) passed 2/2 journeys; [screenshots/report](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40515284380/artifacts/12739401635). Mock-backed acceptance is only for synthetic records.

## Real API browser acceptance (Step 11)
The workflow starts the pinned Doctor Tracker API (`fd9f133b42914a51d3a4d0460e178a66888a0327`) against disposable MongoDB, bootstraps a CI-only administrator and launches the production frontend. [Run #39](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40515283611) passed on `8d317e9b3ff4f082ca65e2726e75cbc11d7af684`: backend lint/typecheck/build, 24/24 HTTP/unit tests, 4/4 MongoDB integration tests and 2/2 real-backend Chromium journeys. Coverage includes CORS preflight, credentialed requests, HttpOnly cookie, CSRF rejection, doctor/patient create/edit, detach vs delete, persistence after reload, dashboard totals and logout/session revocation. [Reports/screenshots/log](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40515283611/artifacts/12738861788).

## Automated accessibility acceptance (Step 12)
Draft [PR #15](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/15) adds a separate pinned Playwright/axe workflow and keeps test API mocking isolated from the real-backend workflow. On tested head `8d317e9b3ff4f082ca65e2726e75cbc11d7af684`, [accessibility run #18](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40515283891) passed 7 tests with 1 expected desktop-only skip.

- axe-core checks WCAG 2.1 A/AA on sign-in, dashboard, doctors and patients views at desktop and mobile viewports; serious/critical findings fail CI.
- Keyboard-only sign-in, `prefers-reduced-motion` behavior and mobile navigation open/Escape/focus restoration are tested.
- The run caught and drove fixes for foreground/background contrast, accessible-name consistency and generic-span ARIA semantics. The passing run has [axe JSON, screenshots and Playwright diagnostics](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40515283891/artifacts/12739597090).

Automation is not a complete WCAG certification. Manual screen-reader/assistive-technology review, exhaustive keyboard review across all forms/dialogs, physical device/touch checks, deployed HTTPS/cookie behavior, performance/security review and deployed smoke remain open in [release-readiness issue #6](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/issues/6).

## Form and confirmation-dialog accessibility extension (Step 13)
On exact tested source head `4c3c73db59c8d425195c518fd5518fa0f2d58bce`, [accessibility run #38](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40520034573) passed 13 tests with 1 expected desktop-only skip. The suite now axe-scans doctor create/edit and duplicate-email errors, patient create/edit and API validation errors, and the patient delete confirmation dialog. Keyboard tests verify form focus order, dialog Tab/Shift+Tab trapping and Escape/Cancel focus restoration; a contrast regression found by the expanded states was fixed rather than excluded. [Reports and screenshots](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40520034573/artifacts/12741611304).

The same source head passed [Frontend CI #247](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40520035122), [synthetic browser E2E #111](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40520034820) and [real API/MongoDB acceptance #59](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40520034007), which passed 24/24 HTTP/unit tests, 4/4 MongoDB integration tests and 2/2 real-browser journeys.

This is automated browser evidence, not a full WCAG certification. Manual assistive-technology/screen-reader, exhaustive keyboard review, physical devices/touch, production HTTPS/cookie behavior, performance/security and deployed smoke remain open.

## Patient detach failure/retry acceptance (Step 14)
Exact tested source/test commit: `51cc8f18e1ae8b74f776641ac18684c47a94f445`.

The synthetic acceptance suite models one failing detach response followed by a successful retry. It checks keyboard activation of the Detach action, Escape and Cancel focus return, the dialog remaining open with an accessible action-error alert after HTTP 503, successful keyboard retry, preserved patient data with the doctor association cleared, removal of the Detach action, continued availability of Delete, and focus return to the patient directory heading. It also axe-scans the detach confirmation dialog. [Accessibility run #53](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40523243906) passed 14 tests with 1 expected desktop-only skip; [reports/screenshots](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40523243906/artifacts/12743151344).

Supporting checks passed on the same code/test commit: [Frontend CI #262](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40523243814), [synthetic browser E2E #126](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40523243720) and [real API/MongoDB #74](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40523243822); the real-backend workflow passed 24/24 HTTP/unit, 4/4 MongoDB integration and 2/2 Chromium journeys. The new state-machine behavior uses disposable synthetic data; this does not replace real-backend or manual/production acceptance.

## Patient permanent-delete failure/retry acceptance (Step 15)
Exact tested source/test commit: `35221c8cbd5659d85e7dd6ab2b5c6e72547ed5ea`.

The synthetic browser test models one HTTP 503 failure for the patient DELETE request followed by a successful retry. It verifies that the confirmation dialog stays open with an accessible error alert, the patient remains in the directory and Delete remains available, keyboard retry completes the action, success feedback appears, the patient row disappears, and focus moves to the Patient directory heading. The dialog also receives an axe WCAG 2.1 A/AA scan. [Accessibility run #64](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40524941652) passed 17 tests with 1 expected desktop-only skip; [reports/screenshots](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40524941652/artifacts/12744490643).

Supporting checks passed on the same code/test commit: [Frontend CI #273](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40524941881), [synthetic browser E2E #137](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40524941805) and [real API/MongoDB #85](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40524948333). The real-backend workflow passed 24/24 HTTP/unit tests, 4/4 MongoDB integration tests and 2/2 Chromium journeys. Synthetic error injection proves UI error-state behavior only; manual and deployed acceptance remain separate.


## Manual release acceptance and evidence (Step 16)
Follow [docs/14-manual-release-acceptance.md](14-manual-release-acceptance.md) after automated CI for the exact candidate passes. It specifies manual keyboard/screen-reader, responsive/touch, deployed HTTPS/cookie/session/CSRF, dependency/security, measured performance and deployed synthetic-data smoke procedures. Record exact frontend/API/deployed SHAs, environment, browser/device/screen-reader, results and redacted evidence. The SRS does not define numeric performance targets; obtain an approved target before marking performance PASS. The runbook itself is not evidence that any gate has passed.


## Frontend dependency security audit
The separate [Frontend dependency security audit workflow](../.github/workflows/security-audit.yml) installs only the frozen pnpm lockfile graph with lifecycle scripts disabled and runs `pnpm audit --audit-level=high --json`. The job fails when the registry audit reports high or critical findings, and uploads the raw report even on failure. On exact dependency/workflow commit `3767f9be37f23fe1ba0cb0f4aff6c3e78547c8e8`, [security audit #2](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40537906377) passed and reported no high/critical dependency audit findings; [raw report artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40537906377/artifacts/12749446556). This is PASS only for high/critical published package advisories on that locked dependency graph; it is not a substitute for code/secret review, backend audit, configuration review or production penetration testing. Broader security release acceptance remains open.


## GitHub Actions runtime maintenance
Use the Node 24-compatible official action versions currently pinned in the workflow files: checkout v7.0.1, setup-node v7.1.0, upload-artifact v7.0.2, cache v6.1.0 and pnpm/action-setup v6.1.0. Their compatibility change passed all existing workflows on exact commit `245ae10c15eab2021bf99e101e0f8cf42d58cf48`. The Node 20 deprecation warning disappeared from CI/audit logs. At this earlier commit, the pnpm v10/v11 home-layout warning remained; its later fix and exact-head validation are recorded in the follow-up section below. Runtime migration does not close the security, manual accessibility, performance or production deployment gates.

## pnpm v11 home-layout warning follow-up — 2026-10-27

Replaced `pnpm/action-setup@v6.1.0` with the official standalone `pnpm/setup@v3.1.2` in all five workflows. The step sets `install: false` so each workflow keeps its existing explicit frozen-lockfile install (including the audit job's `--ignore-scripts`); Node.js 22 and the existing `actions/setup-node` pnpm-store cache remain in place.

On exact workflow commit `d109b8e56bf79d83e111fdee3885d0cee348dadc`, all five PR-triggered workflows passed:
- [Frontend CI #305](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40540876752) — 8/8 API-client unit tests; lint and production build succeeded.
- [Synthetic browser E2E #169](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40540876592) — 2/2 journeys passed; [report artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40540876592/artifacts/12750412771).
- [Accessibility browser acceptance #96](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40540877098) — 17 passed, 1 expected desktop-only skip; [reports/screenshots](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40540877098/artifacts/12750747021).
- [Real API + MongoDB #117](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40540876679) — 24/24 HTTP/unit tests, 4/4 MongoDB integration tests, and 2/2 real-backend browser journeys passed; [artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40540876679/artifacts/12749539660).
- [Frontend dependency security audit #10](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40540876664) — passed with no high/critical published package advisories; [raw JSON report](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40540876664/artifacts/12750417155).

All five job logs were inspected; the old pnpm v10/v11 `PNPM_HOME` layout warning no longer appears. Parallel workflow jobs can still emit non-fatal cache-reservation warnings when they contend for the same cache key; they did not fail a job and are separate from the resolved home-layout warning. This change does not close manual screen-reader/device, deployed HTTPS/session, broader security, performance-target or deployed-smoke gates; keep the stacked PRs draft and do not promote to `dev`/`main`.
