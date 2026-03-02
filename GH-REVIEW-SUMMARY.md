# GitHub Actions Review Summary

## Scope
- Reviewed failing Dependabot and workflow behavior from recent runs.
- Applied safe CI/config fixes tied to package manager alignment and dependency update scope.
- Kept changes limited to GitHub-specific automation.

## Root Cause
- Dependabot `npm_and_yarn` jobs in `/webai-mcp` and `/webai-server` were configured to allow indirect dependency updates.
- Dependabot runs against pnpm and this triggered `tool_feature_not_supported` errors for transitive updates (example logs from `1263347890`).
- Build/release workflows used `npm ci` / `npm install` assumptions that did not match the pnpm lockfile layout.

## Changes Applied
- Updated `.github/dependabot.yml`
  - Kept existing `group` and schedule settings.
  - Changed npm ecosystem update policy to `dependency-type: direct` only for:
    - `/webai-mcp`
    - `/webai-server`
- Updated `.github/workflows/test.yml`
  - Switched setup cache to `cache: pnpm` with `cache-dependency-path: pnpm-lock.yaml`
  - Replaced `npm ci` logic with:
    - `corepack pnpm install --frozen-lockfile --prefer-offline` when `pnpm-lock.yaml` exists
    - fallback `corepack pnpm install --prefer-offline`
- Updated `.github/workflows/main-auto-release.yml`
- Updated `.github/workflows/dev-auto-release.yml`
- Updated `.github/workflows/manual-release.yml`
  - Same cache and pnpm install strategy as above.

## Observed Failures Reviewed
- Dependabot run `22549986849` (webai-server, update #1263347890) failed with:
  - `tool_feature_not_supported`
  - `tool-name: pnpm`
  - `feature: updating transitive dependencies`
- Dependabot run `22549986545` showed similar behavior for `/webai-mcp`.

## GitHub State Reviewed
- Open issues: `0`
- Open PRs checked: `#47` (`@types/node` update), `#48` (actions updates)

## Validation
- Ran `npm run build:all` locally.
- Result: both package builds passed (TypeScript compilation succeeded).
- Confirmed no remaining `npm ci` usage in targeted workflow/install paths.
- Confirmed workflows now use pnpm install flow consistent with existing pnpm lockfile.

## Follow-Up
1. Let existing open Dependabot PRs run to completion and verify they clear after these config changes.
2. If queueing behavior continues on `🧪 Dev Auto Release`, inspect workflow trigger conditions and self-hosted runner scheduling separately from package management fixes.
