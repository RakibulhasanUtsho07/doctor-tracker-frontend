# Traceability and Acceptance

**Snapshot date:** 2026-10-28  
**Current frontend source/test candidate:** 2bf651c47313a3e67ef8fdb89c2de081007abcd6 on draft [PR #20](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/20); this status synchronization is documentation-only.  
**Overall release status:** **PARTIAL / BLOCKED**.  
Statuses used below: NOT STARTED, IN PROGRESS, PASS, FAIL, PARTIAL, BLOCKED. A PASS applies only to the explicit tested scope, environment and commit; it does not imply production release acceptance.

## Requirement traceability matrix

| Requirement | Implementation / test evidence | Current status |
|---|---|---|
| Documentation baseline | Engineering/SRS/architecture/QA documents are merged to frontend dev through [PR #1](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/1). | PASS — documentation baseline exists; final submission README/screenshots are still partial |
| Backend API foundation and health/readiness | API foundation and security middleware; [API CI #13](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40477435393). | PASS — API dev scope |
| AUTH-01 / AUTH-02 / AUTH-03 — server authentication, session, authorization, CSRF and protected routes | API auth/session implementation and [API CI #28](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40479777698); real API/MongoDB browser suite verifies cookie, invalid login, CSRF rejection, protected mutations and logout/revocation. | PASS — automated API/CI scope; production-origin cookie/session review remains open |
| DOC-01 / DOC-02 / DOC-03 — Doctor schema, list/detail/create/edit/search/filter/pagination and patient association | API Doctor implementation [PR #13](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/13); frontend management in draft [PR #11](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/11); real-backend browser workflow on current candidate verifies persisted edits, duplicate-email edit/create errors, preserved records, and successful corrected retries after the email field error. | PARTIAL overall — core flows implemented and tested in CI; review, remaining edge-case acceptance and release gates open |
| PAT-01 / PAT-02 — Patient CRUD, search/filter/pagination and relationship semantics | API Patient implementation [PR #15](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/15); UI in draft [PR #12](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/12); current candidate retains persisted lifecycle, detach-versus-delete, retry/error and paging/search coverage in disposable CI. | PARTIAL overall — automated lifecycle scope passes; broad domain review/deployed acceptance open |
| DASH-01 / DASH-02 — API aggregation, totals, patient counts and daily creation statistics | API dashboard implementation [PR #17](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/17); dashboard UI in draft [PR #10](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/10); real API browser suite checks data-backed totals. | PARTIAL overall — CI scope passes; final release and deployed acceptance open |
| UX-01 — responsive workspace and usable navigation | Shell and motion implementation in draft [PR #9](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/9); synthetic browser suite and 320 CSS-pixel critical-flow reflow test. | PASS — automated viewport/browser scope; human/manual device review remains open |
| NFR-A11Y-01 — labels, contrast, keyboard/focus, reduced motion, dialogs and failure/retry paths | Automated axe/keyboard/reduced-motion/form/dialog/delete/detach checks; current [Accessibility #182](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40642438808) passed on the current candidate. | PASS — automated scope only; screen-reader, actual 200% zoom and physical-device acceptance NOT STARTED |
| NFR-Security — secure config, dependency advisories, browser response hardening, no browser-stored session secrets | [Dependency audit #118](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40642438897) and [real API/MongoDB #225](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40642438861) pass. Current frontend adds CSP, anti-framing, MIME, referrer, permissions and HSTS headers; tests prove public HTTP API endpoints are rejected before fetch and redirects are not followed. The API dev has HTTPS-origin and MongoDB TLS guardrails with passing [latest API CI](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40549035764). | PARTIAL — automated/header-config scope passes; CSP still allows inline scripts for Next hydration; live header/cookie/CORS validation and independent security review remain NOT STARTED |
| NFR-Reliability / error handling | API validation/errors, retryable patient detach/delete flows, auth expiry/revocation handling and browser regression suites. | PARTIAL — covered scenarios pass in CI; production operations/observability review not evidenced |
| NFR-Performance — measured search/aggregate latency and query behavior | API integration tests include synthetic data/query-plan evidence, but SRS does not define a numeric latency/throughput target. | BLOCKED — agree target and record repeatable p50/p95, error rate, payload sizes and query plans before marking PASS |
| Privacy — synthetic acceptance and no patient secrets in artifacts | Browser tests use disposable synthetic records; staging workflow is guarded and disables screenshots/video/traces for the mutating smoke. | PASS — automated test-data/artifact controls within scope; production logging/security review remains open |
| DOCS-01 — README setup, architecture/data flow, two technical decisions and desktop/mobile screenshots | README and engineering docs exist on candidate branch; final screenshots have not been independently evidenced, and main still has the starter README. | PARTIAL |
| DEPLOY-01 — separate frontend/backend deployment and live repository URLs | Guarded read-only endpoint preflight and guarded mutating staging smoke are implemented; no actual deployed URLs/SHAs or successful live smoke have been recorded. | BLOCKED — do not substitute localhost CI for deployment evidence |

## Current candidate CI evidence

All five workflows passed on exact frontend source/test candidate SHA 2bf651c47313a3e67ef8fdb89c2de081007abcd6:

- [Frontend CI #415](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40642438873) — unit tests, lint, TypeScript and production build.
- [Synthetic browser E2E #277](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40642438824) — synthetic API browser journeys.
- [Accessibility browser acceptance #205](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40642438808) — axe/keyboard/reduced-motion and 320 CSS-pixel reflow coverage within its automated test scope.
- [Real API + MongoDB browser acceptance #225](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40642438861) — actual Express API, disposable MongoDB integration suite and Chromium acceptance.

The real API suite passed **9/9 browser tests** on this candidate. Coverage includes Doctor field editing, CSRF-protected `PATCH /doctors/:id`, hospital/phone persistence after reload, duplicate-email edit/create recovery, and a new pointer-free keyboard journey against the real API. A create attempt using the same email with different letter case returns HTTP 409 / `DOCTOR_EMAIL_EXISTS` without persisting the rejected record; the API is queried to prove the existing row stays and the rejected row is absent. The browser then corrects the email using the keyboard, retries successfully and verifies the newly persisted row through direct API reads. Server-side validation also moves focus to the invalid email input.

Frontend security configuration on this candidate has additional automated coverage: the production API client rejects public HTTP endpoints before fetch and refuses redirects; Next response headers include a CSP with a narrowly scoped production `connect-src`, clickjacking protection, MIME-sniffing protection, referrer and permissions policies, and HSTS for non-loopback production targets. The built synthetic-browser test verifies the actual response headers, while unit tests cover the public-HTTP rejection and local loopback-only CI exception. CSP still permits inline scripts for framework hydration; strict nonce-based CSP, live deployed-header verification and independent security review remain open.
- [Frontend dependency security audit #118](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40642438897) — passed the configured high/critical advisory threshold.

Current API dev SHA is efd1fd0f016d98da1fe91bdea52bc48f6295217f; latest API CI on that branch passed [run #40549035764](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40549035764). API main is 39 commits behind API dev and has not been promoted in this snapshot.

## Release gate register

| Gate | Status | Closure evidence |
|---|---|---|
| Exact-head automated checks | PASS — candidate SHA above | All five workflow results above |
| Feature PR dependency review | BLOCKED / NOT MERGED | PRs #9–#20 remain draft. `rakibul-hasan` ancestry now includes `dev` through [`743ace4`](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/commit/743ace45411a4399ac56f09fb003503d9b1da463) without source-tree changes; root CI [#409](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40640102505) and [#410](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40640107741) passed. Manual acceptance and parent review still block feature merges/promotion. See PROJECT-STATUS.md |
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
