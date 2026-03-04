# Lessons Learned

(Capture patterns and corrections here.)

- 2026-03-01: When a user reports unexpected artifacts in a cleanup run (for example "mutants"), always run explicit global scans (`rg -n`) for the term before patching and reflect cleanup scope in `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md` before committing.
- 2026-03-04: After any corrective sweep, immediately align all source-of-truth planning artifacts (`MASTER-CHECKLIST.md`, `EXECUTION-PLAN.md`, `.AGENTS/todo.md`, `docs/standardization-report.md`) in one pass to avoid silent drift.
- 2026-03-05: Before finishing a closeout pass, validate task status snapshots for duplicated IDs across source-of-truth planning docs and require explicit plan artifact archival when `.AGENTS/plans` is used as a staging location.
