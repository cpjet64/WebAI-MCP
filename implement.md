# Implementation Workflow

## Standing Loop

1. Re-ground in durable memory files.
2. Select smallest testable increment from `plans.md`.
3. Implement minimal diff.
4. Validate with executable commands.
5. Update `plans.md`, `todo.md`, and `documentation.md`.
6. Continue to next unblocked task.

## Coding and Testing Standards

- Keep changes scoped and maintainable.
- Prefer explicit validation commands over implicit assumptions.
- If acceptance criteria are ambiguous, mark task blocked and continue elsewhere.
- Preserve historical artifacts by archiving rather than deleting.

## CI/CD Execution Standard

- Local-only commit gate:
  - Hook: `.githooks/pre-commit`
  - Entrypoints: `scripts/ci.ps1` and `scripts/ci.sh`
- Pre-push must not run CI pipeline.
- Pipeline stage order is fixed and must not be reordered:
  - `REPO_HYGIENE`
  - `TOOLCHAIN`
  - `DEPS`
  - `FORMAT`
  - `LINT/STATIC`
  - `BUILD`
  - `TEST`
  - `SECURITY/SUPPLY-CHAIN`
  - `DOCS`

## Current Focus

- Active milestone: none (M1-M7 complete as of 2026-02-07).
- Next queued work: promote new archaeology findings to `todo.md` and `plans.md` as they appear.
