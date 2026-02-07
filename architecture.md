# Architecture Baseline

Derived from current repository evidence on 2026-02-07.

## Stack and Tooling

- Language: TypeScript + JavaScript
- Runtime: Node.js (documented support: 18+)
- Package manager: npm with workspaces
- Primary packages:
  - `webai-mcp`
  - `webai-server`
- Browser integration surface:
  - Chrome extension in `chrome-extension/`

## Module Boundaries

- `webai-mcp/`: MCP server protocol/tool layer and request handling.
- `webai-server/`: local middleware connector, browser communication, audit and proxy helpers.
- `chrome-extension/`: DevTools panel and browser-side collection/instrumentation.
- `scripts/`: setup/diagnostic/validation automation (currently mixed-quality; legacy naming drift present).
- `docs/`: setup and operational documentation.

## Data and Runtime Topology

1. MCP client talks to `webai-mcp`.
2. `webai-mcp` communicates with `webai-server`.
3. `webai-server` exchanges data with the Chrome extension.
4. Logs and captured data are handled locally.

## Build and Validation Conventions

- Workspace builds:
  - `npm run build --workspace=webai-mcp`
  - `npm run build --workspace=webai-server`
- Type checks via `tsc --noEmit` per package.
- Local-only CI policy now enforced by:
  - `scripts/ci.ps1`
  - `scripts/ci.sh`
  - `.githooks/pre-commit`

## Security and Quality Constraints

- Preserve local-first behavior and avoid introducing external telemetry by default.
- Keep sensitive data handling patterns present in existing code and docs.
- Run full local pipeline before commit (pre-commit gate).
- Do not run CI at pre-push.

## Patterns to Follow

- Keep workspace boundaries explicit (`webai-mcp`, `webai-server`, extension).
- Favor additive, backward-compatible changes in scripts/docs when consolidating.
- Track backlog with provenance in `todo.md`.

## Patterns to Avoid

- Reintroducing active cloud CI workflow YAML into `.github/workflows/`.
- Hardcoding obsolete `browser-tools-*` paths in executable scripts.
- Treating scattered roadmap docs as authoritative without consolidation into durable memory files.
