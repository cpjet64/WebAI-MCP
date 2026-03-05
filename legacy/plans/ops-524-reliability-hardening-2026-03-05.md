<!-- file: legacy/plans/ops-524-reliability-hardening-2026-03-05.md -->

# OPS-524: Reliability and hygiene hardening closeout

## 1) Context

- Repository: `C:\Dev\repos\active\WebAI-MCP`
- Scope: tighten local verification reliability and close out remaining tooling debt discovered during `test:all`/worktree review.
- Start date: `2026-03-04T20:00:00Z`
- Branch context: `main`
- Constraint: local-only maintenance only; no CI changes.

## 2) Task list

### Plan

- [x] Audit current repository debt and branch/worktree posture signals:
  - `rg -n "(?i)todo|fixme|placeholder|stub|mutant|mutators|data-stub" --glob '!target' --glob '!.git' --glob '!legacy/**' .`
  - `git branch --show-current`
  - `git branch -r`
  - `git worktree list`
- [x] Hardening tasks in `tests/test-all.js`:
  - [x] Keep Windows-safe entrypoint detection and flag parsing.
  - [x] Add resilient dependency install command selection:
    - try `npm ci --no-audit --no-fund`,
    - fallback to `npm install --no-audit --no-fund`.
- [x] Hardening tasks in `scripts/repository-health.mjs`:
  - [x] Add `git worktree list` posture check.
  - [x] Ensure worktree findings map to warning behavior and strict mode semantics.
- [x] Update source-of-truth controls and report:
  - [x] Add `OPS-524` to `MASTER-CHECKLIST.md`.
  - [x] Add `OPS-524` execution sequencing to `EXECUTION-PLAN.md`.
  - [x] Record this closeout in `docs/standardization-report.md`.
  - [x] Track implementation and review state in `.AGENTS/todo.md`.

## 3) Exit criteria

- `tests/test-all.js` and `scripts/repository-health.mjs` include the above hardening edits.
- `npm run test:all` still executes with explicit install/skip semantics.
- Worktree posture check is present in source-of-truth health validation.
- The plan is synchronized in `MASTER-CHECKLIST.md`, `EXECUTION-PLAN.md`, and `docs/standardization-report.md`.

## 4) Review (2026-03-04T21:30:00Z)

- [x] Implemented and recorded:
  - Added fallback install behavior in `tests/test-all.js` command stack.
  - Added worktree posture check to `scripts/repository-health.mjs`.
- [x] Updated planning control files with `OPS-524` completion evidence:
  - `MASTER-CHECKLIST.md`
  - `EXECUTION-PLAN.md`
  - `.AGENTS/todo.md`
  - `docs/standardization-report.md`
- [x] Remaining follow-ups:
  - If `npm ci` remains unsupported in any environment, document exact fallback behavior in `tests/test-all.js` failure output (already partially covered by explicit warning text).
