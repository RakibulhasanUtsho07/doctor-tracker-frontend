# Doctor Tracker Frontend

Responsive, animated and accessible administration UI for Doctor Tracker, planned with Next.js App Router and React. The current `app/page.tsx` is still the starter page; functional UI work has not started.

## Current status
The engineering documentation baseline has been merged to `dev` via [PR #1](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/1). Backend Step 1 foundation has also passed GitHub Actions and is merged in the API repository: [CI run #13](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40477435393). Frontend functional features remain NOT STARTED.

## Local setup target
Use the package manager declared in `package.json`, copy `.env.example` to `.env.local`, set the local API URL, install dependencies and run the dev script. The feature UI is to be implemented in subsequent steps.

## Engineering references
- [SRS](docs/01-srs.md)
- [Architecture](docs/02-architecture.md)
- [UI/UX and motion](docs/07-ui-ux-motion.md)
- [Test plan](docs/08-test-and-quality-plan.md)
- [Project Status](docs/PROJECT-STATUS.md)
- [Roadmap](docs/ROADMAP.md)

Any `NEXT_PUBLIC_*` variable is browser-visible and must not contain a secret. Use synthetic data in screenshots. Follow CONTRIBUTING.md and SECURITY.md.
