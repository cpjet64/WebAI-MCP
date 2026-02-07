# Local-Only Automation Policy

This repository uses local-only CI/CD for commit gating.

## Current State

- Active workflow YAML files are intentionally removed from `.github/workflows/`.
- Historical GitHub Actions workflows are preserved at:
  - `ci/legacy/github-actions-workflows/`

## Why

The project now enforces a single local gate:

- `pre-commit` must pass the full CI pipeline before commit is accepted.
- `pre-push` does not run CI.
