# EXECUTION PLAN (authoritative workflow for this pass)

Last synchronized: 2026-03-02T09:15:00Z
Branch context: `main`
Status: MCP parity implementation + planning alignment

Task status snapshot (this pass):
- MIG-112: Completed.
- MIG-122: Completed.
- MIG-113: Completed.
- MIG-123: Completed.
- REV-204: Completed.

## 1) Objective

Create one coherent planning source of truth for active and historical work while completing Rust MCP parity dispatch updates in the migration layer and cleaning remaining legacy artifacts into `./legacy`.

This pass implements the discovered cleanup items and closes the targeted backlog findings:
1. synchronizes `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md` with the discovered work state,
2. implements MCP parity dispatch at the HTTP bridge level (`initialize`, `list_tools`, `call_tool`) and updates JSON-RPC envelopes,
3. wires missing Rust server parity route for screenshot capture and keeps audit endpoint responses aligned with explicit provider messaging,
3. applies the scoped production-facing cleanup fixes (`REV-202`, `REV-203`, `REV-205`, `REV-206`, `REV-207`),
4. archives old planning artifacts, and
5. updates active references to moved legacy assets.

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
   - legacy planning artifacts under `.AGENTS/plans` and `docs/archive`,
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

### Phase 5 — Verification and handoff

Goal: confirm this planning pass is internally consistent.

1. Run repository checks to validate working tree and references:
   - `rg -n "legacy/(plans|docs/archive|notes)|MASTER-CHECKLIST|EXECUTION-PLAN|RUN-THIS-PROMPT" README.md DEVELOPER_GUIDE.md docs/ARCHIVE.md`
   - `git status --short`
   - `git diff --check`
2. Verify no unresolved links to old archive paths remain in edited reference files.
3. Record the changes in `docs/standardization-report.md`.

## 4) Exit criteria

- `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md` reflect exactly the same task IDs and sequencing.
- Legacy artifacts are moved, discoverable, and indexed under `legacy/`.
- Active documentation references were updated to match moved legacy assets.
- Working tree includes both code-level parity fixes and planning updates required by this pass.
- No pending unresolved references to moved files in edited docs.
