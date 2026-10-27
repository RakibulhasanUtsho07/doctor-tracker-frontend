# Doctor Tracker Frontend

Responsive administration UI for Doctor Tracker using Next.js App Router and React. The responsive shell and sign-in/dashboard, doctor and patient screens are implemented in stacked draft PRs #9–#12. Step 10 adds a synthetic-API Chromium E2E harness in draft PR #13; live API/browser acceptance and deployment are still open.

## Current status
- Frontend engineering documentation is merged to `dev` via [frontend PR #1](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/1).
- Backend Step 3 Doctor API, Step 4 Patient API and Step 5 Dashboard API are merged to API `dev`; their exact tested CI evidence is recorded in the backend repository.
- Backend API Step 1 foundation is merged and verified: [CI run #13](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40477435393).
- Backend API Step 2 administrator authentication/session foundation is merged and verified: [API PR #11](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/11), [CI run #28](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40479777698) (15/15 HTTP/auth tests, 1/1 MongoDB integration test, lint, typecheck and build passed).
- Responsive shell, dashboard/doctors/patients navigation, focus styles and reduced-motion CSS are implemented in [draft PR #9](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/9). [CI #16](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40496413752) passed lint and production build on code commit `dda345a84530ff224d30ace034af09ec369b717a`.
- Step 7 sign-in/session and live dashboard UI are in stacked [draft PR #10](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/10). [CI #42](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40501396332) passed 5/5 API-client unit tests, lint and production build on code commit `3826645bd8a7f709033b584e3c795f949d706010`. Login uses the API-issued HttpOnly cookie, CSRF stays in memory, and dashboard cards/charts are sourced from `/dashboard/summary`; real API/browser E2E remains pending.
- Doctor management (Issue #4) is in progress in stacked draft [PR #11](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/11): list/detail/create/update, server metadata pagination, prefix search, specialization/hospital filters and inclusive UTC date filters. [CI #78](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40502934194) passed 7/7 API-client tests, lint and production build/TypeScript checks on exact tested code commit `c3808a504c23873b2804895fc77375bc77fa70cc`; real API/browser acceptance remains pending. Doctor deletion is not supported by the current API contract.
- Patient management (Issue #5) is in progress in stacked draft [PR #12](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/12): API-backed patient list/detail/create/update, filters and pagination, relationship-aware add-from-doctor-profile flow, explicit detach-versus-delete confirmations, CSRF-protected mutations, accessible field feedback and responsive layouts. [CI #119](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40504476161) passed 8/8 API-client tests, lint and production build/TypeScript checks on exact tested code commit `c980700e47abecb7f2587e970435bffd4d475c98`; real API/browser acceptance remains pending. The API contract limits records to doctor association, name and optional free-text condition. Deployment remains NOT STARTED.
- Step 10 adds a pinned Playwright Chromium runner and browser journeys in [draft PR #13](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/13). The mocked API is synthetic only; CI and real API/browser verification remain pending until evidence is recorded.
- Manual desktop/tablet/mobile, keyboard-only and reduced-motion checks plus synthetic-only screenshot evidence remain required before Issue #2 can close. PR #9 is intentionally still a draft; green CI alone does not prove the browser/accessibility acceptance criteria.

## Local setup
Use the package manager declared in `package.json`:

```bash
pnpm install --frozen-lockfile
```

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` to the API base path (local default: `http://localhost:4000/api/v1`), then run `pnpm dev`. This variable is browser-visible and must contain only the base URL, never a secret. The API must allow the exact frontend origin and credentialed CORS requests. Browser cookie behaviour still needs verification in the target deployment.

## Commands
- `pnpm test` — API-client unit tests for credentialed requests, CSRF headers, error envelopes, 204 logout and pagination metadata.
- `pnpm lint` — Next.js/React source lint.
- `pnpm build` — production build and TypeScript checks.
- Browser E2E (CI/local): `npm install --prefix .e2e-tools --no-save --package-lock=false @playwright/test@1.64.1`, then `./.e2e-tools/node_modules/.bin/playwright install chromium` and `./.e2e-tools/node_modules/.bin/playwright test --config=e2e/playwright.config.mjs`. The suite stubs the API with synthetic data; it does not replace live API acceptance.

## Engineering references
- [SRS](docs/01-srs.md)
- [Architecture](docs/02-architecture.md)
- [UI/UX and motion](docs/07-ui-ux-motion.md)
- [Test plan](docs/08-test-and-quality-plan.md)
- [Project Status](docs/PROJECT-STATUS.md)
- [Roadmap](docs/ROADMAP.md)
- [Traceability and acceptance](docs/11-traceability-and-acceptance.md)

Any `NEXT_PUBLIC_*` variable is browser-visible and must not contain a secret. Use synthetic data in screenshots. Follow CONTRIBUTING.md and SECURITY.md.
