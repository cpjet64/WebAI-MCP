# GitHub Actions Review Summary

## Root Cause
- Multiple workflows were running `npm ci --prefer-offline || (rm -f package-lock.json && npm install)`.
- In workspaces without a lockfile, `npm ci` exits with `ENOENT` for package-lock, and the fallback path could not guarantee deterministic dependency installation behavior in all matrix/release contexts.
- The same failure pattern was observed across Dependabot PR run logs.

## Changes Made
- Updated install flow in `.github/workflows/test.yml`.
- Updated install flow in `.github/workflows/main-auto-release.yml`.
- Updated install flow in `.github/workflows/dev-auto-release.yml`.
- Updated install flow in `.github/workflows/manual-release.yml`.

### New Install Logic
```bash
if [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then
  npm ci --prefer-offline
else
  npm install --prefer-offline
fi
```

## Validation
- Ran: `npm run build:all`
- Result: failed in local environment because `tsc` is not available in PATH (`'tsc' is not recognized`).

## Recommended Follow-Up
1. Re-run affected Dependabot PR checks (`npm ci` dependent) to confirm install failures are resolved.
2. If still failing, confirm runtime has `npm` binary with TypeScript CLI available in GitHub runners used by these workflows.
