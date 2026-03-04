# Unfinished Marker Hygiene Plan (2026-03-04)

## Objective

- Align active runtime comments and user-facing docs so production-visible wording does not use misleading placeholder wording while preserving explicit compatibility notes.

## Scope

- `crates/server/src/os_paste.rs` (native paste feature-gate comments).
- `README.md` Rust CLI section around JSON-RPC examples.
- Planning artifacts: `.AGENTS/todo.md`, `MASTER-CHECKLIST.md`, `EXECUTION-PLAN.md`.

## Execution

- [x] Normalize `os_paste.rs` comments from placeholder/stub phrasing to explicit deferred implementation notes.
- [x] Rename README JSON-RPC heading to compatibility commands to reflect runtime behavior.
- [x] Update and cross-link task IDs in planning artifacts with `OPS-510`.
- [x] Record sync completion in `docs/standardization-report.md` during the next verification pass if requested.

