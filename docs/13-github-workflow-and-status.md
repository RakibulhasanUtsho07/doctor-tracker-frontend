# GitHub Workflow and Project Status
## Repositories
API: https://github.com/RakibulhasanUtsho07/doctor-tracker-api
Frontend: https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend
## Branch policy
main = release; dev = integration; rakibul-hasan = work branch. Promote only by PR: rakibul-hasan → dev → verified release PR to main.
## Verified status (2026-10-27)
- Frontend docs merged to dev via frontend PR #1.
- Backend API foundation PRs #7–#9 merged to API dev; [CI #13](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40477435393) passed lint/typecheck, 9/9 tests and build.
- Backend authentication PR #11 merged to API dev; [CI #28](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40479777698) passed lint/typecheck, 15/15 HTTP/auth unit tests, 1/1 MongoDB integration test and build.
- Frontend `app/page.tsx` remains the default Next.js starter.
- Frontend feature UI, API integration, tests and deployment are not verified complete.
## Progress
Docs/workflow: merged to dev. Backend foundation: PASS. Backend auth/session: PASS. Frontend features: 0% verified. Deployment: NOT STARTED.
## Next
Build [responsive frontend shell and motion foundation](https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend/issues/2) while backend proceeds with [doctor API issue #4](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/issues/4). Keep frontend auth integration aligned with the actual cookie/CSRF API behaviour. Complete E2E/security/accessibility/performance tests and deployment before release.
