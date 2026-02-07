# Local-Only CI/CD

This repository enforces local-only commit gating.

## Policy

- Full CI runs at `pre-commit`.
- No CI runs at `pre-push`.
- Cloud workflow YAML files are archived under `ci/legacy/github-actions-workflows/`.
- Hook files are dispatchers only; CI logic lives in:
  - `scripts/ci.ps1`
  - `scripts/ci.sh`

## Stage Order

The local pipeline runs this fixed order:

1. `REPO_HYGIENE`
2. `TOOLCHAIN`
3. `DEPS`
4. `FORMAT`
5. `LINT/STATIC`
6. `BUILD`
7. `TEST`
8. `SECURITY/SUPPLY-CHAIN`
9. `DOCS`

## Install Hooks

PowerShell:

```powershell
npm run hooks:install
```

Shell:

```bash
npm run hooks:install:sh
```

This sets `core.hooksPath=.githooks`.

## Config and Validation

- CI config: `ci/ci.config.json`
- Tool versions: `ci/tool-versions.json`
- Docs gate check: `scripts/ci/docs-check.js`

## Running CI Manually

PowerShell:

```powershell
npm run ci
```

Shell:

```bash
npm run ci:sh
```
