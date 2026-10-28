# Doctor Tracker Frontend

Responsive administration UI for Doctor Tracker using Next.js App Router and React. Feature delivery is organized as dependency-stacked pull requests; implementation on a draft branch is not the same as a merged or release-accepted feature.

## Current status

- Frontend engineering documentation baseline is merged to frontend `dev` via [PR #1](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/1).
- Backend API foundation, authentication/session, doctor CRUD, patient CRUD/relationship semantics and dashboard aggregation are merged to API `dev`. Production HTTPS-origin and MongoDB TLS guardrails were added through [API PR #19](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/19) and [API PR #20](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/20); the exact API dev CI evidence is [run #40549035764](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40549035764).
- The responsive workspace shell, navigation, preview-only content, focus behavior and reduced-motion support are in [draft PR #9](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/9). The initial shell milestone is still open because human browser/device acceptance has not been recorded.
- The sign-in/session/dashboard UI is implemented in [draft PR #10](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/10), doctor-management UI in [draft PR #11](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/11), and patient-management UI in [draft PR #12](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/12). Their implementation and automated evidence remain in stacked drafts; they are not treated as merged features.
- Synthetic browser E2E, real API + MongoDB browser acceptance, automated accessibility, failure/retry coverage, guarded staging, responsive reflow, CSP/performance and deployment-preflight work are in [draft PRs #13–#24](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pulls). [PR #25](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/25) separately bootstraps the staging workflow entry point on `main`; it is also draft.
- No frontend feature PR is being marked release-ready solely because CI passed. Parent PRs must be reviewed and integrated in dependency order, and real manual/staging acceptance must be recorded.

## Shell acceptance evidence

The dedicated [Shell browser acceptance workflow #40734481302](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734481302) and [Frontend CI #40734481280](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734481280) passed on source/test SHA `90acaacffd3ae7d7b8b2497f0d981bc1ef0d73d6`. The shell suite reported **18 passed and 2 expected skips** (the mobile-only menu test is skipped for desktop/tablet projects). [PR-triggered shell acceptance #40734490848](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734490848) and [PR-triggered Frontend CI #40734490743](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734490743) also passed. The [artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734481302/artifacts/12837305294) contains synthetic screenshots/test output for 1440×1000, 768×1024, 390×844 and 320×800.

Automated scope includes horizontal overflow on dashboard and doctor/patient placeholder views, preview-only metrics, navigation/current-page semantics, heading focus, skip-link behavior, reduced-motion CSS, and mobile navigation focus restoration. The workflow action references were refreshed to versions used by the validated follow-on branch; the prior Node 20 deprecation warning is absent from the current Frontend CI logs. Later documentation-only commits still have their own exact-head checks in the PR.

## Remaining acceptance

Issue #2 and PR #9 remain open/draft until a human records dated evidence for desktop/tablet/mobile browser review, actual 200% zoom, keyboard-only navigation, reduced-motion behavior, screen-reader/assistive-technology testing and physical touch-device review where available. Emulated viewports and automated screenshots do not prove physical-device acceptance.

Live deployed frontend/API URLs and SHAs, browser cookie/CORS/session/CSRF smoke, independent security review, approved performance targets, and promotion to frontend/API `main` are also outstanding release gates.

## Local setup

Use the package manager declared in `package.json`: run `pnpm install --frozen-lockfile` and then `pnpm dev`. Do not place secrets in browser-visible `NEXT_PUBLIC_*` variables. Use synthetic data in test artifacts and screenshots.

## Engineering references

- [SRS](docs/01-srs.md)
- [Architecture](docs/02-architecture.md)
- [UI/UX and motion](docs/07-ui-ux-motion.md)
- [Test plan](docs/08-test-and-quality-plan.md)
- [Project Status](docs/PROJECT-STATUS.md)
- [Roadmap](docs/ROADMAP.md)
- [Traceability and acceptance](docs/11-traceability-and-acceptance.md)

Follow CONTRIBUTING.md and SECURITY.md.
