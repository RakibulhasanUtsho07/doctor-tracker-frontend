# Traceability and Acceptance
Statuses: NOT STARTED, IN PROGRESS, PASS, FAIL, PARTIAL, BLOCKED. PASS requires evidence tied to the exact tested commit.
| Requirement / work item | Evidence required | Status |
|---|---|---|
| Documentation baseline | Frontend engineering docs and workflow reviewed/merged | PASS — frontend PR #1 merged to dev |
| Backend API foundation | Server config/health/errors/timeouts/security middleware; [CI #13](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40477435393) | PASS — API PRs #7–#9 merged; 9/9 tests/build |
| Backend AUTH-01 | Login, generic failures, session expiry/revocation, CSRF, throttling; [CI #28](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40479777698) | PASS — API PR #11 merged; 15/15 HTTP/auth tests and 1/1 MongoDB integration test |
| Frontend AUTH UI | Sign-in form, session state, logout and expired-session UX | NOT STARTED |
| DOC-01..03 UI | Doctor list/create/search/filter/pagination and associated patients | NOT STARTED |
| PAT-01..02 UI | Patient list/edit/delete/search/filter/pagination | NOT STARTED |
| DASH-01..02 UI | API-backed cards/charts and accessible summaries | NOT STARTED |
| UX-01 / NFR-A11Y-01 | Responsive layouts, keyboard/focus, reduced motion and screenshots | PARTIAL — shell and responsive CSS implemented in draft [PR #9](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/9); automated CI and actual desktop/tablet/mobile, keyboard-only, reduced-motion and screenshot evidence are still pending |
| Frontend quality | Lint/typecheck/component/E2E evidence | PARTIAL — PR #9 adds lint and production-build CI; first run is in progress. Dedicated component/E2E coverage is not yet implemented |
| README requirements | Setup, architecture, two technical decisions, desktop/mobile screenshots | PARTIAL — baseline docs exist; screenshots and UI decision evidence remain |
| Deployment | Live frontend URL and integrated smoke test | NOT STARTED |
## Evidence record template
Requirement IDs, commit/PR, CI link/commit SHA, commands and pass/fail counts, manual/device evidence, limitations and reviewer/date. Code presence alone is not acceptance evidence.
