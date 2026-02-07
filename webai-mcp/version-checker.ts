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
}

export class VersionChecker {
  /**
   * Check compatibility between all WebAI-MCP components
   * @deprecated Use checkCompatibility instead
   */
  static async checkVersionCompatibility(): Promise<CompatibilityResult> {
    return this.checkCompatibility();
  }

  /**
   * Check compatibility between all WebAI-MCP components
   */
  static async checkCompatibility(): Promise<CompatibilityResult> {
    const result: CompatibilityResult = {
      isCompatible: true,
      mcpServer: await this.getMcpServerVersion(),
      webaiServer: await this.getWebaiServerVersion(),
      chromeExtension: await this.getChromeExtensionVersion(),
      errors: [],
      warnings: [],
      recommendations: []
    };

    // Validate versions
    this.validateVersions(result);
    this.generateRecommendations(result);

    return result;
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
    return match ? match[1] : '0';
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
   * Format compatibility results as a string report
   */
  static formatCompatibilityReport(result: CompatibilityResult): string {
    let report = 'WebAI-MCP Version Compatibility Check\n';
    report += '==========================================\n\n';

    report += 'Component Versions:\n';
    report += `  - MCP Server: ${result.mcpServer.version} ${result.mcpServer.isValid ? '[OK]' : '[FAIL]'}\n`;
    report += `  - WebAI Server: ${result.webaiServer.version} ${result.webaiServer.isValid ? '[OK]' : '[FAIL]'}\n`;
    report += `  - Chrome Extension: ${result.chromeExtension.version} ${result.chromeExtension.isValid ? '[OK]' : '[FAIL]'}\n`;

    if (result.errors.length > 0) {
      report += '\nErrors:\n';
      result.errors.forEach(error => report += `  - ${error}\n`);
    }

    if (result.warnings.length > 0) {
      report += '\nWarnings:\n';
      result.warnings.forEach(warning => report += `  - ${warning}\n`);
    }

    if (result.recommendations.length > 0) {
      report += '\nRecommendations:\n';
      result.recommendations.forEach(rec => report += `  - ${rec}\n`);
    }

    report += `\nOverall Compatibility: ${result.isCompatible ? '[COMPATIBLE]' : '[ISSUES FOUND]'}\n`;
    report += '==========================================\n';

    return report;
  }

  /**
   * Display compatibility results in a formatted way
   */
  static displayResults(result: CompatibilityResult): void {
    console.log(this.formatCompatibilityReport(result));
  }
}

// Export for use in other modules
export default VersionChecker;
