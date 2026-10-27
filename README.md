# Doctor Tracker Frontend

Responsive, animated and accessible administration UI for Doctor Tracker, planned with Next.js App Router and React. The current `app/page.tsx` remains the starter screen; functional UI work has not started.

## Current status
- Frontend engineering documentation is merged to `dev` via [frontend PR #1](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/1).
- Backend API Step 1 foundation is merged and verified: [CI run #13](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40477435393).
- Backend API Step 2 administrator authentication/session foundation is merged and verified: [API PR #11](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/11), [CI run #28](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40479777698) (15/15 HTTP/auth tests, 1/1 MongoDB integration test, lint, typecheck and build passed).
- Frontend feature implementation, API integration, UI tests and deployment remain NOT STARTED.

## Local setup target
Use the package manager declared in `package.json`, copy `.env.example` to `.env.local`, set the local API URL, install dependencies and run the development script when features are implemented.

## Engineering references
- [SRS](docs/01-srs.md)
- [Architecture](docs/02-architecture.md)
- [UI/UX and motion](docs/07-ui-ux-motion.md)
- [Test plan](docs/08-test-and-quality-plan.md)
- [Project Status](docs/PROJECT-STATUS.md)
- [Roadmap](docs/ROADMAP.md)

Any `NEXT_PUBLIC_*` variable is browser-visible and must not contain a secret. Use synthetic data in screenshots. Follow CONTRIBUTING.md and SECURITY.md.
