#!/usr/bin/env node

/**
 * WebAI-MCP Setup Automation Script
 *
 * Automates the setup process for webai-mcp including:
 * - Dependency installation
 * - Building packages
 * - Validation
 * - Platform-specific configurations
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import DiagnosticTool from './diagnose.js';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const ICONS = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  rocket: '🚀',
  tools: '🔧',
  package: '📦',
  build: '🏗️'
};

class SetupTool {
  constructor(options = {}) {
    this.options = {
      skipDiagnostics: false,
      skipInstall: false,
      skipBuild: false,
      verbose: false,
      ...options
    };
    this.platform = os.platform();
    this.errors = [];
    this.warnings = [];
  }

  log(message, color = 'reset', icon = '') {
    const colorCode = COLORS[color] || COLORS.reset;
    console.log(`${colorCode}${icon} ${message}${COLORS.reset}`);
  }

  logSection(title) {
    console.log(`\n${COLORS.cyan}${COLORS.bright}=== ${title} ===${COLORS.reset}`);
  }

  async runSetup() {
    this.log('Browser Tools MCP Setup Tool', 'bright', ICONS.rocket);
    this.log(`Platform: ${this.platform}`, 'blue', ICONS.info);
    console.log();

    try {
      // Run initial diagnostics
      if (!this.options.skipDiagnostics) {
        await this.runInitialDiagnostics();
      }

      // Check prerequisites
      await this.checkPrerequisites();

      // Install dependencies
      if (!this.options.skipInstall) {
        await this.installDependencies();
      }

      // Build packages
      if (!this.options.skipBuild) {
        await this.buildPackages();
      }

      // Platform-specific setup
      await this.platformSpecificSetup();

      // Final validation
      await this.finalValidation();

      // Success summary
      this.showSuccessSummary();

    } catch (error) {
      this.log(`Setup failed: ${error.message}`, 'red', ICONS.error);
      process.exit(1);
    }
  }

  async runInitialDiagnostics() {
    this.logSection('Initial Diagnostics');

    try {
      const diagnostic = new DiagnosticTool();
      await diagnostic.runDiagnostics();

      // Check if there are critical issues
      if (diagnostic.issues.length > 0) {
        this.log('Found existing issues. Setup will attempt to fix them.', 'yellow', ICONS.warning);
      }
    } catch (error) {
      this.log('Initial diagnostics failed, continuing with setup...', 'yellow', ICONS.warning);
    }
  }

  async checkPrerequisites() {
    this.logSection('Checking Prerequisites');

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    if (majorVersion >= 18) {
      this.log(`Node.js ${nodeVersion} ✓`, 'green', ICONS.success);
    } else {
      throw new Error(`Node.js ${nodeVersion} is too old. Please upgrade to Node.js 18 or higher.`);
    }

    // Check npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      this.log(`NPM ${npmVersion} ✓`, 'green', ICONS.success);
    } catch (error) {
      throw new Error('NPM is not available. Please install Node.js with NPM.');
    }

    // Check git (optional but recommended)
    try {
      const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
      this.log(`Git available ✓`, 'green', ICONS.success);
    } catch (error) {
      this.log('Git not found (optional)', 'yellow', ICONS.warning);
    }

    // Check if we're in the right directory
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const mcpPackagePath = path.join(process.cwd(), 'webai-mcp', 'package.json');
    const serverPackagePath = path.join(process.cwd(), 'webai-server', 'package.json');

    if (!fs.existsSync(mcpPackagePath) || !fs.existsSync(serverPackagePath)) {
      throw new Error('Please run this script from the webai-mcp repository root directory.');
    }

    this.log('Repository structure ✓', 'green', ICONS.success);
  }

  async installDependencies() {
    this.logSection('Installing Dependencies');

    const packages = [
      { name: 'MCP Server', path: 'webai-mcp' },
      { name: 'WebAI Server', path: 'webai-server' }
    ];

    for (const pkg of packages) {
      this.log(`Installing ${pkg.name} dependencies...`, 'blue', ICONS.package);

      try {
        const cwd = path.join(process.cwd(), pkg.path);

        // Check if package-lock.json exists, use npm ci if it does, npm install if not
        const lockFilePath = path.join(cwd, 'package-lock.json');
        const command = fs.existsSync(lockFilePath) ? 'npm ci' : 'npm install';

        if (this.options.verbose) {
          this.log(`Running: ${command} in ${pkg.path}`, 'blue', ICONS.info);
        }

        execSync(command, {
          cwd,
          stdio: this.options.verbose ? 'inherit' : 'pipe',
          encoding: 'utf8'
        });

        this.log(`${pkg.name} dependencies installed ✓`, 'green', ICONS.success);
      } catch (error) {
        const errorMessage = error.message || 'Unknown error';
        this.errors.push(`Failed to install ${pkg.name} dependencies: ${errorMessage}`);
        throw new Error(`Failed to install ${pkg.name} dependencies`);
      }
    }
  }

  async buildPackages() {
    this.logSection('Building Packages');

    const packages = [
      { name: 'MCP Server', path: 'webai-mcp' },
      { name: 'WebAI Server', path: 'webai-server' }
    ];

    for (const pkg of packages) {
      this.log(`Building ${pkg.name}...`, 'blue', ICONS.build);

      try {
        const cwd = path.join(process.cwd(), pkg.path);

        if (this.options.verbose) {
          this.log(`Running: npm run build in ${pkg.path}`, 'blue', ICONS.info);
        }

        execSync('npm run build', {
          cwd,
          stdio: this.options.verbose ? 'inherit' : 'pipe',
          encoding: 'utf8'
        });

        // Verify build output
        const distPath = path.join(cwd, 'dist');
        if (fs.existsSync(distPath)) {
          this.log(`${pkg.name} built successfully ✓`, 'green', ICONS.success);
        } else {
          throw new Error('Build completed but dist directory not found');
        }
      } catch (error) {
        const errorMessage = error.message || 'Unknown error';
        this.errors.push(`Failed to build ${pkg.name}: ${errorMessage}`);
        throw new Error(`Failed to build ${pkg.name}`);
      }
    }
  }

  async platformSpecificSetup() {
    this.logSection('Platform-Specific Setup');

    switch (this.platform) {
      case 'win32':
        await this.windowsSetup();
        break;
      case 'darwin':
        await this.macosSetup();
        break;
      case 'linux':
        await this.linuxSetup();
        break;
      default:
        this.log(`Platform ${this.platform} - using default setup`, 'blue', ICONS.info);
    }
  }

  async windowsSetup() {
    this.log('Configuring for Windows...', 'blue', ICONS.tools);

    // Check for Windows Defender exclusions (informational)
    this.log('Consider adding Windows Defender exclusions for:', 'yellow', ICONS.warning);
    this.log('  - Node.js installation directory', 'yellow', '  ');
    this.log('  - NPM global modules directory', 'yellow', '  ');
    this.log('  - This project directory', 'yellow', '  ');

    // Check for WSL
    try {
      execSync('wsl --version', { stdio: 'pipe' });
      this.log('WSL detected - setup should work in both Windows and WSL environments', 'green', ICONS.success);
    } catch (error) {
      this.log('WSL not detected (this is fine)', 'blue', ICONS.info);
    }
  }

  async macosSetup() {
    this.log('Configuring for macOS...', 'blue', ICONS.tools);

    // Check for Homebrew
    try {
      execSync('brew --version', { stdio: 'pipe' });
      this.log('Homebrew detected ✓', 'green', ICONS.success);
    } catch (error) {
      this.log('Homebrew not found (optional)', 'yellow', ICONS.warning);
    }

    // Check for Xcode Command Line Tools
    try {
      execSync('xcode-select --version', { stdio: 'pipe' });
      this.log('Xcode Command Line Tools ✓', 'green', ICONS.success);
    } catch (error) {
      this.log('Xcode Command Line Tools not found - may be needed for some dependencies', 'yellow', ICONS.warning);
    }
  }

  async linuxSetup() {
    this.log('Configuring for Linux...', 'blue', ICONS.tools);

    // Check for common tools
    const tools = ['curl', 'wget', 'unzip'];

    for (const tool of tools) {
      try {
        execSync(`which ${tool}`, { stdio: 'pipe' });
        this.log(`${tool} available ✓`, 'green', ICONS.success);
      } catch (error) {
        this.log(`${tool} not found (may be needed)`, 'yellow', ICONS.warning);
      }
    }
  }

  async finalValidation() {
    this.logSection('Final Validation');

    // Run diagnostics again to verify everything is working
    try {
      const diagnostic = new DiagnosticTool();
      await diagnostic.runDiagnostics();

      if (diagnostic.issues.length === 0) {
        this.log('All validation checks passed ✓', 'green', ICONS.success);
      } else {
        this.log(`${diagnostic.issues.length} issues remain after setup`, 'yellow', ICONS.warning);
        diagnostic.issues.forEach(issue => {
          this.warnings.push(issue);
        });
      }
    } catch (error) {
      this.log('Final validation failed, but setup may still be functional', 'yellow', ICONS.warning);
    }
  }

  showSuccessSummary() {
    this.logSection('Setup Complete!');

    if (this.errors.length === 0 && this.warnings.length === 0) {
      this.log('🎉 Browser Tools MCP setup completed successfully!', 'green', ICONS.rocket);
    } else {
      this.log('Setup completed with some issues:', 'yellow', ICONS.warning);

      if (this.errors.length > 0) {
        this.log('Errors:', 'red', ICONS.error);
        this.errors.forEach(error => this.log(`  ${error}`, 'red', '  '));
      }

      if (this.warnings.length > 0) {
        this.log('Warnings:', 'yellow', ICONS.warning);
        this.warnings.forEach(warning => this.log(`  ${warning}`, 'yellow', '  '));
      }
    }

    console.log();
    this.log('Next steps:', 'cyan', ICONS.info);
    this.log('1. Start the server: npx @cpjet64/webai-server', 'blue', '  ');
    this.log('2. Install the Chrome extension from the chrome-extension folder', 'blue', '  ');
    this.log('3. Configure your MCP client (Cursor, Claude Desktop, etc.)', 'blue', '  ');
    console.log();
    this.log('For troubleshooting, run: node scripts/diagnose.js', 'blue', ICONS.tools);
  }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {
    skipDiagnostics: args.includes('--skip-diagnostics'),
    skipInstall: args.includes('--skip-install'),
    skipBuild: args.includes('--skip-build'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Browser Tools MCP Setup Tool

Usage: node scripts/setup.js [options]

Options:
  --skip-diagnostics    Skip initial diagnostics
  --skip-install        Skip dependency installation
  --skip-build          Skip building packages
  --verbose, -v         Show detailed output
  --help, -h            Show this help message

Examples:
  node scripts/setup.js                    # Full setup
  node scripts/setup.js --verbose          # Full setup with detailed output
  node scripts/setup.js --skip-install     # Skip dependency installation
`);
    process.exit(0);
  }

  const setup = new SetupTool(options);
  setup.runSetup().catch(console.error);
}

export default SetupTool;
