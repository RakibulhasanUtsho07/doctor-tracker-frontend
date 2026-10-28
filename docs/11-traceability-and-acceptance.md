# Traceability and Acceptance

**Snapshot date:** 2026-10-28  
**Latest validated shell candidate:** `fb830d2d21bcd51fbb858fb722a7dd1ea14c0886`. The Frontend CI and dedicated Shell browser acceptance passed on this exact documentation-inclusive head. PASS is limited to automated CI scope and does not imply manual acceptance, approval, merge, deployment or production readiness.  
**Overall release status:** **PARTIAL / BLOCKED**.

Statuses: NOT STARTED, IN PROGRESS, PASS, FAIL, PARTIAL, BLOCKED. A PASS requires evidence tied to the explicit tested scope/environment/commit.

## Requirement traceability matrix

| Requirement / work item | Implementation and exact evidence | Status |
|---|---|---|
| Frontend engineering documentation baseline | Docs/architecture/security/QA baseline merged through [frontend PR #1](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/1). This current feature stack also updates README, status, roadmap and test guidance. | PASS for baseline; final submission/live deployment evidence remains incomplete |
| Backend API foundation and health/readiness | API foundation merged to API `dev`; [API CI #13](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40477435393). | PASS — API dev scope |
| AUTH-01/02/03 — backend auth, session revocation, CSRF and protected routes | [API PR #11](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/11) and [API CI #28](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40479777698); later real API/MongoDB browser acceptance is recorded in stacked frontend PR #14. | PASS for merged API implementation and CI; production-origin cookie/session acceptance remains open |
| AUTH UI / dashboard | Sign-in, session restore/logout, expiry handling and data-backed dashboard UI are implemented in stacked [draft PR #10](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/10). Real API test harness is in [draft PR #14](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/14). | PARTIAL overall — implementation/test evidence exists in draft PRs; not merged or deployed |
| DOC-01..03 — doctor UI | API implementation merged via [API PR #13](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/13); directory/detail/create/edit/search/filter/pagination UI is in [draft frontend PR #11](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/11). | PARTIAL overall — stacked implementation, broader review/release acceptance open |
| PAT-01..02 — patient UI and relationship semantics | API patient CRUD and detach/delete semantics merged via [API PR #15](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/15); UI is in [draft frontend PR #12](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/12), with failure/retry extensions in PRs #17–#18. | PARTIAL overall — stacked implementation and automated scope, not merged/deployed |
| DASH-01..02 — dashboard aggregations | Dashboard API merged via [API PR #17](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/17); UI is in draft PR #10. | PARTIAL overall — API PASS, frontend/release acceptance remains open |
| UX-01 — responsive shell and navigation | Dedicated [Shell browser acceptance push #40734982328](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734982328) passed 18 tests and 2 expected skips; PR run [#40734997222](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734997222) also passed. Tests cover 1440×1000, 768×1024, 390×844 and 320×800, and check horizontal overflow in dashboard/doctor/patient placeholder states. | PASS — automated emulated Chromium scope only; manual responsive/physical-device acceptance remains NOT STARTED |
| NFR-A11Y-01 — keyboard, focus and motion | The same shell suite validates primary navigation state, focus movement to section headings, skip link, reduced-motion CSS, and mobile menu Escape/close-button focus restoration. More axe/form/dialog tests are in stacked PRs #15–#18. | PARTIAL — tested automated scope passes; human keyboard-only/reader/assistive-technology acceptance remains NOT STARTED |
| No fabricated live data / synthetic privacy | Shell asserts preview-only metrics, a clear disconnected-data disclaimer, and empty doctor/patient placeholders without sample records. Synthetic-only screenshots are in [artifact #12835539770](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734982328/artifacts/12835539770). | PASS — automated shell scope only |
| Frontend quality — lint/build and shell browser suite | [Frontend CI #40734982300](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734982300) passed lint and production build/TypeScript; [PR CI #40734997250](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734997250) passed. | PASS — current exact-head lint/build and shell suite; broader stacked E2E and release gates remain open |
| NFR-Security — CSP, dependency audit, API origin and MongoDB transport | API HTTPS-origin/MongoDB TLS guardrails are merged to API dev via [API PRs #19–#20](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pulls/19); frontend CSP/preflight work is in stacked draft PRs #21–#24. | PARTIAL — automated checks exist; independent security review and live deployed-header/session validation NOT STARTED |
| README and technical submission evidence | README/status/roadmap/test plan are current for the branch; shell workflow captures synthetic screenshots at four emulated viewport sizes. | PARTIAL — physical/manual screenshot/device review, final live URLs and accepted technical-decision evidence remain |
| DEPLOY-01 — actual deployment and live integrated smoke | The protected preflight/staging smoke workflow work is in draft PRs #19, #24 and separate bootstrap [PR #25](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/25). Actual deployed URLs/SHAs and successful live smoke are not recorded. | BLOCKED — isolated CI/localhost is not deployment evidence |
| Branch promotion | Frontend PRs #9–#24 are stacked open/draft; PR #25 is a separate open/draft workflow bootstrap. API `dev` is ahead of API `main`. | BLOCKED — dependency-ordered review, manual/staging gates and post-merge CI required |

## Latest shell source/test evidence

Validated commit: `fb830d2d21bcd51fbb858fb722a7dd1ea14c0886`.

- [Frontend CI push #40734982300](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734982300) — PASS.
- [Frontend CI PR #40734997250](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734997250) — PASS.
- [Shell browser acceptance push #40734982328](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734982328) — 18 passed, 2 expected skips.
- [Shell browser acceptance PR #40734997222](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734997222) — PASS.
- [Synthetic screenshot/test artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734982328/artifacts/12835539770).

The current Frontend CI log no longer contains the previous Node 20 deprecation warning after workflow Action pins were updated. This is not independent security sign-off.

## Remaining acceptance gates

| Gate | Status | Evidence needed to close |
|---|---|---|
| Human keyboard-only/navigation review | NOT STARTED | Dated reviewer record on supported browser/OS |
| Human screen-reader/assistive-technology review | NOT STARTED | Reader/browser/device combination, findings and retests |
| Actual 200% browser zoom and physical desktop/tablet/mobile touch review | NOT STARTED | Real browser/device evidence; emulation is insufficient |
| Live HTTPS/CORS/session/CSRF/CRUD smoke | BLOCKED | Approved public frontend/API URLs and deployed SHAs plus disposable synthetic test environment |
| Guarded mutating staging smoke | BLOCKED | Reviewed workflow stack, required environment reviewers/branch restriction, staging-scoped secrets/variables and a synthetic doctor fixture |
| Independent security review | NOT STARTED | Review auth, authorization, CSRF/CORS, cookie topology, nonce CSP, DNS/IP pin policy, validation, logs and secrets |
| Performance acceptance | BLOCKED / PARTIAL | Approved numeric target plus repeatable p50/p95, error rate, payload and query-plan evidence |
| PR review and branch promotion | NOT STARTED | Review parent-first, resolve findings, rerun checks after integration, promote only after required gates |

## Safety and promotion rule

Do not mark the overall project PASS while any required row is BLOCKED, NOT STARTED, FAIL or PARTIAL. Do not close issue #2 from automated emulation alone. Do not claim a deployed test without real deployed URLs and SHAs. Do not merge a child PR before its parent and required acceptance are approved. After promotion, rerun required checks against resulting `dev` and `main` SHAs.

## Evidence record template

Record requirement ID, status, full commit SHA, PR/CI links, test/environment, pass/fail counts, manual/device evidence, known limitations, reviewer and date. Never include credentials, cookies, CSRF tokens or real patient data in screenshots, issues or logs.
