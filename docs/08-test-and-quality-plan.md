# Test and Quality Plan
Static checks: lint, typecheck, production build, dependency audit.
Unit/component tests: validation, filter states, forms, empty/error states, accessible chart labelling, reduced motion.
Integration: API auth middleware, doctor/patient CRUD, filters/pagination, relationship constraints, aggregate responses and errors.
E2E: sign in → dashboard → create/search doctor → add patient → edit/filter/delete patient → verify dashboard numbers.
Security: missing/expired session, cross-record access, role bypass, XSS rendering, CORS/CSRF where applicable, mass assignment, and sensitive-data leakage.
Performance: documented synthetic dataset, latency measurements and server query plan.
Release smoke: deployed HTTPS, auth/API connectivity and CRUD with synthetic records.
Use disposable test data, never production. Record exact commit SHA, commands, CI URL, pass/fail counts, environment and gaps. If CI is absent report NOT CONFIGURED, not PASS. A plan is not a result; requirement status changes only with evidence.
