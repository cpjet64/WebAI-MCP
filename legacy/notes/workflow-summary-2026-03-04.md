# GitHub Workflow Summary

## Current state (2026-03-04)

GitHub Actions release automation has been retired.

- No CI/release workflows are defined under `.github/workflows/`.
- Builds, packaging, and release artifact generation are now executed manually.
- Upload and publish operations are performed outside GitHub Actions.

## Local release model

Use the local release scripts in `scripts/`:

- `npm run release:local` (recommended cross-platform entrypoint)
- `npm run release:local:unix`
- `npm run release:local:win`

The local release scripts now run a strict repository health preflight (`npm run health:check -- --strict`) before packaging, with `--skip-health` available for emergency bypass.

The local release output (default: `release-artifacts/`) includes:

- `webai-mcp-v<version>.tgz`
- `webai-server-v<version>.tgz`
- `webai-chrome-extension-v<version>.zip`

After packaging, upload artifacts manually and publish as needed.
