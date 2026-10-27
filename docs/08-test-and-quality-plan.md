# Test and Quality Plan
Static checks: lint, typecheck, production build, dependency audit.
Unit/component tests: validation, filter states, forms, empty/error states, accessible chart labelling, reduced motion.
Integration: API auth middleware, doctor/patient CRUD, filters/pagination, relationship constraints, aggregate responses and errors.
E2E: sign in → dashboard → create/search doctor → add patient → edit/filter/delete patient → verify dashboard numbers.
Security: missing/expired session, cross-record access, role bypass, XSS rendering, CORS/CSRF where applicable, mass assignment, and sensitive-data leakage.
Performance: documented synthetic dataset, latency measurements and server query plan.
Release smoke: deployed HTTPS, auth/API connectivity and CRUD with synthetic records.
Use disposable test data, never production. Record exact commit SHA, commands, CI URL, pass/fail counts, environment and gaps. If CI is absent report NOT CONFIGURED, not PASS. A plan is not a result; requirement status changes only with evidence.

## Browser E2E harness (Step 10)
A pinned Playwright runner starts a production Next.js server and exercises Chromium journeys using a route-intercepted synthetic API. Coverage includes invalid sign-in, sign-in/dashboard, doctor create, doctor-associated patient list, patient create/edit/filter, detach-versus-delete semantics, CSRF headers, sign-out and empty browser storage. Desktop and mobile screenshots are generated as CI artifacts using synthetic records only.

Status: harness added in draft PR #13; the first CI run is pending. Passing mocked browser journeys validate UI/request wiring only. They do not establish real API, cross-origin cookie, CORS, database-persistence, accessibility-audit, production performance or deployed HTTPS acceptance; those remain open in Issue #6.
