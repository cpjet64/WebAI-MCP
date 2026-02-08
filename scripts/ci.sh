#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
source "${SCRIPT_DIR}/ci/common.sh"

cd "${REPO_ROOT}"

stage_repo_hygiene() {
  run_cmd git diff --check --cached

  if command -v rg >/dev/null 2>&1; then
    if rg -n --hidden --glob '!.git' '^(<<<<<<<|=======|>>>>>>>)' >/dev/null 2>&1; then
      log "Merge conflict markers detected."
      return 1
    fi
  else
    if grep -R -n -E '^(<<<<<<<|=======|>>>>>>>)' --exclude-dir=.git . >/dev/null 2>&1; then
      log "Merge conflict markers detected."
      return 1
    fi
  fi

  if [[ -d ".github/workflows" ]] && find ".github/workflows" -maxdepth 1 -type f \( -name "*.yml" -o -name "*.yaml" \) | grep -q .; then
    log "Active cloud workflows detected in .github/workflows. Local-only policy requires this directory to be empty of workflow YAML."
    return 1
  fi
}

stage_toolchain() {
  run_cmd node --version
  run_cmd npm --version

  run_cmd node -e "const major=parseInt(process.versions.node.split('.')[0],10); if (major < 18) { console.error('Node.js >=18 required'); process.exit(1); }"
}

stage_deps() {
  if [[ -f "package-lock.json" ]]; then
    run_cmd npm ci
  else
    log "No root package-lock.json found; skipping root npm ci."
  fi
  run_cmd npm --prefix webai-mcp ci
  run_cmd npm --prefix webai-server ci
}

stage_format() {
  run_cmd npm --prefix webai-mcp run --if-present format
  run_cmd npm --prefix webai-server run --if-present format
}

stage_lint_static() {
  run_cmd npm --prefix webai-mcp run --if-present lint
  run_cmd npm --prefix webai-server run --if-present lint
  run_cmd node webai-mcp/node_modules/typescript/bin/tsc --noEmit -p webai-mcp/tsconfig.json
  run_cmd node webai-server/node_modules/typescript/bin/tsc --noEmit -p webai-server/tsconfig.json
}

stage_build() {
  run_cmd npm --prefix webai-mcp run build
  run_cmd npm --prefix webai-server run build
}

stage_test() {
  run_cmd node scripts/ci/smoke-test.js
  run_cmd node scripts/ci/report-format-test.js
  run_cmd node scripts/ci/server-config-test.js
}

stage_security_supply_chain() {
  run_cmd npm --prefix webai-mcp audit --audit-level=high
  run_cmd npm --prefix webai-server audit --audit-level=high
}

stage_docs() {
  run_cmd node scripts/ci/docs-check.js
  run_cmd node scripts/ci/naming-check.js
}

run_stage "REPO_HYGIENE" stage_repo_hygiene
run_stage "TOOLCHAIN" stage_toolchain
run_stage "DEPS" stage_deps
run_stage "FORMAT" stage_format
run_stage "LINT/STATIC" stage_lint_static
run_stage "BUILD" stage_build
run_stage "TEST" stage_test
run_stage "SECURITY/SUPPLY-CHAIN" stage_security_supply_chain
run_stage "DOCS" stage_docs

log ""
log "Local CI pipeline completed successfully."
