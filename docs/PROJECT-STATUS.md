# Project Status

**Last reviewed:** 2026-10-28  
**Overall release decision:** **PARTIAL / BLOCKED — not release-ready**

A passing workflow proves only its tested scope and exact commit. It does not prove that a feature PR has been approved, merged, deployed, or accepted through manual release checks.

## Backend — doctor-tracker-api

API foundation, administrator authentication/session, doctor CRUD/search/filter/pagination, patient CRUD and relationship semantics, and dashboard aggregation are merged to API `dev`. The API `dev` head is `efd1fd0f016d98da1fe91bdea52bc48f6295217f`; [API CI #40549035764](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40549035764) passed lint, typecheck, unit/MongoDB integration tests and production build. Production HTTPS-origin and MongoDB TLS hardening are included in API dev through [PR #19](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/19) and [PR #20](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/20). API `main` has not yet received the current dev stack.

## Frontend — doctor-tracker-frontend

- [PR #9](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/9) implements the responsive workspace shell, navigation, preview-only states, visible focus, skip link and reduced-motion behavior. It remains draft because browser/manual acceptance is not complete.
- This change adds a dedicated synthetic Playwright shell-acceptance workflow for desktop, tablet, mobile and 320 CSS-pixel viewports. It checks horizontal overflow, keyboard navigation, active navigation semantics, heading focus, skip-link behavior, preview-only content, reduced motion and mobile focus restoration. **Exact-head workflow results are pending for the commit that adds this suite.**
- The sign-in/dashboard, doctor and patient screens plus synthetic E2E, real API/MongoDB acceptance, accessibility, staging, narrow reflow and security/performance work exist in stacked PRs #10–#24; they remain open/draft and must be reviewed in dependency order, not treated as merged features.
- [PR #25](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/25) separately bootstraps the staging-smoke workflow on `main`. It is infrastructure-only, open/draft, and requires review plus trusted staging environment configuration.

## Current blockers

- Manual browser checks for keyboard-only use, visible focus, reduced motion, desktop/tablet/mobile and real 200% zoom have not been accepted by a human reviewer.
- Physical touch-device and screen-reader acceptance has not been evidenced.
- Independent application/configuration security review remains open.
- No authorized public staging frontend/API URLs, deployed SHAs or successful live HTTPS/session/CSRF/CRUD smoke are recorded.
- Performance is observational only until a numeric target is agreed and approved-environment results are collected.
- Feature PR review and promotion to frontend `dev`, frontend `main`, and API `main` remain incomplete.

## Next execution

1. Finish the new exact-head shell-acceptance CI and inspect all generated synthetic screenshots/reports.
2. Record manual acceptance as NOT STARTED until an actual reviewer, browser/device, date and results are available; leave PR #9/Issue #2 open meanwhile.
3. Review the PR dependency chain from #9 upward, then provision and verify approved disposable staging and complete release gates before promotion.

Never invent device results, screenshot review, deployment URLs, credentials, performance SLAs or manual approval. Unavailable evidence remains BLOCKED/NOT STARTED, not PASS.
