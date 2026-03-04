# Plan: Coverage-Uncoverable Inline Notes (2026-03-04)

## Objective

- Close the remaining coverage-metadata backlog item by documenting why selected native-gated branches are intentionally unexecuted in current CI.

## Plan

1. Target `crates/server/src/os_paste.rs` and identify stable branches that are gated by platform/feature conditions.
2. Add clear line-level comments explaining why those branches are currently not covered.
3. Keep implementation behavior unchanged (comments only).
4. Update planning/status artifacts to record completion.

## Execution

- Updated inline comments:
  - `run_windows_paste_native` (all/windows-native branch)
  - `run_windows_paste_native` (fallback branch)
  - `run_macos_paste_native` (all/macos-native branch)
  - `run_macos_paste_native` (fallback branch)
- Updated planning records:
  - `.AGENTS/todo.md`
  - `docs/standardization-report.md`
- Result status:
  - Completed with no behavior changes.
