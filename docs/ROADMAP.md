# Roadmap

## Backend milestones

1. [x] API documentation and engineering baseline — merged to API `dev` via [PR #1](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/1).
2. [x] API foundation, configuration, health/readiness and middleware — [API PRs #7–#9](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pulls); CI passed.
3. [x] Administrator authentication and session lifecycle — [API PR #11](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/11); CI passed.
4. [x] Doctor schema, CRUD, search/filter/pagination — [API PR #13](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/13); CI passed.
5. [x] Patient CRUD, filters, doctor association and detach/delete semantics — [API PR #15](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/15); CI passed.
6. [x] Dashboard aggregation — [API PR #17](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/17); CI passed.
7. [x] Production HTTPS frontend-origin and MongoDB TLS guardrails — [API PR #19](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/19) and [PR #20](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pull/20); API dev CI passed.
8. [ ] Promote API `dev` to `main` only after release review, deployment/operational acceptance and post-merge CI.

## Frontend milestones

9. [ ] Responsive application shell and accessible motion — implementation in [draft PR #9](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/9). This change adds a dedicated shell acceptance workflow covering 1440×1000, 768×1024, 390×844 and 320×800, navigation/focus, skip link, preview-only content and reduced motion. Automated results for the new exact head are pending; manual 200% zoom, physical device/touch, keyboard-only and screen-reader acceptance remain open.
10. [ ] Sign-in/session/dashboard UI — [draft PR #10](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/10).
11. [ ] Doctor directory/detail/create/edit/search/filter/pagination UI — [draft PR #11](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/11).
12. [ ] Patient CRUD, relationship-safe detach/delete and directory filters — [draft PR #12](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/12).
13. [ ] Synthetic browser E2E and release checks — [draft PR #13](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/13).
14. [ ] Real API + MongoDB browser acceptance — [draft PR #14](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/14); automated CI scope does not imply live deployment acceptance.
15. [ ] Automated axe/keyboard/reduced-motion accessibility — [draft PR #15](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/15), followed by form/dialog and patient delete/detach failure/retry cases in PRs #16–#18.
16. [ ] Guarded deployed staging smoke and 320 CSS-pixel responsive reflow — [draft PR #19](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/19) and [PR #20](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/20).
17. [ ] Strict nonce CSP, performance comparison, route-boundary CSP coverage and redirect-safe DNS-pinned deployment preflight — stacked draft PRs [#21](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/21)–[#24](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/24).
18. [ ] Add the manual staging workflow entry point to default branch — separate infrastructure-only [draft PR #25](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/pull/25); required environment protections and secrets must be independently verified.
19. [ ] Manual release acceptance, independent security review, approved performance target, synthetic screenshots and deployed URLs — see [Issue #6](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/issues/6).
20. [ ] Promote frontend `dev` then `main` only in dependency order after acceptance; verify CI against resulting SHAs.

A step is complete only when its acceptance criteria pass with evidence tied to the exact tested commit and required human/staging gates. A draft implementation, passing isolated CI or written runbook alone does not close a release requirement.
