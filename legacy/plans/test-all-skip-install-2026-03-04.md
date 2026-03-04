# Plan: `tests/test-all.js` Skip-Install Hardening (2026-03-04)

## Objective

Allow dependency installation in the build phase to be skipped intentionally without disabling build execution, while keeping `--skip-build` behavior unchanged and explicit.

## Discovery

- `--skip-install` was being introduced into the CLI options but was only surfaced through a nested `--skip-build` branch.
- In the current implementation, passing `--skip-install` did not actually bypass `npm install` when building.
- CLI help text did not document `--skip-install`, creating a mismatch with actual available flags.

## Planned Changes

1. Decouple `--skip-build` and `--skip-install` handling.
   - Keep `--skip-build` as an immediate early exit from the build test step.
   - Add a conditional dependency-install step inside the per-package build loop.
2. Preserve default behavior.
   - Default `skipInstall` remains `false`.
   - Keep dependency installation and build running unless explicitly skipped.
3. Update user-facing usage text.
   - Add `--skip-install` to the CLI usage block in `tests/test-all.js`.
4. Record outcome.
   - Write completion evidence in `.AGENTS/todo.md` and `docs/standardization-report.md`.

## Implementation

- File: `tests/test-all.js`
  - Updated build flow conditionals.
  - Added install gating inside build loop.
  - Added usage text for `--skip-install`.
- Planning files:
  - `.AGENTS/todo.md`
  - `docs/standardization-report.md`

## Success Criteria

- Running with `--skip-build --skip-install` skips build tests and reports skip-build.
- Running with `--skip-install` runs build tests with warnings for dependency-install skip and still runs `npm run build`.
- `--help` shows the new `--skip-install` flag.
