# WebAI-MCP Scripts

This directory contains comprehensive diagnostic, setup, and platform-specific utilities for WebAI-MCP.

## Available Scripts

### 🔧 `setup-deps.ps1` / `setup-deps.sh` - Dependency Setup (NEW)
Robust dependency setup scripts with fallback mechanisms for local environment reliability.

**Windows PowerShell:**
```powershell
.\scripts\setup-deps.ps1          # Basic setup
.\scripts\setup-deps.ps1 --clean  # Clean setup (removes lock files)
```

**Unix/Linux/macOS:**
```bash
chmod +x scripts/setup-deps.sh
./scripts/setup-deps.sh           # Basic setup
./scripts/setup-deps.sh --clean   # Clean setup (removes lock files)
```

**Features:**
- Robust npm installation pattern: `npm ci --prefer-offline || (rm -f package-lock.json && npm install)`
- Automatic lock file regeneration on corruption
- Build verification
- Cross-platform compatibility
- Same pattern used by maintainers for local setup and diagnostics

### 🔍 `diagnose.js` - Diagnostic Tool
Comprehensive diagnostic tool to identify and troubleshoot common issues.

```bash
node scripts/diagnose.js
npm run diagnose
```

**Features:**
- Node.js and NPM setup validation
- Running process detection
- Port availability checking
- Build status verification
- Server connectivity testing
- Chrome extension validation
- Detailed error reporting with solutions

### 🚀 `setup.js` - Automated Setup
Automates the complete setup process for WebAI-MCP.

```bash
node scripts/setup.js [options]
npm run setup
```

**Options:**
- `--skip-diagnostics` - Skip initial diagnostics
- `--skip-install` - Skip dependency installation
- `--skip-build` - Skip building packages
- `--verbose` - Show detailed output

**Features:**
- Prerequisite checking
- Dependency installation
- Package building
- Platform-specific setup
- Final validation

### 🔧 `platform-setup.js` - Platform-Specific Setup
Handles platform-specific configurations and optimizations.

```bash
node scripts/platform-setup.js
npm run platform-setup
```

**Platform Support:**
- **Windows**: Batch files, Windows Defender guidance, PowerShell policy
- **macOS**: Shell scripts, Xcode tools, Homebrew integration
- **Linux**: Systemd services, package manager detection, tool validation

### ✅ `validate-installation.js` - Installation Validator
Comprehensive validation of the entire WebAI-MCP setup.

```bash
node scripts/validate-installation.js
npm run validate
```

**Validation Categories:**
- Prerequisites (Node.js, NPM, browsers)
- Project structure
- Dependencies
- Build artifacts
- Configuration
- Functionality

## Enhanced NPM Scripts (NEW)

The root package.json now includes enhanced dependency management scripts:

```bash
# Install all dependencies across workspaces
npm run install:all

# Build all packages
npm run build:all

# Clean all package-lock.json files (cross-platform)
npm run clean:locks

# Reset dependencies (clean + install)
npm run reset:deps
```

These scripts provide the same robust installation patterns used for local verification.

## Quick Start

### Full Setup (Recommended)
```bash
# Run complete setup process
npm run full-setup
```

This runs:
1. `setup.js` - Install dependencies and build packages
2. `platform-setup.js` - Configure platform-specific settings
3. `validate-installation.js` - Validate the complete installation

### Individual Scripts

```bash
# Just diagnose issues
npm run diagnose

# Setup with verbose output
npm run setup:verbose

# Quick setup (skip diagnostics)
npm run setup:quick

# Platform-specific setup only
npm run platform-setup

# Validate installation only
npm run validate
```

## Platform-Specific Files

### Windows
- `scripts/windows/start-server.bat` - Start server batch file
- `scripts/windows/diagnose.bat` - Diagnostic batch file

### macOS
- `scripts/macos/start-server.sh` - Start server shell script

### Linux
- `scripts/linux/webai-server.service` - Systemd service file

## Troubleshooting

### Common Issues

1. **"Node.js version too old"**
   ```bash
   # Install Node.js 18 or higher
   # Visit: https://nodejs.org/
   ```

2. **"NPX not found"**
   ```bash
   # Reinstall Node.js with NPM
   npm install -g npm@latest
   ```

3. **"Build artifacts missing"**
   ```bash
   # Build packages
   cd webai-mcp && npm run build
   cd ../webai-server && npm run build
   ```

4. **"Server not running"**
   ```bash
   # Start the server
   npx @cpjet64/webai-server
   ```

5. **"Chrome extension not found"**
   - Open Chrome → `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" → Select `chrome-extension` folder

### Getting Help

1. **Run diagnostics first:**
   ```bash
   npm run diagnose
   ```

2. **Check validation:**
   ```bash
   npm run validate
   ```

3. **Platform-specific issues:**
   ```bash
   npm run platform-setup
   ```

4. **Full reset and setup:**
   ```bash
   npm run full-setup
   ```

## Environment Variables

The scripts respect these environment variables:

- `SERVER_HOST` - Server host (default: 0.0.0.0)
- `NETWORK_TIMEOUT` - Network timeout in ms (default: 30000)
- `NETWORK_RETRIES` - Network retry count (default: 3)
- `USER_AGENT` - Custom user agent
- `HTTP_PROXY` - HTTP proxy URL
- `HTTPS_PROXY` - HTTPS proxy URL
- `NO_PROXY` - No-proxy list (comma-separated)

## Script Dependencies

The scripts use ES modules and require:
- Node.js 18+
- NPM 8+
- Access to the webai-mcp repository structure

## Development

To modify or extend the scripts:

1. **Add new functionality** to existing scripts
2. **Create new scripts** following the established patterns
3. **Update package.json** with new script entries
4. **Test on all supported platforms**

### Script Structure

Each script follows this pattern:
```javascript
#!/usr/bin/env node

// Imports
import { ... } from '...';

// Constants and utilities
const COLORS = { ... };
const ICONS = { ... };

// Main class
class ScriptName {
  constructor() { ... }

  async runScript() { ... }

  // Helper methods
  private async helperMethod() { ... }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const script = new ScriptName();
  script.runScript().catch(console.error);
}

export default ScriptName;
```

## Local Release Scripts

GitHub Actions automation is now disabled for release. Use these local scripts when preparing manual releases.

- `scripts/local-release.sh` (Linux/macOS)
- `scripts/local-release.ps1` (Windows)
- `scripts/run-local-release.js` (cross-platform dispatcher)

Top-level package scripts:

- `npm run release:local`
- `npm run release:local:unix`
- `npm run release:local:win`

Artifact outputs (default `release-artifacts/`):

- `webai-mcp-v<version>.tgz`
- `webai-server-v<version>.tgz`
- `webai-chrome-extension-v<version>.zip`

Common options:

- `--version <x>` override release version
- `--out <dir>` choose output directory
- `--skip-build` to skip `npm run build:all`
- `--skip-tests` to skip `npm test`
- `--publish` to run local `npm publish` after packaging
- `--tag <value>` npm tag to use when publishing

Publishing remains manual and explicit; no GitHub publish step is triggered automatically.

## Contributing

When adding new scripts or features:

1. Follow the existing code style
2. Add comprehensive error handling
3. Provide user-friendly messages
4. Include platform-specific considerations
5. Update this README
6. Test on Windows, macOS, and Linux

## License

MIT License - see the main project LICENSE file for details.
