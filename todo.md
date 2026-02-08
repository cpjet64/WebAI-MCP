# Consolidated Backlog

Format:
- ID
- Title
- Category
- Priority
- Status
- Provenance
- Notes/Links

## Items

### T-0001
- Title: Replace stale `browser-tools-*` paths in executable scripts
- Category: Bug
- Priority: P1
- Status: Done
- Provenance:
  - `scripts/setup.js:201`
  - `scripts/setup.js:202`
  - `scripts/test-all.js:215`
  - `scripts/test-all.js:216`
  - `scripts/diagnose.js:259`
  - `scripts/diagnose.js:260`
- Notes/Links:
  - Linked milestone: `M3`
  - Completed on 2026-02-07 via replacements across `scripts/*.js` and `scripts/README.md`.

### T-0002
- Title: Fix broken import/path assumptions in installation validator
- Category: Bug
- Priority: P0
- Status: Done
- Provenance:
  - `scripts/validate-installation.js:15`
  - `scripts/validate-installation.js:231`
  - `scripts/validate-installation.js:232`
  - `scripts/validate-installation.js:291`
  - `scripts/validate-installation.js:292`
- Notes/Links:
  - Linked milestone: `M3`
  - `scripts/validate-installation.js` now uses local package/manifest version compatibility checks.

### T-0003
- Title: Reconcile release/changelog docs with local-only policy
- Category: Docs
- Priority: P1
- Status: Done
- Provenance:
  - `docs/RELEASE_SETUP.md:3`
  - `docs/RELEASE_SETUP.md:108`
  - `docs/CHANGELOG_AUTOMATION.md:13`
  - `docs/CHANGELOG_AUTOMATION.md:19`
- Notes/Links:
  - Linked milestone: `M3`
  - Added local-only supersession note headers to release/changelog docs.

### T-0004
- Title: Reconcile branch strategy/protection docs with local-only CI reality
- Category: Docs
- Priority: P2
- Status: Done
- Provenance:
  - `DEV_BRANCH_STRATEGY.md:145`
  - `BRANCH_PROTECTION_GUIDE.md:33`
  - `BRANCH_PROTECTION_GUIDE.md:213`
- Notes/Links:
  - Linked milestone: `M3`
  - Added historical/superseded note headers with pointers to `docs/LOCAL_CICD.md`.

### T-0005
- Title: Decide whether phase roadmap guide is active scope or archival
- Category: Decision
- Priority: P1
- Status: Done
- Provenance:
  - `plans.md` blocker `B-0001`
  - `webai_mcp_complete_guide.md:39`
  - `webai_mcp_complete_guide.md:50`
  - `webai_mcp_complete_guide.md:61`
- Notes/Links:
  - Linked milestone: `M4`
  - Maintainer decision on 2026-02-07: treat as historical reference.

### T-0006
- Title: Install local-only CI/CD kit and archive cloud workflows
- Category: CI
- Priority: P0
- Status: Done
- Provenance:
  - `.githooks/pre-commit`
  - `.githooks/pre-push`
  - `scripts/ci.ps1`
  - `scripts/ci.sh`
  - `ci/ci.config.json`
  - `ci/tool-versions.json`
  - `ci/legacy/github-actions-workflows/`
- Notes/Links:
  - Linked milestone: `M2`
  - Completed 2026-02-07.

### T-0007
- Title: Bootstrap durable memory files and archaeology baseline
- Category: Docs
- Priority: P0
- Status: Done
- Provenance:
  - `prompt.md`
  - `plans.md`
  - `architecture.md`
  - `implement.md`
  - `documentation.md`
  - `todo.md`
- Notes/Links:
  - Linked milestone: `M1`
  - Completed 2026-02-07.

### T-0008
- Title: Baseline TODO/FIXME scan
- Category: TechDebt
- Priority: P3
- Status: Done
- Provenance:
  - TODO scan command output on 2026-02-07: `NO_MATCHES`
- Notes/Links:
  - No inline TODO/FIXME/XXX/HACK markers found outside lockfiles.

### T-0009
- Title: Resolve high/critical workspace audit findings to unblock CI security stage
- Category: Security
- Priority: P0
- Status: Done
- Provenance:
  - `webai-mcp/package-lock.json`
  - `webai-server/package-lock.json`
  - CI output from `npm run ci` security stage on 2026-02-07
- Notes/Links:
  - Linked milestone: `M2`
  - Remediation executed with `npm --prefix webai-mcp audit fix` and `npm --prefix webai-server audit fix`.

### T-0010
- Title: Normalize ESM CLI entrypoint checks in legacy scripts for Windows path safety
- Category: Bug
- Priority: P1
- Status: Done
- Provenance:
  - `scripts/setup.js:359`
  - `scripts/diagnose.js:463`
  - `scripts/validate-installation.js:504`
  - `scripts/platform-setup.js:515`
  - `scripts/test-all.js:558`
- Notes/Links:
  - Linked milestone: `M3`
  - Replaced with `pathToFileURL(path.resolve(process.argv[1]))` checks in primary script entrypoints.

### T-0011
- Title: Eliminate `MODULE_TYPELESS_PACKAGE_JSON` warnings for root helper scripts
- Category: TechDebt
- Priority: P2
- Status: Done
- Provenance:
  - Runtime warning output from:
    - `node scripts/setup.js --help`
    - `node scripts/test-all.js --help`
    - `node scripts/diagnose.js`
    - `node scripts/validate-installation.js`
- Notes/Links:
  - Linked milestone: `M5`
  - Resolved by introducing `scripts/package.json` (`type: module`) and converting `scripts/ci/*.js` to ESM.

### T-0012
- Title: Align root npm scripts with documented helper commands
- Category: Docs
- Priority: P2
- Status: Done
- Provenance:
  - `scripts/README.md` command examples
  - `package.json` scripts section
- Notes/Links:
  - Linked milestone: `M6`
  - Added missing script aliases for setup/diagnose/platform/validate workflows.

### T-0013
- Title: Reduce Windows diagnostic false positives for running process detection
- Category: Refactor
- Priority: P2
- Status: Done
- Provenance:
  - `scripts/diagnose.js` Windows process scan block
- Notes/Links:
  - Linked milestone: `M7`
  - Upgraded from broad `tasklist` counting to command-line aware filtering with fallback.

### T-0014
- Title: Align runtime server identity and troubleshooting guidance with WebAI naming
- Category: Bug
- Priority: P1
- Status: Done
- Provenance:
  - `webai-mcp/error-handler.ts:177`
  - `webai-mcp/error-handler.ts:304`
  - `webai-server/browser-connector.ts:583`
  - `webai-server/browser-connector.ts:597`
  - `webai-mcp/mcp-server.ts:1804`
- Notes/Links:
  - Linked milestone: `M8`
  - Updated user-facing runtime references to `webai-server` and `WebAI-MCP`, while preserving compatibility discovery signature `mcp-browser-connector-24x7`.

### T-0015
- Title: Align remaining extension UI and runtime config naming drift to WebAI
- Category: Refactor
- Priority: P2
- Status: Done
- Provenance:
  - `webai-mcp/mcp-server.ts:28`
  - `webai-mcp/mcp-server.ts:40`
  - `webai-mcp/mcp-server.ts:68`
  - `chrome-extension/panel.js:57`
  - `chrome-extension/panel.js:571`
  - `chrome-extension/panel.js:1107`
  - `webai-mcp/error-handler.ts:146`
  - `webai-server/proxy-config.ts:40`
  - `webai-server/auto-paste-manager.ts:2`
- Notes/Links:
  - Linked milestone: `M9`
  - Added `WEBAI_HOST`/`WEBAI_PORT` env var support with legacy fallback and updated live UI/runtime naming to WebAI.

### T-0016
- Title: Replace mojibake characters in MCP user-facing report formatting
- Category: Bug
- Priority: P1
- Status: Done
- Provenance:
  - `webai-mcp/error-handler.ts:329`
  - `webai-mcp/error-handler.ts:339`
  - `webai-mcp/error-handler.ts:362`
  - `webai-mcp/version-checker.ts:259`
  - `webai-mcp/version-checker.ts:263`
  - `webai-mcp/version-checker.ts:282`
- Notes/Links:
  - Linked milestone: `M10`
  - Output formatting now uses ASCII-safe labels to avoid terminal/codepage rendering corruption.

### T-0017
- Title: Clean remaining non-authoritative BrowserTools naming in active docs and labels
- Category: Docs
- Priority: P2
- Status: Done
- Provenance:
  - `README.md:93`
  - `README.md:221`
  - `AUTO_PASTE_GUIDE.md:9`
  - `WINDOWS_AUTO_PASTE_GUIDE.md:5`
  - `chrome-extension/devtools.js:834`
  - `chrome-extension/devtools.html:5`
  - `docs/i18n/README_CN.md:66`
  - `scripts/platform-setup.js:231`
- Notes/Links:
  - Linked milestone: `M11`
  - Updated WebAI-facing labels while preserving explicitly-marked original BrowserTools docs references.

### T-0018
- Title: Add CI regression tests for MCP formatting output
- Category: Test
- Priority: P1
- Status: Done
- Provenance:
  - `scripts/ci/report-format-test.js`
  - `scripts/ci.ps1:79`
  - `scripts/ci.sh:66`
  - `npm run ci` output (`[report-format] formatting checks passed`)
- Notes/Links:
  - Linked milestone: `M12`
  - Added assertions for expected labels and mojibake token absence in MCP formatting output.

### T-0019
- Title: Enforce active WebAI naming via CI DOCS-stage regression checks
- Category: CI
- Priority: P1
- Status: Done
- Provenance:
  - `scripts/ci/naming-check.js`
  - `scripts/ci.ps1` DOCS stage command list
  - `scripts/ci.sh` DOCS stage command list
  - `npm run ci` output (`[naming-check] Active naming checks passed`)
- Notes/Links:
  - Linked milestone: `M13`
  - Protects active docs/UI labels from reintroducing known stale BrowserTools naming tokens.

### T-0020
- Title: Align remaining script helper naming with WebAI conventions
- Category: Refactor
- Priority: P2
- Status: Done
- Provenance:
  - `scripts/test-all.js:261`
  - `scripts/test-all.js:267`
  - `scripts/ci/naming-check.js`
  - `npm run ci` output (`[naming-check] Active naming checks passed`)
- Notes/Links:
  - Linked milestone: `M14`
  - Renamed stale helper symbol and added CI guard assertions to prevent regression.

### T-0021
- Title: Add regression tests for MCP server default host/port resolution
- Category: Test
- Priority: P1
- Status: Done
- Provenance:
  - `webai-mcp/server-config.ts`
  - `webai-mcp/mcp-server.ts`
  - `scripts/ci/server-config-test.js`
  - `scripts/ci.ps1` TEST stage command list
  - `scripts/ci.sh` TEST stage command list
  - `npm run ci` output (`[server-config] host/port selection checks passed`)
- Notes/Links:
  - Linked milestone: `M15`
  - Verifies `WEBAI_*` env-var precedence plus legacy and `.port` fallback behavior.

### T-0022
- Title: Continue historical-doc cleanup with corrected legacy index links and supersession references
- Category: Docs
- Priority: P2
- Status: Done
- Provenance:
  - `docs/legacy/README.md` section `Historical Planning and Policy References`
  - `README.md` section `Documentation`
  - `DEV_BRANCH_STRATEGY.md` top historical notice block
  - `BRANCH_PROTECTION_GUIDE.md` top historical notice block
  - `docs/RELEASE_SETUP.md` top historical notice block
  - `docs/CHANGELOG_AUTOMATION.md` top historical notice block
  - `webai_mcp_complete_guide.md` top archival notice block
- Notes/Links:
  - Linked milestone: `M16`
  - Clarifies active-vs-historical documentation boundaries and ensures legacy index references are navigable.

### T-0023
- Title: Clarify changelog historical cloud-workflow references
- Category: Docs
- Priority: P3
- Status: Done
- Provenance:
  - `CHANGELOG.md` header section
  - Follow-up historical-doc scan on 2026-02-08
- Notes/Links:
  - Linked milestone: `M17`
  - Added explicit context note that hosted-CI/dev-branch references in changelog entries are historical and superseded by `docs/LOCAL_CICD.md`.
