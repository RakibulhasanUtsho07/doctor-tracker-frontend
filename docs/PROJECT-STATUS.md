# Doctor Tracker — Current Project Status

**Verified:** 2026-10-28  
**Overall release decision:** **PARTIAL / BLOCKED — not release-ready**  
**Current frontend source/test candidate:** 35c508e1854163b421e8a0dc04733ab7147bf50a on feat/320px-reflow-acceptance (draft PR [#20](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/20)); the status synchronization below is documentation-only.

This file is the concise current snapshot. Historical work-package evidence remains in [Traceability and Acceptance](11-traceability-and-acceptance.md). A green CI run proves only the tested scope and commit; it does not mean that the project is deployed or that manual release gates passed.

## Current verified results

All five required frontend workflows passed on the current source/test candidate 35c508e1854163b421e8a0dc04733ab7147bf50a:

| Gate | Result | Evidence |
|---|---|---|
| Frontend unit tests, lint, TypeScript and production build | PASS | [Frontend CI #384](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40636387230) |
| Synthetic browser journeys | PASS | [Synthetic browser E2E #248](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40636387099) |
| Accessibility browser checks, including the new 320 CSS-pixel reflow journey | PASS — automated scope only | [Accessibility #176](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40636386946) |
| Real Express API + isolated MongoDB browser acceptance | PASS — disposable CI scope only | [Real API + MongoDB #196](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40636387086) |
| Frontend dependency audit | PASS — no high/critical published package advisory found by this gate | [Dependency audit #89](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40636387307) |

The first 320px accessibility run exposed incorrect test selectors for Doctor and Patient Cancel buttons, not a demonstrated layout regression. Both selectors now target the editor containers, and the current-head accessibility workflow passed. The 320 CSS-pixel browser check is not evidence of real browser 200% zoom or physical-device acceptance.

The real API + MongoDB Chromium suite passes 7/7 browser tests on the source/test candidate, including Doctor edit through the protected `PATCH /doctors/:id` route, CSRF-header verification, changed hospital/phone values after reload, and a duplicate-email edit conflict that verifies an accessible field error and confirms both persisted doctor records remain unchanged. An initial attempt caught an ambiguous generic status locator; the assertion was scoped to `.doctor-notice`, and the corrected exact-head run passed.

## Implementation status by repository

### Backend API — doctor-tracker-api

- API foundation, administrator authentication/session, Doctor API, Patient API and dashboard aggregation are present on dev.
- Production configuration guardrails now require HTTPS frontend origins and TLS for production MongoDB connections.
- Current dev head: efd1fd0f016d98da1fe91bdea52bc48f6295217f; latest API CI on that head passed: [API CI run](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40549035764).
- The API main branch is 39 commits behind dev. API promotion to main has **not** been done in this verification.
- Do not equate passing CI with independent production security or deployment acceptance.

### Frontend — doctor-tracker-frontend

- Responsive shell, sign-in/session, dashboard, doctor management, patient management and automated acceptance are implemented across stacked feature branches and draft PRs.
- Current open frontend PRs are [#9–#20](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pulls). They remain **open/draft** and must be reviewed in dependency order; code in these branches is not yet equivalent to delivery on frontend dev or main.
- Frontend dev is still the earlier documentation baseline; the frontend main README is still the default starter README. Neither branch currently represents the full feature candidate.
- Do not close functional SRS items solely because an implementation exists in a draft PR. Require exact-head tests, review, required manual evidence and correct promotion.

## Outstanding release gates

| Gate | Status | Evidence needed to close |
|---|---|---|
| Real deployed frontend/API preflight and browser smoke | **BLOCKED** | Actual public HTTPS staging URLs, exact deployed SHAs, a disposable staging administrator, a synthetic doctor fixture and staging-only secrets; then pass the guarded manual workflows |
| Manual accessibility | **NOT STARTED** | Human keyboard-only and screen-reader walkthroughs; record browser/OS and outcomes |
| Real responsive/device review | **NOT STARTED** | Actual 200% browser zoom, desktop/tablet/mobile and physical touch-device checks; emulation alone is insufficient |
| Independent application/configuration security review | **NOT STARTED** | Review authorization, CSRF/CORS, cookies, session handling, validation, secrets and redacted logging; document any accepted risk |
| Performance acceptance | **BLOCKED / PARTIAL** | Agreed numeric target plus repeatable synthetic-data p50/p95, error rate, payload and query-plan evidence |
| README submission requirements | **PARTIAL** | Current setup/architecture/decisions must remain accurate; synthetic desktop/mobile screenshots and live deployment links are still not evidenced |
| PR review and branch promotion | **NOT STARTED** | Review parent PRs in dependency order; merge only after required acceptance; rerun CI on resulting dev and main SHAs |

Do not invent staging URLs, credentials, screenshots, performance SLAs or manual test results. Keep unavailable tests as BLOCKED/NOT STARTED, not PASS.

## Next execution order

1. Keep this status and the SRS traceability matrix synchronized to the exact current tested candidate; the duplicate-doctor-email edit conflict is now covered in the disposable real-API browser suite.
2. Review the stacked frontend PR dependency chain and the remaining domain edge cases not exhaustively covered; use the latest exact-head workflow results, not older run numbers.
3. Complete human accessibility/device checks and an independent security review.
4. Provision an authorized disposable staging environment, run read-only HTTPS/API preflight, then run the guarded mutating smoke only against that staging environment.
5. Capture approved-target performance measurements and synthetic desktop/mobile screenshots.
6. Promote the validated feature stack to frontend dev, then validate and promote to main. Separately reconcile API dev → API main; confirm post-merge CI against each resulting SHA.

The project is not fully complete until the required SRS items have implementation and acceptance evidence and the release gates above are resolved.
