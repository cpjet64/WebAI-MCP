# EXECUTION PLAN (authoritative workflow for this pass)

Last synchronized: 2026-03-05T05:15:00Z
Branch context: `main`
Status: Local-only release/build model finalized; planning docs aligned

Task status snapshot (this pass):
- MIG-112: Completed.
- MIG-122: Completed.
- MIG-113: Completed.
- MIG-123: Completed.
- REV-204: Completed.
- MIG-141: Completed.
- MIG-142: Completed.
- SEC-300: Completed.
- SEC-302: Completed.
- SEC-303: Completed.
- PERF-401: Completed.
- PERF-402: Completed.
- PERF-403: Completed.
- PERF-404: Completed.
- OPS-500: Completed.
- OPS-505: Completed.
- OPS-506: Completed.
- OPS-507: Completed.
- OPS-508: Completed.
- OPS-509: Completed.
- OPS-510: Completed.
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
- Coverage and cleanup verification updates are now active in this pass and synchronized.
- OPS-523: Completed.
- OPS-525: Completed.
- OPS-524: Completed.
- OPS-526: Completed.
- OPS-527: Completed.

## 1) Objective

Create one coherent planning source of truth for active and historical work while completing Rust MCP parity dispatch updates in the migration layer and cleaning remaining legacy artifacts into `./legacy`.

This pass implements the discovered cleanup items and closes the targeted backlog findings:
1. synchronizes `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md` with the discovered work state,
2. implements MCP parity dispatch at the HTTP bridge level (`initialize`, `list_tools`, `call_tool`) and updates JSON-RPC envelopes,
3. wires missing Rust server parity route for screenshot capture and keeps audit endpoint responses aligned with explicit provider messaging,
  4. applies the scoped production-facing cleanup fixes (`REV-202`, `REV-203`, `REV-205`, `REV-206`, `REV-207`),
  5. completes residual policy and dependency hygiene (`deny.toml`, `tower` version normalization) to reduce `cargo deny` risk,
  6. archives old planning artifacts, and
  7. updates active references to moved legacy assets,
  8. removes branch-noise assumptions from local verification flow and aligns branch posture wording in contributor docs.
  9. adds a reusable repository health-check preflight for branch posture, unresolved marker debt, and legacy index consistency.

Current residual item to be documented:
- SEC-302: Track remaining transitive `windows-sys` duplicate as accepted residual (`windows-sys@0.52.0` via `ring`, `windows-sys@0.59.0` via `mio`/`tokio`) until direct source alignment is feasible.
- PERF-400: Keep `docs/optimization-report.md` aligned with completed optimization findings and full verification evidence (`npm run build:all`, `npm run test`, `just ci-deep`).

## 2) Inputs and constraints

- Repository: `C:\Dev\repos\active\WebAI-MCP`
- Governance inputs: `AGENTS.md`, `CLAUDE.md`, `rules.md`.
- Source-of-truth scope for backlog:
  - `convert-rust.md`
  - `todo.md`
  - `docs/ARCHIVE.md`
  - discovered source inspection (`AGENTS`, planning docs, legacy outputs, code references)
- Scope limit:
  - scoped production behavior fixes only for placeholder/compatibility markers,
  - no external services,
  - no versioned dependency shifts.

## 3) Phases

### Phase 1 — Canonical baseline capture

Goal: establish stable input set and scope for this pass.

1. Confirm current repo state and target artifacts.
2. Extract discovery findings:
   - unfinished implementation surface in Rust crates (`crates/mcp`, `crates/server`, `xtask`),
   - placeholder/stub/TODO footprint in active source and docs,
   - include extension runtime placeholders (`chrome-extension/panel.js`) as deferred backlog actions,
   - absence/presence of temporary legacy markers and historical filenames,
   - legacy planning artifacts under `legacy/plans` and `legacy/docs/archive`,
   - docs references to archived assets.
3. Publish IDs in `MASTER-CHECKLIST.md` linking planning and execution tasks.
4. Publish required MCP parity tasks and acceptance criteria under the same IDs.
5. Record baseline findings in `docs/standardization-report.md`.

### Phase 2 — Update canonical planning files

Goal: make `MASTER-CHECKLIST.md` + `EXECUTION-PLAN.md` authoritative.

1. Update `MASTER-CHECKLIST.md` with:
   - canonical source-of-truth statement,
   - synchronized status IDs,
   - migration + legacy cleanup workstreams,
   - full review findings from this sweep (`REV-*` tasks),
   - definition of done.
2. Update this file (`EXECUTION-PLAN.md`) with the same IDs and deterministic sequencing.
3. Keep task IDs aligned to this run’s completed/in-progress state.

### Phase 3 — Legacy cleanup and migration to `/legacy`

Goal: remove active root clutter from historical planning artifacts.

1. Move historical planning outputs to:
   - `legacy/plans/autonomous-full-development-pipeline-2026-02-26.md`
   - `legacy/plans/s-project-standardizer-2026-03-01.md`
   - `legacy/plans/coverage-uncoverable-notes-2026-03-04.md`
   - `legacy/plans/test-all-docs-sync-2026-03-04.md`
   - `legacy/plans/test-all-skip-install-2026-03-04.md`
   - `legacy/plans/unfinished-marker-hygiene-2026-03-04.md`
2. Move historical docs to:
   - `legacy/docs/archive/3tierconversion.md`
   - `legacy/docs/archive/mcp-ts-sdk.md`
3. Move auxiliary session note:
   - `legacy/notes/prompt.txt`
4. Archive orphaned verification prompt and legacy command notes:
   - `legacy/notes/run-this-prompt.md`
   - `legacy/notes/commands.txt`
5. Archive legacy CI-review summary:
   - `legacy/notes/gh-review-summary-2026-03-04.md`
6. Update `docs/ARCHIVE.md` so it accurately lists only currently retained legacy artifacts.
7. Ensure `legacy/README.md` inventory reflects the moved items.

### Phase 4 — Reference alignment and drift closeout

Goal: avoid stale references after archive migration.

1. Update `README.md` and `DEVELOPER_GUIDE.md` MCP protocol reference links to legacy doc path.
2. Update `docs/ARCHIVE.md` to match the new legacy storage paths.
3. Log completion in this plan and ensure checklist entry `No unresolved references ...` is validated.
   - Recorded archival of `RUN-THIS-PROMPT.md`, `commands.txt`, and `GH-REVIEW-SUMMARY.md` to `legacy/notes/`.
   - Recorded completion archive of `.AGENTS/plans/*-2026-03-04.md` into `legacy/plans/`.
4. Run targeted verification queries and record outputs in `docs/standardization-report.md`:
   - `rg -n "RUN-THIS-PROMPT.md"`
   - `rg -n "data-stub|placeholder|TODO|stub"` crates webai-mcp xtask chrome-extension
   - `rg -n "feature/" tests/test-all.js DEVELOPER_GUIDE.md README.md`

### Phase 5 — Verification and handoff

Goal: confirm this planning pass is internally consistent.

1. Run repository checks to validate working tree and references:
   - `rg -n "legacy/(plans|docs/archive|notes)|MASTER-CHECKLIST|EXECUTION-PLAN|RUN-THIS-PROMPT" README.md DEVELOPER_GUIDE.md docs/ARCHIVE.md`
   - `git status --short`
   - `git diff --check`
2. Verify no unresolved links to old archive paths remain in edited reference files.
3. Remove unused license allowlist entries from `deny.toml`.
4. Align `crates/server/Cargo.toml` tower versions to a single dependency line/version baseline.
5. Run `cargo deny check` and capture remaining non-blocking duplicate warnings.
   - Residual status: accepted residual risk for `windows-sys` duplicates only (0.52.0 and 0.59.0); captured for future dependency alignment when upstreams migrate.
6. Document all residual risks and cleanup status in `docs/standardization-report.md`.
7. Run `just ci-deep` and block handoff until all quality gates pass.
8. Refresh `docs/optimization-report.md` with complete verification evidence for `PERF-400`.

## 4) Exit criteria

- `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md` reflect exactly the same task IDs and sequencing.
- Legacy artifacts are moved, discoverable, and indexed under `legacy/`.
- Active documentation references were updated to match moved legacy assets.
- Working tree includes both code-level parity fixes and planning updates required by this pass.
- No pending unresolved references to moved files in edited docs.

## 5) PERF-400 Execution Evidence (sync run)

Goal: keep `PERF-400` evidence in-band with this pass.

### 1) Completed findings are recorded in `docs/optimization-report.md`
- `PERF-401` optimization pass executed.
- `PERF-402` and `PERF-403` were implemented in `webai-server/browser-connector.ts`.

### 2) Verification matrix captured for this pass
- `npm run build:all` — PASS
- `npm run test` — PASS
- `just ci-deep` — PASS

### 3) Residual acceptance
- Track transitive duplicate `windows-sys` warning as an accepted residual per `SEC-302` until upstream alignment is possible.

## 6) Post-merge hardening and residual risk maintenance

Goal: keep quality and dependency posture healthy after completion of the migration and cleanup pass.

- Run `just ci-deep`, `cargo deny check`, `cargo audit`, and `python scripts/enforce_advisory_policy.py` on a recurring weekly cadence.
- Run `cargo tree -i windows-sys` on a recurring monthly cadence and keep residual risk evidence in this plan/report.
- Track acceptance state for transitive `windows-sys` duplicates in `MASTER-CHECKLIST.md` as part of `SEC-303`.
- Expand into code changes only when a recurring check becomes blocking.

### Current residual baseline

- `windows-sys` duplicate remains transitive-only (`0.52.0` via `ring`, `0.59.0` via `mio`/`tokio`) and is accepted until upstream stack alignment is feasible.

## 7) Local-Only Build + Release Migration (Current pass follow-up)

Goal: remove GitHub-based autobuilding and move to explicit local build/release workflows.

### 7.1 Tasks

- [x] OPS-500: Confirm no active GitHub workflow automation is used for build or release in this repository.
- [x] OPS-501: Update developer and supporting docs to document local-only release/build verification (`DEVELOPER_GUIDE.md`, `README.md`, `scripts/README.md`).
- [x] OPS-502: Remove GitHub Actions update automation from Dependabot (`.github/dependabot.yml`).
- [x] OPS-503: Align local dependency/setup scripts with manual release model.
- [x] OPS-504: Verify `.github/workflows` contains no operational workflow definitions.
- [x] OPS-505: Remove stale origin remotes (`origin/dev`, `origin/feature/3tier-conversion`) and keep only `origin/main`.
- [x] OPS-506: Verify branch and reference posture from `git branch -r` and update references in planning docs.
- [x] OPS-507: Remove branch-noise assumptions from `tests/test-all.js` and update docs (`README.md`, `DEVELOPER_GUIDE.md`) for `main`-first workflow posture.
- [x] OPS-508: Add explicit `--skip-install` support to `tests/test-all.js` without changing default dependency/build behavior:
  - `--skip-install` gates `npm install` only.
  - `--skip-build` remains the exclusive test-step short-circuit.
  - Usage/help text documents the new flag.
- [x] OPS-509: Synchronize `tests/test-all.js` usage and behavior documentation across `DEVELOPER_GUIDE.md`, `scripts/README.md`, and `tests/README.md`:
  - Document `--skip-install` and `--skip-build` semantics consistently.
  - Document direct invocation and `npm run test:all -- <flags>` patterns.

### 7.2 Tasks

- [x] OPS-510: Marker and wording hygiene for active runtime surfaces:
  - Remove confusing placeholder/stub language from active runtime comments and docs (`crates/server/src/os_paste.rs`, `README.md`).
  - Add traceability in this plan and `MASTER-CHECKLIST.md`.

- [x] OPS-511: Archive stale operational and planning artifacts into `legacy/`:
  - Move `GH-REVIEW-SUMMARY.md` to `legacy/notes/gh-review-summary-2026-03-04.md`.
  - Move `.AGENTS/plans/coverage-uncoverable-notes-2026-03-04.md`, `.AGENTS/plans/test-all-docs-sync-2026-03-04.md`,
    `.AGENTS/plans/test-all-skip-install-2026-03-04.md`, and `.AGENTS/plans/unfinished-marker-hygiene-2026-03-04.md` to `legacy/plans/`.
  - Update `docs/ARCHIVE.md` and `legacy/README.md` to keep all retained legacy artifacts indexed.

- [x] OPS-512: Consolidate residual historical planning artifacts:
  - Move `coverage-maximizer-2026-03-02.md` from `.AGENTS/plans/` to `legacy/plans/`.
  - Move `legacy-cleanup-2026-03-04.md` from `.AGENTS/plans/` to `legacy/plans/`.
  - Update plan/task source-of-truth references for consolidated index and archival rationale.

### 7.3 Tasks

- [x] OPS-513: Final source-of-truth freeze and legacy index consistency:
  - Validate `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md` use aligned completion status for `OPS-511` and `OPS-512`.
  - Validate `docs/ARCHIVE.md` and `legacy/README.md` include all legacy artifacts now present in:
    - `legacy/plans/`
    - `legacy/docs/archive/`
    - `legacy/notes/`
  - Re-run reference and marker scans across planning/docs/legacy files to confirm no active stale path references remain:
    - `rg -n "legacy/(plans|docs/archive|notes)|MASTER-CHECKLIST|EXECUTION-PLAN|RUN-THIS-PROMPT" README.md DEVELOPER_GUIDE.md docs/ARCHIVE.md .AGENTS/todo.md`
    - `rg -n "(?i)todo|placeholder|stub|fixme|mutant|mutators|data-stub" --glob '!target' --glob '!.git' --glob '!legacy/**' .`
  - Append completion closure to `docs/standardization-report.md`.

### 7.4 Tasks

- [x] OPS-514: Legacy coverage archive inventory cleanup:
  - Add `legacy/coverage/coverage-report-2026-03-02-prework.md` to all active source-of-truth legacy indexes.
  - Record closeout evidence in `.AGENTS/todo.md` and `docs/standardization-report.md`.
  - Confirm the working docs inventory matches the actual retained legacy coverage report.

### 7.5 Tasks

- [x] OPS-515: Repository health-check preflight and governance automation:
  - Add `scripts/repository-health.mjs` with checks for:
    - branch/remotes posture (`main` + `origin` and stale remotes warning),
    - unresolved debt patterns in active source directories (`TODO`, `FIXME`, `mutant`, `mutators`, `data-stub`, `placeholder`),
    - legacy index consistency against `docs/ARCHIVE.md` and `legacy/README.md`,
    - minimum tooling requirements (`node`, `npm`) and baseline report output.
  - Add `npm run health:check` to root `package.json`.
  - Document command invocation and meaning in `DEVELOPER_GUIDE.md` and `scripts/README.md`.
  - Add detailed plan/review traceability in `.AGENTS/todo.md` and `.AGENTS/plans/repository-health-check-2026-03-04.md`.
  - Record completion evidence in `docs/standardization-report.md`.

### 7.6 Tasks

- [x] OPS-516: Legacy index closure for repository health-check planning artifact:
  - Move `.AGENTS/plans/repository-health-check-2026-03-04.md` to `legacy/plans/repository-health-check-2026-03-04.md`.
  - Add `legacy/plans/repository-health-check-2026-03-04.md` to `docs/ARCHIVE.md` with short retention rationale.
  - Add the same entry to `legacy/README.md`.
  - Re-run `npm run health:check` after archival updates and confirm PASS.

### 7.7 Tasks

- [x] OPS-517: Local-only automation posture hardening for repository health:
  - [x] Extend `scripts/repository-health.mjs` to fail hard when `.github/workflows` contains YAML workflow files.
  - [x] Document the invariant in `DEVELOPER_GUIDE.md` and `scripts/README.md` under repository health checks.
  - [x] Add execution closeout evidence in `.AGENTS/todo.md` and `docs/standardization-report.md`.

### 7.8 Tasks

- [x] OPS-518: Local release preflight hardening for local packaging:
  - [x] Ensure `scripts/local-release.sh` and `scripts/local-release.ps1` enforce `npm run health:check` before build/test in the default run path.
  - [x] Add `--skip-health`/`-skip-health` handling as an explicit emergency bypass on both scripts.
  - [x] Document local-release preflight behavior and bypass option in:
    - `DEVELOPER_GUIDE.md`
    - `scripts/README.md`
  - [x] Record task closure in `.AGENTS/todo.md` and `docs/standardization-report.md`.

### 7.9 Tasks

- [x] OPS-519: Enforce strict local-release posture:
  - [x] Add `--strict` mode to `scripts/repository-health.mjs` with optional strict warning-to-error behavior.
  - [x] Extend branch posture checks to include extra-local-branch detection outside `main`.
  - [x] Update `scripts/local-release.sh` and `scripts/local-release.ps1` to invoke `npm run health:check -- --strict` by default.
  - [x] Document strict-mode behavior in `DEVELOPER_GUIDE.md` and `scripts/README.md`.
  - [x] Record task closure in `.AGENTS/todo.md` and `docs/standardization-report.md`.

### 7.10 Tasks

- [x] OPS-520: Source-of-truth and legacy-index synchronization:
  - [x] Remove the duplicated `OPS-519` status line and keep completion markers in order.
  - [x] Add `OPS-520` closure evidence entry to `.AGENTS/todo.md`.
  - [x] Add `OPS-520` completion evidence to `docs/standardization-report.md`.
  - [x] Index `legacy/plans/ops-520-source-of-truth-closeout-2026-03-05.md` in both `docs/ARCHIVE.md` and `legacy/README.md`.
  - [x] Archive `.AGENTS/plans/ops-520-source-of-truth-closeout-2026-03-05.md` to `legacy/plans/`.
  - [x] Keep source-of-truth docs synchronized after this archival move.

### 7.11 Tasks

- [x] OPS-521: Final convergence closeout:
  - [x] Add dedicated closure plan under `legacy/plans/ops-521-working-tree-convergence-closeout-2026-03-05.md`.
  - [x] Confirm `MASTER-CHECKLIST.md`, `EXECUTION-PLAN.md`, and `docs/standardization-report.md` now include this completion entry.
  - [x] Confirm all legacy artifacts in `legacy/plans`, `legacy/docs/archive`, and `legacy/notes` are indexed in both `docs/ARCHIVE.md` and `legacy/README.md`.
  - [x] Record `OPS-521` completion evidence in this pass plan.

### 7.12 Tasks

- [x] OPS-522: Mainline posture reconciliation:
  - [x] Reconfirm branch and remote posture:
    - `git branch`
    - `git branch -r`
  - [x] Verify `origin` remote remains canonical and active only.
  - [x] Re-run legacy inventory consistency checks for:
    - `legacy/plans`
    - `legacy/docs/archive`
    - `legacy/notes`
    - `legacy/coverage`
  - [x] Confirm all four legacy locations are represented in `docs/ARCHIVE.md` and `legacy/README.md`.
  - [x] Record all `OPS-522` completion evidence in `.AGENTS/todo.md` and `docs/standardization-report.md`.
  - [x] Archive this closeout via `.AGENTS/plans/ops-522-mainline-posture-and-closeout-2026-03-05.md`.

### 7.13 Tasks

- [x] OPS-523: Final planning artifact and legacy-tracking reconciliation:
  - [x] Move the closeout planning artifact `ops-522-mainline-posture-and-closeout-2026-03-05.md` to `legacy/plans/`.
  - [x] Validate that every file under `legacy/plans`, `legacy/docs/archive`, `legacy/notes`, and `legacy/coverage` exists and is listed in `docs/ARCHIVE.md` and `legacy/README.md`.
  - [x] Ensure all newly untracked planning artifacts (`coverage-uncoverable-notes-2026-03-04.md`, `legacy-cleanup-2026-03-04.md`, `test-all-docs-sync-2026-03-04.md`, `test-all-skip-install-2026-03-04.md`, `unfinished-marker-hygiene-2026-03-04.md`, `repository-health-check-2026-03-04.md`) are tracked in git.
  - [x] Add `OPS-523` closeout evidence to `.AGENTS/todo.md` and `docs/standardization-report.md`.

### 7.14 Tasks

- [x] OPS-523 verification:
  - `git status --short`: confirm no untracked `legacy/` planning or notes artifacts remain.
  - `rg -n "legacy/(plans|notes|docs/archive)|legacy/coverage/|OPS-523|ops-522-mainline-posture-and-closeout-2026-03-05|coverage-report-2026-03-02-prework" docs/ARCHIVE.md legacy/README.md .AGENTS/todo.md`: confirm source-of-truth index references exist for each legacy artifact.
  - `rg -n "mutant|mutators|mutator"`: confirm no active "mutant" debt is present in tracked sources.

### 7.15 Tasks

- [x] OPS-524: Reliability hardening and tooling posture sweep:
  - [x] Add resilient dependency installation fallback in `tests/test-all.js`:
    - `npm ci --no-audit --no-fund` first, then fallback to `npm install --no-audit --no-fund`.
  - [x] Add `git worktree list`-based worktree posture check to `scripts/repository-health.mjs`.
  - [x] Verify `scripts/repository-health.mjs` now reports extra local worktrees as warnings and no worktree path for main.
  - [x] Update `.AGENTS/todo.md`, `MASTER-CHECKLIST.md`, and `docs/standardization-report.md` with completion evidence.
  - [x] Archive `legacy/plans/ops-524-reliability-hardening-2026-03-05.md` and index it.

### 7.16 Tasks

- [x] OPS-525: Single-branch readiness and workflow-queue hardening closeout:
  - [x] Re-run `git branch`, `git branch -r`, and `git worktree list` and confirm branch/worktree posture.
  - [x] Re-run `gh run list --status queued` and `gh run list --status in_progress` for repository run posture.
  - [x] Re-run `node scripts/repository-health.mjs --strict` and confirm no hard failures.
  - [x] Update source-of-truth status snapshots and this plan with closeout evidence.

### 7.17 Tasks

- [x] OPS-526: Documentation cleanup and stale artifact migration:
  - [x] Archive `.github/WORKFLOW_SUMMARY.md` to `legacy/notes/workflow-summary-2026-03-04.md`.
  - [x] Remove `.github/WORKFLOW_SUMMARY.md` references from active planning and development docs.
  - [x] Archive `ops-526-doc-hygiene-closeout-2026-03-05.md` from `.AGENTS/plans/` to `legacy/plans/`.
  - [x] Index `legacy/notes/workflow-summary-2026-03-04.md` and `legacy/plans/ops-526-doc-hygiene-closeout-2026-03-05.md` in both `docs/ARCHIVE.md` and `legacy/README.md`.
  - [x] Record completion evidence in `.AGENTS/todo.md` and `docs/standardization-report.md`.

### 7.18 Tasks

- [x] OPS-527: Final cleanup and posture audit:
  - [x] Re-run debt/declaration scans for unfinished-work markers in active source and docs.
  - [x] Verify branch/worktree posture and workflow queue health:
    - `git branch`
    - `git branch -r`
    - `git worktree list`
    - `gh run list --status queued`
    - `gh run list --status in_progress`
  - [x] Reconfirm `.AGENTS/plans` archival artifact moves are indexed by `docs/ARCHIVE.md` and `legacy/README.md`.
  - [x] Confirm formatting consistency in archive indices and remove remaining drift.
  - [x] Record completion evidence in `.AGENTS/todo.md` and `docs/standardization-report.md`.
