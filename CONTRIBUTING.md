# Contributing
## Branch flow
main is release-ready; dev is integration; rakibul-hasan is the active work branch. Promote by PR: rakibul-hasan → dev → verified release PR to main. Do not commit directly to main.
## Per-work-item rules
Keep each change medium-sized. Link issue and requirement IDs in every PR. Add tests and docs; run lint, typecheck, relevant tests and build. Update project status and traceability with evidence tied to exact commit. Review the diff for secrets, real patient data, generated files and accidental dependencies. Use meaningful commits.
## UI-specific evidence
Include desktop and mobile screenshots for meaningful visual changes; use synthetic data. Verify keyboard-only navigation, visible focus and reduced-motion mode.
## Definition of done
Acceptance criteria, automated checks, security/accessibility review, docs and evidence must be complete. No evidence means NOT STARTED, IN PROGRESS or PARTIAL, never PASS.
