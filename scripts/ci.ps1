$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Resolve-Path (Join-Path $ScriptDir "..")
. (Join-Path $ScriptDir "ci/common.ps1")

Set-Location $RepoRoot

function Invoke-RepoHygiene {
  Invoke-Step "git diff --check --cached"

  $hasConflictMarkers = $false
  if (Get-Command rg -ErrorAction SilentlyContinue) {
    try {
      rg -n --hidden --glob '!.git' '^(<<<<<<<|=======|>>>>>>>)' | Out-Null
      if ($LASTEXITCODE -eq 0) {
        $hasConflictMarkers = $true
      }
    } catch {
      if ($LASTEXITCODE -eq 0) {
        $hasConflictMarkers = $true
      }
    }
  } else {
    $files = Get-ChildItem -Recurse -File -Force | Where-Object { $_.FullName -notmatch '\\.git\\' }
    foreach ($file in $files) {
      if (Select-String -Path $file.FullName -Pattern '^(<<<<<<<|=======|>>>>>>>)' -Quiet) {
        $hasConflictMarkers = $true
        break
      }
    }
  }

  if ($hasConflictMarkers) {
    throw "Merge conflict markers detected."
  }

  if (Test-Path ".github/workflows") {
    $activeWorkflowFiles = @(Get-ChildItem ".github/workflows" -File -ErrorAction SilentlyContinue | Where-Object {
      $_.Extension -in @(".yml", ".yaml")
    })
    if ($activeWorkflowFiles.Count -gt 0) {
      throw "Active cloud workflows detected in .github/workflows. Local-only policy requires this directory to be empty of workflow YAML."
    }
  }
}

function Invoke-Toolchain {
  Invoke-Step "node --version"
  Invoke-Step "npm --version"
  Invoke-Step "node -e `"const major=parseInt(process.versions.node.split('.')[0],10); if (major < 18) { console.error('Node.js >=18 required'); process.exit(1); }`""
}

function Invoke-Dependencies {
  if (Test-Path "package-lock.json") {
    Invoke-Step "npm ci"
  } else {
    Write-Host "No root package-lock.json found; skipping root npm ci."
  }
  Invoke-Step "npm --prefix webai-mcp ci"
  Invoke-Step "npm --prefix webai-server ci"
}

function Invoke-Format {
  Invoke-Step "npm --prefix webai-mcp run --if-present format"
  Invoke-Step "npm --prefix webai-server run --if-present format"
}

function Invoke-LintStatic {
  Invoke-Step "npm --prefix webai-mcp run --if-present lint"
  Invoke-Step "npm --prefix webai-server run --if-present lint"
  Invoke-Step "node webai-mcp/node_modules/typescript/bin/tsc --noEmit -p webai-mcp/tsconfig.json"
  Invoke-Step "node webai-server/node_modules/typescript/bin/tsc --noEmit -p webai-server/tsconfig.json"
}

function Invoke-BuildStage {
  Invoke-Step "npm --prefix webai-mcp run build"
  Invoke-Step "npm --prefix webai-server run build"
}

function Invoke-TestStage {
  Invoke-Step "node scripts/ci/smoke-test.js"
  Invoke-Step "node scripts/ci/report-format-test.js"
}

function Invoke-SecuritySupplyChain {
  Invoke-Step "npm --prefix webai-mcp audit --audit-level=high"
  Invoke-Step "npm --prefix webai-server audit --audit-level=high"
}

function Invoke-DocsStage {
  Invoke-Step "node scripts/ci/docs-check.js"
  Invoke-Step "node scripts/ci/naming-check.js"
}

Write-Stage "REPO_HYGIENE"
Invoke-RepoHygiene

Write-Stage "TOOLCHAIN"
Invoke-Toolchain

Write-Stage "DEPS"
Invoke-Dependencies

Write-Stage "FORMAT"
Invoke-Format

Write-Stage "LINT/STATIC"
Invoke-LintStatic

Write-Stage "BUILD"
Invoke-BuildStage

Write-Stage "TEST"
Invoke-TestStage

Write-Stage "SECURITY/SUPPLY-CHAIN"
Invoke-SecuritySupplyChain

Write-Stage "DOCS"
Invoke-DocsStage

Write-Host ""
Write-Host "Local CI pipeline completed successfully."
