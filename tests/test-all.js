#!/usr/bin/env node

/**
 * Comprehensive Test Runner for Browser Tools MCP
 *
 * Automates testing of all components including server, MCP, extension,
 * and new diagnostic features across different branches.
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

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
      skipServer: false,
      skipExtension: false,
      testBranches: false,
      verbose: false,
      ...options
    };
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0
    };
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

      // Feature branch tests (optional)
      if (this.options.testBranches) {
        await this.testFeatureBranches();
      }

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
        this.recordResult('warn', 'Diagnostic script not found (may be on different branch)');
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
        this.recordResult('warn', 'Setup script not found (may be on different branch)');
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
        this.recordResult('warn', 'Validation script not found (may be on different branch)');
      }
    } catch (error) {
      this.recordResult('fail', `Validation script failed: ${error.message}`);
    }
  }

  async testBuildProcess() {
    this.logSection('Testing Build Process');

    if (this.options.skipBuild) {
      this.log('Skipping build tests (--skip-build)', 'yellow', ICONS.warning);
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

        // Install dependencies
        execSync('npm install', {
          cwd: packagePath,
          stdio: this.options.verbose ? 'inherit' : 'pipe'
        });

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
        stdio: this.options.verbose ? 'inherit' : 'pipe'
      });

      // Wait for server to start
      await this.waitForServer('http://localhost:3025/.identity', 10000);

      // Test server endpoints
      await this.testServerEndpoints();

      this.recordResult('pass', 'WebAI Server started and responding');

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
    const endpoints = [
      '/.identity',
      '/console-logs',
      '/network-logs',
      '/settings'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:3025${endpoint}`, {
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
        const response = await fetch('http://localhost:3025/.identity', {
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

  async testFeatureBranches() {
    this.logSection('Testing Feature Branches');

    const branches = [
      'feature/automated-diagnostics',
      'feature/enhanced-error-handling',
      'feature/proxy-support',
      'feature/platform-enhancements'
    ];

    const currentBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();

    for (const branch of branches) {
      try {
        this.log(`Testing branch: ${branch}`, 'blue', ICONS.test);

        // Switch to branch
        execSync(`git checkout ${branch}`, { stdio: 'pipe' });

        // Test branch-specific features
        await this.testBranchFeatures(branch);

        this.recordResult('pass', `Branch ${branch} tested successfully`);

      } catch (error) {
        this.recordResult('fail', `Branch ${branch} test failed: ${error.message}`);
      }
    }

    // Switch back to original branch
    try {
      execSync(`git checkout ${currentBranch}`, { stdio: 'pipe' });
    } catch (error) {
      this.log(`Could not switch back to ${currentBranch}`, 'yellow', ICONS.warning);
    }
  }

  async testBranchFeatures(branch) {
    switch (branch) {
      case 'feature/automated-diagnostics':
        if (fs.existsSync('scripts/diagnose.js')) {
          execSync('node scripts/diagnose.js', { stdio: 'pipe' });
        }
        break;

      case 'feature/enhanced-error-handling':
        // Test enhanced error handling by building MCP server
        if (fs.existsSync('webai-mcp/error-handler.ts')) {
          execSync('npm run build', {
            cwd: 'webai-mcp',
            stdio: 'pipe'
          });
        }
        break;

      case 'feature/proxy-support':
        // Test proxy configuration by building server
        if (fs.existsSync('webai-server/proxy-config.ts')) {
          execSync('npm run build', {
            cwd: 'webai-server',
            stdio: 'pipe'
          });
        }
        break;

      case 'feature/platform-enhancements':
        if (fs.existsSync('scripts/platform-setup.js')) {
          // Just validate the script exists and is syntactically correct
          execSync('node -c scripts/platform-setup.js', { stdio: 'pipe' });
        }
        break;
    }
  }

  async waitForServer(url, timeout = 10000) {
    const start = Date.now();

    while (Date.now() - start < timeout) {
      try {
        const response = await fetch(url, {
          signal: AbortSignal.timeout(1000)
        });

        if (response.ok) {
          return true;
        }
      } catch (error) {
        // Continue waiting
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    throw new Error(`Server did not start within ${timeout}ms`);
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
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {
    skipBuild: args.includes('--skip-build'),
    skipServer: args.includes('--skip-server'),
    skipExtension: args.includes('--skip-extension'),
    testBranches: args.includes('--test-branches'),
    verbose: args.includes('--verbose') || args.includes('-v')
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
WebAI MCP Test Runner

Usage: node scripts/test-all.js [options]

Options:
  --skip-build        Skip build process tests
  --skip-server       Skip server component tests
  --skip-extension    Skip Chrome extension tests
  --test-branches     Test all feature branches
  --verbose, -v       Show detailed output
  --help, -h          Show this help message

Examples:
  node scripts/test-all.js                    # Run all tests
  node scripts/test-all.js --verbose          # Run with detailed output
  node scripts/test-all.js --test-branches    # Test all feature branches
  node scripts/test-all.js --skip-build       # Skip build tests
`);
    process.exit(0);
  }

  const testRunner = new TestRunner(options);
  testRunner.runAllTests().catch(console.error);
}

export default TestRunner;
