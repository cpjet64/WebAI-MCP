# Lessons Learned

(Capture patterns and corrections here.)

- 2026-03-01: When a user reports unexpected artifacts in a cleanup run (for example "mutants"), always run explicit global scans (`rg -n`) for the term before patching and reflect cleanup scope in `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md` before committing.
