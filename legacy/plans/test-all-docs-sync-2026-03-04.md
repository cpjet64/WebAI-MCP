# Plan: test-runner documentation synchronization (2026-03-04)

## Objective

Align all test-runner documentation to the canonical behavior of `tests/test-all.js` after the `--skip-install` change:
- keep `--skip-build` and `--skip-install` behavior explicit and consistent,
- remove invocation-path drift (`scripts/test-all.js` vs `tests/test-all.js`),
- preserve local-only verification posture in all guidance documents.

## Scope

- `tests/README.md`
- `DEVELOPER_GUIDE.md`
- `scripts/README.md`
- `MASTER-CHECKLIST.md`
- `EXECUTION-PLAN.md`
- `.AGENTS/todo.md`
- `docs/standardization-report.md`

## Plan

1. Confirm current references to the test runner path and flags are still inconsistent.
2. Update `tests/README.md` to document `--skip-install` and `--skip-build` with passthrough examples.
3. Add a dedicated `tests/test-all.js` section to `DEVELOPER_GUIDE.md` with clear flag behavior.
4. Add a test-runner section to `scripts/README.md` for command parity and flag usage.
5. Add an OPS-509 tracking item to planning and execution checklists for traceability.
6. Record completion in `.AGENTS/todo.md` and `docs/standardization-report.md`.

## Exit criteria

- All three docs (`tests/README.md`, `DEVELOPER_GUIDE.md`, `scripts/README.md`) present matching `--skip-build` and `--skip-install` semantics.
- No remaining `scripts/test-all.js` usage references remain.
- `OPS-509` appears as completed in both `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md`.
- Evidence entry recorded in planning and standardization reports.
