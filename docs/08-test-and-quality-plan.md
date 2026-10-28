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

## Deployed endpoint preflight automation

The manual `Deployed environment preflight` workflow and `scripts/deployment-preflight.mjs` probe an already provisioned public deployment without changing data. Unit tests cover strict public HTTPS URL validation, frontend HTML/API health/readiness responses, CORS exact-origin and credentials headers, POST method and required headers, plus negative origin/readiness cases. The probe sends GET/OPTIONS only, has no credentials and performs no mutations.

On exact candidate commit `b17bad713cccf231a6cb182a5ef46d8f9b472b20`, all five PR-triggered automated workflows passed:
- [Frontend CI #309](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647234) — 13/13 unit tests (8 API-client + 5 preflight), lint and production build passed.
- [Synthetic browser E2E #173](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647608) — 2/2 journeys passed; [report artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647608/artifacts/12751189274).
- [Accessibility browser acceptance #100](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647762) — 17 passed, 1 expected desktop-only skip; [reports/screenshots](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647762/artifacts/12751254193).
- [Real API + MongoDB #121](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647462) — 24/24 HTTP/unit tests, 4/4 MongoDB integration tests and 2/2 real-backend Chromium journeys passed; [artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647462/artifacts/12751239224).
- [Frontend dependency security audit #14](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647453) — passed with no high/critical published package advisories; [raw JSON report](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647453/artifacts/12752400971).

All five exact-head job logs were reviewed; the old PNPM_HOME migration warning is absent. This PASS is limited to the preflight code/unit tests and normal regression suite. No live public frontend/API URLs or deployed SHAs are available, so the real endpoint probe and overall deployment smoke remain BLOCKED/NOT STARTED.

These are mocked unit checks and regression evidence, not live deployment acceptance. Actual live URL results must be recorded separately; absent public HTTPS URLs mean the live check is BLOCKED. This preflight does not replace browser cookie/session/CSRF testing or the deployed CRUD smoke gate.


## Responsive layout / reflow acceptance — 2026-10-28

**Exact tested frontend source/test SHA:** `88aea3d72a6516959b11361d83b23ef9da633501`  
**Pinned API SHA for the concurrent real-backend regression:** `efd1fd0f016d98da1fe91bdea52bc48f6295217f`

Added an automated Playwright viewport sweep to `e2e/accessibility.spec.mjs`. It checks the sign-in page at 320×800, 390×844, 720×900 (effective reflow width comparable to 200% zoom from 1440 CSS pixels), 768×1024 and 1440×1000. After authentication, it repeats the checks on dashboard, doctor directory, doctor-create form, patient directory, patient-create form and the patient-delete dialog. At each viewport it asserts document/body horizontal overflow does not exceed the viewport and that the principal create actions and delete dialog remain within the viewport. Screenshots are attached for the 320px and 768px patient views.

The first run exposed a real 320px overflow: the doctor table's absolutely-positioned `.visually-hidden` “Actions” text extended the root document width to 739px although the table itself was correctly inside a horizontally scrollable wrapper. Replaced that hidden node with an accessible `aria-label="Actions"` on the column header, retaining the accessible name without introducing an off-screen element. The browser test also revealed and corrected a test-navigation sequencing issue so each viewport begins on the dashboard before checking that view.

On the exact source/test SHA above all five automated workflows passed:
- [Frontend CI #40624554113](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40624554113) — 13/13 API-client/preflight unit tests, lint and production build/TypeScript passed.
- [Synthetic browser E2E #40624554063](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40624554063) — 2/2 journeys passed.
- [Accessibility browser acceptance #40624554139](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40624554139) — 18 passed, 2 expected project-specific skips; the five-width responsive sweep passed on the desktop project.
- [Real API + MongoDB acceptance #40624554157](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40624554157) — API lint/typecheck/build, 26/26 HTTP/unit tests, 4/4 MongoDB integration tests and 5/5 real-backend Chromium journeys passed.
- [Frontend dependency audit #40624554024](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40624554024) — passed with no high/critical published package advisories for the locked frontend dependency graph.

The 720px viewport is an automated reflow-equivalent, not a browser's actual 200%-zoom control. Manual 200% zoom, a real screen reader, touch and physical-device review remain separate human acceptance items in `docs/14-manual-release-acceptance.md`; this automated sweep does not close those gates or prove the deployment's actual cookie/session behavior.


## Proactive session-expiry and revoked-session acceptance — 2026-10-28

**Frontend implementation + short-TTL browser test SHA:** `bf936e040d57555354c72632a5bc139e038fa186`  
**Real-API test-fixture ordering SHA:** `b93921b806e9a9a506fc7873034bb76025442133`  
**Pinned backend API SHA:** `efd1fd0f016d98da1fe91bdea52bc48f6295217f`

The client now treats the API-provided `expiresAt` from login/`GET /auth/me` as a session deadline. While signed in, a lifecycle effect schedules expiry, rechecks when the tab becomes visible (to account for background timer throttling), and routes through the common session-expired handler when the deadline passes or cannot be parsed. That handler clears the in-memory session/CSRF-bearing auth object and dashboard data, unmounts protected workspace views, and announces “Your administrator session expired. Sign in again to continue.” Server authorization remains authoritative; the UI timer is a presentation/state-clearing control, not an authorization boundary.

Two separate acceptance paths cover both normal expiry and server-side invalidation:
- Synthetic Playwright test uses a 5-second session TTL, shows a synthetic patient row, sends no follow-up API request, and asserts that the screen returns to sign-in at the deadline with the expired-session status and without the patient row, authenticated badge, localStorage or sessionStorage entries.
- Real API/MongoDB test creates a uniquely named synthetic doctor and patient, displays the patient in the live API-backed directory, revokes the current server session out-of-band through CSRF-protected logout without updating the React shell, then clicks Refresh. The ensuing protected-request 401 must return the UI to sign-in, clear the patient row and authenticated badge, and leave both browser storages empty.

The first real-API run exposed test-fixture interference: the new scenario created an additional doctor/patient before a count-sensitive dashboard journey. The scenario was moved to the end of the serial real-API test file so prior fixtures retain their documented baseline; the subsequent real-API run passed all six browser journeys. Test records are synthetic and held in the disposable CI database.

Implementation/test evidence:
- [Frontend CI #40625551643](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40625551643) — 13/13 API-client/preflight unit tests, lint and production build passed on `bf936e040d57555354c72632a5bc139e038fa186`.
- [Synthetic E2E #40625551681](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40625551681) — 2/2 journeys passed, including the short-TTL expiry check.
- [Accessibility #40625551648](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40625551648) — accessibility/keyboard/reduced-motion suite passed with the expiry scenario included.
- [Dependency audit #40625551666](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40625551666) — passed; no high/critical published frontend dependency advisories.
- On the real-test-ordering SHA `b93921b806e9a9a506fc7873034bb76025442133`, [Frontend CI #40625887608](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40625887608), [synthetic E2E #40625887630](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40625887630) and [real API + MongoDB #40625887617](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40625887617) all passed. The real API run passed 26/26 HTTP/unit tests, 4/4 MongoDB integration tests and 6/6 real-backend Chromium journeys.

This closes the **automated client session-deadline and revoked-session UI handling** gap within the tested scope. It does not replace the actual browser 200% zoom, human assistive-technology/physical-device review, deployed HTTPS cookie/session validation or independent security review.


## Direct-call transport safety regressions — 2026-10-28

The deployment preflight transport tests now cover its own read-only boundary, not just wrapper call paths: GET/OPTIONS are the only accepted methods, request bodies are rejected, sensitive/unknown header names are refused, and `Accept-Encoding` must be `identity`. Negative cases assert that no HTTPS request object is created, and a credential-free CORS OPTIONS case confirms the supported path remains functional. Automated acceptance passed on exact code/test/docs-inclusive SHA `7176c3ecef2e70f291c79c8dc668ef7231103be0` and later descendant SHA `81a7c34215915510c13d7105ffb7305e1444847a`; the five run URLs are recorded in `docs/PROJECT-STATUS.md` and PR #24. Any further documentation/source change must be verified again on its exact resulting head.

## Additional public-DNS boundary regression matrix — 2026-10-28

A test-only follow-up expands `test/deployment-preflight.test.mjs` to cover explicit denial of IPv4 unspecified/multicast/broadcast/protocol-assignment addresses; IPv6 unspecified and IPv4-mapped loopback; the IPv6 discard-only block, IANA dummy prefix (`100:0:0:1::/64`), SRv6 SID block (`5f00::/16`), 6to4 and documentation ranges; plus mixed public/private DNS answers. A positive case proves a globally routed IPv6 result can pass and is passed through as an IPv6-pinned address. The implementation policy is unchanged; coverage makes the existing strict `2000::/3` allow rule and non-public IPv4 filters regression-visible.

Exact tested source/test commit: `703f6f90451f90b03cabb9e2a26165fb57b95a81`. Frontend CI [#40712140676](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712140676) passed 52/52 unit tests, lint and production build; synthetic browser E2E [#40712140474](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712140474) passed 4/4 journeys; accessibility [#40712140590](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712140590) passed 22 tests with 2 skips across Chromium desktop/mobile; real API + MongoDB [#40712140521](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712140521) passed 26/26 HTTP/unit tests, 4/4 MongoDB integration tests and 9/9 real-backend Chromium journeys; dependency audit [#40712140871](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712140871) passed. These runs are tied to the exact source/test commit above; subsequent documentation commits require their own exact-head verification.
