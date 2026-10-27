# Project Status
Last verified: 2026-10-27

## Foundation
- Frontend documentation baseline merged to dev via [PR #1](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/1).
- Backend API foundations and domain Steps 1–5 are merged to the API repository's dev branch with linked API CI evidence.

## Frontend feature status
- Responsive application shell, navigation, visible keyboard focus and reduced-motion CSS are implemented in stacked draft [PR #9](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/9). Human desktop/tablet/mobile, screen-reader and touch acceptance remains open.
- Sign-in/session, dashboard metrics/charts, API-backed doctor management and patient management are implemented in stacked draft PRs [#10](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/10), [#11](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/11) and [#12](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/12). The full feature milestones remain partial until domain-specific edge cases and manual/release gates are reviewed.
- Patient relationship actions intentionally distinguish detaching a patient from a doctor (preserve patient) from deleting the patient record. Doctor delete remains unavailable because the API does not provide that endpoint.

## Latest automated acceptance (2026-10-27)
- Exact tested source/test head: `8d317e9b3ff4f082ca65e2726e75cbc11d7af684` on `feat/step-12-accessibility-e2e`.
- [Frontend CI #227](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40515283721): unit tests, lint and production build/TypeScript checks passed.
- [Synthetic browser E2E #91](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40515284380): 2/2 Chromium journeys passed; [screenshots/report](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40515284380/artifacts/12739401635).
- [Real API + MongoDB browser acceptance #39](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40515283611): backend lint/typecheck/build, 24/24 HTTP/unit tests, 4/4 MongoDB integration tests and 2/2 Chromium real-backend journeys passed; [artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40515283611/artifacts/12738861788).
- [Accessibility browser acceptance #18](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40515283891): 7 passed, 1 expected desktop-only skip. axe WCAG 2.1 A/AA scans passed on sign-in/dashboard/doctors/patients at desktop and mobile sizes; keyboard sign-in, reduced-motion and mobile Escape/focus restoration passed. [axe JSON, screenshots and Playwright report](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40515283891/artifacts/12739597090).
- The accessibility scan exposed low-contrast workspace text and label/ARIA issues; the UI text colours and brand/status semantics were corrected before the passing run.

## Remaining release gates
- Manual assistive-technology and screen-reader walkthroughs, exhaustive keyboard-only forms/dialogs and physical desktop/tablet/mobile touch review.
- Production HTTPS/cookie policy and deployed smoke test, plus performance/security review.
- Stacked PRs #9–#18 remain drafts. CI success is scoped automated evidence; it does not certify production deployment or replace manual acceptance.

## Next
Run and record the remaining manual accessibility/responsive checks, then complete production HTTPS/deployed smoke and review the stacked PRs in dependency order. Do not promote any PR directly to `dev` or `main` while its parent acceptance or required manual release gates remain open.

## Form/dialog accessibility extension — 2026-10-27
- Draft [PR #16](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/16), exact tested code head `4c3c73db59c8d425195c518fd5518fa0f2d58bce): [Frontend CI #247](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40520035122), [synthetic browser E2E #111](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40520034820), [accessibility #38](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40520034573) all passed; [real API/MongoDB #59](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40520034007) passed.
- Accessibility run: 13 passed, 1 expected desktop-only skip; [axe JSON, screenshots and Playwright diagnostics](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40520034573/artifacts/12741611304). Coverage now includes create/edit forms, duplicate-email/API validation error association, keyboard navigation, confirmation Tab/Shift+Tab loop, Escape/Cancel focus return and contrast on newly exposed states.
- Real API run: 24/24 HTTP/unit, 4/4 MongoDB integration and 2/2 real-backend Chromium journeys passed on the same tested head.
- Manual screen-reader/assistive technology, device/touch, production HTTPS/cookie behavior, performance/security and deployed smoke remain open; the release remains PARTIAL and all dependent PRs stay draft.

## Patient-detach failure and focus acceptance — 2026-10-27
- Stacked draft [PR #17](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/17) adds synthetic DELETE behavior and a retryable detach failure to the accessibility suite. Exact tested app/test commit: `51cc8f18e1ae8b74f776641ac18684c47a94f445`.
- [Frontend CI #262](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40523243814) passed; [synthetic browser E2E #126](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40523243720) passed 2/2 journeys.
- [Accessibility #53](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40523243906) passed 14 tests with 1 expected desktop-only skip; [axe/screenshots/Playwright diagnostics](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40523243906/artifacts/12743151344).
- [Real API + MongoDB #74](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40523243822) passed 24/24 HTTP/unit tests, 4/4 MongoDB integration tests and 2/2 real-backend Chromium journeys; [artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40523243822/artifacts/12740709905).
- The new synthetic test verifies Escape/Cancel focus restoration, retry after a 503 action failure, the alert message, patient preservation with an Unassigned association, and directory-heading focus after success. These are scoped automated checks only. Manual assistive-technology/device, production HTTPS/cookie, security/performance and deployed-smoke gates remain open; the release remains PARTIAL.

## Patient-delete failure and retry acceptance — 2026-10-27
- Stacked draft [PR #18](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/18) verifies the permanent-delete failure/retry path using synthetic test data. Exact tested application/test commit: `35221c8cbd5659d85e7dd6ab2b5c6e72547ed5ea`.
- [Frontend CI #273](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40524941881) passed; [synthetic browser E2E #137](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40524941805) passed 2/2 journeys.
- [Accessibility #64](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40524941652) passed 17 tests with 1 expected desktop-only skip; [reports/screenshots/Playwright diagnostics](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40524941652/artifacts/12744490643).
- [Real API + MongoDB #85](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40524948333) passed 24/24 HTTP/unit tests, 4/4 MongoDB integration tests and 2/2 real-backend Chromium journeys; [artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40524948333/artifacts/12742793169).
- The synthetic test checks the error alert and retained row after failure, retry by keyboard, successful deletion/removal and safe directory-heading focus. The release remains PARTIAL pending manual screen-reader/device, production HTTPS/cookie, security/performance and deployed-smoke gates.


## Manual release readiness — 2026-10-27
- A reproducible checklist is available in [docs/14-manual-release-acceptance.md](14-manual-release-acceptance.md). It defines exact fields to capture, browser/assistive-technology steps, responsive viewports, HTTPS/session checks, security/performance evidence and deployed smoke using synthetic records only.
- This is process documentation only. No human screen-reader/device session, production HTTPS/cookie verification, security/performance sign-off or deployed smoke was executed by adding the runbook. Those gates remain open; overall release remains PARTIAL.


## Frontend dependency audit — 2026-10-27
- Added `.github/workflows/security-audit.yml`: frozen pnpm lockfile installation without lifecycle scripts, then `pnpm audit --audit-level=high --json`; report uploaded even when the check fails.
- [Security audit #2](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40537906377) passed on exact commit `3767f9be37f23fe1ba0cb0f4aff6c3e78547c8e8` and reported no high/critical dependency audit findings; [raw JSON artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40537906377/artifacts/12749446556).
- Scope: published package advisories for the frozen frontend lockfile only. This does not mean zero moderate/low findings, does not audit the backend lockfile, and does not replace source/secret/config review or production security testing. Overall release security remains PARTIAL.


## GitHub Actions runtime compatibility — 2026-10-27
Updated workflow actions to current Node 24-compatible releases in commit `245ae10c15eab2021bf99e101e0f8cf42d58cf48`: checkout v7.0.1, setup-node v7.1.0, upload-artifact v7.0.2, cache v6.1.0 and pnpm/action-setup v6.1.0. All five workflows passed on that exact commit: [Frontend CI #301](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40538649522), [synthetic E2E #165](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40538649116), [accessibility #92](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40538649809) ([artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40538649809/artifacts/12748928310)), [real API/MongoDB #113](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40538649524) ([artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40538649524/artifacts/12749197908)), and [dependency audit #6](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40538649663). The checked CI/audit logs no longer show the previous Node 20 deprecation/forced-Node-24 warning. At this earlier commit, the separate pnpm v10/v11 home-layout warning remained; its later fix and exact-head validation are recorded in the follow-up section below.

## pnpm v11 home-layout warning follow-up — 2026-10-27

Replaced `pnpm/action-setup@v6.1.0` with the official standalone `pnpm/setup@v3.1.2` in all five workflows. The step sets `install: false` so each workflow keeps its existing explicit frozen-lockfile install (including the audit job's `--ignore-scripts`); Node.js 22 and the existing `actions/setup-node` pnpm-store cache remain in place.

On exact workflow commit `d109b8e56bf79d83e111fdee3885d0cee348dadc`, all five PR-triggered workflows passed:
- [Frontend CI #305](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40540876752) — 8/8 API-client unit tests; lint and production build succeeded.
- [Synthetic browser E2E #169](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40540876592) — 2/2 journeys passed; [report artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40540876592/artifacts/12750412771).
- [Accessibility browser acceptance #96](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40540877098) — 17 passed, 1 expected desktop-only skip; [reports/screenshots](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40540877098/artifacts/12750747021).
- [Real API + MongoDB #117](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40540876679) — 24/24 HTTP/unit tests, 4/4 MongoDB integration tests, and 2/2 real-backend browser journeys passed; [artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40540876679/artifacts/12749539660).
- [Frontend dependency security audit #10](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40540876664) — passed with no high/critical published package advisories; [raw JSON report](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40540876664/artifacts/12750417155).

All five job logs were inspected; the old pnpm v10/v11 `PNPM_HOME` layout warning no longer appears. Parallel workflow jobs can still emit non-fatal cache-reservation warnings when they contend for the same cache key; they did not fail a job and are separate from the resolved home-layout warning. This change does not close manual screen-reader/device, deployed HTTPS/session, broader security, performance-target or deployed-smoke gates; keep the stacked PRs draft and do not promote to `dev`/`main`.

## Deployment preflight automation — 2026-10-27

Added `.github/workflows/deployment-preflight.yml` and `scripts/deployment-preflight.mjs` to check a public HTTPS frontend/API pair with GET/OPTIONS only. The probe validates the frontend HTML response, API liveness/readiness, CORS allow-origin exact match, credentialed CORS, POST allowance and `Content-Type`/`X-CSRF-Token` headers. URL parsing rejects HTTP, local/IP-literal hosts, embedded credentials, query strings/fragments and API paths not ending in `/api/v1`. Unit tests include expected success and negative CORS/readiness scenarios.

On exact candidate commit `b17bad713cccf231a6cb182a5ef46d8f9b472b20`, all five PR-triggered automated workflows passed:
- [Frontend CI #309](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647234) — 13/13 unit tests (8 API-client + 5 preflight), lint and production build passed.
- [Synthetic browser E2E #173](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647608) — 2/2 journeys passed; [report artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647608/artifacts/12751189274).
- [Accessibility browser acceptance #100](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647762) — 17 passed, 1 expected desktop-only skip; [reports/screenshots](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647762/artifacts/12751254193).
- [Real API + MongoDB #121](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647462) — 24/24 HTTP/unit tests, 4/4 MongoDB integration tests and 2/2 real-backend Chromium journeys passed; [artifact](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647462/artifacts/12751239224).
- [Frontend dependency security audit #14](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647453) — passed with no high/critical published package advisories; [raw JSON report](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40543647453/artifacts/12752400971).

All five exact-head job logs were reviewed; the old PNPM_HOME migration warning is absent. This PASS is limited to the preflight code/unit tests and normal regression suite. No live public frontend/API URLs or deployed SHAs are available, so the real endpoint probe and overall deployment smoke remain BLOCKED/NOT STARTED.

This evidence validates code and mocked responses only. No real public frontend/API URLs or deployed SHAs are recorded, so the live endpoint preflight is BLOCKED and deployment remains NOT STARTED. Even a successful endpoint preflight would not close browser cookie/session, CSRF rejection, CRUD persistence, manual accessibility/device, broader security or performance gates.
