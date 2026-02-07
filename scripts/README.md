# WebAI-MCP Scripts

This directory contains comprehensive diagnostic, setup, and platform-specific utilities for WebAI-MCP.

## Available Scripts

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
import path from 'path';
import { pathToFileURL } from 'url';

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

const isDirectRun = (() => {
  if (!process.argv[1]) return false;
  try {
    return import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
  } catch {
    return false;
  }
})();

// CLI interface
if (isDirectRun) {
  const script = new ScriptName();
  script.runScript().catch(console.error);
}

export default ScriptName;
```

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
