# Consolidated Release Readiness Work Package

**Date:** 2026-10-27  
**Repository:** RakibulhasanUtsho07/doctor-tracker-frontend  
**Working branch:** feat/patient-delete-failure-e2e  
**Status:** FUNCTIONAL A1–A3, RESPONSIVE G1 AND AUTOMATED SESSION-EXPIRY G2 IMPLEMENTED/VERIFIED; OVERALL RELEASE BLOCKED ON LIVE/MANUAL GATES  
**Latest session-expiry code/test SHA:** `b93921b806e9a9a506fc7873034bb76025442133`  
**Pinned API SHA:** `efd1fd0f016d98da1fe91bdea52bc48f6295217f`  
**Exact code-head evidence:** [Frontend CI](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40557135613), [real API + MongoDB](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40557135446), [synthetic browser E2E](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40557135915), [accessibility](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40557135438), and [dependency audit](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40557135471) all passed on that exact SHA. The documentation-inclusive commit `ee6a198fad1ba355a7bc2f0bc836c205e7ae7cf4` was also independently revalidated: [Frontend CI](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40557813963), [real API + MongoDB](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40557813684), [synthetic browser E2E](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40557813858), [accessibility](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40557804839), and [dependency audit](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40557813681) passed on that exact docs-inclusive SHA. Any later documentation-only commit must also be verified at its exact SHA. Live staging/manual release acceptance is not implied by these CI runs.

## Goal

Combine the next related tasks into one release-candidate work package: close known functional acceptance gaps, deploy the exact candidate to a safe staging environment, run preflight and synthetic-data smoke tests, complete human acceptance and capture reproducible evidence before deciding whether the stacked draft PRs are eligible for promotion.

This is a plan, not a release approval. Automated CI is passing within its tested scope, but public deployment URLs/deployed SHAs, manual accessibility/device acceptance, production-like session/security checks and an agreed performance target are not recorded.

## Workstream A — Close functional edge cases before staging

### A1. Doctor choices beyond the first 100 records — IMPLEMENTED / PASS WITHIN AUTOMATED SCOPE
- Patient association selectors still load the first 100 doctors for a bounded initial render, but the patient page now provides a debounced server-side prefix-search field that calls the existing GET /doctors search contract. Matching doctors are merged into both the create/edit selector and the doctor filter selector; the UI does not pretend the first page is the full directory.
- The exact-head real API/MongoDB journey creates 105 synthetic doctors, proves the selected target is outside page 1 but present on page 2, searches for that target through the UI, reassigns a patient to it, reloads, and confirms the persisted patient `doctorId` through the API.
- Test fixture order is deterministic: the target is created before 104 newer doctors, so this boundary assertion does not depend on request scheduling.

### A2. Optional patient condition semantics — CONTRACT REVIEWED / DECISION RECORDED
- API SRS and API contract define `condition` as optional bounded free text; they do not require clearing an existing condition via PATCH. The API patch schema requires a supplied condition string to contain at least one character; omission means no change.
- Therefore no API contract or database behavior was changed. The UI continues to explain the limitation and rejects saving an empty condition when an existing condition is present. The real API browser journey now asserts that the validation appears, then enters a replacement condition and verifies that save works.
- This is a contract-aligned decision, not a claim that the API supports condition clearing. If product requirements later require clearing, revise the SRS/OpenAPI/API implementation together before changing the UI behavior.

### A3. Pagination/filter regression coverage — IMPLEMENTED / PASS WITHIN AUTOMATED SCOPE
- Retained invalid query checks for zero/excessive/duplicate page parameters, unsupported query keys, invalid calendar dates and reversed ranges.
- Real API/MongoDB browser acceptance now verifies the empty-result metadata contract (`page=2`, `limit=10`, `total=0`, `totalPages=0`, zero rows), deterministic 11-patient ordering across page sizes 10 and 50, the oldest record on page 2 with limit 10, and filter application from page 2 resetting to page 1.
- Reassignment is verified after reload against the API's persisted `doctorId`; the API remains authoritative for counts and pagination metadata.

**Exit gate A: PASS for the specified functional scope** — the condition contract decision is documented and tested; doctor search beyond the first 100 and pagination/filter scenarios pass real-backend automated acceptance. This does not close any live-deployment or human-review gate.

## Workstream B — Lock the release candidate and configuration

- Record the full frontend candidate SHA and exact API SHA. The current real API workflow pins API commit efd1fd0f016d98da1fe91bdea52bc48f6295217f, including production HTTPS-origin and MongoDB TLS hardening.
- Before deployment, verify the public HTTPS frontend origin and a TLS-enabled production MongoDB URI. Keep local HTTP fixtures restricted to test/development.
- Confirm secrets and credentials are configured through the deployment secret manager, never committed into repository files, test artifacts or comments.
- Review the candidate branch and stacked PR parents (#16–#18 and prerequisite feature/E2E PRs). A green top-of-stack run alone does not approve or merge its parent PRs.

**Exit gate B:** immutable source SHAs and configuration inventory are recorded; review order is clear; normal automated workflows pass on the candidate. Do not change main during this work package.

## Workstream C — Provision staging and run read-only preflight

**Current status: BLOCKED** — no public frontend/API deployment URLs or deployed SHAs are recorded.

Once an approved staging environment exists:
1. Deploy the selected frontend/API SHAs with synthetic-only test data.
2. Record exact HTTPS frontend URL, API base URL ending in /api/v1, both deployed SHAs and environment.
3. Run the manually dispatched [deployment preflight workflow](../.github/workflows/deployment-preflight.yml). Its GET/OPTIONS-only probe checks frontend response, API liveness/readiness and credentialed CORS for the exact frontend origin. It must not receive credentials or mutate records.
4. Save the workflow run link and redacted output. If a URL is absent, certificate is invalid, readiness fails or CORS is wrong, record BLOCKED/FAIL and resolve it before continuing.

**Exit gate C:** successful real-endpoint preflight is tied to actual staging URLs and deployed SHAs. CI localhost results do not satisfy this gate.

## Workstream D — Deployed synthetic-data end-to-end smoke

Use the [manual release runbook](./14-manual-release-acceptance.md) and only an approved synthetic administrator plus synthetic doctor/patient records.

- Sign in and verify dashboard totals; inspect cookie attributes without copying cookie values.
- Confirm credentialed CORS works for the exact frontend origin; a safe missing-CSRF write is rejected without persisting a record.
- Create a doctor and patient; search/filter/paginate; edit/reassign the patient; reload and verify the stored association through UI/API.
- Detach one record and prove the patient remains stored but unassigned. Delete a separate record and prove it is absent after reload. Verify dashboard totals reconcile.
- Sign out and verify the old session cannot access protected endpoints.
- Clean up synthetic records and verify cleanup. Redact screenshots/logs; never use real patient data.

**Exit gate D:** every smoke step has exact URL, deployed SHAs, timestamp, result and redacted evidence. Localhost CI E2E is not deployed acceptance.

## Workstream E — Human accessibility, device, security and performance

### E1. Accessibility and responsive/device review
- Run the manual runbook on desktop with keyboard-only navigation and a screen reader. Verify labels/errors, dialog focus loop, Escape/Cancel focus restoration, deletion-failure announcements, stable focus after mutations and understandable pagination counts.
- Check desktop, tablet, 390px mobile and 320px narrow layouts, 200% zoom, reduced motion and touch controls.
- Record real-device vs emulated-device status. Missing hardware/screen-reader access must be BLOCKED/NOT TESTED, not PASS.

### E2. Security review
- Review authorization and CSRF on mutations, CORS origin boundaries, cookie attributes, session revocation, server-side validation, error messages, logs and secret handling.
- Record high/critical findings and disposition. Dependency audit success alone is not independent security sign-off.
- Use staging for negative or fault-injection tests; no destructive or load tests on production without explicit authorization.

### E3. Performance measurements
- The SRS does not define numeric latency/throughput targets. Agree on the target before recording a performance PASS.
- Use a documented synthetic dataset and environment. Measure doctor/patient search, filters, pagination and dashboard aggregation with warm-up and repeated requests; report sample count, p50/p95, errors/timeouts, payload size and relevant query plans.
- If no target is formally agreed, mark performance PARTIAL even when measurements look good.

**Exit gate E:** dated reviewer evidence exists for each human gate; findings are fixed and retested or assigned an accepted risk owner. Unavailable tests are not assumed to pass.

## Workstream F — Traceability and promotion decision

Update [traceability and acceptance](./11-traceability-and-acceptance.md) with exact candidate/deployed SHAs, workflow links, test counts, preflight results, synthetic smoke evidence, manual reviewer, environment, defects and retest SHA.

Promotion rules:
- Keep the PR stack in draft while parent reviews or required manual/deployed gates remain open.
- Do not merge the top stacked PR independently of its parent; promote in dependency order only after each parent is reviewed and its exact head is green.
- Do not merge to main until all release requirements have valid evidence. No live URL, deployed SHA, reviewer evidence or approved performance target means the corresponding gate stays BLOCKED, NOT STARTED or PARTIAL.
- If any exact-head workflow fails, fix the cause and rerun required workflows on the resulting exact candidate SHA before promotion.

## Workstream G — Responsive layout and reflow regression closure

**Status: PASS within automated scope** on exact tested frontend code/test SHA `88aea3d72a6516959b11361d83b23ef9da633501`.

- Added a single repeatable Playwright sweep for 320px narrow phone, 390px phone, 720px reflow-equivalent, 768px tablet and 1440px desktop widths.
- Verifies no root document/body horizontal overflow on sign-in, dashboard, doctor directory/create form, patient directory/create form and the delete confirmation dialog; checks primary create actions and dialog bounds; attaches 320px and 768px synthetic patient UI screenshots.
- Fixed a real defect discovered by the new test: the doctor-table Actions column's visually-hidden absolute-positioned text extended root document width to 739px at a 320px viewport. Replaced it with an accessible header `aria-label`, preserving screen-reader semantics without introducing overflow.
- The test's navigation state was corrected to revisit the dashboard each iteration. The exact source/test SHA passed [CI #40624554113](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40624554113), [synthetic E2E #40624554063](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40624554063), [accessibility #40624554139](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40624554139), [real API/MongoDB #40624554157](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40624554157), and [dependency audit #40624554024](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40624554024).

The 720px CSS viewport is an automated reflow-equivalent to 200% zoom from 1440 CSS pixels, not a real browser zoom action. Actual 200% zoom, manual screen reader, physical touch/device acceptance and live deployment verification remain open human/environment gates.

## Workstream G2 — Session deadline and server-side revocation UI teardown

**Status: PASS within automated scope.** The client now observes the API-issued `expiresAt`, schedules a deadline check, rechecks upon returning to a visible tab, clears the in-memory auth/session and dashboard state, unmounts protected records views, and announces that re-authentication is required. The backend still authoritatively rejects expired/revoked sessions.

- Synthetic browser test: 5-second session TTL; no further API request is sent; protected patient row and authenticated badge disappear at the deadline and browser storage remains empty. [Synthetic E2E #40625551681](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40625551681).
- Real API test: CSRF-protected server-side logout is initiated out-of-band, then the still-visible patient directory refresh receives 401; sign-in and expiry notice return, protected content is absent, browser storage is empty. [Real API + MongoDB #40625887617](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40625887617). Latest test-ordering commit: `b93921b806e9a9a506fc7873034bb76025442133`.

The first run demonstrated that the new fixture must not alter count-sensitive tests. The revocation scenario is now the final serial real-API journey and the complete run passes 6/6 journeys. This PASS is not deployment acceptance: production cookie/session behavior and external/manual release gates remain open.

## Current status board

| Work item | Current status | Completion evidence / remaining blocker |
|---|---|---|
| Existing API/query/reassignment checks | PASS within tested scope | Exact code-head evidence linked at top |
| A1 — Doctor chooser beyond 100 records | PASS — automated scope | Real API/MongoDB browser journey seeds 105 doctors, finds target beyond page 1, reassigns and verifies persisted association after reload |
| A2 — Optional-condition contract decision | PASS — decision and UI behavior | SRS/API contract does not require clearing through PATCH; empty value is rejected by the UI and tested; API contract unchanged |
| A3 — Pagination/filter edge coverage | PASS — automated scope | Empty-page metadata, 10/50 row limits, ordered page 2, filter reset to page 1 and persisted reassignment tested |
| G1 — Responsive layout/reflow coverage | PASS — automated scope | 320/390/720/768/1440 CSS-pixel sweep, overflow checks across auth/dashboard/doctor/patient forms and delete dialog; corrected off-screen table header overflow; exact-head five-workflow evidence linked above |
| G2 — Session deadline/revocation UI teardown | PASS — automated scope | Short-TTL synthetic session expires without a triggering request; real API session revoked out-of-band then next protected 401 clears patient workspace, dashboard/session badge and keeps local/session storage empty; evidence in AUTH-02/NFR Security trace section |
| B — Candidate/configuration lock | PARTIAL | Full frontend code/test SHA and pinned API SHA recorded; deployment environment/configuration inventory and stacked-parent review still require owners/evidence |
| C — Live HTTPS preflight | BLOCKED | No approved public staging frontend/API URLs or deployed SHAs are recorded |
| D — Deployed synthetic smoke | BLOCKED on C | CI-only browser journey passes, but it is not deployed-endpoint acceptance |
| E1 — Manual accessibility and physical devices | PARTIAL / NOT STARTED | Automated suite passes; manual screen reader, keyboard sweep, touch and real-device evidence absent |
| E2 — Independent security sign-off | PARTIAL / NOT STARTED | Locked frontend dependency audit passes with no high/critical advisories; independent app/config/security review is not recorded |
| E3 — Approved performance target and measurements | BLOCKED on target approval | SRS gives no numeric latency/throughput target; target must be agreed before a performance PASS |
| F — Traceability and promotion | PARTIAL / BLOCKED | Functional evidence documented; live/manual gates and parent PR review remain open |

## Release decision

**Functional workstreams A1–A3, responsive G1 and session-expiry G2: PASS within the exact automated scope above. Overall release acceptance: BLOCKED.** No public deployment URL/deployed SHA, dated manual accessibility/device review, independent security sign-off or approved performance target is available in the repository evidence. Do not merge or promote this stacked draft PR to `dev` or `main` until those gates and parent reviews are completed.

## Required deliverables

1. Candidate code and automated-test commits with a green exact-head workflow set.
2. Updated traceability/runbook that keeps code evidence separate from live/manual evidence.
3. Staging deployment record containing source/deployed SHAs and public HTTPS URLs.
4. Redacted preflight, end-to-end smoke, accessibility/device, security and performance evidence.
5. An explicit release decision: PASS only when every required gate is evidence-backed; otherwise record the remaining BLOCKED/PARTIAL items and do not promote.
