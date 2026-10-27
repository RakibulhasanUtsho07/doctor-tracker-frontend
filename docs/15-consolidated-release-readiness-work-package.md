# Consolidated Release Readiness Work Package

**Date:** 2026-10-27  
**Repository:** RakibulhasanUtsho07/doctor-tracker-frontend  
**Working branch:** feat/patient-delete-failure-e2e  
**Status:** PLAN RECORDED — implementation/production acceptance not yet complete  
**Evidence baseline:** tested code commit 1ca823240c88d4153678f154a0d91982a3bc99a9; documentation-inclusive head d86426cd8fab69c06b2f026d2546936a4ee0624d. All five workflows passed on both heads. See [CI #319](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40554383550), [real API/MongoDB #131](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40554383486), [synthetic E2E #183](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40554383484), [accessibility #110](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40554383492), and [dependency audit #24](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40554383485).

## Goal

Combine the next related tasks into one release-candidate work package: close known functional acceptance gaps, deploy the exact candidate to a safe staging environment, run preflight and synthetic-data smoke tests, complete human acceptance and capture reproducible evidence before deciding whether the stacked draft PRs are eligible for promotion.

This is a plan, not a release approval. Automated CI is passing within its tested scope, but public deployment URLs/deployed SHAs, manual accessibility/device acceptance, production-like session/security checks and an agreed performance target are not recorded.

## Workstream A — Close functional edge cases before staging

### A1. Doctor choices beyond the first 100 records
- Patient management currently fetches GET /doctors?page=1&limit=100 for its association selector. The UI docs explicitly note that doctors beyond the first 100 are not offered in that selector.
- Implement a contract-aligned approach: a paginated/searchable doctor chooser, or a clearly bounded workflow using the existing doctor-profile Add patient action. Prefer a searchable/paginated chooser if reassignment must work for every doctor.
- Add real API/MongoDB browser coverage with more than 100 synthetic doctors (or a deterministic fixture exercising the actual page boundary). Verify a doctor beyond the first page can be selected, reassignment saves, and the persisted doctorId survives reload.
- Do not fabricate client-side doctors or silently treat a truncated list as complete.

### A2. Optional patient condition semantics
- The current API/UI explicitly says an existing condition cannot be cleared by PATCH; the UI requires a replacement instead of sending an ambiguous blank string.
- Review the SRS/API contract and decide whether clearing an optional condition is required. If required, implement explicit server-side clearing semantics (including normalized-field cleanup) with HTTP/unit, MongoDB integration, validation and browser tests. If not required, retain the documented limitation in the UI and acceptance matrix. Do not silently change the API contract.
- Include reassignment plus condition edit/clear behavior in the same lifecycle journey after the contract decision.

### A3. Pagination/filter regression coverage
- Keep the existing real-backend query-boundary suite for zero/excessive/duplicate page parameters, unsupported query keys, invalid calendar dates and reversed ranges.
- Add deterministic synthetic-data assertions for page ordering, page-size changes, filter-reset-to-page-one behavior and an empty final page where applicable.
- Confirm UI counts match API meta.pagination; treat API data as authoritative after reload.

**Exit gate A:** the contract decision is documented; relevant automated and MongoDB-backed tests pass on one exact candidate SHA; no patient record is misrepresented as deleted, detached or reassigned.

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

## Status board

| Work item | Initial status | Completion evidence |
|---|---|---|
| Existing automated API/query/reassignment checks | PASS (documented scope) | Exact-head workflow runs linked above |
| A1 — Doctor chooser beyond 100 records | NOT STARTED | Search/pagination UI test and persisted reassignment beyond first 100 |
| A2 — Optional-condition contract decision | NOT STARTED | SRS/API decision plus code/tests or explicit documented non-goal |
| A3 — Pagination/filter boundary expansion | PARTIAL | Deterministic browser assertions for ordering, limit changes, reset and empty page |
| B — Candidate/configuration lock | PARTIAL | Full SHAs, secret/config inventory and reviewed stacked-PR order |
| C — Live HTTPS preflight | BLOCKED | Public staging URLs, deployed SHAs and preflight run |
| D — Deployed synthetic smoke | NOT STARTED / BLOCKED on C | Redacted end-to-end evidence: session/CSRF/CRUD/persistence/cleanup |
| E1 — Manual accessibility and physical devices | NOT STARTED | Dated reviewer/device/screen-reader evidence |
| E2 — Independent security sign-off | NOT STARTED | Review record and finding dispositions |
| E3 — Approved performance target and measurements | BLOCKED on target approval | Target approval, repeatable measurements and query evidence |
| F — Release traceability and promotion | NOT STARTED | Complete evidence matrix and parent-review sequence |

## Required deliverables

1. Candidate code and automated-test commits with a green exact-head workflow set.
2. Updated traceability/runbook that keeps code evidence separate from live/manual evidence.
3. Staging deployment record containing source/deployed SHAs and public HTTPS URLs.
4. Redacted preflight, end-to-end smoke, accessibility/device, security and performance evidence.
5. An explicit release decision: PASS only when every required gate is evidence-backed; otherwise record the remaining BLOCKED/PARTIAL items and do not promote.
