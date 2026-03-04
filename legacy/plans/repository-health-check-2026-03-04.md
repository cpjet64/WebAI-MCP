# Repository Health Check Implementation Plan

Date: 2026-03-04T23:55:00Z
Type: Local maintenance governance enhancement

## Objective

Create and document a single local repository-health workflow that enforces:

- branch/posture consistency for ongoing local maintenance,
- unresolved debt/marker drift visibility,
- legacy artifact index consistency,
- minimum tooling availability checks.

## Plan

- [x] Add check script:
  - `scripts/repository-health.mjs` exists and runs four checks:
    - Branch/remotes (`main` + `origin`), with warnings for extra remote noise.
    - Marker debt scan in active source roots.
    - Legacy index scan (`legacy/` inventories versus `docs/ARCHIVE.md` and `legacy/README.md`).
    - Node/npm presence and version capture.
- [x] Add script entrypoint:
  - Root `package.json` exposes `npm run health:check`.
- [x] Add documentation:
  - `scripts/README.md` explains command usage and output intent.
  - `DEVELOPER_GUIDE.md` includes health check in maintenance flow and build verification list.
- [x] Track governance and evidence:
  - Add `OPS-515` to `MASTER-CHECKLIST.md`.
  - Add `OPS-515` closure tasks in `EXECUTION-PLAN.md`.
  - Record closure/review in `.AGENTS/todo.md`.
  - Record completion evidence in `docs/standardization-report.md`.

## Completion criteria

- [x] `npm run health:check` runs without file-not-found errors and returns a non-zero status on detected hard failures.
- [x] `MASTER-CHECKLIST.md`, `EXECUTION-PLAN.md`, and `.AGENTS/todo.md` all reference `OPS-515` with completion status.
- [x] Developer and script documentation contains explicit health-check invocation guidance.
