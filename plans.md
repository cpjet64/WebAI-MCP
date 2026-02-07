# Milestone Plan

Date initialized: 2026-02-07
Authoritative status source for execution sequencing.

## Milestone M1 - Durable Memory Bootstrap

- Scope: Establish required durable memory files and consolidate scattered planning context.
- Tasks:
  - Create `prompt.md`, `plans.md`, `architecture.md`, `implement.md`, `documentation.md`, `todo.md`.
  - Run archaeology scan over docs/scripts/workflows and TODO/FIXME comments.
  - Capture actionable items with provenance in `todo.md`.
- Acceptance criteria:
  - All six durable memory files exist at repo root.
  - `todo.md` includes provenance-backed backlog items.
  - `documentation.md` logs decisions and rationale.
- Validation steps:
  - `node scripts/ci/docs-check.js`
- Status: Done
- Evidence:
  - Durable files created on 2026-02-07.
  - Archaeology scan captured in `todo.md`.

## Milestone M2 - Local-Only CI/CD Foundation

- Scope: Install/repair local-only CI kit and disable cloud CI execution paths.
- Tasks:
  - Add `.githooks/pre-commit` and `.githooks/pre-push`.
  - Add `scripts/ci.ps1`, `scripts/ci.sh`, plus shared modules.
  - Add `ci/ci.config.json` and `ci/tool-versions.json`.
  - Add `docs/LOCAL_CICD.md` and `.github/LOCAL_ONLY.md`.
  - Archive existing workflow YAML files out of `.github/workflows/`.
  - Ensure `.gitignore` includes `.ci-tools/` and `.ci-artifacts/`.
- Acceptance criteria:
  - Pipeline stages execute in required order from pre-commit entrypoint.
  - No active workflow YAML remains in `.github/workflows/`.
  - Legacy workflows remain preserved.
- Validation steps:
  - `npm run hooks:install`
  - `npm run ci` (or `npm run ci:sh`)
  - `node scripts/ci/docs-check.js`
- Status: Done
- Evidence:
  - Workflow YAML moved to `ci/legacy/github-actions-workflows/`.
  - CI/hook/config/docs files added.
  - Validation passed: `npm run hooks:install`.
  - Validation passed: `npm run ci` (all nine stages green after script hardening and dependency audit remediation).

## Milestone M3 - Legacy Script Path Drift Remediation

- Scope: Fix stale `browser-tools-*` paths and package names in local scripts that should target WebAI paths.
- Tasks:
  - Update scripts under `scripts/` to use `webai-mcp` and `webai-server`.
  - Re-test setup/diagnostic helper scripts for runtime correctness.
  - Update `scripts/README.md` examples that reference stale service names.
- Acceptance criteria:
  - `scripts/setup.js`, `scripts/test-all.js`, `scripts/validate-installation.js`, and `scripts/diagnose.js` no longer reference stale package paths where they break functionality.
  - Updated scripts execute without path-resolution failures.
- Validation steps:
  - `node scripts/diagnose.js`
  - `node scripts/validate-installation.js`
  - `node scripts/setup.js --skip-diagnostics --skip-install`
- Status: Done
- Evidence:
  - Completed: T-0001 stale path migration in scripts.
  - Completed: T-0002 validator version compatibility check no longer imports non-existent path.
  - Completed: T-0003/T-0004 docs reconciled with local-only policy notices.
  - Completed: T-0010 ESM CLI entrypoint normalization.

## Milestone M4 - Roadmap Scope Reconciliation

- Scope: Decide whether the roadmap in `webai_mcp_complete_guide.md` is active scope or archival.
- Tasks:
  - Compare roadmap claims against implemented code and current repo intent.
  - If active, create executable subtasks with concrete acceptance criteria.
  - If archival, mark guide as historical in docs and keep provenance.
- Acceptance criteria:
  - Scope decision recorded.
  - `todo.md` and `plans.md` aligned to the decision.
- Validation steps:
  - Documentation consistency review across `prompt.md`, `plans.md`, `documentation.md`, and `docs/legacy/README.md`.
- Status: Done
- blocker: Resolved on 2026-02-07 by maintainer confirmation; treat `webai_mcp_complete_guide.md` as historical reference.
- unblock requires: N/A
- date noted: 2026-02-07
- Evidence:
  - Guide now labeled archived and linked to durable planning files.
  - `todo.md` decision item closed.

## Milestone M5 - Script Module Warning Cleanup

- Scope: Remove Node `MODULE_TYPELESS_PACKAGE_JSON` warnings from root `scripts/*.js` execution.
- Tasks:
  - Choose module strategy for root scripts (`type: module` at root vs isolated script package config).
  - Implement non-breaking change.
  - Validate helper scripts still execute.
- Acceptance criteria:
  - Running root helper scripts no longer emits module typeless warnings.
  - No regression to existing npm workspace behavior.
- Validation steps:
  - `node scripts/setup.js --help`
  - `node scripts/test-all.js --help`
  - `node scripts/diagnose.js`
- Status: Done
- Evidence:
  - Added `scripts/package.json` with `type: module`.
  - Converted `scripts/ci/docs-check.js` and `scripts/ci/smoke-test.js` to ESM.
  - Confirmed warning-free execution of:
    - `node scripts/setup.js --help`
    - `node scripts/test-all.js --help`

## Milestone M6 - Script Interface Alignment

- Scope: Align documented script commands with actual root `package.json` scripts and remove stale phrasing in diagnostics.
- Tasks:
  - Add root npm scripts matching `scripts/README.md` guidance.
  - Normalize process-detection messaging in `scripts/diagnose.js`.
  - Revalidate setup and diagnose command paths.
- Acceptance criteria:
  - `npm run setup -- --help` works.
  - `npm run diagnose` works.
  - No missing-command drift remains for documented script entrypoints.
- Validation steps:
  - `npm run setup -- --help`
  - `npm run diagnose`
  - `npm run validate:docs`
- Status: Done
- Evidence:
  - Added `diagnose/setup/setup:verbose/setup:quick/platform-setup/validate/full-setup` scripts to root `package.json`.
  - `scripts/diagnose.js` now reports `WebAI-related process(es)`.

## Milestone M7 - Windows Process Detection Refinement

- Scope: Reduce false-positive process counts in diagnostics on Windows.
- Tasks:
  - Replace broad `tasklist`-only counting with command-line aware process filtering.
  - Keep fallback behavior if CIM query fails.
- Acceptance criteria:
  - `npm run diagnose` no longer reports unrelated Node processes as WebAI-related by default.
- Validation steps:
  - `npm run diagnose`
- Status: Done
- Evidence:
  - `scripts/diagnose.js` now queries `Win32_Process` command lines and filters on `webai`/`mcp-server`/`browser-connector`.
  - Fallback to basic `tasklist` scan retained when command-line inspection fails.

## Milestone M8 - Runtime Rebrand Consistency Cleanup

- Scope: Remove stale `browser-tools-*` runtime guidance in user-facing error/help paths while preserving compatibility-sensitive discovery signatures.
- Tasks:
  - Update WebAI server guidance and command suggestions in `webai-mcp/error-handler.ts`.
  - Update `.identity` name/version detection and startup banner text in `webai-server/browser-connector.ts`.
  - Update stale tool description text in `webai-mcp/mcp-server.ts`.
- Acceptance criteria:
  - Runtime guidance references `webai-server` package and current WebAI repository links.
  - `.identity` endpoint returns `name: "webai-server"` while still exposing the existing signature used by discovery clients.
  - TypeScript build/test pipeline remains green under local CI.
- Validation steps:
  - `npm run ci`
- Status: Done
- Evidence:
  - Updated command and help-link strings in `webai-mcp/error-handler.ts`.
  - Updated package-name detection and identity payload in `webai-server/browser-connector.ts`.
  - Updated version-check tool description in `webai-mcp/mcp-server.ts`.

## Milestone M9 - UI and Config Naming Alignment

- Scope: Align remaining live-code `Browser Tools` naming in extension UI and runtime configuration surfaces with current WebAI naming, without changing compatibility signatures.
- Tasks:
  - Update MCP server display name and env var handling in `webai-mcp/mcp-server.ts`.
  - Update extension UI status strings/comments in `chrome-extension/panel.js`.
  - Update remaining runtime guidance strings/comments in `webai-mcp/error-handler.ts`, `webai-server/proxy-config.ts`, and `webai-server/auto-paste-manager.ts`.
- Acceptance criteria:
  - Extension UI and runtime messages refer to `WebAI`/`webai-server` instead of stale `Browser Tools` names.
  - MCP runtime accepts `WEBAI_HOST`/`WEBAI_PORT` while retaining backward compatibility for legacy env vars.
  - Local CI remains green.
- Validation steps:
  - `npm run ci`
- Status: Done
- Evidence:
  - Updated `webai-mcp/mcp-server.ts` server name and env var precedence.
  - Updated extension connection banner/status text in `chrome-extension/panel.js`.
  - Updated runtime comment/message drift in `webai-mcp/error-handler.ts`, `webai-server/proxy-config.ts`, and `webai-server/auto-paste-manager.ts`.

## Blockers

| Blocker ID | Related milestone/task | What is blocked | Unblock question | Date noted |
|---|---|---|---|---|
| B-0001 | M4 scope reconciliation | Promotion of phase-based roadmap items into active implementation plan | Should `webai_mcp_complete_guide.md` be active scope or archival reference? | 2026-02-07 (Resolved: archival reference) |
