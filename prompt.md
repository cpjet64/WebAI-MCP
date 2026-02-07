# Project Charter

## Project Overview

WebAI-MCP is a local browser automation and monitoring toolkit that connects:

1. MCP clients
2. The `webai-mcp` server
3. The `webai-server` middleware
4. A Chrome extension

The project intent is to provide reliable local browser observability and browser-control tooling for AI-assisted workflows.

## Goals

- Keep the MCP + local server + extension pipeline stable and usable across Windows/macOS/Linux.
- Preserve local-first behavior for logs and browser data handling.
- Improve maintainability by consolidating planning and decision memory into repository-root durable memory files.
- Enforce commit quality through local-only commit gating.

## Non-Goals

- Re-architecting core product scope away from browser tooling.
- Replacing the current Node/TypeScript workspace structure.
- Deleting historical docs or release history artifacts.

## Constraints and Non-Negotiables

- Be truthful about implementation and validation.
- Prefer simple, maintainable changes over speculative complexity.
- If acceptance criteria are unclear, record a blocked milestone and continue elsewhere.
- Preserve historical docs/workflows by archiving, not deleting.

## Autopilot Policy

- Operate in autonomous mode by default.
- Continue through inspect -> plan -> implement -> validate -> document -> memory-update without waiting for "continue".
- Ask the user only for true blockers: product decisions, scope-changing charter edits, or global execution blockers.

## Durable Memory Methodology

The following files are the only durable operational memory and must stay synchronized:

- `prompt.md`
- `plans.md`
- `architecture.md`
- `implement.md`
- `documentation.md`
- `todo.md`

Re-grounding is mandatory:

- At start of major work
- Before planning
- Before non-trivial implementation
- When drift is detected

## Local-Only CI/CD Commitment Gating Policy

- Full CI pipeline runs at pre-commit only.
- No CI execution is allowed at pre-push.
- Hooks are dispatchers only (`.githooks/`).
- CI source of truth is:
  - `scripts/ci.ps1`
  - `scripts/ci.sh`
- Active cloud workflow YAML files must remain archived under:
  - `ci/legacy/github-actions-workflows/`

## Commit Message Policy

- Use Conventional Commits (`feat`, `fix`, `docs`, `refactor`, `test`, `ci`, `build`, `chore`).
- Keep commit scope aligned to a single milestone or tightly related task set.

## Repo Facts

- Monorepo with npm workspaces:
  - `webai-mcp` (TypeScript MCP server)
  - `webai-server` (TypeScript local middleware)
- Browser extension lives in `chrome-extension/`.
- Root scripts and docs include migration/release history from the previous `browser-tools-*` naming era.
- Node.js 18+ is the documented runtime baseline (`README.md` compatibility section).
- Legacy cloud workflows were archived to `ci/legacy/github-actions-workflows/` on 2026-02-07.

## Open Questions (True Blockers Only)

- None currently.
