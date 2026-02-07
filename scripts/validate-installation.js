#!/usr/bin/env node

/**
 * Installation Validation Script for WebAI-MCP
 *
 * Comprehensive validation of the entire WebAI-MCP setup
 * including dependencies, builds, configuration, and functionality.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { pathToFileURL } from 'url';
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
  check: '🔍',
  build: '🏗️',
  test: '🧪',
  rocket: '🚀'
};

class InstallationValidator {
  constructor() {
    this.results = {
      prerequisites: { passed: 0, failed: 0, warnings: 0 },
      structure: { passed: 0, failed: 0, warnings: 0 },
      dependencies: { passed: 0, failed: 0, warnings: 0 },
      builds: { passed: 0, failed: 0, warnings: 0 },
      configuration: { passed: 0, failed: 0, warnings: 0 },
      functionality: { passed: 0, failed: 0, warnings: 0 }
    };
    this.issues = [];
    this.recommendations = [];
  }

  log(message, color = 'reset', icon = '') {
    const colorCode = COLORS[color] || COLORS.reset;
    console.log(`${colorCode}${icon} ${message}${COLORS.reset}`);
  }

  logSection(title) {
    console.log(`\n${COLORS.cyan}${COLORS.bright}=== ${title} ===${COLORS.reset}`);
  }

  recordResult(category, status, message) {
    if (status === 'pass') {
      this.results[category].passed++;
      this.log(message, 'green', ICONS.success);
    } else if (status === 'fail') {
      this.results[category].failed++;
      this.log(message, 'red', ICONS.error);
      this.issues.push(message);
    } else if (status === 'warn') {
      this.results[category].warnings++;
      this.log(message, 'yellow', ICONS.warning);
    }
  }

  async runValidation() {
    this.log('WebAI-MCP Installation Validator', 'bright', ICONS.rocket);
    this.log(`Platform: ${os.platform()} ${os.arch()}`, 'blue', ICONS.info);
    this.log(`Node.js: ${process.version}`, 'blue', ICONS.info);
    console.log();

    try {
      await this.validatePrerequisites();
      await this.validateProjectStructure();
      await this.validateDependencies();
      await this.validateBuilds();
      await this.validateConfiguration();
      await this.validateFunctionality();

      this.generateFinalReport();
    } catch (error) {
      this.log(`Validation failed: ${error.message}`, 'red', ICONS.error);
      process.exit(1);
    }
  }

  async validatePrerequisites() {
    this.logSection('Prerequisites Validation');

    // Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

    if (majorVersion >= 18) {
      this.recordResult('prerequisites', 'pass', `Node.js ${nodeVersion} meets requirements (>=18)`);
    } else {
      this.recordResult('prerequisites', 'fail', `Node.js ${nodeVersion} is too old (requires >=18)`);
    }

    // NPM version
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      this.recordResult('prerequisites', 'pass', `NPM ${npmVersion} available`);
    } catch (error) {
      this.recordResult('prerequisites', 'fail', 'NPM not available');
    }

    // NPX availability
    try {
      execSync('npx --version', { encoding: 'utf8' });
      this.recordResult('prerequisites', 'pass', 'NPX available');
    } catch (error) {
      this.recordResult('prerequisites', 'fail', 'NPX not available');
    }

    // Git availability (optional)
    try {
      execSync('git --version', { encoding: 'utf8' });
      this.recordResult('prerequisites', 'pass', 'Git available');
    } catch (error) {
      this.recordResult('prerequisites', 'warn', 'Git not available (optional)');
    }

    // Chrome/Chromium availability
    await this.checkBrowserAvailability();
  }

  async checkBrowserAvailability() {
    const platform = os.platform();
    let chromeFound = false;

    try {
      if (platform === 'win32') {
        // Check Windows Chrome locations
        const chromePaths = [
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
        ];

        for (const chromePath of chromePaths) {
          if (fs.existsSync(chromePath)) {
            chromeFound = true;
            break;
          }
        }
      } else if (platform === 'darwin') {
        // Check macOS Chrome locations
        const chromePaths = [
          '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
          '/Applications/Chromium.app/Contents/MacOS/Chromium'
        ];

        for (const chromePath of chromePaths) {
          if (fs.existsSync(chromePath)) {
            chromeFound = true;
            break;
          }
        }
      } else {
        // Check Linux Chrome availability
        try {
          execSync('which google-chrome || which chromium-browser || which chromium', { stdio: 'pipe' });
          chromeFound = true;
        } catch (error) {
          // Chrome not found
        }
      }

      if (chromeFound) {
        this.recordResult('prerequisites', 'pass', 'Chrome/Chromium browser found');
      } else {
        this.recordResult('prerequisites', 'fail', 'Chrome/Chromium browser not found');
        this.recommendations.push('Install Google Chrome or Chromium browser');
      }
    } catch (error) {
      this.recordResult('prerequisites', 'warn', 'Could not verify browser availability');
    }
  }

  async validateProjectStructure() {
    this.logSection('Project Structure Validation');

    const requiredDirectories = [
      'webai-mcp',
      'webai-server',
      'chrome-extension',
      'scripts'
    ];

    const requiredFiles = [
      'package.json',
      'webai-mcp/package.json',
      'webai-server/package.json',
      'chrome-extension/manifest.json',
      'README.md'
    ];

    // Check directories
    for (const dir of requiredDirectories) {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
        this.recordResult('structure', 'pass', `Directory exists: ${dir}`);
      } else {
        this.recordResult('structure', 'fail', `Missing directory: ${dir}`);
      }
    }

    // Check files
    for (const file of requiredFiles) {
      const filePath = path.join(process.cwd(), file);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        this.recordResult('structure', 'pass', `File exists: ${file}`);
      } else {
        this.recordResult('structure', 'fail', `Missing file: ${file}`);
      }
    }

    // Check for build artifacts
    const buildDirs = [
      'webai-mcp/dist',
      'webai-server/dist'
    ];

    for (const buildDir of buildDirs) {
      const buildPath = path.join(process.cwd(), buildDir);
      if (fs.existsSync(buildPath)) {
        this.recordResult('structure', 'pass', `Build directory exists: ${buildDir}`);
      } else {
        this.recordResult('structure', 'warn', `Build directory missing: ${buildDir} (run npm run build)`);
      }
    }
  }

  async validateDependencies() {
    this.logSection('Dependencies Validation');

    const packages = [
      { name: 'MCP Server', path: 'webai-mcp' },
      { name: 'WebAI Server', path: 'webai-server' }
    ];

    for (const pkg of packages) {
      const packagePath = path.join(process.cwd(), pkg.path);
      const nodeModulesPath = path.join(packagePath, 'node_modules');
      const packageLockPath = path.join(packagePath, 'package-lock.json');

      // Check if dependencies are installed
      if (fs.existsSync(nodeModulesPath)) {
        this.recordResult('dependencies', 'pass', `${pkg.name} dependencies installed`);
      } else {
        this.recordResult('dependencies', 'fail', `${pkg.name} dependencies not installed`);
        this.recommendations.push(`Run: cd ${pkg.path} && npm install`);
      }

      // Check for package-lock.json
      if (fs.existsSync(packageLockPath)) {
        this.recordResult('dependencies', 'pass', `${pkg.name} has package-lock.json`);
      } else {
        this.recordResult('dependencies', 'warn', `${pkg.name} missing package-lock.json`);
      }

      // Check for security vulnerabilities
      try {
        execSync(`npm --prefix ${pkg.path} audit --audit-level=high`, {
          encoding: 'utf8',
          stdio: 'pipe'
        });
        this.recordResult('dependencies', 'pass', `${pkg.name} has no high-severity vulnerabilities`);
      } catch (error) {
        this.recordResult('dependencies', 'warn', `${pkg.name} may have security vulnerabilities`);
        this.recommendations.push(`Run: cd ${pkg.path} && npm audit fix`);
      }
    }
  }

  async validateBuilds() {
    this.logSection('Build Validation');

    const packages = [
      { name: 'MCP Server', path: 'webai-mcp' },
      { name: 'WebAI Server', path: 'webai-server' }
    ];

    for (const pkg of packages) {
      const packagePath = path.join(process.cwd(), pkg.path);
      const distPath = path.join(packagePath, 'dist');

      if (fs.existsSync(distPath)) {
        // Check if dist has content
        const distContents = fs.readdirSync(distPath);
        if (distContents.length > 0) {
          this.recordResult('builds', 'pass', `${pkg.name} build artifacts present`);

          // Check for main entry point
          const packageJsonPath = path.join(packagePath, 'package.json');
          if (fs.existsSync(packageJsonPath)) {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
            const mainFile = packageJson.main || 'index.js';
            const mainPath = path.isAbsolute(mainFile)
              ? mainFile
              : path.join(packagePath, mainFile);

            if (fs.existsSync(mainPath)) {
              this.recordResult('builds', 'pass', `${pkg.name} main entry point exists`);
            } else {
              this.recordResult('builds', 'warn', `${pkg.name} main entry point not found`);
            }
          }
        } else {
          this.recordResult('builds', 'fail', `${pkg.name} dist directory is empty`);
          this.recommendations.push(`Run: cd ${pkg.path} && npm run build`);
        }
      } else {
        this.recordResult('builds', 'fail', `${pkg.name} not built`);
        this.recommendations.push(`Run: cd ${pkg.path} && npm run build`);
      }
    }
  }

  async validateConfiguration() {
    this.logSection('Configuration Validation');

    // Check Chrome extension manifest
    const manifestPath = path.join(process.cwd(), 'chrome-extension', 'manifest.json');
    if (fs.existsSync(manifestPath)) {
      try {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

        if (manifest.manifest_version === 3) {
          this.recordResult('configuration', 'pass', 'Chrome extension uses Manifest V3');
        } else {
          this.recordResult('configuration', 'warn', 'Chrome extension uses older manifest version');
        }

        if (manifest.permissions && manifest.permissions.includes('debugger')) {
          this.recordResult('configuration', 'pass', 'WebAI-MCP extension has debugger permission');
        } else {
          this.recordResult('configuration', 'fail', 'WebAI-MCP extension missing debugger permission');
        }

        if (manifest.devtools_page) {
          this.recordResult('configuration', 'pass', 'Chrome extension has devtools page');
        } else {
          this.recordResult('configuration', 'fail', 'Chrome extension missing devtools page');
        }
      } catch (error) {
        this.recordResult('configuration', 'fail', 'Chrome extension manifest.json is invalid');
      }
    }

    // Check version compatibility
    try {
      const versionResult = this.checkLocalVersionCompatibility();
      if (versionResult.isCompatible) {
        this.recordResult('configuration', 'pass', 'All component versions are compatible');
      } else {
        this.recordResult('configuration', 'fail', 'Version compatibility issues detected');
        this.recommendations.push(`Align versions: MCP=${versionResult.mcpVersion}, Server=${versionResult.serverVersion}, Extension=${versionResult.extensionVersion}`);
      }
    } catch (error) {
      this.recordResult('configuration', 'warn', 'Could not check version compatibility');
    }
  }

  checkLocalVersionCompatibility() {
    const mcpPackage = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'webai-mcp', 'package.json'), 'utf8')
    );
    const serverPackage = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'webai-server', 'package.json'), 'utf8')
    );
    const extensionManifest = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), 'chrome-extension', 'manifest.json'), 'utf8')
    );

    const mcpVersion = mcpPackage.version || '0.0.0';
    const serverVersion = serverPackage.version || '0.0.0';
    const extensionVersion = extensionManifest.version || '0.0.0';

    const normalizeBase = (version) => version.replace(/-dev\.\d+$/, '');
    const major = (version) => normalizeBase(version).split('.')[0];

    const mcpBase = normalizeBase(mcpVersion);
    const serverBase = normalizeBase(serverVersion);
    const compatibleMajors = major(mcpVersion) === major(serverVersion);
    const toExtensionDevVersion = (version) => {
      const match = version.match(/^(\d+\.\d+\.\d+)-dev\.(\d+)$/);
      if (!match) return normalizeBase(version);
      return `${match[1]}.${match[2]}`;
    };

    const allowedExtensionVersions = new Set([
      mcpBase,
      serverBase,
      toExtensionDevVersion(mcpVersion),
      toExtensionDevVersion(serverVersion)
    ]);
    const extensionMatches = allowedExtensionVersions.has(extensionVersion);

    return {
      isCompatible: compatibleMajors && extensionMatches,
      mcpVersion,
      serverVersion,
      extensionVersion
    };
  }

  async validateFunctionality() {
    this.logSection('Functionality Validation');

    // Run diagnostic tool
    try {
      const diagnostic = new DiagnosticTool();
      await diagnostic.runDiagnostics();

      if (diagnostic.issues.length === 0) {
        this.recordResult('functionality', 'pass', 'All diagnostic checks passed');
      } else {
        this.recordResult('functionality', 'warn', `${diagnostic.issues.length} diagnostic issues found`);
        diagnostic.issues.forEach(issue => {
          this.recommendations.push(issue);
        });
      }
    } catch (error) {
      this.recordResult('functionality', 'warn', 'Could not run diagnostic checks');
    }

    // Test server startup (if not already running)
    await this.testServerStartup();
  }

  async testServerStartup() {
    try {
      // Check if server is already running
      const response = await fetch('http://localhost:3025/.identity', {
        signal: AbortSignal.timeout(2000)
      });

      if (response.ok) {
        const identity = await response.json();
        if (identity.signature === 'mcp-browser-connector-24x7') {
          this.recordResult('functionality', 'pass', 'WebAI Server is running and responding');
        } else {
          this.recordResult('functionality', 'warn', 'Server running but wrong signature');
        }
      } else {
        this.recordResult('functionality', 'warn', 'Server running but not responding correctly');
      }
    } catch (error) {
      this.recordResult('functionality', 'warn', 'WebAI Server not running');
      this.recommendations.push('WebAI Server is not running. Start it with: npx @cpjet64/webai-server');
    }
  }

  generateFinalReport() {
    this.logSection('Validation Summary');

    let totalPassed = 0;
    let totalFailed = 0;
    let totalWarnings = 0;

    // Calculate totals
    Object.values(this.results).forEach(category => {
      totalPassed += category.passed;
      totalFailed += category.failed;
      totalWarnings += category.warnings;
    });

    // Display category results
    Object.entries(this.results).forEach(([category, results]) => {
      const categoryName = category.charAt(0).toUpperCase() + category.slice(1);
      const status = results.failed > 0 ? 'red' : results.warnings > 0 ? 'yellow' : 'green';
      const icon = results.failed > 0 ? ICONS.error : results.warnings > 0 ? ICONS.warning : ICONS.success;

      this.log(
        `${categoryName}: ${results.passed} passed, ${results.failed} failed, ${results.warnings} warnings`,
        status,
        icon
      );
    });

    console.log();

    // Overall status
    if (totalFailed === 0 && totalWarnings === 0) {
      this.log('🎉 Installation validation PASSED! All checks successful.', 'green', ICONS.rocket);
    } else if (totalFailed === 0) {
      this.log(`⚠️ Installation validation PASSED with ${totalWarnings} warnings.`, 'yellow', ICONS.warning);
    } else {
      this.log(`❌ Installation validation FAILED. ${totalFailed} critical issues found.`, 'red', ICONS.error);
    }

    // Show recommendations
    if (this.recommendations.length > 0) {
      const uniqueRecommendations = [...new Set(this.recommendations)];
      console.log();
      this.log('Recommendations:', 'cyan', ICONS.info);
      uniqueRecommendations.forEach((rec, index) => {
        this.log(`${index + 1}. ${rec}`, 'blue', '  ');
      });
    }

    console.log();
    this.log(`Total: ${totalPassed} passed, ${totalFailed} failed, ${totalWarnings} warnings`, 'bright', ICONS.check);
  }
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
  const validator = new InstallationValidator();
  validator.runValidation().catch(console.error);
}

export default InstallationValidator;
