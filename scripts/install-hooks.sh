#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

git config core.hooksPath .githooks

chmod +x .githooks/pre-commit .githooks/pre-push scripts/ci.sh scripts/install-hooks.sh

echo "Installed local git hooks path: .githooks"
