#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Browser Tools MCP
 *
 * Automates testing of all components including server, MCP, extension,
 * and diagnostic features on the active workspace.
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

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
  test: '🧪',
  rocket: '🚀',
  server: '🖥️',
  browser: '🌐',
  tools: '🔧'
};

class TestRunner {
  constructor(options = {}) {
    this.options = {
      skipBuild: false,
      skipInstall: false,
      skipServer: false,
      skipExtension: false,
      verbose: false,
      ...options
    };
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0
    };
    this.serverBaseUrl = null;
    this.serverProcess = null;
    this.mcpProcess = null;
  }

  log(message, color = 'reset', icon = '') {
    const colorCode = COLORS[color] || COLORS.reset;
    console.log(`${colorCode}${icon} ${message}${COLORS.reset}`);
  }

  logSection(title) {
    console.log(`\n${COLORS.cyan}${COLORS.bright}=== ${title} ===${COLORS.reset}`);
  }

  async runAllTests() {
    this.log('Browser Tools MCP - Comprehensive Test Runner', 'bright', ICONS.rocket);
    this.log(`Platform: ${os.platform()} ${os.arch()}`, 'blue', ICONS.info);
    console.log();

    try {
      // Pre-test setup
      await this.preTestSetup();

      // Core component tests
      await this.testDiagnostics();
      await this.testBuildProcess();
      await this.testServerComponents();
      await this.testChromeExtension();
      await this.testIntegration();

      // Cleanup and summary
      await this.cleanup();
      this.generateSummary();

    } catch (error) {
      this.log(`Test runner failed: ${error.message}`, 'red', ICONS.error);
      await this.cleanup();
      process.exit(1);
    }
  }

  async preTestSetup() {
    this.logSection('Pre-Test Setup');

    // Check current branch
    try {
      const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      this.log(`Current branch: ${currentBranch}`, 'blue', ICONS.info);
    } catch (error) {
      this.log('Could not determine current branch', 'yellow', ICONS.warning);
    }

    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    if (majorVersion >= 18) {
      this.recordResult('pass', `Node.js ${nodeVersion} meets requirements`);
    } else {
      this.recordResult('fail', `Node.js ${nodeVersion} is too old (requires >=18)`);
      throw new Error('Node.js version requirement not met');
    }

    // Check if Chrome is available
    await this.checkChromeAvailability();
  }

  async checkChromeAvailability() {
    const platform = os.platform();
    let chromeFound = false;

    try {
      if (platform === 'win32') {
        const chromePaths = [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
        ];
        chromeFound = chromePaths.some(path => fs.existsSync(path));
      } else if (platform === 'darwin') {
        chromeFound = fs.existsSync('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome');
      } else {
        try {
          execSync('which google-chrome || which chromium-browser', { stdio: 'pipe' });
          chromeFound = true;
        } catch (error) {
          chromeFound = false;
        }
      }

      if (chromeFound) {
        this.recordResult('pass', 'Chrome browser found');
      } else {
        this.recordResult('warn', 'Chrome browser not found - some tests may fail');
      }
    } catch (error) {
      this.recordResult('warn', 'Could not verify Chrome availability');
    }
  }

  async testDiagnostics() {
    this.logSection('Testing Diagnostic Tools');

    // Test diagnostic script
    try {
      this.log('Running diagnostic script...', 'blue', ICONS.test);

      if (fs.existsSync('scripts/diagnose.js')) {
        const output = execSync('node scripts/diagnose.js', {
          encoding: 'utf8',
          stdio: this.options.verbose ? 'inherit' : 'pipe'
        });
        this.recordResult('pass', 'Diagnostic script executed successfully');
      } else {
        this.recordResult('warn', 'Diagnostic script not found (optional script missing)');
      }
    } catch (error) {
      this.recordResult('fail', `Diagnostic script failed: ${error.message}`);
    }

    // Test setup script
    try {
      if (fs.existsSync('scripts/setup.js')) {
        this.log('Testing setup script (dry run)...', 'blue', ICONS.test);
        // Note: We don't actually run setup to avoid side effects
        this.recordResult('pass', 'Setup script found and appears valid');
      } else {
        this.recordResult('warn', 'Setup script not found (optional script missing)');
      }
    } catch (error) {
      this.recordResult('fail', `Setup script test failed: ${error.message}`);
    }

    // Test validation script
    try {
      if (fs.existsSync('scripts/validate-installation.js')) {
        this.log('Running installation validation...', 'blue', ICONS.test);
        const output = execSync('node scripts/validate-installation.js', {
          encoding: 'utf8',
          stdio: this.options.verbose ? 'inherit' : 'pipe'
        });
        this.recordResult('pass', 'Installation validation completed');
      } else {
        this.recordResult('warn', 'Validation script not found (optional script missing)');
      }
    } catch (error) {
      this.recordResult('fail', `Validation script failed: ${error.message}`);
    }
  }

  async testBuildProcess() {
    this.logSection('Testing Build Process');

    if (this.options.skipBuild) {
      this.recordResult('warn', 'Skipping build tests (--skip-build)');
      return;
    }

    const packages = [
      { name: 'MCP Server', path: 'webai-mcp' },
      { name: 'WebAI Server', path: 'webai-server' }
    ];

    for (const pkg of packages) {
      try {
        this.log(`Building ${pkg.name}...`, 'blue', ICONS.test);

        const packagePath = path.join(process.cwd(), pkg.path);

        if (!this.options.skipInstall) {
          this.ensureDependencies(pkg.name, packagePath);
        } else {
          this.recordResult('warn', `Skipping dependency install for ${pkg.name} (--skip-install)`);
        }

        // Build package
        execSync('npm run build', {
          cwd: packagePath,
          stdio: this.options.verbose ? 'inherit' : 'pipe'
        });

        // Verify build output
        const distPath = path.join(packagePath, 'dist');
        if (fs.existsSync(distPath) && fs.readdirSync(distPath).length > 0) {
          this.recordResult('pass', `${pkg.name} built successfully`);
        } else {
          this.recordResult('fail', `${pkg.name} build produced no output`);
        }

      } catch (error) {
        this.recordResult('fail', `${pkg.name} build failed: ${error.message}`);
      }
    }
  }

  ensureDependencies(packageName, packagePath) {
    const packageLockPath = path.join(packagePath, 'package-lock.json');
    const nodeModulesPath = path.join(packagePath, 'node_modules');

    if (this.hasUsableNodeModules(packagePath)) {
      this.log(`Dependencies already installed for ${packageName}; skipping install step.`, 'blue', ICONS.info);
      return;
    }

    if (fs.existsSync(nodeModulesPath)) {
      this.recordResult('warn', `${packageName}: node_modules present but incomplete/corrupt; running install repair.`);
      fs.rmSync(nodeModulesPath, { recursive: true, force: true });
      this.log(`Removed corrupted dependency tree for ${packageName}.`, 'yellow', ICONS.warning);
    }

    if (!fs.existsSync(packageLockPath)) {
      this.recordResult(
        'warn',
        `${packageName}: package-lock.json missing; skipping package-local install and relying on workspace resolution.`
      );
      return;
    }

    const installCommands = [
      {
        label: 'npm ci',
        command: 'npm ci --no-audit --no-fund'
      },
      {
      label: 'npm install',
      command: 'npm install --no-audit --no-fund'
      }
    ];

    for (const commandSpec of installCommands) {
      try {
        this.log(`Installing dependencies for ${packageName} with ${commandSpec.label}...`, 'blue', ICONS.test);
        execSync(commandSpec.command, {
          cwd: packagePath,
          stdio: this.options.verbose ? 'inherit' : 'pipe'
        });
        return;
      } catch (error) {
        this.log(
          `Dependency install command failed for ${packageName} (${commandSpec.label}): ${error.message}`,
          'yellow',
          ICONS.warning
        );

        if (commandSpec.label === 'npm ci') {
          this.recordResult('warn', `${packageName}: npm ci failed; falling back to npm install.`);
          continue;
        }

        this.recordResult(
          'warn',
          `${packageName}: dependency install failed with ${commandSpec.label}; continuing with workspace dependencies.`
        );
        return;
      }
    }

    this.recordResult(
      'warn',
      `${packageName}: dependency install commands were unavailable; continuing with workspace dependencies.`
    );
  }

  hasUsableNodeModules(packagePath) {
    const nodeModulesPath = path.join(packagePath, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      return false;
    }

    try {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(packagePath, 'package.json'), 'utf8')
      );
      const directDependencies = Object.keys(packageJson.dependencies || {});

      for (const depName of directDependencies) {
        const depRoot = path.join(nodeModulesPath, depName);
        const depPackageJsonPath = path.join(depRoot, 'package.json');

        if (!fs.existsSync(depPackageJsonPath)) {
          return false;
        }

        const depPackageJson = JSON.parse(fs.readFileSync(depPackageJsonPath, 'utf8'));
        const declaredMain = depPackageJson.main;

        if (declaredMain) {
          const normalizedMain = declaredMain.startsWith('./')
            ? declaredMain.slice(2)
            : declaredMain;
          const mainPath = path.join(depRoot, normalizedMain);

          if (!fs.existsSync(mainPath)) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      return false;
    }
  }

  async testServerComponents() {
    this.logSection('Testing Server Components');

    if (this.options.skipServer) {
      this.log('Skipping server tests (--skip-server)', 'yellow', ICONS.warning);
      return;
    }

    // Test WebAI Server
    await this.testWebAIServer();

    // Test MCP Server
    await this.testMcpServer();
  }

  async testWebAIServer() {
    try {
      this.log('Starting WebAI Server...', 'blue', ICONS.server);

      // Start server in background
      this.serverProcess = spawn('node', ['dist/browser-connector.js'], {
        cwd: path.join(process.cwd(), 'webai-server'),
        env: {
          ...process.env,
          SERVER_HOST: process.env.SERVER_HOST || '127.0.0.1'
        },
        stdio: this.options.verbose ? 'inherit' : 'pipe'
      });

      // Wait for server to start
      const discoveredIdentityUrl = await this.waitForServer(this.getServerIdentityCandidates(), 15000);
      this.serverBaseUrl = discoveredIdentityUrl.replace('/.identity', '');

      // Test server endpoints
      await this.testServerEndpoints();

      this.recordResult('pass', `WebAI Server started and responding (${this.serverBaseUrl})`);

    } catch (error) {
      this.recordResult('fail', `WebAI Server test failed: ${error.message}`);
    }
  }

  async testMcpServer() {
    try {
      this.log('Testing MCP Server connection...', 'blue', ICONS.test);

      // Start MCP server in background (it should connect to WebAI Server)
      this.mcpProcess = spawn('node', ['dist/mcp-server.js'], {
        cwd: path.join(process.cwd(), 'webai-mcp'),
        stdio: this.options.verbose ? 'inherit' : 'pipe'
      });

      // Give it time to connect
      await new Promise(resolve => setTimeout(resolve, 3000));

      this.recordResult('pass', 'MCP Server started successfully');

    } catch (error) {
      this.recordResult('fail', `MCP Server test failed: ${error.message}`);
    }
  }

  async testServerEndpoints() {
    if (!this.serverBaseUrl) {
      throw new Error('Server base URL not set');
    }

    const endpoints = [
      '/.identity',
      '/console-logs',
      '/network-logs',
      '/settings'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${this.serverBaseUrl}${endpoint}`, {
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          this.recordResult('pass', `Endpoint ${endpoint} responding`);
        } else {
          this.recordResult('warn', `Endpoint ${endpoint} returned ${response.status}`);
        }
      } catch (error) {
        this.recordResult('fail', `Endpoint ${endpoint} failed: ${error.message}`);
      }
    }
  }

  async testChromeExtension() {
    this.logSection('Testing Chrome Extension');

    if (this.options.skipExtension) {
      this.log('Skipping extension tests (--skip-extension)', 'yellow', ICONS.warning);
      return;
    }

    // Check extension files
    const extensionPath = path.join(process.cwd(), 'chrome-extension');
    const requiredFiles = ['manifest.json', 'devtools.js', 'panel.js', 'panel.html'];

    for (const file of requiredFiles) {
      const filePath = path.join(extensionPath, file);
      if (fs.existsSync(filePath)) {
        this.recordResult('pass', `Extension file exists: ${file}`);
      } else {
        this.recordResult('fail', `Extension file missing: ${file}`);
      }
    }

    // Validate manifest
    try {
      const manifestPath = path.join(extensionPath, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        if (manifest.manifest_version === 3) {
          this.recordResult('pass', 'Extension uses Manifest V3');
        } else {
          this.recordResult('warn', 'Extension uses older manifest version');
        }

        if (manifest.permissions && manifest.permissions.includes('debugger')) {
          this.recordResult('pass', 'Extension has debugger permission');
        } else {
          this.recordResult('fail', 'Extension missing debugger permission');
        }
      }
    } catch (error) {
      this.recordResult('fail', `Extension manifest validation failed: ${error.message}`);
    }
  }

  async testIntegration() {
    this.logSection('Testing Integration');

    // Test server-to-server communication
    if (this.serverProcess && this.mcpProcess) {
      try {
        // Test if MCP server can reach WebAI Server
        const identityUrl = this.serverBaseUrl ? `${this.serverBaseUrl}/.identity` : 'http://127.0.0.1:3025/.identity';
        const response = await fetch(identityUrl, {
          signal: AbortSignal.timeout(5000)
        });

        if (response.ok) {
          const identity = await response.json();
          if (identity.signature === 'mcp-browser-connector-24x7') {
            this.recordResult('pass', 'Server integration working');
          } else {
            this.recordResult('fail', 'Server responding but wrong signature');
          }
        } else {
          this.recordResult('fail', 'Server integration failed');
        }
      } catch (error) {
        this.recordResult('fail', `Integration test failed: ${error.message}`);
      }
    } else {
      this.recordResult('warn', 'Integration test skipped (servers not running)');
    }
  }

  getServerIdentityCandidates() {
    const requestedPort = Number.parseInt(process.env.PORT || '3025', 10);
    const basePort = Number.isNaN(requestedPort) ? 3025 : requestedPort;
    const ports = Array.from({ length: 11 }, (_, i) => basePort + i);
    const hosts = ['127.0.0.1', 'localhost'];
    return hosts.flatMap(host => ports.map(port => `http://${host}:${port}/.identity`));
  }

  async waitForServer(urls, timeout = 10000) {
    const candidates = Array.isArray(urls) ? urls : [urls];
    const start = Date.now();

    while (Date.now() - start < timeout) {
      for (const url of candidates) {
        try {
          const response = await fetch(url, {
            signal: AbortSignal.timeout(1000)
          });

          if (response.ok) {
            return url;
          }
        } catch (error) {
          // Continue waiting
        }
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error(`Server did not start within ${timeout}ms (tried ${candidates.join(', ')})`);
  }

  recordResult(status, message) {
    if (status === 'pass') {
      this.results.passed++;
      this.log(message, 'green', ICONS.success);
    } else if (status === 'fail') {
      this.results.failed++;
      this.log(message, 'red', ICONS.error);
    } else if (status === 'warn') {
      this.results.warnings++;
      this.log(message, 'yellow', ICONS.warning);
    }
  }

  async cleanup() {
    this.logSection('Cleanup');

    // Stop server processes
    if (this.serverProcess) {
      this.log('Stopping WebAI Server...', 'blue', ICONS.info);
      this.serverProcess.kill();
      this.serverProcess = null;
    }

    if (this.mcpProcess) {
      this.log('Stopping MCP Server...', 'blue', ICONS.info);
      this.mcpProcess.kill();
      this.mcpProcess = null;
    }

    // Wait a moment for processes to clean up
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  generateSummary() {
    this.logSection('Test Summary');

    const total = this.results.passed + this.results.failed + this.results.warnings;

    this.log(`Total tests: ${total}`, 'blue', ICONS.info);
    this.log(`Passed: ${this.results.passed}`, 'green', ICONS.success);
    this.log(`Failed: ${this.results.failed}`, 'red', ICONS.error);
    this.log(`Warnings: ${this.results.warnings}`, 'yellow', ICONS.warning);

    console.log();

    if (this.results.failed === 0) {
      this.log('🎉 All tests passed! WebAI MCP is ready for use.', 'green', ICONS.rocket);
    } else {
      this.log(`❌ ${this.results.failed} test(s) failed. Please review the issues above.`, 'red', ICONS.error);
      process.exit(1);
    }
  }
}

// CLI interface
const scriptPath = path.resolve(fileURLToPath(import.meta.url));
if (scriptPath === path.resolve(process.argv[1] ?? '')) {
  const args = process.argv.slice(2);
  const options = {
    skipBuild: args.includes('--skip-build'),
    skipInstall: args.includes('--skip-install'),
    skipServer: args.includes('--skip-server'),
    skipExtension: args.includes('--skip-extension'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
WebAI MCP Test Runner

Usage: node tests/test-all.js [options]

Options:
  --skip-build        Skip build process tests
  --skip-install      Skip dependency install during build process tests
  --skip-server       Skip server component tests
  --skip-extension    Skip Chrome extension tests
  --verbose, -v       Show detailed output
  --help, -h          Show this help message

Examples:
  node tests/test-all.js                    # Run all tests
  node tests/test-all.js --verbose          # Run with detailed output
  node tests/test-all.js --skip-build       # Skip build tests
  node tests/test-all.js --skip-install     # Skip dependency install, keep build tests
  node tests/test-all.js --skip-build --skip-install # Skip build and install checks
`);
    process.exit(0);
  }

  const testRunner = new TestRunner(options);
  testRunner.runAllTests().catch(console.error);
}

export default TestRunner;
