#!/usr/bin/env node

/**
 * Browser Tools MCP Diagnostic Tool
 *
 * Comprehensive diagnostic tool to identify and troubleshoot common issues
 * with webai-mcp setup and connectivity.
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import net from 'net';

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
  search: '🔍',
  tools: '🔧',
  network: '🌐',
  chrome: '🌐',
  node: '📦'
};

class DiagnosticTool {
  constructor() {
    this.results = {
      nodeSetup: null,
      processes: null,
      ports: null,
      chromeExtension: null,
      connectivity: null,
      buildStatus: null
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

  async runDiagnostics() {
    this.log('Browser Tools MCP Diagnostics Tool', 'bright', ICONS.search);
    this.log(`Platform: ${os.platform()} ${os.arch()}`, 'blue', ICONS.info);
    this.log(`Node.js: ${process.version}`, 'blue', ICONS.info);
    console.log();

    try {
      await this.checkNodeSetup();
      await this.checkRunningProcesses();
      await this.checkPorts();
      await this.checkBuildStatus();
      await this.checkConnectivity();
      await this.checkChromeExtension();

      this.generateReport();
    } catch (error) {
      this.log(`Diagnostic failed: ${error.message}`, 'red', ICONS.error);
    }
  }

  async checkNodeSetup() {
    this.logSection('Node.js and NPM Setup');

    try {
      // Check Node.js version
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

      if (majorVersion >= 18) {
        this.log(`Node.js version: ${nodeVersion}`, 'green', ICONS.success);
        this.results.nodeSetup = { status: 'good', version: nodeVersion };
      } else {
        this.log(`Node.js version: ${nodeVersion} (requires >= 18)`, 'red', ICONS.error);
        this.issues.push('Node.js version is too old. Please upgrade to Node.js 18 or higher.');
        this.results.nodeSetup = { status: 'error', version: nodeVersion };
      }

      // Check npm
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      this.log(`NPM version: ${npmVersion}`, 'green', ICONS.success);

      // Check npx
      try {
        const npxVersion = execSync('npx --version', { encoding: 'utf8' }).trim();
        this.log(`NPX version: ${npxVersion}`, 'green', ICONS.success);
      } catch (error) {
        this.log('NPX not found', 'red', ICONS.error);
        this.issues.push('NPX is not available. Please reinstall Node.js.');
      }

      // Check global packages
      try {
        const globalPackages = execSync('npm list -g --depth=0', { encoding: 'utf8' });
        const hasBrowserTools = globalPackages.includes('@cpjet64/browser-tools');

        if (hasBrowserTools) {
          this.log('Browser Tools packages found globally', 'green', ICONS.success);
        } else {
          this.log('Browser Tools packages not installed globally', 'yellow', ICONS.warning);
          this.recommendations.push('Consider installing globally: npm install -g @cpjet64/webai-mcp @cpjet64/webai-server');
        }
      } catch (error) {
        this.log('Could not check global packages', 'yellow', ICONS.warning);
      }

    } catch (error) {
      this.log(`Node.js setup check failed: ${error.message}`, 'red', ICONS.error);
      this.results.nodeSetup = { status: 'error', error: error.message };
    }
  }

  async checkRunningProcesses() {
    this.logSection('Running Processes');

    try {
      const platform = os.platform();
      let processes = [];

      if (platform === 'win32') {
        // Windows
        try {
          const output = execSync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV', { encoding: 'utf8' });
          const lines = output.split('\n').slice(1); // Skip header

          for (const line of lines) {
            if (line.trim()) {
              const parts = line.split(',');
              if (parts.length >= 2) {
                const pid = parts[1].replace(/"/g, '');
                processes.push({ pid, name: 'node.exe' });
              }
            }
          }
        } catch (error) {
          this.log('Could not check Windows processes', 'yellow', ICONS.warning);
        }
      } else {
        // Unix-like systems
        try {
          const output = execSync('ps aux | grep -E "(browser-tools|node.*mcp-server|node.*browser-connector)"', { encoding: 'utf8' });
          const lines = output.split('\n');

          for (const line of lines) {
            if (line.includes('browser-tools') || line.includes('mcp-server') || line.includes('browser-connector')) {
              if (!line.includes('grep')) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 2) {
                  processes.push({ pid: parts[1], command: line });
                }
              }
            }
          }
        } catch (error) {
          this.log('Could not check Unix processes', 'yellow', ICONS.warning);
        }
      }

      if (processes.length > 0) {
        this.log(`Found ${processes.length} browser-tools related process(es)`, 'green', ICONS.success);
        processes.forEach(proc => {
          this.log(`  PID: ${proc.pid}`, 'blue', '  →');
        });
        this.results.processes = { status: 'running', count: processes.length, processes };
      } else {
        this.log('No browser-tools processes found', 'yellow', ICONS.warning);
        this.results.processes = { status: 'none', count: 0 };
        this.recommendations.push('Start the webai-server: npx @cpjet64/webai-server');
      }

    } catch (error) {
      this.log(`Process check failed: ${error.message}`, 'red', ICONS.error);
      this.results.processes = { status: 'error', error: error.message };
    }
  }

  async checkPorts() {
    this.logSection('Port Availability');

    const portsToCheck = [3025, 3026, 3027, 3028, 3029, 3030];
    const portResults = [];

    for (const port of portsToCheck) {
      try {
        const isInUse = await this.isPortInUse(port);

        if (isInUse) {
          this.log(`Port ${port}: IN USE`, 'yellow', ICONS.warning);
          portResults.push({ port, status: 'in_use' });

          if (port === 3025) {
            this.log('  Default port 3025 is in use (this might be good if server is running)', 'blue', ICONS.info);
          }
        } else {
          this.log(`Port ${port}: Available`, 'green', ICONS.success);
          portResults.push({ port, status: 'available' });
        }
      } catch (error) {
        this.log(`Port ${port}: Error checking`, 'red', ICONS.error);
        portResults.push({ port, status: 'error', error: error.message });
      }
    }

    this.results.ports = { status: 'checked', ports: portResults };

    // Check if default port is available or in use appropriately
    const defaultPortResult = portResults.find(p => p.port === 3025);
    if (defaultPortResult?.status === 'available' && this.results.processes?.count === 0) {
      this.recommendations.push('Port 3025 is available but no server is running. Start the server.');
    }
  }

  async isPortInUse(port) {
    return new Promise((resolve) => {
      const server = net.createServer();

      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      });

      server.once('listening', () => {
        server.close();
        resolve(false);
      });

      server.listen(port);
    });
  }

  async checkBuildStatus() {
    this.logSection('Build Status');

    try {
      // Check if dist directories exist
      const mcpDistPath = path.join(process.cwd(), 'webai-mcp', 'dist');
      const serverDistPath = path.join(process.cwd(), 'webai-server', 'dist');

      const mcpBuilt = fs.existsSync(mcpDistPath);
      const serverBuilt = fs.existsSync(serverDistPath);

      if (mcpBuilt) {
        this.log('MCP Server build artifacts found', 'green', ICONS.success);
      } else {
        this.log('MCP Server not built', 'red', ICONS.error);
        this.issues.push('MCP Server needs to be built. Run: cd webai-mcp && npm run build');
      }

      if (serverBuilt) {
        this.log('Browser Tools Server build artifacts found', 'green', ICONS.success);
      } else {
        this.log('WebAI Server not built', 'red', ICONS.error);
        this.issues.push('WebAI Server needs to be built. Run: cd webai-server && npm run build');
      }

      this.results.buildStatus = {
        status: mcpBuilt && serverBuilt ? 'good' : 'incomplete',
        mcpBuilt,
        serverBuilt
      };

    } catch (error) {
      this.log(`Build status check failed: ${error.message}`, 'red', ICONS.error);
      this.results.buildStatus = { status: 'error', error: error.message };
    }
  }

  async checkConnectivity() {
    this.logSection('Server Connectivity');

    const hostsToCheck = ['localhost', '127.0.0.1'];
    const portsToCheck = [3025, 3026, 3027, 3028, 3029];
    let serverFound = false;
    let serverDetails = null;

    for (const host of hostsToCheck) {
      for (const port of portsToCheck) {
        try {
          this.log(`Checking ${host}:${port}...`, 'blue', ICONS.network);

          const response = await fetch(`http://${host}:${port}/.identity`, {
            signal: AbortSignal.timeout(2000)
          });

          if (response.ok) {
            const identity = await response.json();

            if (identity.signature === 'mcp-browser-connector-24x7') {
              this.log(`✓ Browser Tools Server found at ${host}:${port}`, 'green', ICONS.success);
              this.log(`  Server version: ${identity.version || 'unknown'}`, 'blue', ICONS.info);
              serverFound = true;
              serverDetails = { host, port, identity };
              break;
            } else {
              this.log(`  Found server but wrong signature at ${host}:${port}`, 'yellow', ICONS.warning);
            }
          }
        } catch (error) {
          // Silent fail for connection attempts
        }
      }
      if (serverFound) break;
    }

    if (!serverFound) {
      this.log('No WebAI Server found', 'red', ICONS.error);
      this.issues.push('WebAI Server is not running. Start it with: npx @cpjet64/webai-server');
      this.results.connectivity = { status: 'no_server' };
    } else {
      this.results.connectivity = { status: 'connected', server: serverDetails };

      // Test additional endpoints
      try {
        const healthResponse = await fetch(`http://${serverDetails.host}:${serverDetails.port}/console-logs`, {
          signal: AbortSignal.timeout(2000)
        });

        if (healthResponse.ok) {
          this.log('Server API endpoints responding', 'green', ICONS.success);
        } else {
          this.log('Server found but API endpoints not responding properly', 'yellow', ICONS.warning);
        }
      } catch (error) {
        this.log('Server found but API endpoints not accessible', 'yellow', ICONS.warning);
      }
    }
  }

  async checkChromeExtension() {
    this.logSection('Chrome Extension');

    try {
      // Check if Chrome extension files exist
      const extensionPath = path.join(process.cwd(), 'chrome-extension');
      const manifestPath = path.join(extensionPath, 'manifest.json');

      if (!fs.existsSync(extensionPath)) {
        this.log('Chrome extension directory not found', 'red', ICONS.error);
        this.issues.push('Chrome extension files are missing');
        this.results.chromeExtension = { status: 'missing' };
        return;
      }

      if (!fs.existsSync(manifestPath)) {
        this.log('Chrome extension manifest.json not found', 'red', ICONS.error);
        this.issues.push('Chrome extension manifest.json is missing');
        this.results.chromeExtension = { status: 'invalid' };
        return;
      }

      // Read and validate manifest
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      this.log(`Chrome extension found (v${manifest.version})`, 'green', ICONS.success);
      this.log(`Extension name: ${manifest.name}`, 'blue', ICONS.info);

      // Check required files
      const requiredFiles = ['devtools.js', 'panel.js', 'panel.html'];
      let allFilesPresent = true;

      for (const file of requiredFiles) {
        const filePath = path.join(extensionPath, file);
        if (fs.existsSync(filePath)) {
          this.log(`  ✓ ${file}`, 'green', '    ');
        } else {
          this.log(`  ✗ ${file} missing`, 'red', '    ');
          allFilesPresent = false;
        }
      }

      if (allFilesPresent) {
        this.results.chromeExtension = { status: 'ready', version: manifest.version };
        this.recommendations.push('Install the Chrome extension by loading the chrome-extension folder as an unpacked extension in Chrome Developer mode');
      } else {
        this.results.chromeExtension = { status: 'incomplete' };
        this.issues.push('Chrome extension files are incomplete');
      }

    } catch (error) {
      this.log(`Chrome extension check failed: ${error.message}`, 'red', ICONS.error);
      this.results.chromeExtension = { status: 'error', error: error.message };
    }
  }

  generateReport() {
    this.logSection('Diagnostic Summary');

    // Overall status
    const hasErrors = this.issues.length > 0;
    const hasRecommendations = this.recommendations.length > 0;

    if (!hasErrors && !hasRecommendations) {
      this.log('All checks passed! Your webai-mcp setup looks good.', 'green', ICONS.success);
    } else if (hasErrors) {
      this.log(`Found ${this.issues.length} issue(s) that need attention:`, 'red', ICONS.error);
      this.issues.forEach((issue, index) => {
        this.log(`${index + 1}. ${issue}`, 'red', '  ');
      });
    }

    if (hasRecommendations) {
      console.log();
      this.log(`${this.recommendations.length} recommendation(s):`, 'yellow', ICONS.warning);
      this.recommendations.forEach((rec, index) => {
        this.log(`${index + 1}. ${rec}`, 'yellow', '  ');
      });
    }

    // Quick start guide
    if (hasErrors || hasRecommendations) {
      console.log();
      this.logSection('Quick Fix Guide');

      if (!this.results.buildStatus?.mcpBuilt || !this.results.buildStatus?.serverBuilt) {
        this.log('1. Build the packages:', 'cyan', ICONS.tools);
        this.log('   cd webai-mcp && npm install && npm run build', 'blue', '   ');
        this.log('   cd ../webai-server && npm install && npm run build', 'blue', '   ');
      }

      if (this.results.connectivity?.status === 'no_server') {
        this.log('2. Start the server:', 'cyan', ICONS.tools);
        this.log('   npx @cpjet64/webai-server', 'blue', '   ');
      }

      if (this.results.chromeExtension?.status === 'ready') {
        this.log('3. Install Chrome extension:', 'cyan', ICONS.tools);
        this.log('   - Open Chrome and go to chrome://extensions/', 'blue', '   ');
        this.log('   - Enable "Developer mode"', 'blue', '   ');
        this.log('   - Click "Load unpacked" and select the chrome-extension folder', 'blue', '   ');
      }
    }

    console.log();
    this.log('Diagnostic complete!', 'bright', ICONS.success);
  }
}

// Run diagnostics if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const diagnostic = new DiagnosticTool();
  diagnostic.runDiagnostics().catch(console.error);
}

export default DiagnosticTool;
