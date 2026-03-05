# Master Checklist (Source-of-Truth)

Last synced: 2026-03-05T05:15:00Z
Status: Active
Scope: Source-of-truth planning updates plus targeted cleanup and compatibility behavior fixes for discovered placeholder/stub items.

Conventions used below:
- `[x]` done
- `[ ]` pending
- IDs are shared with `EXECUTION-PLAN.md` and point to the same task in both files.

## 1) Canonical Planning Artifacts

- [x] `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md` are updated from the same discovery pass.
- [x] Plan and checklist are now consistent with this execution run.
- [x] `convert-rust.md`, `todo.md`, and `docs/ARCHIVE.md` are the active reference inputs.
- [x] Add a short `docs`/`legacy` migration entry whenever another archival move occurs.

## 2) Current Backlog (Discovery-Driven)

### MIG-100 Rust Migration Parity — MCP

- [x] MIG-101: Implement full JSON-RPC dispatch path in `crates/mcp/src/lib.rs` (initialize, list_tools, call_tool, notifications, schema exposure).
- [x] MIG-102: Implement tool execution path in `crates/mcp/src/tools.rs` for all defined tool families (logs, network, storage, screenshot, audits).
- [x] MIG-103: Remove remaining stub branches that return placeholder strings in `crates/mcp/src/lib.rs` once real dispatch is wired.
- [x] MIG-104: Ensure error responses use existing Rust error model (typed mapping and consistent messages).
- [x] MIG-105: Add MCP parity test coverage for tool-level JSON input/output and malformed-call behavior.
- [x] MIG-106: Add `POST /capture-screenshot` parity endpoint in Rust HTTP router and keep parity metadata aligned.

### MIG-110 Rust Migration Parity — HTTP + WebSocket

- [x] MIG-111: Replace legacy `data-stub` HTML responses in `crates/server/src/flow_adapter.rs` with real Rust-owned path where feasible.
- [x] MIG-112: Add route-level parity checks for `GET /capabilities`, `/identity`, `/current-url`, and related compatibility endpoints.
- [x] MIG-113: Review websocket schema evolution and complete any unimplemented flow messages in `crates/server/src/ws_schema.rs`, `crates/server/src/ws_handlers` and compatibility flow handling.

### MIG-120 Rust Migration Parity — CLI / Tooling

- [x] MIG-121: Complete `xtask/src/main.rs` from placeholder to actionable automation command dispatcher.
- [x] MIG-122: Validate `webai` CLI command matrix against documented behavior (server/mcp/all + health/identity/help).
- [x] MIG-123: Align launch behavior with `todo.md` and `convert-rust.md` milestones for launch precedence and deprecation paths.

### MIG-130 Legacy cleanup and documentation accuracy

- [x] MIG-131: Resolve MCP protocol reference link in README and developer docs to the preserved legacy location.
- [x] MIG-132: Ensure `docs/ARCHIVE.md` and development docs describe where archived content lives now.
- [x] MIG-133: Keep `README.md` and `DEVELOPER_GUIDE.md` aligned with source-of-truth plan files.

### MIG-140 Test and quality backlog from plan artifacts

- [x] MIG-141: Verify code coverage/test status for Rust crates updated by items above before opening the workstream.
- [x] MIG-142: Keep `todo.md` and `convert-rust.md` headings tracked (not duplicated) and refer to them as backlog context for longer-term work.

### SEC-300 Dependency & policy residuals

- [x] SEC-300: Remove unused license allowlist entries (`CC0-1.0`, `MPL-2.0`, `OpenSSL`, `Unicode-DFS-2016`) from `deny.toml` to satisfy dependency policy checks.
- [x] SEC-301: Align tower dependency versions in `crates/server/Cargo.toml` to reduce duplicate transitive crate warnings from `cargo deny`.
- [x] SEC-302: Track remaining transitive duplicate `windows-sys` (`0.52.0` via `ring` and `0.59.0` via `mio`/`tokio`) as an accepted residual risk until direct dependency alignment is feasible.

Residual risk:
- `windows-sys` duplicate is transitive via current `ring` and `tokio/mio` stacks in this dependency graph.
- This is currently non-blocking because it is not exploitable from direct dependency policy and is captured for future dependency alignment work.

### SEC-303 Post-merge hardening and residual monitoring

- [x] SEC-303: Establish and execute the first post-merge hardening cycle on `main` (quality gates, dependency drift, residual monitoring).
- [x] SEC-303a: Run `just ci-deep` and record pass status with all checks.
- [x] SEC-303b: Run dependency risk checks (`cargo deny check`, `cargo audit`, `python scripts/enforce_advisory_policy.py`) and confirm residual status for `windows-sys`.
- [x] SEC-303c: Run monthly dependency-visibility checks (`cargo tree -i windows-sys`) and archive the evidence.
- [x] SEC-303d: Add recurring post-merge hardening cadence (weekly/monthly) to the plan execution context and report it in `docs/standardization-report.md`.

### PERF-400 Browser connector performance optimizer pass

- [x] PERF-401: Execute `s-autonomous-performance-optimizer` and document optimization findings in `docs/optimization-report.md`.
- [x] PERF-402: Fix request-specific callback routing in `webai-server/browser-connector.ts` to avoid cross-request callback contamination.
- [x] PERF-403: Convert screenshot persistence path to async filesystem operations in `webai-server/browser-connector.ts`.
- [x] PERF-404: Execute full local verification after optimization changes (`npm run build:all`, `npm run test`, `just ci-deep`).

### REV-200 Full-code review findings (sweep complete on 2026-03-01)

- [x] REV-201: Complete MCP JSON-RPC parity by replacing remaining placeholder/stub paths in `crates/mcp/src/lib.rs` and `crates/mcp/src/tools.rs` for initialize/list_tools/call_tool behavior.
- [x] REV-202: Replace placeholder implementation with functional command dispatch in `xtask/src/main.rs`.
- [x] REV-203: Finalize WebSocket flow compatibility by removing legacy `data-stub` behavior in `crates/server/src/flow_adapter.rs` and reconciling `crates/server/tests/ws_flows.rs`.
- [x] REV-204: Expand stubbed audit handling in `crates/server/src/audit.rs` from feature-gated placeholders to production-compatible routes.
- [x] REV-205: Replace placeholder Google Analytics ID `G-XXXXXXXXXX` in `webai-mcp/mcp-server.ts` (or document telemetry removal).
- [x] REV-206: Replace placeholder MCP version text in `chrome-extension/panel.js` (or document version source explicitly).
- [x] REV-207: Remove remaining `placeholder`/`data-stub` indicators from production-relevant Rust surface (`crates/core/src/dto.rs`, `crates/server/src/flow_adapter.rs`, `crates/server/tests/ws_flows.rs`) by moving them to explicit feature-gated or migration notes.

## 3) Discovery-Verified Legacy Cleanup

- [x] LEG-001: Move `autonomous-full-development-pipeline-2026-02-26.md` out of active planning roots into `legacy/plans/`.
- [x] LEG-002: Move `s-project-standardizer-2026-03-01.md` out of active planning roots into `legacy/plans/`.
- [x] LEG-003: Move `3tierconversion.md` artifact into `legacy/docs/archive/`.
- [x] LEG-004: Move `mcp-ts-sdk.md` artifact into `legacy/docs/archive/`.
- [x] LEG-005: Move session prompt note file (`prompt.txt`) into `legacy/notes/prompt.txt`.
- [x] LEG-006: Add `legacy/README.md` inventory for archived item rationale.
- [x] LEG-007: Move `RUN-THIS-PROMPT.md` into `legacy/notes/run-this-prompt.md`.
- [x] LEG-008: Move `commands.txt` into `legacy/notes/commands.txt`.

## 4) OPS-500 Local-Only Build + Release Migration

- [x] OPS-501: Finalize local-only build and release posture by removing automation assumptions from contributor documentation (`README.md`, `DEVELOPER_GUIDE.md`, `scripts/README.md`).
- [x] OPS-502: Remove GitHub Actions update automation from `.github/dependabot.yml`.
- [x] OPS-503: Align dependency/setup scripts to document local verification and manual publication paths.
- [x] OPS-504: Confirm `.github/workflows` has no active build/release workflow files and no operational automation in use.
- [x] OPS-505: Remove stale remote branch refs from origin (`origin/dev`, `origin/feature/3tier-conversion`) so only `origin/main` remains.

## 5) OPS-506 Reference and branch posture verification

- [x] OPS-506: Verify branch topology and doc references are consistent with local-only posture:
  - `git branch -r` and `.github` layout show no stale remotes or workflow automation.
  - planning artifacts record both remote cleanup and local-only verification as complete.

- [x] OPS-507: Remove branch-noise behavior from local verification tooling and docs:
  - `tests/test-all.js` no longer checks out or depends on legacy feature branches.
  - contributor docs now describe a `main`-first workflow with no required branch workflow.

- [x] OPS-508: Add explicit `--skip-install` handling to `tests/test-all.js` while preserving `--skip-build` behavior:
  - `--skip-install` now independently controls dependency installation.
  - `--skip-build` remains the exclusive gate for skipping build tests.
  - Usage output in `tests/test-all.js` documents the new flag.

- [x] OPS-509: Synchronize test-runner documentation across `DEVELOPER_GUIDE.md`, `scripts/README.md`, and `tests/README.md`:
  - Document `--skip-install` and `--skip-build` semantics consistently.
  - Document direct invocation (`node tests/test-all.js ...`) and `npm run test:all -- ...` passthrough patterns.

### 5.1) OPS-510 Marker and wording hygiene

- [x] OPS-510: Remove placeholder-like language from active runtime surfaces and user-facing docs:
  - `crates/server/src/os_paste.rs` comments now describe explicit compatibility/deferred behavior for native features.
  - `README.md` CLI examples now label JSON-RPC compatibility commands (not stubs).

### 5.2) OPS-511 Legacy artifact cleanup and index consolidation

- [x] OPS-511: Archive stale operational and planning artifacts after local-only transition:
  - `GH-REVIEW-SUMMARY.md` moved to `legacy/notes/gh-review-summary-2026-03-04.md`.
  - `.AGENTS/plans/*-2026-03-04.md` cleanup artifacts moved to `legacy/plans/`.
  - `docs/ARCHIVE.md` and `legacy/README.md` updated with retained-location rationale.

### 5.3) OPS-512 Final historical plan artifact consolidation

- [x] OPS-512: Consolidate residual historical planning artifacts into legacy storage:
  - `coverage-maximizer-2026-03-02.md` moved from `.AGENTS/plans/` to `legacy/plans/`.
  - `legacy-cleanup-2026-03-04.md` moved from `.AGENTS/plans/` to `legacy/plans/`.
  - `docs/ARCHIVE.md` and `legacy/README.md` updated to reflect both moved artifacts.

### 5.4) OPS-513 Source-of-truth freeze and final index check

- [x] OPS-513: Run final source-of-truth and artifact-index freeze:
  - Reconfirm checklist alignment across `MASTER-CHECKLIST.md`, `EXECUTION-PLAN.md`, and `.AGENTS/todo.md`.
  - Verify `docs/ARCHIVE.md` and `legacy/README.md` list all legacy assets now present in:
    - `legacy/plans/`
    - `legacy/docs/archive/`
    - `legacy/notes/`
  - Perform cross-document reference checks to confirm stale references are absent outside indexed locations.
  - Record closure evidence in `docs/standardization-report.md`.

### 5.5) OPS-514 Legacy coverage archive inventory cleanup

- [x] OPS-514: Add `legacy/coverage/coverage-report-2026-03-02-prework.md` to:
  - `docs/ARCHIVE.md`
  - `legacy/README.md`
- [x] Record completion in `.AGENTS/todo.md`, `EXECUTION-PLAN.md`, and `docs/standardization-report.md`.
- [x] Re-run final legacy inventory scan to confirm `legacy/coverage` is represented in source-of-truth indexes.

### 5.6) OPS-515 Repository health check automation

- [x] OPS-515: Add a maintainable local repository preflight command:
  - Add `scripts/repository-health.mjs` checks for branch/posture, marker debt, legacy index consistency, and minimum tooling.
  - Add `npm run health:check` to root scripts for repeatable execution.
  - Document usage in `DEVELOPER_GUIDE.md` and `scripts/README.md`.
  - Keep plan/review evidence in `.AGENTS/todo.md`.
  - Record completion evidence in `docs/standardization-report.md`.

### 5.7) OPS-516 Legacy index closure for repository-health-check plan

- [x] OPS-516: Finalize legacy index closure for repository health-check planning artifacts:
  - [x] Add `legacy/plans/repository-health-check-2026-03-04.md` to `docs/ARCHIVE.md` with retention rationale.
  - [x] Add `legacy/plans/repository-health-check-2026-03-04.md` to `legacy/README.md`.
  - [x] Move `.AGENTS/plans/repository-health-check-2026-03-04.md` to `legacy/plans/repository-health-check-2026-03-04.md`.
  - [x] Re-run `npm run health:check` after archival closure.

### 5.8) OPS-517 Local-only automation hardening

- [x] OPS-517: Add hard guard for local-only automation posture in repository health checks:
  - [x] `scripts/repository-health.mjs` fails when YAML files are present in `.github/workflows`.
  - [x] `DEVELOPER_GUIDE.md` and `scripts/README.md` document the invariant that workflow automation files must be absent.
  - [x] `docs/standardization-report.md` captures evidence of completed enforcement.

### 5.9) OPS-518 Local release preflight hardening

- [x] OPS-518: Enforce repository health preflight in local release scripts:
  - [x] `scripts/local-release.sh` and `scripts/local-release.ps1` run `npm run health:check` before build/test.
  - [x] Add `--skip-health` as an explicit emergency bypass on both scripts.
  - [x] Document behavior and fallback in `DEVELOPER_GUIDE.md` and `scripts/README.md`.

### 5.10) OPS-519 Strict local-release health mode

- [x] OPS-519: Convert local release preflight to strict mode by default:
  - [x] Add strict mode to `scripts/repository-health.mjs` (`--strict`) so warning-only posture issues become hard failures.
  - [x] Extend branch checks to detect extra local branches outside `main` and gate release behavior accordingly.
  - [x] Update local release scripts to call `npm run health:check -- --strict` by default.
  - [x] Update health check and release docs in `DEVELOPER_GUIDE.md` and `scripts/README.md` with strict-mode semantics.

### 5.11) OPS-520 Source-of-truth and index closeout

- [x] OPS-520: Finalize final planning/source-of-truth coherence:
  - [x] Remove duplicate `OPS-519` status entries in `EXECUTION-PLAN.md`.
  - [x] Update task status snapshots in `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md` to include `OPS-520`.
  - [x] Record this closure in `.AGENTS/todo.md` and `docs/standardization-report.md`.
  - [x] Index `legacy/plans/ops-520-source-of-truth-closeout-2026-03-05.md` in `docs/ARCHIVE.md` and `legacy/README.md`.
  - [x] Archive the plan artifact in `legacy/plans/`.

### 5.12) OPS-521 Final working-tree convergence closeout

- [x] OPS-521: Finalize a clean closeout state for all planning and legacy cleanup artifacts:
  - [x] Keep this checklist synchronized with `EXECUTION-PLAN.md` and this run's completion evidence.
  - [x] Add `legacy/plans/ops-521-working-tree-convergence-closeout-2026-03-05.md` to both legacy indexes:
    - `docs/ARCHIVE.md`
    - `legacy/README.md`
  - [x] Capture closure evidence in `.AGENTS/todo.md` and `docs/standardization-report.md`.
  - [x] Confirm no legacy artifact references are expected outside `legacy/plans`, `legacy/docs/archive`, `legacy/notes`, and `legacy/coverage`.

### 5.13) OPS-522 Mainline posture reconciliation

- [x] OPS-522: Confirm final branch posture and source-of-truth alignment:
  - [x] Reconfirm `git branch` and `git branch -r` show only the `main` local branch and `origin/main` remote branch.
  - [x] Verify remote target remains canonical (`origin`) and no extra remotes are active.
  - [x] Re-run legacy inventory inclusion checks across `legacy/plans`, `legacy/docs/archive`, `legacy/notes`, and `legacy/coverage`.
  - [x] Confirm all retained legacy artifacts are indexed in both `docs/ARCHIVE.md` and `legacy/README.md`.
  - [x] Record this closeout in `.AGENTS/todo.md`, `EXECUTION-PLAN.md`, and `docs/standardization-report.md`.
  - [x] Archive this closeout via `.AGENTS/plans/ops-522-mainline-posture-and-closeout-2026-03-05.md`.

### 5.14) OPS-523 Final legacy-tracking reconciliation

- [x] OPS-523: Keep planning and artifact records fully trackable and synchronized:
  - [x] Move `.AGENTS/plans/ops-522-mainline-posture-and-closeout-2026-03-05.md` into `legacy/plans/`.
  - [x] Confirm that every file under `legacy/plans`, `legacy/docs/archive`, `legacy/notes`, and `legacy/coverage` is added to git and listed in both `docs/ARCHIVE.md` and `legacy/README.md`.
  - [x] Ensure `docs/ARCHIVE.md` contains a retention entry for `legacy/plans/ops-522-mainline-posture-and-closeout-2026-03-05.md`.
  - [x] Record execution evidence in `.AGENTS/todo.md` and `docs/standardization-report.md`.

### 5.15) OPS-524 Reliability hardening and worktree posture sweep

- [x] OPS-524: Finalize active reliability posture for local verification:
  - [x] Add dependency-install fallback resilience in `tests/test-all.js`.
  - [x] Add git worktree count posture check in `scripts/repository-health.mjs`.
  - [x] Record `OPS-524` execution evidence in source-of-truth tracking files.
  - [x] Add this closeout to `docs/standardization-report.md`.

### 5.16) OPS-525 Single-branch + workflow queue readiness closeout

- [x] OPS-525: Confirm local branch/worktree/run-posture alignment after single-branch migration:
  - [x] Re-run `git branch`, `git branch -r`, and `git worktree list` and verify single-main-posture expectations.
  - [x] Re-run `gh run list` checks for queued and in-progress runs for this repository and verify no active CI is queued.
  - [x] Run `node scripts/repository-health.mjs --strict`.
  - [x] Record completion evidence in `docs/standardization-report.md`, `.AGENTS/todo.md`, and source-of-truth status snapshots.

### 5.17) OPS-526 Source-of-truth and stale workflow summary cleanup

- [x] OPS-526: Clean up stale local-only workflow documentation artifacts and keep source-of-truth alignment:
  - [x] Archive `.github/WORKFLOW_SUMMARY.md` to `legacy/notes/workflow-summary-2026-03-04.md`.
  - [x] Remove `.github/WORKFLOW_SUMMARY.md` references from active source-of-truth and development docs.
  - [x] Index `legacy/notes/workflow-summary-2026-03-04.md` in `docs/ARCHIVE.md` and `legacy/README.md`.
  - [x] Archive `.AGENTS/plans/ops-526-doc-hygiene-closeout-2026-03-05.md` under `legacy/plans/` and index it in legacy inventories.

### 5.18) OPS-527 Final cleanup and posture audit

- [x] OPS-527: Final cleanup and posture audit for unresolved debt and operational posture:
  - [x] Re-run repository-wide marker debt checks for `TODO`, `FIXME`, `placeholder`, `stub`, `mutant`, `mutators`, and `XXX` in active source and documentation.
  - [x] Reconfirm branch/remotes/worktree and run-queue posture:
    - `git branch`
    - `git branch -r`
    - `git worktree list`
    - `gh run list --status queued`
    - `gh run list --status in_progress`
  - [x] Confirm no stale references to stale workflow-summary artifacts remain in source-of-truth and active docs.
  - [x] Keep formatting and index consistency for all legacy records.
  - [x] Record closure evidence in `.AGENTS/todo.md`, `EXECUTION-PLAN.md`, and `docs/standardization-report.md`.

## Task status snapshot (this pass)

- OPS-511: Completed.
- OPS-512: Completed.
- OPS-513: Completed.
- OPS-514: Completed.
- OPS-515: Completed.
- OPS-516: Completed.
- OPS-517: Completed.
- OPS-518: Completed.
- OPS-519: Completed.
- OPS-520: Completed.
- OPS-521: Completed.
- OPS-522: Completed.
- OPS-523: Completed.
- OPS-524: Completed.
- OPS-525: Completed.
- OPS-526: Completed.
- OPS-527: Completed.

## 6) Definition of Done (for this pass)

- [x] `MASTER-CHECKLIST.md` includes every active task from this implementation run.
- [x] `EXECUTION-PLAN.md` documents sequencing, outputs, and verification.
- [x] All legacy moves are reflected by actual path updates in active docs.
- [x] No unresolved references to moved files remain in README or developer docs.
- [x] No orphaned legacy maintenance artifacts remain at root; moved items are indexed under `legacy/`.
- [x] Working tree includes only the expected MCP parity code updates and planning + archival cleanup changes.
