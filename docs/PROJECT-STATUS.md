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
- Stacked PRs #9–#15 remain drafts. CI success is scoped automated evidence; it does not certify production deployment or replace manual acceptance.

## Next
Run and record the remaining manual accessibility/responsive checks, then complete production HTTPS/deployed smoke and review the stacked PRs in dependency order. Do not promote any PR directly to `dev` or `main` while its parent acceptance or required manual release gates remain open.

## Form/dialog accessibility extension — 2026-10-27
- Draft [PR #16](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/16), exact tested code head `4c3c73db59c8d425195c518fd5518fa0f2d58bce): [Frontend CI #247](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40520035122), [synthetic browser E2E #111](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40520034820), [accessibility #38](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40520034573) all passed; [real API/MongoDB #59](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40520034007) passed.
- Accessibility run: 13 passed, 1 expected desktop-only skip; [axe JSON, screenshots and Playwright diagnostics](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40520034573/artifacts/12741611304). Coverage now includes create/edit forms, duplicate-email/API validation error association, keyboard navigation, confirmation Tab/Shift+Tab loop, Escape/Cancel focus return and contrast on newly exposed states.
- Real API run: 24/24 HTTP/unit, 4/4 MongoDB integration and 2/2 real-backend Chromium journeys passed on the same tested head.
- Manual screen-reader/assistive technology, device/touch, production HTTPS/cookie behavior, performance/security and deployed smoke remain open; the release remains PARTIAL and all dependent PRs stay draft.
