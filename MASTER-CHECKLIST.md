# Master Checklist (Source-of-Truth)

Last synced: 2026-03-04T00:00:00Z
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

## 5) Definition of Done (for this pass)

- [x] `MASTER-CHECKLIST.md` includes every active task from this implementation run.
- [x] `EXECUTION-PLAN.md` documents sequencing, outputs, and verification.
- [x] All legacy moves are reflected by actual path updates in active docs.
- [x] No unresolved references to moved files remain in README or developer docs.
- [x] No orphaned legacy maintenance artifacts remain at root; moved items are indexed under `legacy/`.
- [x] Working tree includes only the expected MCP parity code updates and planning + archival cleanup changes.
