param(
    [string]$OutDir = "$PSScriptRoot\..\release-artifacts",
    [string]$Version = "",
    [switch]$SkipBuild,
    [switch]$SkipTests,
    [switch]$SkipHealth,
    [switch]$Publish,
    [string]$Tag = "latest",
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$RemainingArguments
)

Set-StrictMode -Version Latest

$ErrorActionPreference = "Stop"
$RootDir = Join-Path $PSScriptRoot ".." | Resolve-Path
if ($RemainingArguments) {
    for ($i = 0; $i -lt $RemainingArguments.Length; $i++) {
        $arg = $RemainingArguments[$i]

        switch ($arg.ToLowerInvariant()) {
            "--out" {
                if ($i + 1 -ge $RemainingArguments.Length) {
                    throw "--out requires a directory value."
                }
                $OutDir = $RemainingArguments[$i + 1]
                $i++
            }
            "--version" {
                if ($i + 1 -ge $RemainingArguments.Length) {
                    throw "--version requires a value."
                }
                $Version = $RemainingArguments[$i + 1]
                $i++
            }
            "--skip-build" {
                $SkipBuild = $true
            }
            "--skip-tests" {
                $SkipTests = $true
            }
            "--skip-health" {
                $SkipHealth = $true
            }
            "--publish" {
                $Publish = $true
            }
            "--tag" {
                if ($i + 1 -ge $RemainingArguments.Length) {
                    throw "--tag requires a value."
                }
                $Tag = $RemainingArguments[$i + 1]
                $i++
            }
            "--help" {
                Write-Host "Usage:`n  .\scripts\local-release.ps1 [options]`n`nOptions:`n  --out <dir>            Output directory for release assets (default: ./release-artifacts)`n  --version <value>      Override package version used for filenames`n  --skip-tests           Skip npm test`n  --skip-build           Skip npm run build:all`n  --skip-health          Skip repository health preflight (npm run health:check)`n  --publish              Publish packages after packaging`n  --tag <value>          NPM publish tag (default: latest)"
                exit 0
            }
            "-out" {
                if ($i + 1 -ge $RemainingArguments.Length) {
                    throw "-out requires a directory value."
                }
                $OutDir = $RemainingArguments[$i + 1]
                $i++
            }
            "-version" {
                if ($i + 1 -ge $RemainingArguments.Length) {
                    throw "-version requires a value."
                }
                $Version = $RemainingArguments[$i + 1]
                $i++
            }
            "-skip-build" {
                $SkipBuild = $true
            }
            "-skip-tests" {
                $SkipTests = $true
            }
            "-skip-health" {
                $SkipHealth = $true
            }
            "-publish" {
                $Publish = $true
            }
            "-tag" {
                if ($i + 1 -ge $RemainingArguments.Length) {
                    throw "-tag requires a value."
                }
                $Tag = $RemainingArguments[$i + 1]
                $i++
            }
            default {
                if ($arg.StartsWith("--") -or $arg.StartsWith("-")) {
                    throw "Unknown option: $arg"
                }
            }
        }
    }
}
if (-not (Test-Path $OutDir)) {
    New-Item -ItemType Directory -Path $OutDir -Force | Out-Null
}

function Invoke-BuildCommand {
    param([string]$Command, [string]$WorkingDirectory)

    Write-Host "==> $Command"
    if ([string]::IsNullOrWhiteSpace($WorkingDirectory)) {
        Invoke-Expression $Command
    } else {
        Push-Location $WorkingDirectory
        try {
            Invoke-Expression $Command
        } finally {
            Pop-Location
        }
    }
}

function Get-LatestPackageArtifact {
    param([string]$Directory)
    return (Get-ChildItem -Path $Directory -Filter "*.tgz" | Sort-Object LastWriteTime | Select-Object -Last 1)
}

if ([string]::IsNullOrWhiteSpace($Version)) {
    $versionPath = Join-Path $RootDir "webai-server/package.json"
    $versionJson = Get-Content $versionPath -Raw | ConvertFrom-Json
    $Version = $versionJson.version
}

if (-not $SkipHealth.IsPresent) {
    Invoke-BuildCommand "npm run health:check -- --strict"
}

if (-not $SkipBuild.IsPresent) {
    Invoke-BuildCommand "npm run build:all"
}

if (-not $SkipTests.IsPresent) {
    Invoke-BuildCommand "npm test"
}

Set-Location $RootDir

$webaiMcpOut = Join-Path $OutDir "webai-mcp-v$Version.tgz"
$webaiServerOut = Join-Path $OutDir "webai-server-v$Version.tgz"

Set-Location (Join-Path $RootDir "webai-mcp")
Invoke-BuildCommand "npm pack"
$mcpArtifact = Get-LatestPackageArtifact -Directory (Get-Location).Path
if (-not $mcpArtifact) {
    throw "Failed to create webai-mcp package artifact."
}
Move-Item $mcpArtifact.FullName $webaiMcpOut -Force

Set-Location (Join-Path $RootDir "webai-server")
Invoke-BuildCommand "npm pack"
$serverArtifact = Get-LatestPackageArtifact -Directory (Get-Location).Path
if (-not $serverArtifact) {
    throw "Failed to create webai-server package artifact."
}
Move-Item $serverArtifact.FullName $webaiServerOut -Force

Set-Location (Join-Path $RootDir "chrome-extension")
$extensionZip = Join-Path $OutDir "webai-chrome-extension-v$Version.zip"
if (Test-Path $extensionZip) {
    Remove-Item -Path $extensionZip -Force
}
Compress-Archive -Path "*" -DestinationPath $extensionZip -Force

if ($Publish.IsPresent) {
    Invoke-BuildCommand "npm publish `"$webaiMcpOut`" --access public --tag $Tag"
    Invoke-BuildCommand "npm publish `"$webaiServerOut`" --access public --tag $Tag"
    Write-Host "==> Published webai-mcp and webai-server with tag '$Tag'"
}

Set-Location $RootDir
Write-Host ""
Write-Host "Local release assets are ready:"
Write-Host "  - $webaiMcpOut"
Write-Host "  - $webaiServerOut"
Write-Host "  - $extensionZip"
if (-not $Publish.IsPresent) {
    Write-Host "Artifacts are prepared for manual publishing/uploading."
    Write-Host "Use --publish to perform local npm publish now."
}
