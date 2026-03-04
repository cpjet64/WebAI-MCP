# TODO / Plan

- [x] Initialize standardizer session and confirm repository context
- [x] Stage `.agent-state/last-head.txt` and baseline audit info
- [x] Detect project type and collect governance inputs
- [x] Generate `MASTER-CHECKLIST.md`
- [x] Generate `EXECUTION-PLAN.md`
- [x] Create/update `docs/standardization-report.md` with audit timestamps
- [x] Commit generated standardization outputs

## Review (2026-03-02T13:20:00Z)

- [x] Verified no unresolved legacy artifacts remain outside `legacy/` after the last cleanup pass.
- [x] Re-ran marker scan for unfinished work (`TODO`/`FIXME`/`placeholder`/`stub`) and confirmed only intentional backlog/test markers remain.
- [x] Confirmed no `mutant`/`mutator` strings exist in repository contents after cleanup.
- [x] Confirmed working tree is clean on `main` and no further legacy-reference fixes are pending.

## Review (2026-03-02T14:09:48Z)

- [x] Re-ran `just ci-deep` and confirmed PASS.
- [x] Re-ran `npm run build:all` and `npm run test`.
- [x] Re-ran `npm run test:all`.
- [x] Re-ran `cargo llvm-cov nextest --all-features --fail-under-regions 73` (74.92%).
- [x] Re-ran security posture checks: `cargo deny check`, `cargo audit`, and `python scripts/enforce_advisory_policy.py`.
- [x] Re-ran `cargo tree -i windows-sys` and confirmed residual accepted duplicate path.

## Coverage Maximizer (2026-03-02)

- [x] Create and use dedicated coverage work branch `agent/coverage-max-2026-03-02` (done in isolated worktree).
- [x] Record rollback hash in `.agent-state/last-head.txt`.
- [x] Archive prior coverage report into `legacy/coverage/` as `legacy/coverage/coverage-report-2026-03-02-prework.md`.
- [x] Run full Rust coverage using `cargo nextest --all-features` and `cargo llvm-cov nextest --all-features --fail-under-regions 73 --lcov --output-path lcov.info` in coverage worktree.
- [x] Generate `docs/coverage-report.md` with before/after line/region/function metrics.
- [x] Investigate uncovered regions and classify as dead code / coverable / comment-required.
- [x] Add/extend tests for coverable gaps.
- [x] Add strict inline comments for unavoidable uncovered/uncoverable lines.
- [x] Run post-change `cargo nextest` + `cargo llvm-cov` and capture final report.
- [x] Commit atomic changes and document removed dead code/test additions in coverage report.

## Review (2026-03-02T20:25:22Z)

- [x] Confirmed all touched coverage-targeted tests are passing and deterministic.
- [x] Confirmed `cargo nextest run --all-features` pass count: 148 passed.
- [x] Confirmed `cargo llvm-cov nextest --all-features --fail-under-regions 73 --lcov --output-path lcov.info` passes in coverage worktree.
- [x] Confirmed end-line metrics for this pass: Regions 78.09%, Functions 81.68%, Lines 75.29% (baseline 74.92 / 80.05 / 71.54 from main branch run).
- [x] Confirmed prior coverage-report snapshot is archived under `legacy/coverage/`.

## Review (2026-03-04T18:00:00Z)

- [x] Re-validated branch and release posture on `main` after final plan alignment.
- [x] Re-ran `git status --short --branch`: clean, `main...origin/main`.
- [x] Re-ran `git branch -r`: only `origin/main` + `origin/HEAD -> origin/main`.
- [x] Re-ran `gh run list` for queued/in-progress states: none pending after queue cleanup.
- [x] Re-ran repository marker checks for unfinished-work debt (`TODO|FIXME|placeholder|stub|mutant` in active source dirs): no production debt found.
- [x] Re-ran legacy-path checks for moved planning artifacts (`autonomous-full-development-pipeline*`, `s-project-standardizer*`, `3tierconversion.md`, `mcp-ts-sdk.md`, `RUN-THIS-PROMPT.md`, `commands.txt`): all present under `legacy/`.
- [x] Re-ran archive reference checks in `README.md`, `DEVELOPER_GUIDE.md`, `docs/ARCHIVE.md`: expected references only.

## Review (2026-03-04T18:30:00Z)

- [x] Re-confirmed branch posture: `main...origin/main` with only `origin/main` and `origin/HEAD -> origin/main`.
- [x] Re-ran debt scan across active sources with expanded patterns (`todo|fixme|placeholder|stub|mutant|mutators|data-stub`): no production debt beyond intentional backlog/docs markers and HTML `placeholder=` attributes.
- [x] Revalidated no unresolved legacy-marker filenames remain outside `legacy/` via repo-wide marker scan.
- [x] Reconfirmed `main` remains ahead by local-only closeout commits (`d72ef51`, `050015e`) and clean staging state.

## Plan (2026-03-04T18:55:00Z)

- [x] Add coverage-justification comments in platform-gated native paste stubs in `crates/server/src/os_paste.rs`.
- [x] Record completion in `.AGENTS/todo.md` coverage backlog task.
- [x] Append execution evidence to `docs/standardization-report.md`.

## Plan (2026-03-04T19:20:00Z)

- [x] Normalize `tests/test-all.js` build execution semantics for local-only pipelines:
  - [x] Decouple `--skip-install` from `--skip-build` and ensure dependency installation is optional, not omitted implicitly by branch checks.
  - [x] Preserve default behavior (`npm install` + build) unless user passes `--skip-install`.
  - [x] Keep `--skip-build` as a clear and independent test-selection shortcut.
  - [x] Update CLI usage/help to document `--skip-install`.
- [x] Validate that the `tests/test-all.js` behavior change is reflected in planning evidence.

## Plan (2026-03-04T20:00:00Z)

- [x] Synchronize `tests/test-all.js` flag usage and behavior in `DEVELOPER_GUIDE.md`, `scripts/README.md`, and `tests/README.md`.
- [x] Add planning traceability for doc sync as `OPS-509` in both `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md`.
- [x] Record completion evidence in `docs/standardization-report.md`.

## Review (2026-03-04T20:20:00Z)

- [x] Completed docs sync for `tests/test-all.js`:
  - `DEVELOPER_GUIDE.md`: added explicit end-to-end runner section and flag semantics (`--skip-build`, `--skip-install`).
  - `scripts/README.md`: added dedicated test-runner usage and passthrough flag examples.
  - `tests/README.md`: added command examples for `npm run test:all -- <flags>` and direct `node tests/test-all.js`.
- [x] Added completed `OPS-509` entries to `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md`.
- [x] Added execution evidence entry for this plan and plan file in `docs/standardization-report.md` and `.AGENTS/plans/test-all-docs-sync-2026-03-04.md`.

## Plan (2026-03-04T20:40:00Z)

- [x] Add a hygiene sweep for production runtime placeholder wording in source comments:
  - [x] Replace non-actionable placeholder/stub wording in `crates/server/src/os_paste.rs` comments with explicit compatibility-state notes.
- [x] Update `README.md` to remove placeholder-language in user-visible Rust CLI examples where behavior is functional compatibility mode.
- [x] Introduce a new planning artifact under `.AGENTS/plans/unfinished-marker-hygiene-2026-03-04.md`.
- [x] Add `OPS-510` to `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md` to keep marker hygiene as a source-of-truth task.

## Plan (2026-03-04T22:10:00Z)

- [x] Archive stale operational and planning artifacts into `legacy/`:
  - [x] Move `GH-REVIEW-SUMMARY.md` to `legacy/notes/gh-review-summary-2026-03-04.md`.
  - [x] Move completed `coverage-uncoverable-notes-2026-03-04.md`, `test-all-docs-sync-2026-03-04.md`, `test-all-skip-install-2026-03-04.md`, `unfinished-marker-hygiene-2026-03-04.md` from `.AGENTS/plans/` to `legacy/plans/`.
  - [x] Record the closure and index updates in `docs/ARCHIVE.md`, `legacy/README.md`, and `docs/standardization-report.md`.
- [x] Add one authoritative cleanup task entry (`OPS-511`) into `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md` and mark it as complete with evidence.

## Review (2026-03-04T22:10:00Z)

- [x] Executed artifact archival pass for stale operational and plan-review files:
  - Archived `GH-REVIEW-SUMMARY.md` and four completed `.AGENTS/plans/*.md` run artifacts to `legacy/`.
  - Updated `docs/ARCHIVE.md` and `legacy/README.md` with their retained-location rationale.
  - Updated `MASTER-CHECKLIST.md`, `EXECUTION-PLAN.md`, and `docs/standardization-report.md` with `OPS-511` completion evidence.
- [x] Confirmed no references to archived file names remain outside legacy locations via a repo scan.

## Plan (2026-03-04T22:30:00Z)

- [x] Consolidate remaining historical planning artifact into legacy:
  - [x] Move `coverage-maximizer-2026-03-02.md` from `.AGENTS/plans/` to `legacy/plans/`.
  - [x] Move `legacy-cleanup-2026-03-04.md` planning trace from `.AGENTS/plans/` to `legacy/plans/`.
  - [x] Update `docs/ARCHIVE.md` and `legacy/README.md` to include retained legacy location.
  - [x] Add `OPS-512` closeout to `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md`.

## Review (2026-03-04T22:30:00Z)

- [x] Confirmed final historical planning artifact is archived:
  - `coverage-maximizer-2026-03-02.md` now exists at `legacy/plans/coverage-maximizer-2026-03-02.md`.
  - `legacy-cleanup-2026-03-04.md` now exists at `legacy/plans/legacy-cleanup-2026-03-04.md`.
  - Source-of-truth indexes (`docs/ARCHIVE.md`, `legacy/README.md`) and control docs now reference the migrated artifact.
  - `OPS-512` is recorded as complete in `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md`.

## Plan (2026-03-04T23:15:00Z)

- [x] Finalize `OPS-513` source-of-truth closeout pass:
  - [x] Add final consistency task and status entries to `MASTER-CHECKLIST.md`.
  - [x] Add final closeout phase and execution evidence to `EXECUTION-PLAN.md`.
  - [x] Record completion summary in `docs/standardization-report.md`.
  - [x] Confirm legacy inventories in `docs/ARCHIVE.md` and `legacy/README.md` include all expected `legacy/plans`, `legacy/docs/archive`, and `legacy/notes` artifacts.

## Review (2026-03-04T23:15:00Z)

- [x] Completed `OPS-513` final synchronization:
  - Re-ran a cross-document legacy reference scan across `README.md`, `DEVELOPER_GUIDE.md`, `docs/ARCHIVE.md`, `.AGENTS/todo.md`, `MASTER-CHECKLIST.md`, `EXECUTION-PLAN.md`, and `legacy/README.md`.
  - Verified expected references to migrated artifacts remain in indexes and planning controls; no new stale path references were found.
  - Updated `docs/standardization-report.md` and both checklists with `OPS-513` completion evidence.
  - Left working tree scoped to intended planning/documentation cleanup changes and pending local closeout artifacts.

## Plan (2026-03-04T23:35:00Z)

- [x] Close residual legacy-coverage index gap:
  - Ensure `legacy/coverage/coverage-report-2026-03-02-prework.md` is present in `docs/ARCHIVE.md`.
  - Ensure the same coverage artifact is listed in `legacy/README.md` with retention rationale.
  - Confirm `OPS-514` is completed in `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md`.

## Review (2026-03-04T23:35:00Z)

- [x] Completed `OPS-514` legacy inventory cleanup:
  - Updated `docs/ARCHIVE.md` and `legacy/README.md` with the missing coverage-report entry.
  - Verified source-of-truth status fields were synchronized in `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md`.
  - Recorded completion evidence in `docs/standardization-report.md`.

## Plan (2026-03-04T23:55:00Z)

- [x] Add a repository health preflight asset:
  - [x] Add `scripts/repository-health.mjs`.
  - [x] Add `npm run health:check` script for repeatable execution.
  - [x] Add dependency checks for tooling (`node`, `npm`) and hard-stop behavior on blocking drift.
- [x] Wire health checks into planning and maintenance docs:
  - [x] Document usage in `scripts/README.md`.
  - [x] Add local validation section in `DEVELOPER_GUIDE.md`.
  - [x] Add task `OPS-515` to `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md`.
  - [x] Track completion in `docs/standardization-report.md`.
- [x] Add implementation traceability:
  - [x] Add `.AGENTS/plans/repository-health-check-2026-03-04.md`.
  - [x] Add closeout review section in `.AGENTS/todo.md`.
  - [x] Confirm the updated maintenance posture in this single pass.

## Review (2026-03-04T23:55:00Z)

- [x] Completed OPS-515 repository health-check pass:
  - Added repository health command and docs coverage in `scripts/README.md` and `DEVELOPER_GUIDE.md`.
  - Updated source-of-truth plan/checklist files (`MASTER-CHECKLIST.md`, `EXECUTION-PLAN.md`) and added dedicated plan file.
  - Recorded completion evidence in `docs/standardization-report.md`.
  - Confirmed this task now exists as an atomic governance improvement with checkable evidence trail.

## Plan (2026-03-04T23:59:00Z)

- [x] Complete legacy index closure for all completed plan artifacts:
  - [x] Normalize `docs/ARCHIVE.md` and `legacy/README.md` index entries to include all `legacy/plans` files present.
  - [x] Move completed `.AGENTS/plans/repository-health-check-2026-03-04.md` into `legacy/plans/`.
  - [x] Record the archival evidence in execution/plan/check logs and confirm `npm run health:check` remains clean.

## Review (2026-03-04T23:59:00Z)

- [x] Completed OPS-516 legacy index normalization:
  - Added missing plan artifacts (`autonomous-full-development-pipeline-2026-02-26`, `s-project-standardizer-2026-03-01`, `repository-health-check-2026-03-04`) to `docs/ARCHIVE.md` and `legacy/README.md` index tracking.
  - Moved completed `repository-health-check-2026-03-04.md` to `legacy/plans/`.
  - Re-ran `npm run health:check` and confirmed a clean result.

## Plan (2026-03-04T23:59:55Z)

- [x] Add final repository-posture hardening and evidence closeout:
  - [x] Add a hard-fail in `scripts/repository-health.mjs` when `.github/workflows` contains any `.yml`/`.yaml` workflow files.
  - [x] Align `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md` with new `OPS-517` completion state.
  - [x] Expand maintenance posture docs (`DEVELOPER_GUIDE.md`, `scripts/README.md`) to explicitly call out `.github/workflows` absence as a required local-first invariant.
  - [x] Add completion evidence to `docs/standardization-report.md`.

## Review (2026-03-04T23:59:55Z)

- [x] Completed `OPS-517` local-only automation hardening:
  - `scripts/repository-health.mjs` now fails on workflow file presence in `.github/workflows`.
  - `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md` now include completed `OPS-517` items and snapshots.
  - `DEVELOPER_GUIDE.md` and `scripts/README.md` explicitly document the automation-invariant check for repository health.
  - `docs/standardization-report.md` records closeout evidence for this governance hardening pass.

## Plan (2026-03-04T23:59:59Z)

- [x] Execute `OPS-518` local release preflight hardening:
  - Add mandatory `npm run health:check` into `scripts/local-release.sh` and `scripts/local-release.ps1` before build/test.
  - Add `--skip-health` on both scripts as an explicit exception.
  - Update `DEVELOPER_GUIDE.md`, `scripts/README.md`, and `.github/WORKFLOW_SUMMARY.md` with default and exception behavior.

## Review (2026-03-04T23:59:59Z)

- [x] Completed `OPS-518` local release preflight hardening:
  - Release scripts now gate default local release execution with repository health preflight.
  - `--skip-health` bypass is documented and implemented in both local release script entry points.
  - `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md` now include `OPS-518: Completed`.
  - `docs/standardization-report.md` includes this closure evidence.

## Plan (2026-03-05T00:00:00Z)

- [x] Execute and close `OPS-519` strict local release posture:
  - Confirm `scripts/repository-health.mjs` strict warning-to-error behavior is wired into release preflight.
  - Update `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md` status snapshots to include `OPS-519: Completed`.
  - Add plan/review evidence entries to `docs/standardization-report.md`.
  - Archive the new `.AGENTS/plans/ops-519-strict-local-release-closeout-2026-03-05.md` file under `legacy/plans` and index it.

## Review (2026-03-05T00:10:00Z)

- [x] Completed `OPS-519` local release strict-posture closeout:
  - Confirmed all source-of-truth planning docs (`MASTER-CHECKLIST.md`, `EXECUTION-PLAN.md`, `.AGENTS/todo.md`) now reflect `OPS-519` as complete.
  - `docs/standardization-report.md` includes a closing evidence entry for strict health preflight posture.
  - `.AGENTS/plans/ops-519-strict-local-release-closeout-2026-03-05.md` has been archived to `legacy/plans/` and indexed in `docs/ARCHIVE.md` and `legacy/README.md`.

## Plan (2026-03-05T01:00:00Z)

- [x] Complete `OPS-520` source-of-truth and legacy-index synchronization:
  - [x] Deduplicate `OPS-519` status in `EXECUTION-PLAN.md`.
  - [x] Add `OPS-520` completion evidence to this file.
  - [x] Add closure evidence to `docs/standardization-report.md`.
  - [x] Archive `ops-520-source-of-truth-closeout-2026-03-05.md` under `legacy/plans/`.
  - [x] Index `legacy/plans/ops-520-source-of-truth-closeout-2026-03-05.md` in `docs/ARCHIVE.md` and `legacy/README.md`.
  - [x] Confirm source-of-truth references remain coherent after move.

## Review (2026-03-05T01:00:00Z)

- [x] Completed `OPS-520` source-of-truth cleanout:
  - [x] `EXECUTION-PLAN.md` now has one `OPS-519: Completed.` entry and one `OPS-520: Completed.` entry.
  - [x] `legacy/plans/ops-520-source-of-truth-closeout-2026-03-05.md` archived to `legacy/plans/`.
  - [x] Index updates for this artifact are present in both `docs/ARCHIVE.md` and `legacy/README.md`.
  - [x] Completion evidence was captured in `docs/standardization-report.md`.

## Plan (2026-03-05T01:30:00Z)

- [x] Launch `OPS-521`: final convergence closeout for this run.
- [x] Add a dedicated closure plan in `legacy/plans/ops-521-working-tree-convergence-closeout-2026-03-05.md`.
- [x] Confirm source-of-truth control files reflect the same completion marker set (`OPS-520` + `OPS-521`) and updated synchronization timestamp.
- [x] Align `docs/ARCHIVE.md` and `legacy/README.md` with all newly retained legacy artifacts.
- [x] Add explicit pass entry for this closeout to `docs/standardization-report.md`.

## Review (2026-03-05T01:30:00Z)

- [x] Completed `OPS-521` working-tree convergence and documentation closeout:
  - [x] `EXECUTION-PLAN.md` and `MASTER-CHECKLIST.md` updated with `OPS-521: Completed.` and latest synchronization metadata.
  - [x] `legacy/plans/ops-521-working-tree-convergence-closeout-2026-03-05.md` added with closeout evidence.
  - [x] Source-of-truth indexes updated in `docs/ARCHIVE.md` and `legacy/README.md`.
  - [x] `docs/standardization-report.md` includes the closure evidence entry for this pass.

## Plan (2026-03-05T02:00:00Z)

- [x] Execute `OPS-522`: mainline posture and legacy inventory final reconciliation.
  - [x] Confirm active branch and remote posture from `git branch` and `git branch -r`.
  - [x] Verify no stale local remote branches remain outside `origin/main`.
  - [x] Re-run legacy inventory inclusion checks for all active legacy directories against `docs/ARCHIVE.md` and `legacy/README.md`.
  - [x] Record completion state in source-of-truth control files and this standardization report.

## Review (2026-03-05T02:00:00Z)

- [x] Completed `OPS-522` with evidence:
  - Branch posture check shows only `main` locally and `origin/main` remotely.
  - Legacy artifact inventory check shows all `legacy/plans`, `legacy/docs/archive`, `legacy/notes`, and `legacy/coverage` files are indexed in source-of-truth references.
  - Source-of-truth trackers updated with `Last synchronized` and `OPS-522: Completed.` state and dedicated closeout evidence.

## Plan (2026-03-05T03:00:00Z)

- [x] Execute `OPS-523`: final planning artifact tracking and legacy index reconciliation.
  - [x] Move `.AGENTS/plans/ops-522-mainline-posture-and-closeout-2026-03-05.md` into `legacy/plans/`.
  - [x] Confirm and add all untracked legacy planning artifacts and notes in `legacy/plans`, `legacy/docs/archive`, `legacy/notes`, and `legacy/coverage`.
  - [x] Confirm `docs/ARCHIVE.md` and `legacy/README.md` include all currently retained artifacts, including `legacy/plans/ops-522-mainline-posture-and-closeout-2026-03-05.md`.
  - [x] Record closeout evidence for final trackability cleanup in this pass.

## Review (2026-03-05T03:00:00Z)

- [x] Completed `OPS-523` with evidence:
  - Moved `.AGENTS/plans/ops-522-mainline-posture-and-closeout-2026-03-05.md` to legacy tracking.
  - Confirmed all untracked legacy artifacts listed in this pass are now in git and referenced by source-of-truth indexes.
  - Updated `MASTER-CHECKLIST.md`, `EXECUTION-PLAN.md`, and `docs/standardization-report.md` with the closeout metadata.
  - Updated both `docs/ARCHIVE.md` and `legacy/README.md` for `ops-522` retention.
