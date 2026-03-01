# EXECUTION PLAN (authoritative workflow for this pass)

Last synchronized: 2026-03-01 00:00:00Z
Branch context: `main`
Status: Single-pass cleanup + backlog synchronization

## 1) Objective

Create one coherent planning source of truth for active and historical work while cleaning historical artifacts into `./legacy`.

This pass does not implement feature behavior changes. It:
1. synchronizes `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md` with the discovered work state,
2. archives old planning artifacts, and
3. updates active references to moved legacy assets.

## 2) Inputs and constraints

- Repository: `C:\Dev\repos\active\WebAI-MCP`
- Governance inputs: `AGENTS.md`, `CLAUDE.md`, `rules.md`.
- Source-of-truth scope for backlog:
  - `convert-rust.md`
  - `todo.md`
  - `docs/ARCHIVE.md`
  - discovered source inspection (`AGENTS`, planning docs, legacy outputs, code references)
- Scope limit:
  - no production code changes,
  - no external services,
  - no versioned dependency shifts.

## 3) Phases

### Phase 1 — Canonical baseline capture

Goal: establish stable input set and scope for this pass.

1. Confirm current repo state and target artifacts.
2. Extract discovery findings:
   - unfinished implementation surface in Rust crates (`crates/mcp`, `crates/server`, `xtask`),
   - legacy planning artifacts under `.AGENTS/plans` and `docs/archive`,
   - docs references to archived assets.
3. Publish IDs in `MASTER-CHECKLIST.md` linking planning and execution tasks.

### Phase 2 — Update canonical planning files

Goal: make `MASTER-CHECKLIST.md` + `EXECUTION-PLAN.md` authoritative.

1. Update `MASTER-CHECKLIST.md` with:
   - canonical source-of-truth statement,
   - synchronized status IDs,
   - migration + legacy cleanup workstreams,
   - definition of done.
2. Update this file (`EXECUTION-PLAN.md`) with the same IDs and deterministic sequencing.

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
4. Add `legacy/README.md` with archive mapping and rationale.

### Phase 4 — Reference alignment and drift closeout

Goal: avoid stale references after archive migration.

1. Update `README.md` and `DEVELOPER_GUIDE.md` MCP protocol reference links to legacy doc path.
2. Update `docs/ARCHIVE.md` to match the new legacy storage paths.
3. Log completion in this plan and ensure checklist entry `No unresolved references ...` is validated.

### Phase 5 — Verification and handoff

Goal: confirm this planning pass is internally consistent.

1. Run repository checks to validate working tree and references:
   - `rg -n "legacy/(plans|docs/archive|notes)|MASTER-CHECKLIST|EXECUTION-PLAN" README.md DEVELOPER_GUIDE.md docs/ARCHIVE.md`
   - `git status --short`
   - `git diff --check`
2. Verify no unresolved links to old archive paths remain in edited reference files.
3. Record the changes in `docs/standardization-report.md`.

## 4) Exit criteria

- `MASTER-CHECKLIST.md` and `EXECUTION-PLAN.md` reflect exactly the same task IDs and sequencing.
- Legacy artifacts are moved, discoverable, and indexed under `legacy/`.
- Active documentation references were updated to match moved legacy assets.
- Working tree diffs are docs-only and include a clear standardization trail.
- No pending unresolved references to moved files in edited docs.
