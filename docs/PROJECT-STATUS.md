# Project Status

**Last reviewed:** 2026-10-28  
**Overall release decision:** **PARTIAL / BLOCKED — not release-ready**

A passing workflow proves only its tested scope and exact commit. It does not prove that a feature PR has been approved, merged, deployed, or accepted through manual release checks.

## Backend — doctor-tracker-api

API foundation, administrator authentication/session, doctor CRUD/search/filter/pagination, patient CRUD and relationship semantics, and dashboard aggregation are merged to API `dev`. The API `dev` head is `efd1fd0f016d98da1fe91bdea52bc48f6295217f`; [API CI #40549035764](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40549035764) passed lint, typecheck, unit/MongoDB integration tests and production build. Production HTTPS-origin and MongoDB TLS hardening are included in API dev through [PR #19](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/19) and [PR #20](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/20). API `main` has not yet received the current dev stack.

## Frontend — doctor-tracker-frontend

- [PR #9](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/9) implements the responsive workspace shell, navigation, preview-only states, visible focus, skip link and reduced-motion behavior. It remains draft because browser/manual acceptance is not complete.
- The latest validated shell source/test candidate is `90acaacffd3ae7d7b8b2497f0d981bc1ef0d73d6`: [Shell acceptance #40734481302](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734481302) passed 18 tests with 2 expected desktop/tablet skips, [Frontend CI #40734481280](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734481280) passed lint/build, and PR-triggered checks [#40734490848](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734490848) / [#40734490743](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734490743) passed. [Synthetic screenshots/test output](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/actions/runs/40734481302/artifacts/12837305294) covers 1440×1000, 768×1024, 390×844 and 320×800. It is automated Chromium evidence only.
- The sign-in/dashboard, doctor and patient screens are implemented in stacked [draft PR #10](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/10), [draft PR #11](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/11) and [draft PR #12](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/12). Synthetic E2E, real API/MongoDB acceptance, accessibility, staging, narrow reflow and security/performance work exists in draft PRs #13–#24. These are not merged features and must be reviewed in dependency order.
- [PR #25](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/25) separately bootstraps the staging-smoke workflow on `main`. It is infrastructure-only, open/draft, and requires review plus trusted staging environment configuration.

## Current blockers

- Manual browser checks for keyboard-only use, visible focus, reduced motion, desktop/tablet/mobile and actual 200% zoom have not been accepted by a human reviewer.
- Physical touch-device and screen-reader acceptance has not been evidenced.
- Independent application/configuration security review remains open.
- No authorized public staging frontend/API URLs, deployed SHAs or successful live HTTPS/session/CSRF/CRUD smoke are recorded.
- Performance is observational only until a numeric target is agreed and approved-environment results are collected.
- Feature PR review and promotion to frontend `dev`, frontend `main`, and API `main` remain incomplete.

## Next execution

1. Collect the remaining manual browser/device acceptance for shell milestone #2 and retain the reviewer/date/environment evidence; leave PR #9 and Issue #2 open until then.
2. Review the PR dependency chain from #9 upward; don't mark a feature PR ready before its parent and acceptance gates are resolved.
3. Provision and verify approved disposable staging, complete live HTTPS/session/CSRF/CRUD smoke, independent security review and agreed-target performance evidence, then promote branches and rerun CI on the resulting SHAs.

Never invent device results, screenshot review, deployment URLs, credentials, performance SLAs or manual approval. Unavailable evidence remains BLOCKED/NOT STARTED, not PASS.
