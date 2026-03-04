# EXECUTION PLAN (authoritative workflow for this pass)

Last synchronized: 2026-03-04T18:00:00Z
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
- Coverage and cleanup verification updates are now active in this pass and synchronized.

## 1) Objective

Create one coherent planning source of truth for active and historical work while completing Rust MCP parity dispatch updates in the migration layer and cleaning remaining legacy artifacts into `./legacy`.

This pass implements the discovered cleanup items and closes the targeted backlog findings:
1. synchronizes `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md` with the discovered work state,
2. implements MCP parity dispatch at the HTTP bridge level (`initialize`, `list_tools`, `call_tool`) and updates JSON-RPC envelopes,
3. wires missing Rust server parity route for screenshot capture and keeps audit endpoint responses aligned with explicit provider messaging,
3. applies the scoped production-facing cleanup fixes (`REV-202`, `REV-203`, `REV-205`, `REV-206`, `REV-207`),
4. completes residual policy and dependency hygiene (`deny.toml`, `tower` version normalization) to reduce `cargo deny` risk,
5. archives old planning artifacts, and
6. updates active references to moved legacy assets,
7. removes branch-noise assumptions from local verification flow and aligns branch posture wording in contributor docs.

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
2. Move historical docs to:
   - `legacy/docs/archive/3tierconversion.md`
   - `legacy/docs/archive/mcp-ts-sdk.md`
3. Move auxiliary session note:
   - `legacy/notes/prompt.txt`
4. Archive orphaned verification prompt and legacy command notes:
   - `legacy/notes/run-this-prompt.md`
   - `legacy/notes/commands.txt`
5. Update `docs/ARCHIVE.md` so it accurately lists only currently retained legacy artifacts.
6. Ensure `legacy/README.md` inventory reflects the moved items.

### Phase 4 — Reference alignment and drift closeout

Goal: avoid stale references after archive migration.

1. Update `README.md` and `DEVELOPER_GUIDE.md` MCP protocol reference links to legacy doc path.
2. Update `docs/ARCHIVE.md` to match the new legacy storage paths.
3. Log completion in this plan and ensure checklist entry `No unresolved references ...` is validated.
   - Recorded archival of `RUN-THIS-PROMPT.md` and `commands.txt` to `legacy/notes/`.
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
