# Doctor Tracker Frontend

Responsive administration UI for Doctor Tracker using Next.js App Router and React. The first application shell is implemented in draft PR #9; live feature screens and API-connected data are still in progress.

## Current status
- Frontend engineering documentation is merged to `dev` via [frontend PR #1](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/1).
- Backend Step 3 Doctor API, Step 4 Patient API and Step 5 Dashboard API are merged to API `dev`; their exact tested CI evidence is recorded in the backend repository.
- Backend API Step 1 foundation is merged and verified: [CI run #13](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40477435393).
- Backend API Step 2 administrator authentication/session foundation is merged and verified: [API PR #11](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/11), [CI run #28](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40479777698) (15/15 HTTP/auth tests, 1/1 MongoDB integration test, lint, typecheck and build passed).
- Responsive shell, dashboard/doctors/patients navigation, preview-only module states, focus styles and reduced-motion CSS are implemented in [draft PR #9](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/9); automated CI is pending.
- Sign-in/session integration, live dashboard data, doctor/patient CRUD screens, component/E2E tests and deployment remain NOT STARTED.
- Manual desktop/tablet/mobile, keyboard-only and reduced-motion checks plus screenshot evidence remain required before Issue #2 can close.

## Local setup target
Use the package manager declared in `package.json`: run `pnpm install --frozen-lockfile` then `pnpm dev`. API-origin configuration and credentialed session verification will be documented with the sign-in/API integration milestone.

## Engineering references
- [SRS](docs/01-srs.md)
- [Architecture](docs/02-architecture.md)
- [UI/UX and motion](docs/07-ui-ux-motion.md)
- [Test plan](docs/08-test-and-quality-plan.md)
- [Project Status](docs/PROJECT-STATUS.md)
- [Roadmap](docs/ROADMAP.md)
- [Traceability and acceptance](docs/11-traceability-and-acceptance.md)

Any `NEXT_PUBLIC_*` variable is browser-visible and must not contain a secret. Use synthetic data in screenshots. Follow CONTRIBUTING.md and SECURITY.md.
