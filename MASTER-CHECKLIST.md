# Master Checklist (Source-of-Truth)

Last synced: 2026-03-01T23:50:00Z
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

- [ ] MIG-101: Implement full JSON-RPC dispatch path in `crates/mcp/src/lib.rs` (initialize, list_tools, call_tool, notifications, schema exposure).
- [ ] MIG-102: Implement tool execution path in `crates/mcp/src/tools.rs` for all defined tool families (logs, network, storage, screenshot, audits).
- [ ] MIG-103: Remove remaining stub branches that return placeholder strings in `crates/mcp/src/lib.rs` once real dispatch is wired.
- [ ] MIG-104: Ensure error responses use existing Rust error model (typed mapping and consistent messages).
- [ ] MIG-105: Add MCP parity test coverage for tool-level JSON input/output and malformed-call behavior.

### MIG-110 Rust Migration Parity — HTTP + WebSocket

- [x] MIG-111: Replace legacy `data-stub` HTML responses in `crates/server/src/flow_adapter.rs` with real Rust-owned path where feasible.
- [ ] MIG-112: Add route-level parity checks for `GET /capabilities`, `/identity`, `/current-url`, and related compatibility endpoints.
- [ ] MIG-113: Review websocket schema evolution and complete any unimplemented flow messages in `crates/server/src/flow_adapter.rs` and `crates/server/src/routes_ws.rs`.

### MIG-120 Rust Migration Parity — CLI / Tooling

- [x] MIG-121: Complete `xtask/src/main.rs` from placeholder to actionable automation command dispatcher.
- [ ] MIG-122: Validate `webai` CLI command matrix against documented behavior (server/mcp/all + health/identity/help).
- [ ] MIG-123: Align launch behavior with `todo.md` and `convert-rust.md` milestones for launch precedence and deprecation paths.

### MIG-130 Legacy cleanup and documentation accuracy

- [x] MIG-131: Resolve MCP protocol reference link in README and developer docs to the preserved legacy location.
- [x] MIG-132: Ensure `docs/ARCHIVE.md` and development docs describe where archived content lives now.
- [x] MIG-133: Keep `README.md` and `DEVELOPER_GUIDE.md` aligned with source-of-truth plan files.

### MIG-140 Test and quality backlog from plan artifacts

- [ ] MIG-141: Verify code coverage/test status for Rust crates updated by items above before opening the workstream.
- [ ] MIG-142: Keep `todo.md` and `convert-rust.md` headings tracked (not duplicated) and refer to them as backlog context for longer-term work.

### REV-200 Full-code review findings (sweep complete on 2026-03-01)

- [ ] REV-201: Complete MCP JSON-RPC parity by replacing remaining placeholder/stub paths in `crates/mcp/src/lib.rs` and `crates/mcp/src/tools.rs` for initialize/list_tools/call_tool behavior.
- [x] REV-202: Replace placeholder implementation with functional command dispatch in `xtask/src/main.rs`.
- [x] REV-203: Finalize WebSocket flow compatibility by removing legacy `data-stub` behavior in `crates/server/src/flow_adapter.rs` and reconciling `crates/server/tests/ws_flows.rs`.
- [ ] REV-204: Expand stubbed audit handling in `crates/server/src/lib.rs` from feature-gated placeholders to production-compatible routes.
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

## 4) Definition of Done (for this pass)

- [x] `MASTER-CHECKLIST.md` includes every active task from this implementation run.
- [x] `EXECUTION-PLAN.md` documents sequencing, outputs, and verification.
- [x] All legacy moves are reflected by actual path updates in active docs.
- [x] No unresolved references to moved files remain in README or developer docs.
- [x] No orphaned legacy maintenance artifacts remain at root; moved items are indexed under `legacy/`.
- [x] Working tree only contains expected updates for planning + archival cleanup.
