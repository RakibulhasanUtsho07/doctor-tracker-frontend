# Changelog

## Unreleased
- Step 7 sign-in/session and API-backed dashboard implementation started in stacked draft [PR #10](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/10): session restore with `/auth/me`, credentialed login, CSRF-protected logout, API error/expiry states, live dashboard totals, UTC trend charts and date-range controls. CI and real API/browser E2E remain pending.
- Frontend Step 6 shell implementation started in [draft PR #9](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/9): replaces the Next.js starter, adds dashboard/doctors/patients workspace navigation, responsive mobile sidebar, visual design tokens, visible focus, skip link and reduced-motion overrides.
- Preview-only UI explicitly labels metrics as not connected and does not claim a live admin session or show patient samples. [CI #16](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40496413752) passed lint and production build on `dda345a84530ff224d30ace034af09ec369b717a`; manual desktop/tablet/mobile, keyboard and screenshot acceptance remains pending.
- Added frontend engineering documentation, UI/motion/accessibility standards, traceability and phased roadmap.
- Frontend documentation baseline merged to dev in PR #1.
- Backend API Step 1 foundation passed CI run #13 and merged to dev via API PRs #7–#9.
- Backend API Step 2 authentication/session foundation passed CI run #28 (15/15 HTTP/auth tests, 1/1 MongoDB integration test, lint, typecheck and build) and merged to API dev via PR #11.
- Frontend feature implementation, API integration and deployment remain planned.
