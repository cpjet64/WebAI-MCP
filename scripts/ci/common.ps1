$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Stage {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Name
  )

  Write-Host ""
  Write-Host "=============================="
  Write-Host "STAGE: $Name"
  Write-Host "=============================="
}

function Invoke-Step {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Command
  )

  Write-Host "+ $Command"
  $global:LASTEXITCODE = 0
  Invoke-Expression $Command
  if ($LASTEXITCODE -ne 0) {
    throw "Command failed with exit code ${LASTEXITCODE}: $Command"
  }
}

function Assert-FileExists {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
    throw "Missing file: $Path"
  }
}

function Assert-DirectoryExists {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Path
  )

  if (-not (Test-Path -LiteralPath $Path -PathType Container)) {
    throw "Missing directory: $Path"
  }
}
