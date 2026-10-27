# GitHub Workflow and Project Status
## Repositories
API: https://github.com/RakibulhasanUtsho07/doctor-tracker-api
Frontend: https://github.com/RakibulhasanUtsho07/doctor-tracker-frontend
## Branch policy
main = release; dev = integration; rakibul-hasan = work branch. Promote via PR only: rakibul-hasan → dev → verified release PR to main.
## Verified status (2026-10-27)
- Documentation baseline merged to dev via frontend PR #1.
- Backend foundation merged to API dev via [PRs #7–#9](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/pulls); [CI run #13](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/actions/runs/40477435393) passed source hygiene lint, typecheck, 9/9 tests and build.
- Frontend `app/page.tsx` remains the default Next.js starter.
- Frontend feature UI, API integration, tests, CI and deployment are not verified complete.
## Progress
Docs/workflow: merged to dev. API foundation: PASS. Frontend feature implementation: 0% verified. Deployment: NOT STARTED.
## Next
Implement backend authentication/authorization ([API issue #3](https://github.com/RakibulhasanUtsho07/doctor-tracker-api/issues/3)), then complete doctor/patient/dashboard APIs. Build the frontend shell and screens when the API/auth contract is stable; then validate E2E, accessibility, security and deployment.
