# Documentation Ledger

Append-only decision and rationale log.

## 2026-02-07 - Durable Memory Bootstrap

- Decision: Establish the six root durable memory files as authoritative operational memory.
- Why: Existing planning/strategy context is fragmented across root markdown docs, scripts, and legacy workflow docs.
- Evidence:
  - Root docs and guides include overlapping planning material (`webai_mcp_complete_guide.md`, `DEV_BRANCH_STRATEGY.md`, `BRANCH_PROTECTION_GUIDE.md`).
  - Script/tooling drift found in `scripts/` (`browser-tools-*` references).

## 2026-02-07 - Local-Only CI/CD Enforcement

- Decision: Enforce full local pipeline at pre-commit and disable cloud workflow execution.
- Why: Commit quality gate needs to be local, deterministic, and independent from hosted CI paths.
- Evidence:
  - Active workflow YAML files existed in `.github/workflows/` and were archived to `ci/legacy/github-actions-workflows/`.
  - New local CI source-of-truth files were added (`scripts/ci.ps1`, `scripts/ci.sh`) with hook dispatchers in `.githooks/`.

## 2026-02-07 - Prompt Charter Sync Note

- What changed:
  - Created `prompt.md` with:
    - autopilot policy
    - durable memory methodology
    - local-only CI/CD commitment-gating policy
    - repo facts section grounded in this repository
- Why:
  - To satisfy durable memory charter requirements and prevent future drift between execution and project intent.
- Repo evidence used:
  - `README.md` architecture and compatibility sections
  - Workspace/package layout (`package.json`, `webai-mcp/package.json`, `webai-server/package.json`)
  - Existing docs and scripts inventory collected during archaeology

## 2026-02-07 - Current Repository Snapshot

- Code roots:
  - `webai-mcp/`
  - `webai-server/`
  - `chrome-extension/`
- Operational docs now include:
  - `docs/LOCAL_CICD.md`
  - `.github/LOCAL_ONLY.md`
  - `docs/legacy/README.md`
- Legacy cloud CI workflows preserved at:
  - `ci/legacy/github-actions-workflows/`

## 2026-02-07 - CI Runner Hardening and Security Remediation

- Decision: Harden PowerShell CI command execution to fail immediately on non-zero exits.
- Why: Initial CI run continued after failed commands, producing false-success behavior.
- Evidence:
  - `scripts/ci/common.ps1` now checks `$LASTEXITCODE` and throws on failure.
  - `scripts/ci.ps1` and `scripts/ci.sh` now use workspace-scoped dependency/tool/audit commands.

- Decision: Apply automatic audit fixes in both workspaces to satisfy security gate.
- Why: Security stage failed on existing high/critical advisories.
- Evidence:
  - `npm --prefix webai-mcp audit fix` completed with zero vulnerabilities.
  - `npm --prefix webai-server audit fix` completed with zero vulnerabilities.
  - Final `npm run ci` run passed all stages.

## 2026-02-07 - Legacy Script Naming Drift Remediation (Partial)

- Decision: Replace stale `browser-tools-*` identifiers in executable scripts with `webai-*`.
- Why: Setup/diagnostic/test helper scripts referenced directories and package names that no longer exist in this repo.
- Evidence:
  - Updated script references across `scripts/setup.js`, `scripts/diagnose.js`, `scripts/test-all.js`, `scripts/validate-installation.js`, `scripts/platform-setup.js`, and `scripts/README.md`.
  - Validator now performs local version compatibility checks without importing `../webai-mcp/version-checker.js`.
- Remaining risk:
  - ESM CLI entrypoint guards still use brittle path string comparison and are tracked as `T-0010`.

## 2026-02-07 - Roadmap Scope Decision (Resolved)

- Decision: Treat `webai_mcp_complete_guide.md` as a historical planning reference, not active execution scope.
- Why: Maintainer confirmation received; current actionable plan is governed by durable memory files.
- Evidence:
  - Guide now labeled as archived reference at file top.
  - `plans.md` blocker `B-0001` resolved.
  - `todo.md` decision item `T-0005` closed.

## 2026-02-07 - Legacy Script Entry Guard Hardening

- Decision: Replace brittle ESM direct-run checks in scripts with normalized file URL comparisons.
- Why: `import.meta.url === \`file://${process.argv[1]}\`` is path-normalization fragile across environments.
- Evidence:
  - Updated in `scripts/setup.js`, `scripts/diagnose.js`, `scripts/validate-installation.js`, `scripts/platform-setup.js`, `scripts/test-all.js`.

## 2026-02-07 - Legacy Docs Reconciliation with Local-Only Policy

- Decision: Keep cloud-era workflow documents, but mark them as historical and point to local-only policy docs.
- Why: Preserve provenance while preventing operational confusion.
- Evidence:
  - Added supersession notices in:
    - `docs/RELEASE_SETUP.md`
    - `docs/CHANGELOG_AUTOMATION.md`
    - `DEV_BRANCH_STRATEGY.md`
    - `BRANCH_PROTECTION_GUIDE.md`

## 2026-02-07 - Validator Accuracy Improvements

- Decision: Improve `scripts/validate-installation.js` checks for audit invocation, main entrypoint path resolution, and dev-version compatibility mapping.
- Why: Previous validator produced false failures/warnings in current repo layout.
- Evidence:
  - `npm audit` now runs with `cwd` per package.
  - Build main entry check now resolves from package root.
  - Version compatibility now accepts `x.y.z-dev.n` mapped extension version `x.y.z.n`.

## 2026-02-07 - Script Module Warning Cleanup Completed

- Decision: Scope script module type to `scripts/` directory to avoid root-package semantic changes.
- Why: Remove non-fatal `MODULE_TYPELESS_PACKAGE_JSON` noise without impacting root workspace behavior.
- Evidence:
  - Added `scripts/package.json` with `"type": "module"`.
  - Converted `scripts/ci/docs-check.js` and `scripts/ci/smoke-test.js` to ESM imports.
  - `node scripts/setup.js --help` and `node scripts/test-all.js --help` now run without module-typeless warnings.

## 2026-02-07 - Root Script Interface Alignment

- Decision: Add missing root script aliases that `scripts/README.md` already instructs users to run.
- Why: Remove docs/runtime mismatch and reduce setup friction.
- Evidence:
  - Added root scripts: `diagnose`, `setup`, `setup:verbose`, `setup:quick`, `platform-setup`, `validate`, `full-setup`.
  - Verified `npm run setup -- --help` and `npm run diagnose` execute correctly.
  - Updated diagnostic wording to `WebAI-related process(es)` for consistency.

## 2026-02-07 - Windows Process Detection Refinement

- Decision: Use command-line aware process filtering on Windows for diagnostic process listing.
- Why: Prior behavior counted all `node.exe` processes and inflated WebAI-related process counts.
- Evidence:
  - `scripts/diagnose.js` now queries `Win32_Process` via PowerShell and filters by `webai`, `mcp-server`, or `browser-connector`.
  - Maintains fallback `tasklist` scan if CIM inspection fails.

## 2026-02-07 - Runtime Naming and Identity Consistency

- Decision: Update runtime-facing server guidance and `.identity` metadata to WebAI naming while preserving compatibility-critical discovery signature behavior.
- Why: Archaeology identified stale `browser-tools-*` references in live error handling and identity responses that can mislead users even though repository/package naming is `webai-*`.
- Evidence:
  - `webai-mcp/error-handler.ts` now suggests `npx @cpjet64/webai-server` and links to `https://github.com/cpjet64/WebAI-MCP/...`.
  - `webai-server/browser-connector.ts` now reports `.identity.name` as `webai-server` and accepts both `webai-server` and legacy `browser-tools-server` package names when reading version data.
  - `webai-mcp/mcp-server.ts` version compatibility tool description now refers to `WebAI Server`.

## 2026-02-07 - Extension UI and Env Var Naming Alignment

- Decision: Continue naming-drift cleanup in live runtime surfaces by aligning extension UI/server labels and MCP env var names to WebAI conventions.
- Why: Post-M8 archaeology still showed stale `Browser Tools` labels in active extension status UX and MCP runtime env var wiring.
- Evidence:
  - `webai-mcp/mcp-server.ts` now reports server name `WebAI MCP` and prefers `WEBAI_PORT`/`WEBAI_HOST` with legacy fallback.
  - `chrome-extension/panel.js` now shows `WebAI Server` in connection status and mismatch messages.
  - `webai-mcp/error-handler.ts`, `webai-server/proxy-config.ts`, and `webai-server/auto-paste-manager.ts` now use WebAI naming in remaining runtime-facing comments/messages/default user-agent string.

## 2026-02-07 - ASCII-Safe Runtime Report Formatting

- Decision: Replace mojibake-prone symbols in MCP-facing reports with explicit ASCII labels.
- Why: Error and compatibility report output contained corrupted symbol sequences in terminal rendering, reducing readability for troubleshooting.
- Evidence:
  - `webai-mcp/error-handler.ts` now formats with `ERROR`, `Suggested Solutions`, `[HIGH]/[MEDIUM]/[LOW]`, and `RETRY`.
  - `webai-mcp/version-checker.ts` now formats with ASCII status markers (`[OK]`, `[FAIL]`, `[COMPATIBLE]`, `[ISSUES FOUND]`).

## 2026-02-08 - Legacy Naming Cleanup in Active Docs and Labels

- Decision: Continue rebrand cleanup in non-authoritative active docs/UI labels/comments while preserving explicit historical BrowserTools references.
- Why: Archaeology still showed mixed naming in setup guides and panel labels that can create onboarding confusion despite runtime naming being aligned.
- Evidence:
  - Updated setup/guide labels in `README.md`, `AUTO_PASTE_GUIDE.md`, `WINDOWS_AUTO_PASTE_GUIDE.md`, and `docs/i18n/README_CN.md`.
  - Updated extension panel labels in `chrome-extension/devtools.js` and `chrome-extension/devtools.html`.
  - Updated Windows batch-template title in `scripts/platform-setup.js`.
  - Preserved explicit “Original BrowserTools MCP Docs” labeling for historical reference links.

## 2026-02-08 - Formatting Regression Test Coverage

- Decision: Add explicit CI regression coverage for user-facing MCP formatting output.
- Why: Recent runtime formatting hardening addressed mojibake/readability issues; targeted tests are needed to prevent silent regressions.
- Evidence:
  - Added `scripts/ci/report-format-test.js` with assertions for:
    - `ErrorHandler.formatErrorForUser`
    - `VersionChecker.formatCompatibilityReport`
  - Wired test into CI TEST stage in `scripts/ci.ps1` and `scripts/ci.sh`.
  - Verified via `npm run ci` with passing line `[report-format] formatting checks passed`.

## 2026-02-08 - Active Naming Regression Guard Coverage

- Decision: Add CI-enforced guardrails for active WebAI naming in docs/UI labels.
- Why: Rebrand cleanup is now broad enough that accidental reintroduction of stale labels is likely without automated checks.
- Evidence:
  - Added `scripts/ci/naming-check.js` with file-scoped forbidden and required token checks.
  - Wired naming checks into DOCS stage for both `scripts/ci.ps1` and `scripts/ci.sh`.
  - Verified via `npm run ci` with passing line `[naming-check] Active naming checks passed`.

## 2026-02-08 - Script Helper Naming Consistency Completion

- Decision: Remove remaining stale BrowserTools helper naming in active script internals and enforce via existing naming guard.
- Why: One active utility method name still used legacy BrowserTools wording despite runtime/docs rebrand completion.
- Evidence:
  - Renamed helper `testBrowserToolsServer` to `testWebAIServer` in `scripts/test-all.js`.
  - Extended `scripts/ci/naming-check.js` forbidden/required token checks for this symbol path.
  - Verified via `npm run ci` with passing line `[naming-check] Active naming checks passed`.
