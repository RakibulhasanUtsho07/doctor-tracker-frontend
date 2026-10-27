# Doctor Tracker Frontend

Responsive administration UI for Doctor Tracker using Next.js App Router and React. The first application shell is implemented in draft PR #9; live feature screens and API-connected data are still in progress.

## Current status
- Frontend engineering documentation is merged to `dev` via [frontend PR #1](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/1).
- Backend Step 3 Doctor API, Step 4 Patient API and Step 5 Dashboard API are merged to API `dev`; their exact tested CI evidence is recorded in the backend repository.
- Backend API Step 1 foundation is merged and verified: [CI run #13](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40477435393).
- Backend API Step 2 administrator authentication/session foundation is merged and verified: [API PR #11](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/11), [CI run #28](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40479777698) (15/15 HTTP/auth tests, 1/1 MongoDB integration test, lint, typecheck and build passed).
- Responsive shell, dashboard/doctors/patients navigation, focus styles and reduced-motion CSS are implemented in [draft PR #9](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/9). [CI #16](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40496413752) passed lint and production build on code commit `dda345a84530ff224d30ace034af09ec369b717a`.
- Step 7 sign-in/session and live dashboard UI are in stacked [draft PR #10](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/10); CI is pending. Login uses the API-issued HttpOnly cookie, CSRF stays in memory, and dashboard cards/charts are sourced from `/dashboard/summary`.
- Sign-in/session integration, live dashboard data, doctor/patient CRUD screens, component/E2E tests and deployment remain NOT STARTED.
- Manual desktop/tablet/mobile, keyboard-only and reduced-motion checks plus synthetic-only screenshot evidence remain required before Issue #2 can close. PR #9 is intentionally still a draft; green CI alone does not prove the browser/accessibility acceptance criteria.

## Local setup
Use the package manager declared in `package.json`:

```bash
pnpm install --frozen-lockfile
```

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` to the API base path (local default: `http://localhost:4000/api/v1`), then run `pnpm dev`. This variable is browser-visible and must contain only the base URL, never a secret. The API must allow the exact frontend origin and credentialed CORS requests. Browser cookie behaviour still needs verification in the target deployment.

## Commands
- `pnpm test` — API client unit tests (credentialed requests, CSRF header, error envelopes and 204 logout).
- `pnpm lint` — Next.js/React source lint.
- `pnpm build` — production build and TypeScript checks.

## Engineering references
- [SRS](docs/01-srs.md)
- [Architecture](docs/02-architecture.md)
- [UI/UX and motion](docs/07-ui-ux-motion.md)
- [Test plan](docs/08-test-and-quality-plan.md)
- [Project Status](docs/PROJECT-STATUS.md)
- [Roadmap](docs/ROADMAP.md)
- [Traceability and acceptance](docs/11-traceability-and-acceptance.md)

Any `NEXT_PUBLIC_*` variable is browser-visible and must not contain a secret. Use synthetic data in screenshots. Follow CONTRIBUTING.md and SECURITY.md.
