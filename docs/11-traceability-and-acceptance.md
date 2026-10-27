# Traceability and Acceptance
Statuses: NOT STARTED, IN PROGRESS, PASS, FAIL, PARTIAL, BLOCKED. PASS requires evidence tied to the exact tested commit.
| Requirement / work item | Evidence required | Status |
|---|---|---|
| Documentation baseline | Frontend engineering docs and workflow reviewed/merged | PASS — frontend PR #1 merged to dev |
| API foundation | Server configuration/health/errors/timeouts/security middleware, CI [run #13](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40477435393) | PASS — API PRs #7–#9 merged, 9/9 tests and build |
| AUTH-01..03 UI | Sign-in, protected navigation and expiry/error states | NOT STARTED |
| DOC-01..03 UI | Doctor list/create/search/filter/pagination and associated patients | NOT STARTED |
| PAT-01..02 UI | Patient list/edit/delete/search/filter/pagination | NOT STARTED |
| DASH-01..02 UI | API-backed cards/charts and accessible summaries | NOT STARTED |
| UX-01 / NFR-A11Y-01 | Responsive layouts, keyboard, focus, reduced motion and screenshots | NOT STARTED |
| Frontend quality | Lint/typecheck/component/E2E test evidence | NOT STARTED |
| README requirements | Setup, architecture, two technical decisions, desktop/mobile screenshots | PARTIAL — baseline docs exist; screenshots/decision evidence remain |
| Deployment | Live frontend URL and integrated smoke test | NOT STARTED |
## Evidence record template
Requirement IDs, commit/PR, CI link/commit SHA, commands and pass/fail counts, manual/device evidence, limitations and reviewer/date. Code presence alone is not acceptance evidence.