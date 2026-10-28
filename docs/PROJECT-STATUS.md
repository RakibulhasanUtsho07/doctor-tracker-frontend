# Doctor Tracker — Current Project Status

**Verified:** 2026-10-28  
**Overall release decision:** **PARTIAL / BLOCKED — not release-ready**  
**Latest verified preflight-hardening candidate at this snapshot:** source/test head `a34bd77643bfbfc2fdda341eda5d33d24de05b00`, included in documentation-inclusive head `59c07b5e3870c6546e31e834ce5c9f5ae049117d`; all five required workflows passed on that exact documentation-inclusive head. The current branch's Actions results are authoritative for any subsequent commit. Live staging, independent security review and manual accessibility/device acceptance remain separate release gates. Live staging and independent review remain separate release gates.

This file is the concise current snapshot. Historical work-package evidence remains in [Traceability and Acceptance](11-traceability-and-acceptance.md). A green CI run proves only the tested scope and commit; it does not mean that the project is deployed or that manual release gates passed.

## Current verified results

The last fully verified candidate before this status snapshot is PR #24 documentation-inclusive head `59c07b5e3870c6546e31e834ce5c9f5ae049117d`; all five required workflows passed. Performance comparison remains observational only, not an SLA gate:

| Gate | Result | Evidence |
|---|---|---|
| Frontend unit tests, lint, TypeScript, production build + observational benchmark comparison | PASS — benchmark itself is not an SLA gate | [Frontend CI #40697483960](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40697483960) |
| Synthetic browser journeys | PASS | [Synthetic browser E2E #40697484066](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40697484066) |
| Accessibility browser checks, including 320 CSS-pixel reflow | PASS — automated scope only | [Accessibility #40697484156](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40697484156) |
| Real Express API + isolated MongoDB browser acceptance | PASS — disposable CI scope only | [Real API + MongoDB #40697483847](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40697483847) |
| Frontend dependency audit | PASS — no high/critical published package advisory found by this gate | [Dependency audit #40697483931](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40697483931) |

## Protected staging workflow — follow-up security hardening

The mutating staging-smoke job is restricted by YAML to dispatches from `dev` only and is attached to GitHub Actions environment `disposable-staging`. Static regression tests assert both controls. Repository configuration must still add required reviewers, restrict allowed deployment branches to trusted protected branches, and keep staging credentials at environment scope; those settings cannot be proven from the source diff alone. Until settings are verified, the live mutating staging gate stays BLOCKED.

## Guarded staging smoke host allowlist — follow-up security work

The mutating staging workflow previously accepted any public host containing a staging-like label, which did not prove that the target was owned by this deployment. The current candidate adds exact matching against trusted repository variables `STAGING_FRONTEND_HOST` and `STAGING_API_HOST`. Missing variables or host mismatches fail closed before the workflow checks staging credentials or makes network requests. The expected values must be exact lowercase DNS hostnames only. Regression tests cover missing/malformed variables and staging-looking attacker-controlled domains. This follow-up is subject to exact-head CI; it does not authorize a staging run or close live acceptance.

## Deployment preflight redirect, DNS, port, IP-pin, response-size and timeout safety — PR #24

The read-only preflight rejects redirects on frontend GET, API health/readiness GET and CORS OPTIONS requests. URL validation rejects local/reserved/IP-literal, malformed/trailing-dot and IANA special-use DNS hostnames (including subdomains of `example.com`, `example.net`, `example.org`, `.onion`, `.arpa` and `.alt`) and permits only the default HTTPS port (443). Explicit :443 normalizes to the default; non-default ports such as 444 or 8443 are rejected.

Before each request, DNS is resolved and all answers are checked against the non-public IPv4/IPv6 policy; unsafe or empty answers fail closed. The HTTPS socket lookup is pinned to those validated addresses so it does not perform a second independent DNS resolution. The original hostname remains in TLS SNI and certificate verification, and address-family failover is limited to the validated set. Defense in depth: the exported transport independently validates its target URL, confirms every pin is a public IP and rejects address-family mismatches, including when called outside the normal preflight wrapper.

The [IANA IPv6 Special-Purpose registry](https://www.iana.org/assignments/iana-ipv6-special-registry) marks 2001:2::/48 (benchmarking) as not globally reachable. The policy now rejects that range and conservatively rejects deprecated former ORCHID prefix 2001:10::/28 as well as existing local, link-local, documentation, multicast and other reserved ranges. This is a reviewed static policy, not a runtime registry fetch; independent security review remains required.

The HTTPS adapter caps response bodies at **2 MiB**. It counts streamed bytes, destroys the request and rejects the preflight when the limit is exceeded. The exported adapter also creates a default **10-second AbortSignal timeout** if a caller omits a signal, preventing direct adapter calls from accidentally running indefinitely; the normal preflight continues to pass its configured per-request timeout. These safeguards apply only to deployment-preflight responses, not normal application API payloads.

Regression coverage includes malformed/trailing-dot and IANA special-use DNS names/subdomains; HTTPS port validation; IPv4 and IPv6 private/special ranges including IANA benchmarking and deprecated ORCHID; mixed public/private DNS answers; DNS failure and empty answers; pinned lookup hostname/family behavior; standalone adapter rejection of private pins, family mismatch, IP-literal targets, non-default ports and redirect-follow; TLS hostname versus socket IP separation; oversized-response rejection; and default timeout-signal creation. Tests use injected synthetic DNS/fetch/request fixtures or isolated CI services. No deployed endpoint was contacted.

Source/test head `a34bd77643bfbfc2fdda341eda5d33d24de05b00` was included in documentation-inclusive head `59c07b5e3870c6546e31e834ce5c9f5ae049117d`; all five required workflows passed on that exact head. The links below are the verification evidence; any later commit must be checked on its own exact head:
- [Frontend CI #40693923599](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40693923599) — unit tests, lint and production build.
- [Synthetic browser E2E #40693923693](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40693923693).
- [Accessibility #40693915201](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40693915201) — automated browser scope only.
- [Real API + MongoDB #40693915463](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40693915463) — isolated acceptance scope only.
- [Dependency audit #40693923674](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40693923674).

The documentation-inclusive head `b98ad1f29be655f05c2bdf906f45b3d5c7975a21` also passed all five workflows after the timeout documentation and PR-summary update:
- [Frontend CI #40694547447](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40694547447)
- [Synthetic browser E2E #40694547480](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40694547480)
- [Accessibility #40694547442](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40694547442)
- [Real API + MongoDB #40694547456](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40694547456)
- [Dependency audit #40694547465](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40694547465)

Every documentation-only commit is subject to the same exact-resulting-head workflow checks as a source commit. Record the latest SHA and workflow links on PR #24 before treating that snapshot as verified.

**Remaining release gates:** authorized live staging HTTPS/CORS/session/CSRF acceptance, independent security review of the IP-range policy and pinned transport, and parent-PR review. Automated CI does not establish production acceptance.

## CSP matcher boundary regression — PR #23

The proxy matcher now excludes only the `/api` segment and descendants, the real `/_next/static` and `/_next/image` path boundaries, and the exact `favicon.ico`, `robots.txt`, and `sitemap.xml` filenames. It no longer skips CSP for similarly named frontend paths such as `/apiary-csp-boundary-regression` or `/faviconXico-csp-boundary-regression`. Chromium regression coverage asserts both paths return 404 HTML with a fresh nonce-bound CSP, `'strict-dynamic'`, and neither `unsafe-inline` nor `unsafe-eval`.

The documentation-inclusive head `e2c15857438195dd83bbae0b68a4acf002fbc797` passed all five workflows:
- [Frontend CI #40650964437](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40650964437)
- [Synthetic browser E2E #40650964406](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40650964406) — includes the new 404-path CSP regression.
- [Accessibility #40650964482](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40650964482)
- [Real API + MongoDB #40650964392](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40650964392)
- [Dependency audit #40650964434](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40650964434)

PR #23 remains draft and unmerged pending independent human review; live deployed-header verification, independent security review and manual accessibility/device acceptance remain open release gates.
The first 320px accessibility run exposed incorrect test selectors for Doctor and Patient Cancel buttons, not a demonstrated layout regression. Both selectors now target the editor containers, and the current-head accessibility workflow passed. A separate real-API keyboard test then exposed a genuine focus-recovery defect after a 409 field error; the Doctor editor now focuses the invalid field and the fixed journey passes. The 320 CSS-pixel browser check is not evidence of real browser 200% zoom or physical-device acceptance.

The real API + MongoDB Chromium suite passed 9/9 browser tests on the security-hardening candidate; the PR #21 docs-inclusive verification also passed at `75f70bce3d4223dd5a71005270b92730d5ec7676`. Coverage includes Doctor edit through protected `PATCH /doctors/:id`, CSRF-header verification, hospital/phone persistence after reload, and duplicate-email recovery. A new keyboard-only real-API journey creates an original Doctor, verifies a mixed-case duplicate returns HTTP 409 / `DOCTOR_EMAIL_EXISTS` without persisting the rejected record, verifies both records through direct API reads, corrects the email using only the keyboard, and confirms the successful retry persists. The journey also asserts that a server-side field error returns focus to the invalid email input so keyboard users can recover without a pointer.

The frontend now generates a fresh per-response CSP nonce in `proxy.ts`, forwards that CSP to Next.js for nonce propagation, and sets production `script-src`/`style-src` without `'unsafe-inline'`. Chromium acceptance verifies script nonce matching, nonce rotation on reload, the sign-in screen/hydration, and no CSP-related console errors. Baseline response headers and narrow production `connect-src` remain configured; public HTTP API targets are rejected and API redirects are not automatically followed. To support a per-response nonce safely, the root route uses `connection()` and the previous static/PPR-oriented config was removed. This is an explicit cache/performance trade-off; performance acceptance is still blocked until measured. Live deployed-header verification and an independent security review remain open.

The comparison was measured on [Frontend CI run #40648782677](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40648782677), with a JSON artifact [frontend-performance-baseline-comparison](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40648782677/artifacts/12798299690). Across 3 warm-ups and 30 sequential root GETs per variant, the cached/PPR baseline at `9356a765ddcad60baf4964bb8b1db968b40a5184` reported response-header latency p50/p95 `2.01/7.04 ms`, full response p50/p95 `2.56/8.85 ms`, and HTML size `7,470 bytes`. The nonce-CSP dynamic candidate reported `5.86/15.44 ms`, `6.87/16.56 ms`, and `8,608 bytes` respectively. Observed deltas were +3.85 ms header p50 (+191.54%), +8.40 ms header p95 (+119.32%), +4.31 ms full-response p50 (+168.36%), +7.71 ms full-response p95 (+87.12%), and +1,138 bytes HTML (+15.23%). These are small local-CI sample timings with runner noise, not real-user/Core Web Vitals, end-to-end authenticated journeys, API/database performance, or proof of steady-state production behavior. The comparison is **OBSERVATIONAL_ONLY**: no numeric SRS threshold exists, so performance acceptance remains BLOCKED pending an agreed target and staging/real-browser evidence.

## Implementation status by repository

### Backend API — doctor-tracker-api

- API foundation, administrator authentication/session, Doctor API, Patient API and dashboard aggregation are present on dev.
- Production configuration guardrails now require HTTPS frontend origins and TLS for production MongoDB connections.
- Current dev head: efd1fd0f016d98da1fe91bdea52bc48f6295217f; latest API CI on that head passed: [API CI run](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40549035764).
- The API main branch is 39 commits behind dev. API promotion to main has **not** been done in this verification.
- Do not equate passing CI with independent production security or deployment acceptance.

### Frontend — doctor-tracker-frontend

- Responsive shell, sign-in/session, dashboard, doctor management, patient management and automated acceptance are implemented across stacked feature branches and draft PRs.
- Current open frontend PRs are [#9–#24](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pulls). They remain **open/draft** and must be reviewed in dependency order; PR #21 adds nonce CSP, PR #22 adds observational comparison tooling, and PR #23 narrows CSP matcher exclusions. None is promoted to frontend dev/main.
- Frontend dev is still the earlier documentation baseline; the frontend main README is still the default starter README. Neither branch currently represents the full feature candidate.
- Do not close functional SRS items solely because an implementation exists in a draft PR. Require exact-head tests, review, required manual evidence and correct promotion.

## Branch integration audit — verified 2026-10-28

The feature branches have implementation and automated test evidence, but the integration graph is not yet ready to merge:

- Frontend `dev` is **9 commits ahead of `main`**; `main` is behind and has not received the current feature stack.
- `rakibul-hasan` now includes the current `dev` tip as its second parent through ancestry-only merge commit [`743ace4`](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/commit/743ace45411a4399ac56f09fb003503d9b1da463); its source tree remained byte-identical to the prior head. Branch comparison is now **21 commits ahead of and 0 behind `dev`**. Current-head [Frontend CI push #409](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40640102505) and [PR #9 CI #410](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40640107741) both passed.
- PRs #9–#24 are **open and draft**. PR #21 adds nonce CSP on top of PR #20, PR #22 adds observational performance comparison, and PR #23 tests matcher path boundaries. Their automated verification and review status are recorded per exact head; none has been merged or promoted. Structural mergeability is not equivalent to approved review or manual release acceptance.

| PR | Base branch | Head branch | State |
|---|---|---|---|
| [#9](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/9) | `dev` | `rakibul-hasan` | OPEN / DRAFT |
| [#10](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/10) | `rakibul-hasan` | `feat/step-7-auth-dashboard` | OPEN / DRAFT |
| [#11](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/11) | `feat/step-7-auth-dashboard` | `feat/step-8-doctor-management` | OPEN / DRAFT |
| [#12](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/12) | `feat/step-8-doctor-management` | `feat/step-9-patient-management` | OPEN / DRAFT |
| [#13](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/13) | `feat/step-9-patient-management` | `feat/step-10-release-e2e` | OPEN / DRAFT |
| [#14](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/14) | `feat/step-10-release-e2e` | `feat/step-11-real-api-e2e` | OPEN / DRAFT |
| [#15](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/15) | `feat/step-11-real-api-e2e` | `feat/step-12-accessibility-e2e` | OPEN / DRAFT |
| [#16](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/16) | `feat/step-12-accessibility-e2e` | `feat/form-dialog-accessibility-e2e` | OPEN / DRAFT |
| [#17](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/17) | `feat/form-dialog-accessibility-e2e` | `feat/patient-detach-failure-e2e` | OPEN / DRAFT |
| [#18](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/18) | `feat/patient-detach-failure-e2e` | `feat/patient-delete-failure-e2e` | OPEN / DRAFT |
| [#19](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/19) | `feat/patient-delete-failure-e2e` | `feat/staging-browser-smoke` | OPEN / DRAFT |
| [#20](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/20) | `feat/staging-browser-smoke` | `feat/320px-reflow-acceptance` | OPEN / DRAFT |
| [#21](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/21) | `feat/320px-reflow-acceptance` | `feat/csp-sri-hardening` | OPEN / DRAFT |
| [#22](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/22) | `feat/csp-sri-hardening` | `feat/performance-baseline` | OPEN / DRAFT |
| [#23](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/23) | `feat/performance-baseline` | `feat/csp-route-boundary-hardening` | OPEN / DRAFT |
| [#24](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/24) | `feat/csp-route-boundary-hardening` | `feat/preflight-no-redirects` | OPEN / DRAFT |

Safe next sequence:

1. Completed: reconcile `dev` ancestry into `rakibul-hasan` with non-force commit [`743ace4`](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/commit/743ace45411a4399ac56f09fb003503d9b1da463); confirmed no content-tree changes and passed root CI [#409](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40640102505) / [#410](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40640107741).
2. Keep PR #9 and the stacked children in draft until the required manual keyboard/screen-reader, actual 200% zoom and physical-device checks have dated evidence.
3. After PR #9 is accepted and integrated into `dev`, promote the child PRs in dependency order, checking each diff against its new base and rerunning CI on the resulting branch SHA.
4. Promote the validated `dev` state to `main` only after the frontend and API release gates are met; verify post-merge CI against both resulting SHAs.

No frontend feature PR was merged or promoted by this audit. Live deployment, manual device acceptance, independent security review and agreed-target performance evidence remain open.

## Outstanding release gates

| Gate | Status | Evidence needed to close |
|---|---|---|
| Real deployed frontend/API preflight and browser smoke | **BLOCKED** | Actual public HTTPS staging URLs, exact deployed SHAs, a disposable staging administrator, a synthetic doctor fixture and staging-only secrets; then pass the guarded manual workflows |
| Manual accessibility | **NOT STARTED** | Human keyboard-only and screen-reader walkthroughs; record browser/OS and outcomes |
| Real responsive/device review | **NOT STARTED** | Actual 200% browser zoom, desktop/tablet/mobile and physical touch-device checks; emulation alone is insufficient |
| Independent application/configuration security review | **NOT STARTED** | Review authorization, CSRF/CORS, cookies, per-response nonce/CSP propagation, proxy matcher/headers, session handling, validation, secrets and redacted logging; verify live deployed headers and document accepted risks |
| Performance acceptance | **BLOCKED / PARTIAL** | Agreed numeric target plus repeatable synthetic-data p50/p95, error rate, payload and query-plan evidence |
| README submission requirements | **PARTIAL** | Current setup/architecture/decisions must remain accurate; synthetic desktop/mobile screenshots and live deployment links are still not evidenced |
| PR review and branch promotion | **NOT STARTED** | Review parent PRs in dependency order; merge only after required acceptance; rerun CI on resulting dev and main SHAs |

Do not invent staging URLs, credentials, screenshots, performance SLAs or manual test results. Keep unavailable tests as BLOCKED/NOT STARTED, not PASS.

## Next execution order

1. Completed: add and verify the keyboard-only real-API duplicate-email recovery path; the real API + MongoDB browser suite passes 9/9 within its disposable CI scope.
2. Completed in draft PR #21: per-response nonce CSP without production `unsafe-inline`; frontend CI, synthetic E2E, accessibility acceptance, real API acceptance and dependency audit all pass on docs-inclusive verification SHA `75f70bce3d4223dd5a71005270b92730d5ec7676`.
3. Completed in draft PR #22: measure and compare the performance impact of request-time rendering against the prior cached/PPR candidate; agree a numeric target before any performance PASS.
4. Completed in draft PR #23: scope the CSP proxy matcher exclusions to exact path boundaries and add 404-route nonce-policy regression coverage; the documented exact-head checks passed, but independent review and live/manual release gates remain open.
5. Current: obtain independent review of the dependency chain in order, starting at the earliest parent; do not mark PRs ready or merge/promote until review and the required manual/staging acceptance gates are recorded.
6. Complete human accessibility/device checks and an independent security review.
7. Provision an authorized disposable staging environment, run read-only HTTPS/API preflight, then run the guarded mutating smoke only against that environment.
8. Capture approved-target performance measurements and synthetic desktop/mobile screenshots; promote the validated feature stack to frontend `dev`, then validate and promote to `main` only after release gates pass. Separately reconcile API `dev` → API `main`; confirm post-merge CI on resulting SHAs.

The project is not fully complete until the required SRS items have implementation and acceptance evidence and the release gates above are resolved.


## PR #24 exact-head regression repair — 2026-10-28

Source/test commit: [a66e01a](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/commit/a66e01aa7313b800069da74c58158e735e8bfaf5).

The prior pull-request merge-candidate Frontend CI run [#40706171008](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40706171008) failed 2 of 49 unit tests. The failures were stale validation-order fixtures in `test/staging-smoke-guard.test.mjs`, not a production-code failure: one test expected the staging-marker check before exact trusted-host matching, and a second used a reserved `.example` host that the public-host guard correctly rejected before allowlist comparison. The tests now configure the matching unstaged host when asserting marker rejection, and use syntactically valid public-DNS-shaped attacker hostnames when asserting trusted allowlist mismatch. No production code was changed in this correction.

All five required workflows passed on exact source/test head `a66e01aa7313b800069da74c58158e735e8bfaf5`:
- [Frontend CI #40706431111](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40706431111) — PASS; 49/49 unit tests, 0 failures, lint/build completed.
- [Synthetic browser E2E #40706431107](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40706431107) — PASS.
- [Accessibility browser acceptance #40706431042](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40706431042) — PASS within its automated Chromium scope.
- [Real API + MongoDB browser acceptance #40706431035](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40706431035) — PASS within isolated CI scope.
- [Frontend dependency security audit #40706431108](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40706431108) — PASS at the configured high/critical advisory threshold.

A non-fatal `react-hooks/exhaustive-deps` lint warning about the `session` dependency remains in the existing application source; this test-only commit did not change that code. Track it separately rather than mixing unrelated application behavior into the preflight regression repair.

### IPv6 policy review note

IANA lists `2001:2::/48` as benchmarking with Globally Reachable set to False, and `2001:10::/28` as the deprecated former ORCHID allocation ([IANA IPv6 Special-Purpose Address Space](https://www.iana.org/assignments/iana-ipv6-special-registry)). Audit nuance: the current denylist already includes the enclosing `2001::/23`, which contains both subnets. The newly explicit entries and regression cases make the policy intent clearer, but they do not change the deny decision for those addresses relative to that existing supernet rule. The enclosing rule is deliberately conservative and also blocks more-specific allocations inside `2001::/23` that IANA individually marks globally reachable; an independent security reviewer should explicitly accept or revise that compatibility trade-off.

### Release decision

Automated source/test acceptance is PASS for commit `a66e01a` only. PR #24 is still draft and unmerged, and reviews remain absent on PRs #16–#24. This does not establish live staging/deployed-header acceptance, manual screen-reader/keyboard/200%-zoom/physical-device acceptance, independent security sign-off, or performance acceptance against an agreed target. Keep the whole stack unmerged and do not promote to `dev` or `main` until those gates are evidenced.


## Direct-call read-only transport guard — 2026-10-28

Final review of PR #24's exported `createPinnedHttpsFetch` found that, although the normal preflight wrapper only sends GET and CORS OPTIONS, direct callers could choose other methods and supply arbitrary headers/body. This was not a demonstrated remote bypass of the wrapper, but it weakened the transport's own security contract. The follow-up now enforces the contract inside the transport: only GET/OPTIONS; no request body; only the reviewed preflight header set; credential/custom headers rejected; and `Accept-Encoding` must be `identity` so streamed response-size limits remain predictable.

Regression tests reject POST/PATCH/PUT/DELETE/TRACE/CONNECT, bodies, Authorization/Cookie/Proxy-Authorization/API-key/custom headers and compressed-response requests before any socket is created, while proving a credential-free OPTIONS preflight still works.

All five required workflows passed on exact source/test/docs-inclusive head `7176c3ecef2e70f291c79c8dc668ef7231103be0`: [Frontend CI #40708077699](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40708077699) (50/50 unit tests), [Synthetic E2E #40708077562](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40708077562), [Accessibility #40708077530](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40708077530), [Real API + MongoDB #40708077522](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40708077522), and [Dependency audit #40708077603](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40708077603).

The later documentation/release-workflow descendant `81a7c34215915510c13d7105ffb7305e1444847a` also passed all five exact-head workflows: [Frontend CI #40709717851](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40709717851), [Synthetic E2E #40709717839](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40709717839), [Accessibility #40709717996](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40709717996), [Real API + MongoDB #40709718719](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40709718719), and [Dependency audit #40709717953](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40709717953).

This acceptance applies only to the exact SHAs listed above. The documentation-refresh commit created next requires the five workflows to be rerun on its resulting head; final run links will be recorded in the PR #24 timeline.

PR #24 remains draft. This added adapter hardening does not close independent security review, real deployed staging verification, manual keyboard/screen-reader/200%-zoom/device checks, or agreed-target performance acceptance.

## Latest PR #24 test-only DNS boundary expansion — 2026-10-28

Added commit [`703f6f9`](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/commit/703f6f90451f90b03cabb9e2a26165fb57b95a81) to `feat/preflight-no-redirects`. It broadens address-range regression tests for IPv4 unspecified, multicast, broadcast and protocol-assignment blocks; IPv6 unspecified/IPv4-mapped loopback, discard-only, IANA dummy/SRv6 prefixes, 6to4 and documentation ranges; mixed public/private DNS answers; and a positive global IPv6 pinning scenario. This changes tests only, not production transport code.

The exact source/test commit passed five workflows: [Frontend CI #40712140676](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712140676) (52/52 unit tests, lint and build), [Synthetic E2E #40712140474](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712140474) (4/4 journeys), [Accessibility #40712140590](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712140590) (22 passed, 2 skipped), [Real API + MongoDB #40712140521](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712140521) (26/26 HTTP/unit, 4/4 MongoDB integration, 9/9 Chromium journeys), and [Dependency audit #40712140871](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712140871) (pass). These checks do not change the overall release status: PR #24 stays draft/unmerged pending dependency-ordered independent review, external staging configuration and live/manual release acceptance. This documentation update needs a fresh exact-head workflow rerun.

## PR #24 docs-inclusive CI completion — 2026-10-28

The five workflows have now completed successfully on docs-inclusive head `f912e896a992c7455488d960981dcdfe44e86413`: [Frontend CI #40712995190](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712995190), [Synthetic E2E #40712995187](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712995187), [Accessibility #40712995361](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712995361), [Real API + MongoDB #40712995279](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712995279), and [Dependency audit #40712995330](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40712995330). PR #24 remains draft/unmerged pending independent review and live/manual release criteria. This note creates a newer docs-inclusive SHA; rerun all five workflows against that resulting head before treating it as the latest accepted snapshot.
