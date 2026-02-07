#!/usr/bin/env node

/**
 * Platform-Specific Setup Utilities for WebAI-MCP
 * 
 * Handles platform-specific configurations, optimizations,
 * and troubleshooting for Windows, macOS, and Linux.
 */

import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { pathToFileURL } from 'url';

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
  windows: '🪟',
  apple: '🍎',
  linux: '🐧',
  tools: '🔧'
};

class PlatformSetup {
  constructor() {
    this.platform = os.platform();
    this.arch = os.arch();
    this.issues = [];
    this.fixes = [];
  }

  log(message, color = 'reset', icon = '') {
    const colorCode = COLORS[color] || COLORS.reset;
    console.log(`${colorCode}${icon} ${message}${COLORS.reset}`);
  }

  logSection(title) {
    console.log(`\n${COLORS.cyan}${COLORS.bright}=== ${title} ===${COLORS.reset}`);
  }

  async runPlatformSetup() {
    const platformIcon = this.platform === 'win32' ? ICONS.windows : 
                        this.platform === 'darwin' ? ICONS.apple : ICONS.linux;
    
    this.log(`Platform-Specific Setup for ${this.platform} ${this.arch}`, 'bright', platformIcon);
    console.log();

    switch (this.platform) {
      case 'win32':
        await this.setupWindows();
        break;
      case 'darwin':
        await this.setupMacOS();
        break;
      case 'linux':
        await this.setupLinux();
        break;
      default:
        this.log(`Unsupported platform: ${this.platform}`, 'yellow', ICONS.warning);
    }

    this.generateReport();
  }

  async setupWindows() {
    this.logSection('Windows-Specific Setup');

    // Check Windows version
    await this.checkWindowsVersion();
    
    // Check Windows Defender
    await this.checkWindowsDefender();
    
    // Check PowerShell execution policy
    await this.checkPowerShellPolicy();
    
    // Check WSL
    await this.checkWSL();
    
    // Check Node.js installation method
    await this.checkNodeInstallation();
    
    // Setup Windows-specific optimizations
    await this.setupWindowsOptimizations();
  }

  async checkWindowsVersion() {
    try {
      const version = execSync('ver', { encoding: 'utf8' });
      this.log(`Windows version: ${version.trim()}`, 'blue', ICONS.info);
      
      // Check if it's Windows 10/11
      if (version.includes('10.0')) {
        this.log('Windows 10/11 detected - full compatibility', 'green', ICONS.success);
      } else {
        this.log('Older Windows version detected - some features may not work', 'yellow', ICONS.warning);
        this.issues.push('Consider upgrading to Windows 10 or 11 for best compatibility');
      }
    } catch (error) {
      this.log('Could not determine Windows version', 'yellow', ICONS.warning);
    }
  }

  async checkWindowsDefender() {
    this.log('Checking Windows Defender configuration...', 'blue', ICONS.info);
    
    try {
      // Check if Windows Defender is running
      const processes = execSync('tasklist /FI "IMAGENAME eq MsMpEng.exe"', { encoding: 'utf8' });
      
      if (processes.includes('MsMpEng.exe')) {
        this.log('Windows Defender is active', 'yellow', ICONS.warning);
        this.log('Consider adding exclusions for better performance:', 'yellow', '  ');
        this.log('  - Node.js installation directory', 'yellow', '    ');
        this.log('  - NPM global modules directory', 'yellow', '    ');
        this.log('  - This project directory', 'yellow', '    ');
        
        this.fixes.push({
          title: 'Add Windows Defender Exclusions',
          description: 'Add exclusions to improve performance and prevent false positives',
          commands: [
            'Open Windows Security → Virus & threat protection → Manage settings',
            'Add exclusions for Node.js and project directories'
          ],
          automated: false
        });
      } else {
        this.log('Windows Defender not detected or disabled', 'green', ICONS.success);
      }
    } catch (error) {
      this.log('Could not check Windows Defender status', 'yellow', ICONS.warning);
    }
  }

  async checkPowerShellPolicy() {
    try {
      const policy = execSync('powershell -Command "Get-ExecutionPolicy"', { encoding: 'utf8' }).trim();
      this.log(`PowerShell execution policy: ${policy}`, 'blue', ICONS.info);
      
      if (policy === 'Restricted') {
        this.log('PowerShell execution policy is restricted', 'yellow', ICONS.warning);
        this.issues.push('PowerShell execution policy may prevent some scripts from running');
        
        this.fixes.push({
          title: 'Update PowerShell Execution Policy',
          description: 'Allow local scripts to run',
          commands: [
            'Run PowerShell as Administrator',
            'Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser'
          ],
          automated: false
        });
      } else {
        this.log('PowerShell execution policy allows script execution', 'green', ICONS.success);
      }
    } catch (error) {
      this.log('Could not check PowerShell execution policy', 'yellow', ICONS.warning);
    }
  }

  async checkWSL() {
    try {
      const wslVersion = execSync('wsl --version', { encoding: 'utf8' });
      this.log('WSL detected and available', 'green', ICONS.success);
      this.log('WSL can be used for Linux-compatible development', 'blue', ICONS.info);
    } catch (error) {
      this.log('WSL not available', 'blue', ICONS.info);
      this.log('Consider installing WSL for enhanced development experience', 'yellow', '  ');
    }
  }

  async checkNodeInstallation() {
    try {
      const nodePath = execSync('where node', { encoding: 'utf8' }).trim();
      this.log(`Node.js path: ${nodePath}`, 'blue', ICONS.info);
      
      // Check if installed via installer vs package manager
      if (nodePath.includes('Program Files')) {
        this.log('Node.js installed via official installer', 'green', ICONS.success);
      } else if (nodePath.includes('chocolatey') || nodePath.includes('scoop')) {
        this.log('Node.js installed via package manager', 'green', ICONS.success);
      } else {
        this.log('Node.js installation method unclear', 'yellow', ICONS.warning);
      }
    } catch (error) {
      this.log('Could not determine Node.js installation path', 'yellow', ICONS.warning);
    }
  }

  async setupWindowsOptimizations() {
    this.log('Setting up Windows optimizations...', 'blue', ICONS.tools);
    
    // Create Windows-specific batch files
    await this.createWindowsBatchFiles();
    
    // Check for Windows Terminal
    await this.checkWindowsTerminal();
  }

  async createWindowsBatchFiles() {
    const batchDir = path.join(process.cwd(), 'scripts', 'windows');
    
    try {
      fs.mkdirSync(batchDir, { recursive: true });
      
      // Create start script
      const startScript = `@echo off
echo Starting WebAI-MCP Server...
set MIDDLEWARE_PORT=3025

:: Kill existing processes
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%MIDDLEWARE_PORT%"') do (
    taskkill /F /PID %%a /T 2>nul
)

:: Start middleware server
start "BrowserTools Server" cmd /c "npx @cpjet64/webai-server"

:: Wait and start MCP server if needed
timeout /t 3 /nobreak > nul
echo Server should be running on port %MIDDLEWARE_PORT%
echo Check the server window for status
pause`;

      fs.writeFileSync(path.join(batchDir, 'start-server.bat'), startScript);
      
      // Create diagnostic script
      const diagScript = `@echo off
echo Running WebAI-MCP Diagnostics...
node scripts/diagnose.js
pause`;

      fs.writeFileSync(path.join(batchDir, 'diagnose.bat'), diagScript);
      
      this.log('Created Windows batch files', 'green', ICONS.success);
      this.log(`  - ${path.join(batchDir, 'start-server.bat')}`, 'blue', '    ');
      this.log(`  - ${path.join(batchDir, 'diagnose.bat')}`, 'blue', '    ');
      
    } catch (error) {
      this.log('Failed to create Windows batch files', 'red', ICONS.error);
      this.issues.push('Could not create Windows convenience scripts');
    }
  }

  async checkWindowsTerminal() {
    try {
      execSync('wt --version', { encoding: 'utf8' });
      this.log('Windows Terminal available', 'green', ICONS.success);
    } catch (error) {
      this.log('Windows Terminal not available', 'yellow', ICONS.warning);
      this.log('Consider installing Windows Terminal for better experience', 'yellow', '  ');
    }
  }

  async setupMacOS() {
    this.logSection('macOS-Specific Setup');

    // Check macOS version
    await this.checkMacOSVersion();
    
    // Check Xcode Command Line Tools
    await this.checkXcodeTools();
    
    // Check Homebrew
    await this.checkHomebrew();
    
    // Check security settings
    await this.checkMacOSSecurity();
    
    // Setup macOS optimizations
    await this.setupMacOSOptimizations();
  }

  async checkMacOSVersion() {
    try {
      const version = execSync('sw_vers -productVersion', { encoding: 'utf8' }).trim();
      this.log(`macOS version: ${version}`, 'blue', ICONS.info);
      
      const majorVersion = parseInt(version.split('.')[0]);
      if (majorVersion >= 11) {
        this.log('macOS Big Sur or later - full compatibility', 'green', ICONS.success);
      } else {
        this.log('Older macOS version - some features may not work', 'yellow', ICONS.warning);
      }
    } catch (error) {
      this.log('Could not determine macOS version', 'yellow', ICONS.warning);
    }
  }

  async checkXcodeTools() {
    try {
      execSync('xcode-select --version', { encoding: 'utf8' });
      this.log('Xcode Command Line Tools installed', 'green', ICONS.success);
    } catch (error) {
      this.log('Xcode Command Line Tools not found', 'red', ICONS.error);
      this.issues.push('Xcode Command Line Tools required for native dependencies');
      
      this.fixes.push({
        title: 'Install Xcode Command Line Tools',
        description: 'Required for compiling native Node.js modules',
        commands: ['xcode-select --install'],
        automated: true
      });
    }
  }

  async checkHomebrew() {
    try {
      const brewVersion = execSync('brew --version', { encoding: 'utf8' });
      this.log('Homebrew installed', 'green', ICONS.success);
    } catch (error) {
      this.log('Homebrew not found', 'yellow', ICONS.warning);
      this.log('Homebrew can simplify package management', 'yellow', '  ');
    }
  }

  async checkMacOSSecurity() {
    this.log('Checking macOS security settings...', 'blue', ICONS.info);
    
    // Check if running on Apple Silicon
    if (this.arch === 'arm64') {
      this.log('Apple Silicon Mac detected', 'blue', ICONS.info);
      this.log('Ensure Node.js is ARM64 native for best performance', 'yellow', '  ');
    }
    
    // Note about accessibility permissions
    this.log('Note: AppleScript features may require accessibility permissions', 'yellow', ICONS.warning);
  }

  async setupMacOSOptimizations() {
    this.log('Setting up macOS optimizations...', 'blue', ICONS.tools);
    
    // Create macOS-specific scripts
    await this.createMacOSScripts();
  }

  async createMacOSScripts() {
    const scriptDir = path.join(process.cwd(), 'scripts', 'macos');
    
    try {
      fs.mkdirSync(scriptDir, { recursive: true });
      
      // Create start script
      const startScript = `#!/bin/bash
echo "Starting WebAI-MCP Server..."
export MIDDLEWARE_PORT=3025

# Kill existing processes
lsof -ti:$MIDDLEWARE_PORT | xargs kill -9 2>/dev/null || true

# Start server
npx @cpjet64/webai-server &

echo "Server starting on port $MIDDLEWARE_PORT"
echo "Check terminal output for status"`;

      fs.writeFileSync(path.join(scriptDir, 'start-server.sh'), startScript);
      fs.chmodSync(path.join(scriptDir, 'start-server.sh'), '755');
      
      this.log('Created macOS shell scripts', 'green', ICONS.success);
      
    } catch (error) {
      this.log('Failed to create macOS scripts', 'red', ICONS.error);
    }
  }

  async setupLinux() {
    this.logSection('Linux-Specific Setup');

    // Check Linux distribution
    await this.checkLinuxDistribution();
    
    // Check package manager
    await this.checkPackageManager();
    
    // Check required tools
    await this.checkLinuxTools();
    
    // Setup Linux optimizations
    await this.setupLinuxOptimizations();
  }

  async checkLinuxDistribution() {
    try {
      const release = fs.readFileSync('/etc/os-release', 'utf8');
      const distro = release.match(/PRETTY_NAME="([^"]+)"/)?.[1] || 'Unknown';
      this.log(`Linux distribution: ${distro}`, 'blue', ICONS.info);
    } catch (error) {
      this.log('Could not determine Linux distribution', 'yellow', ICONS.warning);
    }
  }

  async checkPackageManager() {
    const managers = [
      { name: 'apt', command: 'apt --version' },
      { name: 'yum', command: 'yum --version' },
      { name: 'dnf', command: 'dnf --version' },
      { name: 'pacman', command: 'pacman --version' },
      { name: 'zypper', command: 'zypper --version' }
    ];

    for (const manager of managers) {
      try {
        execSync(manager.command, { stdio: 'pipe' });
        this.log(`Package manager: ${manager.name}`, 'green', ICONS.success);
        return;
      } catch (error) {
        // Continue to next manager
      }
    }
    
    this.log('No recognized package manager found', 'yellow', ICONS.warning);
  }

  async checkLinuxTools() {
    const tools = ['curl', 'wget', 'unzip', 'git'];
    
    for (const tool of tools) {
      try {
        execSync(`which ${tool}`, { stdio: 'pipe' });
        this.log(`${tool} available`, 'green', ICONS.success);
      } catch (error) {
        this.log(`${tool} not found`, 'yellow', ICONS.warning);
        this.issues.push(`${tool} is recommended for full functionality`);
      }
    }
  }

  async setupLinuxOptimizations() {
    this.log('Setting up Linux optimizations...', 'blue', ICONS.tools);
    
    // Create Linux-specific scripts
    await this.createLinuxScripts();
  }

  async createLinuxScripts() {
    const scriptDir = path.join(process.cwd(), 'scripts', 'linux');
    
    try {
      fs.mkdirSync(scriptDir, { recursive: true });
      
      // Create systemd service file
      const serviceFile = `[Unit]
Description=WebAI-MCP Server
After=network.target

[Service]
Type=simple
User=\${USER}
WorkingDirectory=\${PWD}
ExecStart=/usr/bin/npx @cpjet64/webai-server
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target`;

      fs.writeFileSync(path.join(scriptDir, 'webai-server.service'), serviceFile);
      
      this.log('Created Linux systemd service file', 'green', ICONS.success);
      this.log('To install: sudo cp scripts/linux/webai-server.service /etc/systemd/system/', 'blue', '  ');
      
    } catch (error) {
      this.log('Failed to create Linux scripts', 'red', ICONS.error);
    }
  }

  generateReport() {
    this.logSection('Platform Setup Summary');
    
    if (this.issues.length === 0 && this.fixes.length === 0) {
      this.log('Platform setup completed successfully! 🎉', 'green', ICONS.success);
    } else {
      if (this.issues.length > 0) {
        this.log('Issues found:', 'yellow', ICONS.warning);
        this.issues.forEach((issue, index) => {
          this.log(`${index + 1}. ${issue}`, 'yellow', '  ');
        });
      }
      
      if (this.fixes.length > 0) {
        console.log();
        this.log('Recommended fixes:', 'cyan', ICONS.tools);
        this.fixes.forEach((fix, index) => {
          this.log(`${index + 1}. ${fix.title}`, 'cyan', '  ');
          this.log(`   ${fix.description}`, 'blue', '     ');
          if (fix.commands) {
            fix.commands.forEach(cmd => {
              this.log(`   ${cmd}`, 'blue', '     ');
            });
          }
        });
      }
    }
    
    console.log();
    this.log('Platform-specific setup complete!', 'bright', ICONS.success);
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
  const setup = new PlatformSetup();
  setup.runPlatformSetup().catch(console.error);
}

export default PlatformSetup;
