# Delivery Plan and Definition of Done
| Step | Work package | Exit criteria | Status |
|---|---|---|---|
| 0 | Docs/workflow | Baseline docs and branch/PR rules in both repos | PASS — documentation PRs merged to dev |
| 1 | Backend API foundation | Config validation, health, errors, security middleware, timeouts and tests | PASS — API PRs #7–#9 merged; [CI #13 passed](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40477435393) |
| 2 | Backend authentication | Secure login/session, protected routes, admin checks and negative tests | NOT STARTED — [API issue #3](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/issues/3) |
| 3 | Doctor API | Schema/indexes, CRUD/search/filter/pagination tests | NOT STARTED |
| 4 | Patient API | CRUD, relationship/delete policy, filters and tests | NOT STARTED |
| 5 | Dashboard API | Aggregation and reconciliation tests | NOT STARTED |
| 6 | Frontend shell | Responsive layout, navigation, design tokens and accessible motion | NOT STARTED — [frontend issue #2](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/issues/2) |
| 7 | Functional UI | Sign-in, charts and doctor/patient workflows integrated | NOT STARTED |
| 8 | Quality hardening | E2E/security/accessibility/performance evidence | NOT STARTED |
| 9 | Deployment | Live URLs, smoke test, README screenshots and release notes | NOT STARTED |
Done means acceptance criteria and checks pass, security/accessibility are reviewed, docs/traceability are current, evidence is linked and the PR is reviewed. Promote via rakibul-hasan → dev → main only after verification.