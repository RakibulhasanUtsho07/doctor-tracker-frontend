# Traceability and Acceptance

## Current scope decision — public signup removed (2026-10-29)

Public signup is not part of the current product. The previous `/signup` page, `GET /auth/registration-status`, `POST /auth/register` and setup-code UI are historical records only and do not establish current route availability. Backend API PR #23 removed the public registration routes and setup-token configuration; API `dev` retains login/session/CSRF and operator-only `pnpm bootstrap:admin`. Regression tests must continue to prove removed routes return 404 and CLI bootstrap cannot overwrite or create multiple administrators.

| Requirement | Current implementation / evidence | Status |
|---|---|---|
| AUTH-04 — initial administrator provisioned by operator only | Backend `pnpm bootstrap:admin` uses securely injected `ADMIN_EMAIL` / `ADMIN_PASSWORD`, rejects overwrite and serializes competing bootstrap attempts with the durable setup marker. API PR #23 removes the public registration endpoints; frontend PR #33 removes `/signup` and signup browser journeys. | API removal CI PASS; frontend five exact-head workflows PASS on `e01ee0da`; merged to `dev` as `f8c37b9` |
| Login/session, doctor/patient/dashboard screens | Credentialed login, server-side sessions, CSRF-protected mutations and existing data actions are preserved; PR #33 real API + MongoDB browser acceptance passed. | Automated candidate PASS; deployed HTTPS cookie/CORS/session behaviour remains NOT STARTED |


**Snapshot date:** 2026-10-28  
**Latest verified pre-refresh baseline:** PR #24 head `84450c298757a462adc856fdae60b926aa4c5df7`; all five required workflows passed on that exact head: [Frontend CI #40727138375](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40727138375), [synthetic E2E #40727138214](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40727138214), [accessibility #40727138792](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40727138792), [real API + MongoDB #40727138193](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40727138193), and [dependency audit #40727137801](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40727137801). Current work remains on open/draft [PR #24](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/24), stacked on [PR #23](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/23), [PR #22](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/22) and [PR #21](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/21). These baseline results do not apply to later documentation commits until their exact heads pass again. The policy covers standalone transport pin validation, HTTPS port enforcement, a 2 MiB response cap, a default 10-second direct-call timeout, IANA IPv6 range exclusions and IANA special-use DNS suffix/subdomain rejection. Automated evidence does not establish live deployment acceptance.  
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
| NFR-Security-Preflight — redirect-safe requests and pinned public endpoint validation | Rejects redirects, malformed/local/IP-literal DNS names, IANA special-use DNS names and subdomains (including `example.com/.net/.org`, `.onion`, `.arpa` and `.alt`) and non-default HTTPS ports. DNS answers are screened against non-public IPv4/IPv6 ranges, including IANA IPv6 benchmarking `2001:2::/48` and deprecated former ORCHID `2001:10::/28`; the HTTPS transport independently rejects private pins/family mismatch, retains the hostname for TLS verification, caps responses at 2 MiB and supplies a default 10-second abort timeout if called without a signal. Regression tests cover these rejection paths. | PASS — all five required workflows passed on the previous exact head `84450c298757a462adc856fdae60b926aa4c5df7`; the subsequent status/traceability refresh must pass the same five workflows on its final SHA. Live staging and independent review remain BLOCKED release gates |
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

## Protected staging workflow environment — PR #19 / PR #24

The mutating staging smoke job is source-restricted to `dev` only and uses the `disposable-staging` environment. A static regression checks those declarations. This is not enough by itself: configure required reviewers, deployment-branch restriction to `dev` and environment-scoped staging secrets in repository settings. Until those external settings are inspected and confirmed, the live staging smoke remains BLOCKED.

## Guarded staging smoke target ownership — PR #19 / follow-up review

The mutating staging workflow must not treat a `staging`/ `preview` hostname label as proof of target ownership. The current follow-up requires exact host matching against out-of-band repository variables `STAGING_FRONTEND_HOST` and `STAGING_API_HOST`; missing or mismatched values reject before network access. Regression cases cover absent/malformed allowlists and attacker-controlled staging-looking hosts. Because this change adds commits to the stacked top branch, exact-head CI must pass before its automated status can be marked PASS. Actual staging execution remains BLOCKED pending authorized host values, staging-only secrets, an existing synthetic doctor fixture and manual approval.

## Deployment preflight redirect, DNS, port, pin, response-size and timeout safety — PR #24

The preflight fails closed for redirects on frontend GET, API health/readiness GET and CORS OPTIONS. Hostname validation rejects local/reserved/IP-literal, malformed and trailing-dot names, including IANA special-use DNS suffixes and their subdomains. Non-default HTTPS ports are rejected; explicit :443 normalizes to the default. Hostname validation takes precedence over port rejection so local/reserved targets receive the intended error.

DNS answers are screened before each request. The same validated set is used by the custom node:https lookup callback; the requested hostname stays in TLS SNI/certificate verification while only checked public addresses are returned for socket routing. Address-family fallback remains inside that set. The exported transport independently validates its URL and each pinned IP/family before opening a socket, so direct calls cannot supply a private or loopback pin.

The [IANA IPv6 Special-Purpose Address registry](https://www.iana.org/assignments/iana-ipv6-special-registry) marks 2001:2::/48 (benchmarking) as not globally reachable. The implementation blocks that range and conservatively rejects deprecated former ORCHID prefix 2001:10::/28, in addition to existing non-public IPv4/IPv6 categories. The policy is static and still requires independent security review; it is not an automatically maintained mirror of IANA.

The HTTPS adapter rejects response bodies over **2 MiB** while streaming, destroys the request and fails closed instead of assembling an unbounded body in memory. If a direct caller omits an AbortSignal, the adapter applies a **10-second default timeout**; the usual deployment-preflight path still uses its configured request timeout. The body cap applies to deployment checker responses only, not normal application API payloads.

Tests cover hostname syntax and IANA special-use DNS subdomains (`example.com`, `example.net`, `example.org`, `.onion`, `.arpa`, `.alt`), custom-port rejection, IPv4/IPv6 special ranges (including 2001:2::/48 and 2001:10::/28), mixed public/private records, resolver failure/empty answers, pinned lookup hostname/family selection, private-pin and mismatched-family rejection for direct adapter calls, IP-literal/port rejection, redirect safety, TLS hostname versus socket address, oversized responses, and default timeout-signal creation.

The source/test candidate `a34bd77643bfbfc2fdda341eda5d33d24de05b00` was verified on documentation-inclusive head `59c07b5e3870c6546e31e834ce5c9f5ae049117d`; all five required workflows passed on that exact head:
- [Frontend CI #40697483960](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40697483960)
- [Synthetic browser E2E #40697484066](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40697484066)
- [Accessibility #40697484156](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40697484156)
- [Real API + MongoDB #40697483847](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40697483847)
- [Dependency audit #40697483931](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40697483931)

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
| Exact-head automated checks | PASS on prior candidate `84450c298757a462adc856fdae60b926aa4c5df7`; this update is documentation-only and requires its own exact-head run | All five workflows passed on the prior exact head. For the resulting documentation-inclusive SHA, check all five PR #24 workflows again; do not infer PASS from an earlier SHA. |
| Feature PR dependency review | BLOCKED / NOT MERGED | Stacked implementation PRs #9–#24 remain draft; nonce-CSP PR #21 is stacked on #20, observational performance PR #22 is stacked on #21, CSP matcher-boundary PR #23 is stacked on #22, and redirect-safe preflight PR #24 is stacked on #23. Separate infrastructure-only [PR #25](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/25) is open/draft against `main` and is not part of that feature dependency chain. `rakibul-hasan` ancestry now includes `dev` through [`743ace4`](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/commit/743ace45411a4399ac56f09fb003503d9b1da463) without source-tree changes; root CI [#409](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40640102505) and [#410](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40640107741) passed. Manual acceptance and parent review still block feature merges/promotion. See PROJECT-STATUS.md |
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


## PR #24 exact-head regression repair — 2026-10-28

The pull-request merge candidate had two failed unit assertions because test fixtures no longer reached the specific staging-marker and trusted-host-mismatch branches after stricter fail-closed validation. Commit [a66e01a](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/commit/a66e01aa7313b800069da74c58158e735e8bfaf5) corrects only the fixtures; production guard behavior is unchanged. The exact source/test SHA passed all five workflows: [Frontend CI #40706431111](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40706431111) (49/49 unit tests), [Synthetic E2E #40706431107](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40706431107), [Accessibility #40706431042](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40706431042), [Real API + MongoDB #40706431035](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40706431035) and [Dependency audit #40706431108](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40706431108).

Security traceability note: the IANA registry marks `2001:2::/48` as benchmarking/non-globally-reachable and `2001:10::/28` as deprecated former ORCHID ([source](https://www.iana.org/assignments/iana-ipv6-special-registry)). Both already fall within the current `2001::/23` deny rule, so exact entries/tests strengthen explicit documentation/regression coverage but are redundant to current behavior. The broad enclosing rule intentionally errs on the side of rejection; independent review should acknowledge that it also blocks more-specific allocations individually marked globally reachable by IANA.

Acceptance status remains PARTIAL / BLOCKED overall: PRs #16–#24 are open drafts with no recorded review, and live staging, manual accessibility/device checks, independent security review, and agreed-target performance evidence are still outstanding. After this documentation change, verify the five workflows on the resulting documentation-inclusive head; record its final run URLs in the PR thread rather than treating the earlier source/test SHA as the latest documentation-head acceptance.


## Direct-call read-only transport guard — 2026-10-28

The normal deployment preflight wrapper already uses only GET and CORS OPTIONS and does not supply credentials; a final review found that direct callers of the exported `createPinnedHttpsFetch` were not independently constrained to that same contract. The transport is now being hardened to reject other methods, request bodies, credential/custom headers and any response encoding except identity. New direct-call regressions also prove that supported credential-free OPTIONS headers remain permitted. This is additional defense-in-depth, not evidence of a demonstrated external bypass.

**Automated acceptance:** all five workflows passed on source/test/docs-inclusive SHA `7176c3ecef2e70f291c79c8dc668ef7231103be0` and later descendant SHA `81a7c34215915510c13d7105ffb7305e1444847a`. Exact run URLs are documented in `docs/PROJECT-STATUS.md` and the PR #24 timeline. This documentation-refresh commit creates a newer SHA and must be rechecked; record its five exact-head run links in the PR timeline. No merge/promotion is authorized by automated checks alone.

## PR #24 public-DNS regression matrix — 2026-10-28

- Exact tested source/test SHA: `703f6f90451f90b03cabb9e2a26165fb57b95a81`.
- Expanded `test/deployment-preflight.test.mjs` with explicit IPv4 unspecified, multicast, limited-broadcast and IANA protocol-assignment negative cases; IPv6 unspecified, IPv4-mapped loopback, discard-only, IANA dummy (`100:0:0:1::/64`), SRv6 SID (`5f00::/16`), 6to4 and documentation-prefix cases; mixed public/private DNS answers; and a positive globally routed IPv6 pinning case. Production behavior is unchanged by this test-only commit.
- Exact-source/test CI: [Frontend CI #40712140676](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712140676) — 52/52 unit tests, lint/build pass; [Synthetic E2E #40712140474](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712140474) — 4/4; [Accessibility #40712140590](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712140590) — 22 passed, 2 skipped; [Real API + MongoDB #40712140521](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712140521) — 26/26 HTTP/unit, 4/4 database integration, 9/9 browser journeys; [Dependency audit #40712140871](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712140871) — pass.
- The `2001:2::/48` benchmarking and `2001:10::/28` former ORCHID cases remain covered by the pre-existing explicit tests; the enclosing current `2001::/23` deny rule already blocks them. The broad deny rule's compatibility trade-off remains for independent security review. DNS-filter tests do not substitute for production network testing.
- This acceptance evidence applies only to SHA `703f6f9…`; this traceability edit and any subsequent docs edit must be re-run on the resulting head before calling the new docs-inclusive head PASS.

## PR #24 documentation-inclusive exact-head verification — 2026-10-28

The newer source/test/docs-inclusive SHA `f912e896a992c7455488d960981dcdfe44e86413` has now passed all five workflows: [Frontend CI #40712995190](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712995190), [Synthetic E2E #40712995187](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712995187), [Accessibility #40712995361](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712995361), [Real API + MongoDB #40712995279](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712995279), and [Dependency audit #40712995330](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712995330). This closes the previously pending CI result for that exact SHA only. It does not close live deployment or manual release gates. This evidence note creates a new documentation commit and that resulting head must be reverified.


## Historical record — first-administrator signup implementation (removed from current scope) — 2026-10-29

| Requirement | Implementation | Exact acceptance evidence | Status |
|---|---|---|---|
| AUTH-04: single-use first-admin setup | API `GET /auth/registration-status`, `POST /auth/register`; frontend `/signup`; role fields disallowed; first user is ADMIN; registration closes once any user exists; durable marker serializes API/CLI setup attempts. | [API PR #21](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/21) merged as API `dev` `ed64953b445a3b027b2298205b36afd415b0c4db); [API CI #72](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40901298937) passed the merge candidate. | **PASS — automated scope** |
| Signup page integration | Responsive accessible form, password confirmation, open/closed/unavailable states, credentialed API request, existing HttpOnly session handoff and redirect. Dynamic request-time rendering preserves the proxy's per-response CSP nonce. | [Frontend PR #27](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/27) merged as frontend `dev` `aba792eb6934df160c6407d7b24b0c2267c24c47`; all five workflows passed on matching source candidate `bd3772bb76115f0c50e33ed5cf29242a33b5202f`: [Frontend CI #796](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40901762506), [synthetic E2E #651](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40901762548), [accessibility #576](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40901762515), [real API + MongoDB #598](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40901762508), [dependency audit #463](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40901762487). | **PASS — automated scope** |
| Production/manual first-admin release acceptance | Live HTTPS, real browser cookie/session behavior, human keyboard/screen-reader and physical-device review. | No live deployment URL, deployed SHA, or manual evidence was supplied for this change. | **NOT STARTED / BLOCKED** |

This section supersedes older dated branch-status statements for the first-admin signup feature only. Historical notes for unrelated stacked security PRs remain historical and their own release gates stay open. The signup feature is merged to `dev`; no changes were made to `main`.


## Production first-admin setup-code gate — 2026-10-29

| Requirement | Implementation / evidence | Status |
|---|---|---|
| Production must not allow any visitor to claim the first ADMIN on an empty database | API [PR #22](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/22) merged to API `dev` at `7334b8783def285e5316c8d9dcf1b594c1a5afea). Empty production setup is disabled if `INITIAL_ADMIN_SETUP_TOKEN` is missing. If configured, the token is required in the request body and checked using fixed-length SHA-256 digests with `timingSafeEqual`. API CI [#75](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40905197587) passed lint, typecheck, unit, MongoDB integration and build. | **PASS — automated API scope** |
| Signup UI follows setup-code status, does not persist code, and blocks disabled production setup | Frontend [PR #29](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/29) merged to frontend `dev` at `5e81216ba1f35dd86b9856d717c82a91ca0d1e66`. Candidate `7561000c82c8ff08a003961f5330d0e0c8ebb1e9` passed all five workflows: [CI #805](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40906769259), [synthetic E2E #660](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40906769324), [accessibility #585](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40906769377), [real API + MongoDB #607](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40906769145) against API `dev` `7334b8783def285e5316c8d9dcf1b594c1a5afea`, and [dependency audit #472](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40906769216). | **PASS — automated candidate scope** |
| Live production operation and manual acceptance | Operator-provisioned 32+ byte secret, out-of-band delivery, removal from API runtime after setup, deployed HTTPS/session/cookie verification, human screen-reader/keyboard/device review. | **NOT STARTED / BLOCKED** — no deployed URL or manual evidence recorded. |

This supersedes older dated branch-state statements for current scope. API PR #23 removed public registration endpoints; frontend PR #33 removed the browser signup page and journeys and merged to `dev` as `f8c37b9` after all five exact-source-head workflows passed. `main` was not changed. Overall product release remains PARTIAL / BLOCKED pending live HTTPS/staging acceptance and manual release gates.


## Dashboard visual system update — 2026-10-29

| Requirement | Implementation / evidence | Status |
|---|---|---|
| UI-CANVAS-01 — full-white project canvas | Global `--canvas`, `html`, `body`, application frame, main shell and sidebar use `#ffffff`; cards retain semantic accents and borders. | PASS in PR #33 source head; merged to `dev` as `f8c37b9`; production visual review remains open |
| UI-HERO-01 — clearer responsive dashboard hero | White elevated panel, pill-style kicker, stronger heading hierarchy, improved spacing, refined floating workspace illustration and reduced rotation; responsive breakpoints and reduced-motion rules remain. | Automated PASS in PR #33 source head; manual deployed screenshot review remains open |


## Patient directory UI refinement — 2026-10-29

| Requirement | Candidate change | Status |
|---|---|---|
| PAT-UX-01 — clear doctor lookup hierarchy | Dedicated lookup heading/icon, labelled search input and clear loading/empty/error status are tested without changing search semantics. | PASS — PR #33 browser E2E, accessibility and real API acceptance |
| PAT-UX-02 — discoverable patient filters | Filter-workspace heading/description, control spacing/focus styling and prefix-search/UTC-date guidance are tested without changing request semantics. | PASS — PR #33 exact-head workflows; live visual acceptance remains open |
| PAT-UX-03 — readable persisted records | Count/header, table rows, View/Detach/Delete controls and pagination are refined; persisted CRUD/reassignment/session revocation passed real API + MongoDB acceptance. | PASS — PR #33 exact-head real API browser acceptance |
| PAT-UX-04 — responsive and reduced-motion support | Responsive tablet/mobile layouts and reduced-motion overrides are in the candidate. | PASS within automated accessibility scope; human device/assistive-technology review remains open |

The visual changes do not replace manual keyboard/screen-reader, 200% zoom or physical-device review. Do not mark the PR fully accepted or promote it based on source inspection alone.
