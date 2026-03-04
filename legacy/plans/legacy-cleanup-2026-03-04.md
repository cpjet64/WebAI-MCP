# Plan: Legacy Artifact Cleanup and Index Consolidation (2026-03-04)

## Objective

Finish the repository hygiene pass by moving stale operational and one-off planning artifacts out of active root/planning space into `legacy/`, then update source-of-truth indexes.

## Scope

- `GH-REVIEW-SUMMARY.md` (stale operational note from prior CI workflow era)
- `.AGENTS/plans/coverage-uncoverable-notes-2026-03-04.md`
- `.AGENTS/plans/test-all-docs-sync-2026-03-04.md`
- `.AGENTS/plans/test-all-skip-install-2026-03-04.md`
- `.AGENTS/plans/unfinished-marker-hygiene-2026-03-04.md`
- `docs/ARCHIVE.md`
- `legacy/README.md`
- `MASTER-CHECKLIST.md`
- `EXECUTION-PLAN.md`
- `.AGENTS/todo.md`
- `docs/standardization-report.md`

## Plan

1. Move stale artifacts to legacy locations.
2. Add plan/task traceability as `OPS-511` in checklists.
3. Update archive indexes and legacy inventory to keep single-source documentation.
4. Record implementation evidence and closeout in `docs/standardization-report.md`.

## Exit Criteria

- All listed artifacts are located only under `legacy/` with matching index entries.
- `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md` include `OPS-511` with completed status.
- `docs/standardization-report.md` has a dated execution record for this cleanup pass.
- `.AGENTS/todo.md` includes plan + review entry for `OPS-511`.

