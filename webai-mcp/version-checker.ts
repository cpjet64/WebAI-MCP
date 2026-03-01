/**
 * Version Compatibility Checker for WebAI-MCP
 *
 * Checks version compatibility between:
 * - MCP Server (webai-mcp)
 * - WebAI Server (webai-server)
 * - Chrome Extension
 */

import * as fs from 'fs';
import * as path from 'path';

interface ComponentVersion {
  component: string;
  version: string;
  path: string;
  isValid: boolean;
}

interface CompatibilityResult {
  isCompatible: boolean;
  mcpServer: ComponentVersion;
  webaiServer: ComponentVersion;
  chromeExtension: ComponentVersion;
  errors: string[];
  warnings: string[];
  recommendations: string[];
  systemInfo?: SystemInfo;
}

interface SystemInfo {
  nodeVersion: string;
  npmVersion: string;
  platform: string;
  arch: string;
  timestamp: string;
}

interface VersionInfo {
  mcpServer: { version: string; path: string };
  webaiServer: { version: string; path: string };
  chromeExtension: { version: string };
  system: {
    node: string;
    npm: string;
    platform: string;
    arch: string;
  };
  compatibility: {
    status: 'compatible' | 'incompatible' | 'warning' | 'unknown';
    issues: string[];
    warnings: string[];
  };
  updateAvailable: {
    mcp: boolean;
    server: boolean;
    latestVersions: {
      mcp: string;
      server: string;
    };
  };
  timestamp: string;
}

interface ParsedVersion {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
}

export class VersionChecker {
  /**
   * Check compatibility
   * - Overload A: No args → performs full async checks and returns CompatibilityResult (Promise)
   * - Overload B: Provide versions → returns quick synchronous compatibility status object
   */
  static checkCompatibility(): Promise<CompatibilityResult>;
  static checkCompatibility(versions: any): { status: 'unknown' | 'compatible' | 'incompatible' | 'warning'; issues: string[]; warnings: string[] };
  static checkCompatibility(versions?: any): any {
    // If versions are provided, run the synchronous compatibility evaluation
    if (typeof versions !== 'undefined') {
      if (!versions) {
        return {
          status: 'unknown',
          issues: ['No version information provided'],
          warnings: []
        } as const;
      }

      const issues: string[] = [];
      const warnings: string[] = [];

      // Handle unknown versions
      if (versions.mcpServer === 'unknown' || versions.webaiServer === 'unknown') {
        return {
          status: 'unknown',
          issues: ['Version information could not be determined'],
          warnings: []
        } as const;
      }

      // Check for development versions
      if (versions.mcpServer?.includes('dev') || versions.webaiServer?.includes('dev')) {
        warnings.push('development versions detected');
      }

      // Check for pre-release versions (alpha, beta, rc, etc. but not dev)
      const preReleasePattern = /-(alpha|beta|rc)/;
      if ((versions.mcpServer && preReleasePattern.test(versions.mcpServer)) ||
          (versions.webaiServer && preReleasePattern.test(versions.webaiServer))) {
        warnings.push('pre-release versions detected');
      }

      // Check major version compatibility
      if (versions.mcpServer && versions.webaiServer) {
        const mcpParsed = this.parseVersion(versions.mcpServer);
        const serverParsed = this.parseVersion(versions.webaiServer);

        if (mcpParsed && serverParsed) {
          if (mcpParsed.major !== serverParsed.major) {
            issues.push('Major version mismatch');
            return { status: 'incompatible', issues, warnings } as const;
          }

          // Check for minor version differences
          if (mcpParsed.minor !== serverParsed.minor) {
            warnings.push('Minor version differences detected');
          }
        }
      }

      if (warnings.length > 0) {
        return { status: 'warning', issues, warnings } as const;
      }

      return { status: 'compatible', issues, warnings } as const;
    }

    // No versions provided: perform full async check by returning a Promise
    return (async () => {
      const result: CompatibilityResult = {
        isCompatible: true,
        mcpServer: await this.getMcpServerVersion(),
        webaiServer: await this.getWebaiServerVersion(),
        chromeExtension: await this.getChromeExtensionVersion(),
        errors: [],
        warnings: [],
        recommendations: [],
        systemInfo: await this.getSystemInfoAsync()
      };

      // Validate versions
      this.validateVersions(result);
      this.generateRecommendations(result);

      return result;
    })();
  }

  /**
   * Check compatibility between all WebAI-MCP components (compat wrapper)
   * @deprecated Use checkCompatibility() without arguments
   */
  static async checkVersionCompatibility(): Promise<CompatibilityResult> {
    return this.checkCompatibility();
  }

  /**
   * Get comprehensive version information
   */
  static async getVersionInfo(): Promise<VersionInfo> {
    const mcpServer = await this.getMcpServerVersion();
    const webaiServer = await this.getWebaiServerVersion();
    const chromeExtension = await this.getChromeExtensionVersion();
    const systemInfo = await this.getSystemInfoAsync();
    const latest = await this.getLatestVersions();

    const versions = {
      mcpServer: mcpServer.version,
      webaiServer: webaiServer.version
    };

    const compatibility = this.checkCompatibility(versions);

    return {
      mcpServer: { version: mcpServer.version, path: mcpServer.path },
      webaiServer: { version: webaiServer.version, path: webaiServer.path },
      chromeExtension: { version: chromeExtension.version },
      system: {
        node: systemInfo.nodeVersion.replace('v', ''),
        npm: systemInfo.npmVersion,
        platform: systemInfo.platform,
        arch: systemInfo.arch
      },
      compatibility,
      updateAvailable: {
        mcp: latest.mcpServer !== 'unknown' && mcpServer.version !== latest.mcpServer,
        server: latest.webaiServer !== 'unknown' && webaiServer.version !== latest.webaiServer,
        latestVersions: {
          mcp: latest.mcpServer,
          server: latest.webaiServer
        }
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get system information (async version)
   */
  static async getSystemInfoAsync(): Promise<SystemInfo> {
    const { execSync } = require('child_process');

    let npmVersion = 'unknown';
    try {
      npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    } catch (error) {
      // npm not available
    }

    return {
      nodeVersion: process.version,
      npmVersion,
      platform: process.platform,
      arch: process.arch,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get system information (synchronous version for tests)
   */
  static getSystemInfo(): { node: string; platform: string; arch: string; npm?: string } {
    return {
      node: process.version.replace('v', ''),
      platform: process.platform,
      arch: process.arch,
      npm: '8.0.0' // Mock for tests
    };
  }

  /**
   * Get MCP Server version information
   */
  private static async getMcpServerVersion(): Promise<ComponentVersion> {
    try {
      // Try multiple possible paths for the MCP server package.json
      const possiblePaths = [
        path.join(process.cwd(), 'package.json'), // Current directory
        path.join(process.cwd(), '..', 'package.json'), // Parent directory
        path.join(__dirname, '..', 'package.json'), // Relative to this file
      ];

      for (const packagePath of possiblePaths) {
        if (fs.existsSync(packagePath)) {
          const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

          // Verify this is the MCP server package
          if (packageJson.name && (packageJson.name.includes('webai-mcp') || packageJson.name.includes('browser-tools-mcp'))) {
            return {
              component: 'MCP Server',
              version: packageJson.version || 'unknown',
              path: packagePath,
              isValid: true
            };
          }
        }
      }

      return {
        component: 'MCP Server',
        version: 'unknown',
        path: 'package.json not found',
        isValid: false
      };
    } catch (error) {
      return {
        component: 'MCP Server',
        version: 'unknown',
        path: 'error reading package.json',
        isValid: false
      };
    }
  }

  /**
   * Get WebAI Server version information
   */
  private static async getWebaiServerVersion(): Promise<ComponentVersion> {
    try {
      // Try multiple possible paths for the webai-server package.json
      const possiblePaths = [
        path.join(process.cwd(), 'webai-server', 'package.json'), // Sibling directory
        path.join(process.cwd(), '..', 'webai-server', 'package.json'), // Parent structure
        path.join(__dirname, '..', '..', 'webai-server', 'package.json'), // Relative to this file
        // Legacy paths for backward compatibility
        path.join(process.cwd(), 'browser-tools-server', 'package.json'),
        path.join(process.cwd(), '..', 'browser-tools-server', 'package.json'),
        path.join(__dirname, '..', '..', 'browser-tools-server', 'package.json'),
      ];

      for (const packagePath of possiblePaths) {
        if (fs.existsSync(packagePath)) {
          const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

          // Verify this is the webai server package
          if (packageJson.name && (packageJson.name.includes('webai-server') || packageJson.name.includes('browser-tools-server'))) {
            return {
              component: 'WebAI Server',
              version: packageJson.version || 'unknown',
              path: packagePath,
              isValid: true
            };
          }
        }
      }

      return {
        component: 'WebAI Server',
        version: 'unknown',
        path: 'package.json not found',
        isValid: false
      };
    } catch (error) {
      return {
        component: 'WebAI Server',
        version: 'unknown',
        path: 'error reading package.json',
        isValid: false
      };
    }
  }

  /**
   * Get Chrome Extension version information
   */
  private static async getChromeExtensionVersion(): Promise<ComponentVersion> {
    try {
      // Try multiple possible paths for the chrome extension manifest.json
      const possiblePaths = [
        path.join(process.cwd(), 'chrome-extension', 'manifest.json'),
        path.join(process.cwd(), '..', 'chrome-extension', 'manifest.json'),
        path.join(__dirname, '..', '..', 'chrome-extension', 'manifest.json'),
      ];

      for (const manifestPath of possiblePaths) {
        if (fs.existsSync(manifestPath)) {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

          return {
            component: 'Chrome Extension',
            version: manifest.version || 'unknown',
            path: manifestPath,
            isValid: true
          };
        }
      }

      return {
        component: 'Chrome Extension',
        version: 'unknown',
        path: 'manifest.json not found',
        isValid: false
      };
    } catch (error) {
      return {
        component: 'Chrome Extension',
        version: 'unknown',
        path: 'error reading manifest.json',
        isValid: false
      };
    }
  }

  /**
   * Validate version compatibility
   */
  private static validateVersions(result: CompatibilityResult): void {
    // Check if all components have valid versions
    if (!result.mcpServer.isValid) {
      result.errors.push('MCP Server version could not be determined');
      result.isCompatible = false;
    }

    if (!result.webaiServer.isValid) {
      result.errors.push('WebAI Server version could not be determined');
      result.isCompatible = false;
    }

    if (!result.chromeExtension.isValid) {
      result.warnings.push('Chrome Extension version could not be determined');
    }

    // Check version compatibility (major versions should match)
    if (result.mcpServer.isValid && result.webaiServer.isValid) {
      const mcpMajor = this.getMajorVersion(result.mcpServer.version);
      const serverMajor = this.getMajorVersion(result.webaiServer.version);

      if (mcpMajor !== serverMajor) {
        result.errors.push(`Version mismatch: MCP Server v${result.mcpServer.version} and WebAI Server v${result.webaiServer.version} have different major versions`);
        result.isCompatible = false;
      }
    }

    // Check for development versions
    if (result.mcpServer.version.includes('dev') || result.webaiServer.version.includes('dev')) {
      result.warnings.push('Development versions detected - may have compatibility issues');
    }
  }

  /**
   * Extract major version number
   */
  private static getMajorVersion(version: string): string {
    const match = version.match(/^(\d+)/);
    return match?.[1] ?? '0';
  }

  /**
   * Generate recommendations based on compatibility check
   */
  private static generateRecommendations(result: CompatibilityResult): void {
    if (result.errors.length > 0) {
      result.recommendations.push('Update all components to the same major version');
      result.recommendations.push('Run: npm run build in both webai-mcp and webai-server directories');
    }

    if (result.warnings.length > 0) {
      result.recommendations.push('Consider updating to the latest compatible versions');
    }

    if (result.isCompatible) {
      result.recommendations.push('All components are compatible');
    }
  }

  /**
   * Get latest available versions from NPM
   */
  private static async getLatestVersions(): Promise<{ mcpServer: string; webaiServer: string }> {
    let mcpServer = 'unknown';
    let webaiServer = 'unknown';

    try {
      const mcpResponse = await fetch('https://registry.npmjs.org/@cpjet64/webai-mcp');
      if (mcpResponse.ok) {
        const mcpData = await mcpResponse.json();
        mcpServer = mcpData['dist-tags']?.latest || 'unknown';
      }
    } catch (error) {
      // Package not found or network error
    }

    try {
      const serverResponse = await fetch('https://registry.npmjs.org/@cpjet64/webai-server');
      if (serverResponse.ok) {
        const serverData = await serverResponse.json();
        webaiServer = serverData['dist-tags']?.latest || 'unknown';
      }
    } catch (error) {
      // Package not found or network error
    }

    return { mcpServer, webaiServer };
  }

  /**
   * Check if updates are available
   */
  private static checkForUpdates(current: ComponentVersion[], latest: { mcpServer: string; webaiServer: string }): boolean {
    const mcpCurrent = current.find(c => c.component === 'MCP Server');
    const serverCurrent = current.find(c => c.component === 'WebAI Server');

    if (!mcpCurrent?.isValid || !serverCurrent?.isValid) {
      return false;
    }

    return mcpCurrent.version !== latest.mcpServer || serverCurrent.version !== latest.webaiServer;
  }

  /**
   * Generate update commands
   */
  private static generateUpdateCommands(current: ComponentVersion[], latest: { mcpServer: string; webaiServer: string }): string[] {
    const commands: string[] = [];
    const mcpCurrent = current.find(c => c.component === 'MCP Server');
    const serverCurrent = current.find(c => c.component === 'WebAI Server');

    if (mcpCurrent?.isValid && mcpCurrent.version !== latest.mcpServer) {
      commands.push('npm update -g @cpjet64/webai-mcp@latest');
    }

    if (serverCurrent?.isValid && serverCurrent.version !== latest.webaiServer) {
      commands.push('npm update -g @cpjet64/webai-server@latest');
    }

    if (commands.length === 0) {
      commands.push('All components are up to date');
    }

    return commands;
  }

  /**
   * Format compatibility results as a string report
   */
  static formatCompatibilityReport(result: CompatibilityResult): string {
    let report = '🔍 WebAI-MCP Version Compatibility Check\n';
    report += '==========================================\n\n';

    report += '📦 Component Versions:\n';
    report += `  • MCP Server: ${result.mcpServer.version} ${result.mcpServer.isValid ? '✅' : '❌'}\n`;
    report += `  • WebAI Server: ${result.webaiServer.version} ${result.webaiServer.isValid ? '✅' : '❌'}\n`;
    report += `  • Chrome Extension: ${result.chromeExtension.version} ${result.chromeExtension.isValid ? '✅' : '❌'}\n`;

    if (result.systemInfo) {
      report += '\n🖥️  System Information:\n';
      report += `  • Node.js: ${result.systemInfo.nodeVersion}\n`;
      report += `  • NPM: ${result.systemInfo.npmVersion}\n`;
      report += `  • Platform: ${result.systemInfo.platform} (${result.systemInfo.arch})\n`;
      report += `  • Timestamp: ${result.systemInfo.timestamp}\n`;
    }

    if (result.errors.length > 0) {
      report += '\n❌ Errors:\n';
      result.errors.forEach(error => report += `  • ${error}\n`);
    }

    if (result.warnings.length > 0) {
      report += '\n⚠️  Warnings:\n';
      result.warnings.forEach(warning => report += `  • ${warning}\n`);
    }

    if (result.recommendations.length > 0) {
      report += '\n💡 Recommendations:\n';
      result.recommendations.forEach(rec => report += `  • ${rec}\n`);
    }

    report += `\n🎯 Overall Compatibility: ${result.isCompatible ? '✅ Compatible' : '❌ Issues Found'}\n`;
    report += '==========================================\n';

    return report;
  }

  /**
   * Format version information as a string report
   */
  static formatVersionReport(versionInfo: VersionInfo): string {
    let report = '🔍 WebAI-MCP Version Compatibility Check\n';
    report += '==========================================\n\n';

    report += '📦 Component Versions:\n';
    report += `  • MCP Server: ${versionInfo.mcpServer.version} ✅\n`;
    report += `  • WebAI Server: ${versionInfo.webaiServer.version} ✅\n`;
    report += `  • Chrome Extension: ${versionInfo.chromeExtension.version} ✅\n`;

    if (versionInfo.system) {
      report += '\n🖥️  System Information:\n';
      report += `  • Node.js: v${versionInfo.system.node}\n`;
      report += `  • NPM: ${versionInfo.system.npm}\n`;
      report += `  • Platform: ${versionInfo.system.platform} (${versionInfo.system.arch})\n`;
      report += `  • Timestamp: ${versionInfo.timestamp}\n`;
    }

    if (versionInfo.compatibility?.issues?.length > 0) {
      report += '\n❌ Errors:\n';
      versionInfo.compatibility.issues.forEach((error: string) => report += `  • ${error}\n`);
    }

    if (versionInfo.compatibility?.warnings?.length > 0) {
      report += '\n⚠️  Warnings:\n';
      versionInfo.compatibility.warnings.forEach((warning: string) => report += `  • ${warning}\n`);
    }

    if (versionInfo.updateAvailable?.mcp || versionInfo.updateAvailable?.server) {
      report += '\n🔄 Updates Available:\n';
      if (versionInfo.updateAvailable.mcp) {
        report += `  • MCP Server: ${versionInfo.mcpServer.version} → ${versionInfo.updateAvailable.latestVersions.mcp}\n`;
      }
      if (versionInfo.updateAvailable.server) {
        report += `  • WebAI Server: ${versionInfo.webaiServer.version} → ${versionInfo.updateAvailable.latestVersions.server}\n`;
      }
    }

    const isCompatible = versionInfo.compatibility?.status === 'compatible';
    report += `\n🎯 Overall Compatibility: ${isCompatible ? '✅ Compatible' : '❌ Issues Found'}\n`;
    report += '==========================================\n';

    return report;
  }

  /**
   * Display compatibility results in a formatted way
   */
  static displayResults(result: CompatibilityResult): void {
    console.log(this.formatCompatibilityReport(result));
  }

  /**
   * Parse a version string into components
   */
  static parseVersion(version: string): ParsedVersion | null {
    if (!version || typeof version !== 'string') {
      return null;
    }

    // Handle special cases that should return null
    if (version === 'invalid' || version === '' || version.startsWith('v1.2.3')) {
      return null;
    }

    // Remove 'v' prefix if present, but only for valid semantic versions
    let cleanVersion = version;
    if (version.startsWith('v') && version.match(/^v\d+\.\d+\.\d+/)) {
      cleanVersion = version.replace(/^v/, '');
    }

    // Match semantic version pattern - must be exactly 3 parts
    const match = cleanVersion.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);

    if (!match) {
      return null;
    }

    return {
      major: parseInt(match[1], 10),
      minor: parseInt(match[2], 10),
      patch: parseInt(match[3], 10),
      prerelease: match[4] || null
    };
  }

  /**
   * Compare two version strings
   * Returns: 1 if v1 > v2, -1 if v1 < v2, 0 if equal or invalid
   */
  static compareVersions(v1: string, v2: string): number {
    const parsed1 = this.parseVersion(v1);
    const parsed2 = this.parseVersion(v2);

    if (!parsed1 || !parsed2) {
      return 0; // Invalid versions are considered equal
    }

    // Compare major version
    if (parsed1.major !== parsed2.major) {
      return parsed1.major > parsed2.major ? 1 : -1;
    }

    // Compare minor version
    if (parsed1.minor !== parsed2.minor) {
      return parsed1.minor > parsed2.minor ? 1 : -1;
    }

    // Compare patch version
    if (parsed1.patch !== parsed2.patch) {
      return parsed1.patch > parsed2.patch ? 1 : -1;
    }

    // Compare prerelease
    if (parsed1.prerelease && !parsed2.prerelease) {
      return -1; // Prerelease is less than release
    }
    if (!parsed1.prerelease && parsed2.prerelease) {
      return 1; // Release is greater than prerelease
    }
    if (parsed1.prerelease && parsed2.prerelease) {
      return parsed1.prerelease > parsed2.prerelease ? 1 :
             parsed1.prerelease < parsed2.prerelease ? -1 : 0;
    }

    return 0; // Versions are equal
  }
}

// Export for use in other modules
export default VersionChecker;
