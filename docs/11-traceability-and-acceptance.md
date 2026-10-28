# Traceability and Acceptance

**Snapshot date:** 2026-10-28  
**Current preflight-hardening candidate:** deployment-preflight hardening including standalone transport pin validation, default HTTPS-port enforcement, 2 MiB response cap and a default 10-second timeout for direct adapter calls; source/test head `e6ae741fbd78680075f25a7121198c406e7c67e4` passed all five workflows, and docs-inclusive head `b98ad1f29be655f05c2bdf906f45b3d5c7975a21` also passed all five. This subsequent traceability refresh requires exact-head CI. Current work remains on draft [PR #24](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/24), stacked on [PR #23](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/23), [PR #22](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/22) and [PR #21](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/21). Automated evidence does not establish live deployment acceptance. Last verified parent baseline: `c5419ba0f34ad8ff2f1c7fe3fc86bb4ec82bcf00`.  
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
| NFR-A11Y-01 — labels, contrast, keyboard/focus, reduced motion, dialogs and failure/retry paths | Automated axe/keyboard/reduced-motion/form/dialog/delete/detach checks; current [Accessibility #40650964482](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40650964482) passed on the current candidate. | PASS — automated scope only; screen-reader, actual 200% zoom and physical-device acceptance NOT STARTED |
| NFR-Security — secure config, dependency advisories, browser response hardening, no browser-stored session secrets | [Dependency audit #40650964434](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40650964434) and [real API/MongoDB #40650964392](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40650964392) pass. Current frontend adds CSP, anti-framing, MIME, referrer, permissions and HSTS headers; tests prove public HTTP API endpoints are rejected before fetch and redirects are not followed. The API dev has HTTPS-origin and MongoDB TLS guardrails with passing [latest API CI](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40549035764). | PARTIAL — automated/header-config scope passes; production CSP now uses a fresh per-response nonce with `strict-dynamic` and contains neither `unsafe-inline` nor `unsafe-eval`; live header/cookie/CORS validation and independent security review remain NOT STARTED |
| NFR-Security-Route — nonce CSP covers frontend HTML route boundaries | `proxy.ts` narrowly excludes `/api` and actual static/metadata paths; Chromium E2E verifies similarly named 404 routes retain the nonce CSP. | PASS — automated route-boundary scope on PR #23; deployed-header and independent security review remain open |
| NFR-Security-Preflight — redirect-safe requests and pinned public endpoint validation | Rejects redirects, malformed/local/IP-literal DNS names and non-default HTTPS ports. DNS answers are screened against non-public IPv4/IPv6 ranges, including IANA IPv6 benchmarking `2001:2::/48` and deprecated former ORCHID `2001:10::/28`; the HTTPS transport independently rejects private pins/family mismatch, retains the hostname for TLS verification, caps responses at 2 MiB and supplies a default 10-second abort timeout if called without a signal. Regression tests cover these rejection paths. | PASS — five required workflows passed on source/test head `e6ae741fbd78680075f25a7121198c406e7c67e4`; live staging and independent review remain BLOCKED release gates |
| NFR-Reliability / error handling | API validation/errors, retryable patient detach/delete flows, auth expiry/revocation handling and browser regression suites. | PARTIAL — covered scenarios pass in CI; production operations/observability review not evidenced |
| NFR-Performance — measured search/aggregate latency and query behavior | CI comparison [run #40648782677](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40648782677) and [JSON artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40648782677/artifacts/12798299690). Cached/PPR p50/p95: headers `2.01/7.04 ms`, full response `2.56/8.85 ms`, HTML `7,470 B`; nonce dynamic p50/p95: `5.86/15.44 ms`, `6.87/16.56 ms`, HTML `8,608 B`. Local sequential CI sample only; no real-user/Core Web Vitals or API/database query-plan evidence. | BLOCKED — no numeric SRS threshold is defined; observed dynamic route adds about `4.31 ms` median full-response time and `1,138 B` HTML in this sample, but do not treat noisy CI timings as steady-state acceptance; agree target and collect approved staging plus API/database p50/p95, error-rate and query-plan evidence before PASS |
| Privacy — synthetic acceptance and no patient secrets in artifacts | Browser tests use disposable synthetic records; staging workflow is guarded and disables screenshots/video/traces for the mutating smoke. | PASS — automated test-data/artifact controls within scope; production logging/security review remains open |
| DOCS-01 — README setup, architecture/data flow, two technical decisions and desktop/mobile screenshots | README and engineering docs exist on candidate branch; final screenshots have not been independently evidenced, and main still has the starter README. | PARTIAL |
| DEPLOY-01 — separate frontend/backend deployment and live repository URLs | Guarded read-only endpoint preflight and guarded mutating staging smoke are implemented; no actual deployed URLs/SHAs or successful live smoke have been recorded. | BLOCKED — do not substitute localhost CI for deployment evidence |

## Latest completed base CI evidence (PR #22)

All five workflows passed on the fully verified parent performance-baseline SHA `15bd4f2ebd035b20e23b0c4f480a33266ed8ce4d` for draft PR #22. PR #23 adds CSP route-boundary regression coverage and its exact-head checks must pass separately:

- [Frontend CI #40649163233](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40649163233) — unit tests, lint, TypeScript and production build, plus the branch-scoped baseline comparison.
- [Synthetic browser E2E #40649163110](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40649163110) — synthetic API browser journeys.
- [Accessibility browser acceptance #40649163301](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40649163301) — axe/keyboard/reduced-motion and 320 CSS-pixel reflow coverage within its automated test scope.
- [Real API + MongoDB browser acceptance #40649163489](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40649163489) — actual Express API, disposable MongoDB integration suite and Chromium acceptance.
- [Dependency security audit #40649163123](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40649163123) — configured high/critical advisory threshold.
- Comparative reports artifact from this fully verified base head: [frontend-performance-baseline-comparison](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40649163233/artifacts/12798697347).

The real API suite passed **9/9 browser tests** on the security-hardening candidate; the docs-inclusive PR #21 verification also passed. Coverage includes Doctor field editing, CSRF-protected `PATCH /doctors/:id`, hospital/phone persistence after reload, duplicate-email edit/create recovery, and a new pointer-free keyboard journey against the real API. A create attempt using the same email with different letter case returns HTTP 409 / `DOCTOR_EMAIL_EXISTS` without persisting the rejected record; the API is queried to prove the existing row stays and the rejected row is absent. The browser then corrects the email using the keyboard, retries successfully and verifies the newly persisted row through direct API reads. Server-side validation also moves focus to the invalid email input.

Draft PR #21 replaces the previous inline-script exception with a fresh per-response nonce generated in `proxy.ts`. The request and response carry the nonce-bound CSP so Next can attach the matching nonce to generated scripts/styles. Chromium acceptance verifies nonce matching, a new nonce on reload, working hydration/sign-in UI, and zero CSP console errors. The root route calls `connection()` so its HTML is rendered at request time; the previous static/PPR-oriented config was removed to avoid serving HTML with a reused nonce. This is a security/cache trade-off and does not count as performance acceptance. Live deployment header verification and independent security review remain open.
- [Frontend dependency security audit](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40646330427) — passed the configured high/critical advisory threshold.

Current API dev SHA is efd1fd0f016d98da1fe91bdea52bc48f6295217f; latest API CI on that branch passed [run #40549035764](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40549035764). API main is 39 commits behind API dev and has not been promoted in this snapshot.

## Deployment preflight redirect, DNS, port, pin, response-size and timeout safety — PR #24

The preflight fails closed for redirects on frontend GET, API health/readiness GET and CORS OPTIONS. Hostname validation rejects local/reserved/IP-literal, malformed and trailing-dot names. Non-default HTTPS ports are rejected; explicit :443 normalizes to the default. Hostname validation takes precedence over port rejection so local/reserved targets receive the intended error.

DNS answers are screened before each request. The same validated set is used by the custom node:https lookup callback; the requested hostname stays in TLS SNI/certificate verification while only checked public addresses are returned for socket routing. Address-family fallback remains inside that set. The exported transport independently validates its URL and each pinned IP/family before opening a socket, so direct calls cannot supply a private or loopback pin.

The [IANA IPv6 Special-Purpose Address registry](https://www.iana.org/assignments/iana-ipv6-special-registry) marks 2001:2::/48 (benchmarking) as not globally reachable. The implementation blocks that range and conservatively rejects deprecated former ORCHID prefix 2001:10::/28, in addition to existing non-public IPv4/IPv6 categories. The policy is static and still requires independent security review; it is not an automatically maintained mirror of IANA.

The HTTPS adapter rejects response bodies over **2 MiB** while streaming, destroys the request and fails closed instead of assembling an unbounded body in memory. If a direct caller omits an AbortSignal, the adapter applies a **10-second default timeout**; the usual deployment-preflight path still uses its configured request timeout. The body cap applies to deployment checker responses only, not normal application API payloads.

Tests cover hostname syntax, custom-port rejection, IPv4/IPv6 special ranges (including 2001:2::/48 and 2001:10::/28), mixed public/private records, resolver failure/empty answers, pinned lookup hostname/family selection, private-pin and mismatched-family rejection for direct adapter calls, IP-literal/port rejection, redirect safety, TLS hostname versus socket address, oversized responses, and default timeout-signal creation.

All five required workflows passed on source/test head `e6ae741fbd78680075f25a7121198c406e7c67e4`:
- [Frontend CI #40693923599](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40693923599)
- [Synthetic browser E2E #40693923693](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40693923693)
- [Accessibility #40693915201](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40693915201)
- [Real API + MongoDB #40693915463](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40693915463)
- [Dependency audit #40693923674](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40693923674)

The documentation-inclusive head `b98ad1f29be655f05c2bdf906f45b3d5c7975a21` also passed all five workflows:
- [Frontend CI #40694547447](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40694547447)
- [Synthetic browser E2E #40694547480](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40694547480)
- [Accessibility #40694547442](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40694547442)
- [Real API + MongoDB #40694547456](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40694547456)
- [Dependency audit #40694547465](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40694547465)

Treat every documentation-only change like a source change: verify all five workflows on the resulting SHA and record the exact run links in PR #24.

These automated/isolated results do not establish live deployment acceptance. Authorized staging verification and independent review remain open.

## CSP matcher boundary regression — PR #23

`proxy.ts` now scopes exclusions to the actual `/api` segment and descendants, the `/_next/static` and `/_next/image` paths, and exact metadata filenames. Chromium tests request `/apiary-csp-boundary-regression` and `/faviconXico-csp-boundary-regression` and assert that both 404 HTML documents still carry a nonce-bound CSP with `'strict-dynamic'` and neither `unsafe-inline` nor `unsafe-eval`.

The documentation-inclusive candidate `e2c15857438195dd83bbae0b68a4acf002fbc797` passed all five workflows:
- [Frontend CI #40650964437](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40650964437)
- [Synthetic browser E2E #40650964406](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40650964406)
- [Accessibility #40650964482](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40650964482)
- [Real API + MongoDB #40650964392](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40650964392)
- [Dependency audit #40650964434](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40650964434)

These checks establish automated coverage only. PR #23 remains draft pending independent human review; live deployed-header verification, independent security review and manual accessibility/device acceptance remain open release gates.

## Release gate register

| Gate | Status | Closure evidence |
|---|---|---|
| Exact-head automated checks | PASS — source/test SHA `e6ae741fbd78680075f25a7121198c406e7c67e4` and docs-inclusive baseline `b98ad1f29be655f05c2bdf906f45b3d5c7975a21` | Both documented baselines passed all five workflows. For later commits, exact-head evidence is maintained on PR #24; do not infer PASS from an earlier SHA. |
| Feature PR dependency review | BLOCKED / NOT MERGED | PRs #9–#24 remain draft; nonce-CSP PR #21 is stacked on #20, observational performance PR #22 is stacked on #21, CSP matcher-boundary PR #23 is stacked on #22, and redirect-safe preflight PR #24 is stacked on #23. `rakibul-hasan` ancestry now includes `dev` through [`743ace4`](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/commit/743ace45411a4399ac56f09fb003503d9b1da463) without source-tree changes; root CI [#409](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40640102505) and [#410](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40640107741) passed. Manual acceptance and parent review still block feature merges/promotion. See PROJECT-STATUS.md |
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
