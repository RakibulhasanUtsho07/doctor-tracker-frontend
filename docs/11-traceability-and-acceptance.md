# Traceability and Acceptance

**Snapshot date:** 2026-10-28  
**Current frontend source/test candidate:** 35c508e1854163b421e8a0dc04733ab7147bf50a on draft [PR #20](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/20); this status synchronization is documentation-only.  
**Overall release status:** **PARTIAL / BLOCKED**.  
Statuses used below: NOT STARTED, IN PROGRESS, PASS, FAIL, PARTIAL, BLOCKED. A PASS applies only to the explicit tested scope, environment and commit; it does not imply production release acceptance.

## Requirement traceability matrix

| Requirement | Implementation / test evidence | Current status |
|---|---|---|
| Documentation baseline | Engineering/SRS/architecture/QA documents are merged to frontend dev through [PR #1](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/1). | PASS — documentation baseline exists; final submission README/screenshots are still partial |
| Backend API foundation and health/readiness | API foundation and security middleware; [API CI #13](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40477435393). | PASS — API dev scope |
| AUTH-01 / AUTH-02 / AUTH-03 — server authentication, session, authorization, CSRF and protected routes | API auth/session implementation and [API CI #28](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40479777698); real API/MongoDB browser suite verifies cookie, invalid login, CSRF rejection, protected mutations and logout/revocation. | PASS — automated API/CI scope; production-origin cookie/session review remains open |
| DOC-01 / DOC-02 / DOC-03 — Doctor schema, list/detail/create/edit/search/filter/pagination and patient association | API Doctor implementation [PR #13](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/13); frontend management in draft [PR #11](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/11); real-backend browser workflow on current candidate, including persisted Doctor edits after reload and a duplicate-email edit conflict that preserves both records and presents an accessible field error. | PARTIAL overall — core flows implemented and tested in CI; review, remaining edge-case acceptance and release gates open |
| PAT-01 / PAT-02 — Patient CRUD, search/filter/pagination and relationship semantics | API Patient implementation [PR #15](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/15); UI in draft [PR #12](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/12); current candidate retains persisted lifecycle, detach-versus-delete, retry/error and paging/search coverage in disposable CI. | PARTIAL overall — automated lifecycle scope passes; broad domain review/deployed acceptance open |
| DASH-01 / DASH-02 — API aggregation, totals, patient counts and daily creation statistics | API dashboard implementation [PR #17](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/17); dashboard UI in draft [PR #10](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/10); real API browser suite checks data-backed totals. | PARTIAL overall — CI scope passes; final release and deployed acceptance open |
| UX-01 — responsive workspace and usable navigation | Shell and motion implementation in draft [PR #9](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/9); synthetic browser suite and 320 CSS-pixel critical-flow reflow test. | PASS — automated viewport/browser scope; human/manual device review remains open |
| NFR-A11Y-01 — labels, contrast, keyboard/focus, reduced motion, dialogs and failure/retry paths | Automated axe/keyboard/reduced-motion/form/dialog/delete/detach checks; current [Accessibility #176](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40636386946) passed on the current candidate. | PASS — automated scope only; screen-reader, actual 200% zoom and physical-device acceptance NOT STARTED |
| NFR-Security — secure config, dependency advisories, no browser-stored session secrets | Current [Frontend dependency audit #89](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40636387307) passed its high/critical advisory gate; current real API + MongoDB run [#196](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40636387086) passed; API dev has HTTPS-origin and MongoDB TLS guardrails with passing [latest API CI](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40549035764). | PARTIAL — automated tests/audit pass in scope; independent application/configuration review and live cookie/CORS validation NOT STARTED |
| NFR-Reliability / error handling | API validation/errors, retryable patient detach/delete flows, auth expiry/revocation handling and browser regression suites. | PARTIAL — covered scenarios pass in CI; production operations/observability review not evidenced |
| NFR-Performance — measured search/aggregate latency and query behavior | API integration tests include synthetic data/query-plan evidence, but SRS does not define a numeric latency/throughput target. | BLOCKED — agree target and record repeatable p50/p95, error rate, payload sizes and query plans before marking PASS |
| Privacy — synthetic acceptance and no patient secrets in artifacts | Browser tests use disposable synthetic records; staging workflow is guarded and disables screenshots/video/traces for the mutating smoke. | PASS — automated test-data/artifact controls within scope; production logging/security review remains open |
| DOCS-01 — README setup, architecture/data flow, two technical decisions and desktop/mobile screenshots | README and engineering docs exist on candidate branch; final screenshots have not been independently evidenced, and main still has the starter README. | PARTIAL |
| DEPLOY-01 — separate frontend/backend deployment and live repository URLs | Guarded read-only endpoint preflight and guarded mutating staging smoke are implemented; no actual deployed URLs/SHAs or successful live smoke have been recorded. | BLOCKED — do not substitute localhost CI for deployment evidence |

## Current candidate CI evidence

All five workflows passed on exact frontend source/test candidate SHA 35c508e1854163b421e8a0dc04733ab7147bf50a:

- [Frontend CI #384](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40636387230) — unit tests, lint, TypeScript and production build.
- [Synthetic browser E2E #248](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40636387099) — synthetic API browser journeys.
- [Accessibility browser acceptance #176](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40636386946) — axe/keyboard/reduced-motion and 320 CSS-pixel reflow coverage within its automated test scope.
- [Real API + MongoDB browser acceptance #196](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40636387086) — actual Express API, disposable MongoDB integration suite and Chromium acceptance.

The real API suite passed **7/7 browser tests** on this candidate. Coverage includes Doctor field editing, CSRF-protected `PATCH /doctors/:id`, hospital/phone persistence after reload, and an edit using another doctor's email: the UI presents the accessible duplicate-email field error and direct API reads confirm both doctors' original email/hospital values remain persisted.
- [Frontend dependency security audit #89](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40636387307) — passed the configured high/critical advisory threshold.

Current API dev SHA is efd1fd0f016d98da1fe91bdea52bc48f6295217f; latest API CI on that branch passed [run #40549035764](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40549035764). API main is 39 commits behind API dev and has not been promoted in this snapshot.

## Release gate register

| Gate | Status | Closure evidence |
|---|---|---|
| Exact-head automated checks | PASS — candidate SHA above | All five workflow results above |
| Feature PR dependency review | IN PROGRESS / NOT MERGED | Review PRs #9–#20 in dependency order; ensure each parent is accepted before retargeting/merging children |
| Human keyboard and screen-reader audit | NOT STARTED | Dated findings, environment and reviewer details; no secrets/patient data |
| Actual 200% zoom and physical desktop/tablet/mobile touch review | NOT STARTED | Real browser/device evidence, not emulation alone |
| Live HTTPS/CORS/session/CSRF smoke | BLOCKED | Authorized staging frontend/API URLs, exact deployed SHAs and a disposable administrator |
| Guarded mutating staging browser smoke | BLOCKED | Staging-only secrets plus existing synthetic doctor fixture ID; use only a disposable staging database |
| Independent security review | NOT STARTED | Review auth, authorization, CSRF/CORS, cookie topology, validation, logging, secrets and residual risks |
| Performance | BLOCKED / PARTIAL | Approved target and reproducible synthetic-data measurements/query plans |
| README screenshots and live URLs | PARTIAL / BLOCKED | Synthetic desktop/mobile screenshots plus verified live URLs |
| Frontend dev/main and API main promotion | NOT STARTED | Approved review, required acceptance gates, and post-merge CI tied to resulting branch SHAs |

## Safety and promotion rule

Do not mark the overall release PASS while any required row is BLOCKED, NOT STARTED, FAIL or PARTIAL. Do not claim a live deployment test without real deployed URLs and SHAs. Do not merge a child PR while its parent/diff dependency remains unaccepted. After every eventual promotion, rerun the required checks against the resulting dev and main commit SHAs.
