# GitHub Actions Review Summary

## Scope
- Reviewed failing Dependabot and workflow behavior from recent runs.
- Confirmed package-manager-alignment fixes already applied to GitHub automation.
- Kept changes limited to GitHub-specific automation surfaces.

## Root Cause
- Dependabot `npm_and_yarn` jobs in `/webai-mcp` and `/webai-server` were configured to allow indirect dependency updates.
- Dependabot runs against pnpm and this triggered `tool_feature_not_supported` errors for transitive updates.
- Build/release workflows previously used `npm ci` / `npm install` assumptions that did not match the pnpm lockfile setup.

## Changes Applied (already present in tracked state)
- Updated `.github/dependabot.yml`
  - Kept existing `group` and schedule settings.
  - Set npm ecosystem update policy to `dependency-type: direct` only for:
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
- Dependabot run `22549986849` (webai-server, `npm_and_yarn`) failed with:
  - `tool_feature_not_supported`
  - `tool-name: pnpm`
  - `feature: updating transitive dependencies`
- Dependabot run `22549986545` showed similar behavior for `/webai-mcp`.
- Dependabot runs `21788968405`, `21788964768`, and `21788961512` show similar historical transitive-update failures.

## GitHub State Reviewed
- Open issues: `0` (queried at time of run)
- Open PRs checked: `#46`, `#47`, `#48`, `#53`, `#56`, `#72` (all Dependabot updates)

## Validation
- Queried failed action runs via GitHub Actions API; current remaining failures are tied to historical Dependabot transitive update attempts.
- Confirmed no remaining `npm ci` usage in targeted workflow/install paths.
- Confirmed workflows now use pnpm install flow consistent with existing pnpm lockfile.
- Verified open PR status checks are not showing immediate new failures beyond known Dependabot queue/update behavior.

## Current status
- No additional automation code changes required this pass beyond the existing pnpm/direct-only dependency policy.
- Recommend re-running Dependabot queue only if these transitive-update PRs remain blocked after policy enforcement.

## Follow-Up
1. Let existing open Dependabot PRs run to completion and verify they clear under current config.
2. If queueing behavior persists on `🧪 Dev Auto Release`, inspect workflow trigger conditions and runner scheduling separately from package-management fixes.
