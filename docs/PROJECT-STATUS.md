# Doctor Tracker — Current Project Status

**Verified:** 2026-10-28  
**Overall release decision:** **PARTIAL / BLOCKED — not release-ready**  
**Current frontend source/test candidate:** 9945f0a2d9bc5111a31b23cde6cf9bbc457bbc9c on feat/320px-reflow-acceptance (draft PR [#20](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/20)); the status synchronization below is documentation-only.

This file is the concise current snapshot. Historical work-package evidence remains in [Traceability and Acceptance](11-traceability-and-acceptance.md). A green CI run proves only the tested scope and commit; it does not mean that the project is deployed or that manual release gates passed.

## Current verified results

All five required frontend workflows passed on the current source/test candidate 9945f0a2d9bc5111a31b23cde6cf9bbc457bbc9c:

| Gate | Result | Evidence |
|---|---|---|
| Frontend unit tests, lint, TypeScript and production build | PASS | [Frontend CI #406](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40639456854) |
| Synthetic browser journeys | PASS | [Synthetic browser E2E #270](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40639456915) |
| Accessibility browser checks, including the new 320 CSS-pixel reflow journey | PASS — automated scope only | [Accessibility #198](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40639456989) |
| Real Express API + isolated MongoDB browser acceptance | PASS — disposable CI scope only | [Real API + MongoDB #218](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40639456987) |
| Frontend dependency audit | PASS — no high/critical published package advisory found by this gate | [Dependency audit #111](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40639456871) |

The first 320px accessibility run exposed incorrect test selectors for Doctor and Patient Cancel buttons, not a demonstrated layout regression. Both selectors now target the editor containers, and the current-head accessibility workflow passed. A separate real-API keyboard test then exposed a genuine focus-recovery defect after a 409 field error; the Doctor editor now focuses the invalid field and the fixed journey passes. The 320 CSS-pixel browser check is not evidence of real browser 200% zoom or physical-device acceptance.

The real API + MongoDB Chromium suite passes 9/9 browser tests on source/test candidate `9945f0a2d9bc5111a31b23cde6cf9bbc457bbc9c`, including Doctor edit through protected `PATCH /doctors/:id`, CSRF-header verification, hospital/phone persistence after reload, and duplicate-email recovery. A new keyboard-only real-API journey creates an original Doctor, verifies a mixed-case duplicate returns HTTP 409 / `DOCTOR_EMAIL_EXISTS` without persisting the rejected record, verifies both records through direct API reads, corrects the email using only the keyboard, and confirms the successful retry persists. The journey also asserts that a server-side field error returns focus to the invalid email input so keyboard users can recover without a pointer.

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

## Branch integration audit — verified 2026-10-28

The feature branches have implementation and automated test evidence, but the integration graph is not yet ready to merge:

- Frontend `dev` is **9 commits ahead of `main`**; `main` is behind and has not received the current feature stack.
- `rakibul-hasan` now includes the current `dev` tip as its second parent through ancestry-only merge commit [`743ace4`](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/commit/743ace45411a4399ac56f09fb003503d9b1da463); its source tree remained byte-identical to the prior head. Branch comparison is now **21 commits ahead of and 0 behind `dev`**. Current-head [Frontend CI push #409](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40640102505) and [PR #9 CI #410](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40640107741) both passed.
- PRs #9–#20 are all still **open and draft**. GitHub reports them structurally mergeable; that is not equivalent to approved review, passing current-head checks or manual release acceptance.

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
| Independent application/configuration security review | **NOT STARTED** | Review authorization, CSRF/CORS, cookies, session handling, validation, secrets and redacted logging; document any accepted risk |
| Performance acceptance | **BLOCKED / PARTIAL** | Agreed numeric target plus repeatable synthetic-data p50/p95, error rate, payload and query-plan evidence |
| README submission requirements | **PARTIAL** | Current setup/architecture/decisions must remain accurate; synthetic desktop/mobile screenshots and live deployment links are still not evidenced |
| PR review and branch promotion | **NOT STARTED** | Review parent PRs in dependency order; merge only after required acceptance; rerun CI on resulting dev and main SHAs |

Do not invent staging URLs, credentials, screenshots, performance SLAs or manual test results. Keep unavailable tests as BLOCKED/NOT STARTED, not PASS.

## Next execution order

1. Completed: add and verify the keyboard-only real-API duplicate-email recovery path; source/test SHA `9945f0a2d9bc5111a31b23cde6cf9bbc457bbc9c` passes five workflows and 9/9 real API browser tests.
2. Review the stacked frontend PR dependency chain and the remaining domain edge cases not exhaustively covered; use the latest exact-head workflow results, not older run numbers.
3. Complete human accessibility/device checks and an independent security review.
4. Provision an authorized disposable staging environment, run read-only HTTPS/API preflight, then run the guarded mutating smoke only against that staging environment.
5. Capture approved-target performance measurements and synthetic desktop/mobile screenshots.
6. Promote the validated feature stack to frontend dev, then validate and promote to main. Separately reconcile API dev → API main; confirm post-merge CI against each resulting SHA.

The project is not fully complete until the required SRS items have implementation and acceptance evidence and the release gates above are resolved.
