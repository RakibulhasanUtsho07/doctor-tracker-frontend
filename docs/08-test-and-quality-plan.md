# Test and Quality Plan

## Required automated checks
- Static quality: source lint, TypeScript/production build, dependency audit and configuration guards.
- Unit/component tests: validation, filters, forms, empty/error states, accessible chart labelling and reduced motion.
- API integration: authentication/session middleware, doctor/patient CRUD, filters/pagination, relationship constraints, aggregate responses and error handling.
- Synthetic browser E2E: sign-in → dashboard → doctor/patient workflows, with deterministic in-memory API responses and no production records.
- Real API browser acceptance: isolated API + MongoDB and Chromium, including session/CSRF behavior and database persistence.
- Shell browser acceptance: dedicated Playwright workflow tests responsive overflow at 1440×1000, 768×1024, 390×844 and 320×800, plus horizontal overflow in doctor/patient placeholder states, navigation/current-page semantics, heading focus, skip-link, preview-only content, reduced-motion behavior and mobile menu focus return. It attaches synthetic-only viewport screenshots and Playwright diagnostics. The validated source/test candidate `90acaacffd3ae7d7b8b2497f0d981bc1ef0d73d6` passed [Shell acceptance #40734481302](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734481302) with 18 passed and 2 expected skips, and [Frontend CI #40734481280](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734481280) passed lint/build.
- Security: missing/expired session, cross-record access, role bypass, XSS rendering, CORS/CSRF where applicable, mass assignment, preflight target validation and sensitive-data leakage.
- Performance: documented synthetic dataset, repeatable latency measurements and server query plans.
- Release smoke: deployed HTTPS, auth/API connectivity and CRUD with synthetic records.

## Evidence rules
Use disposable test data, never production. Record exact commit SHA, workflow URL, pass/fail counts, browser/OS/device, environment, and remaining gaps. If CI is absent report NOT CONFIGURED, not PASS. A plan is not a result; requirement status changes only with evidence. Browser emulation does not count as physical-device acceptance, and automated axe/keyboard assertions do not replace a human screen-reader review. Later documentation-only commits must be verified on their own exact SHA.
