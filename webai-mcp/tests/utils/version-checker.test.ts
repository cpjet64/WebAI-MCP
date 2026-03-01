import { VersionChecker } from '../../version-checker';
import fs from 'fs';
import path from 'path';

// Mock fs and path modules
jest.mock('fs');
jest.mock('path');

describe('VersionChecker', () => {
  const mockFs = fs as jest.Mocked<typeof fs>;
  const mockPath = path as jest.Mocked<typeof path>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default path mocks
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.dirname.mockImplementation((p) => p.split('/').slice(0, -1).join('/'));
  });

  describe('getVersionInfo', () => {
    it('should get version info successfully', async () => {
      // Mock package.json files
      const mcpPackageJson = { version: '1.5.0' };
      const serverPackageJson = { version: '1.5.0' };
      
      mockFs.existsSync.mockImplementation((filePath: any) => {
        return filePath.includes('package.json');
      });
      
      mockFs.readFileSync.mockImplementation((filePath: any) => {
        if (filePath.includes('webai-mcp')) {
          return JSON.stringify(mcpPackageJson);
        } else if (filePath.includes('webai-server')) {
          return JSON.stringify(serverPackageJson);
        }
        return '{}';
      });

      // Mock fetch for NPM registry
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          'dist-tags': { latest: '1.5.1' },
          versions: { '1.5.1': {}, '1.5.0': {} }
        })
      });

      const versionInfo = await VersionChecker.getVersionInfo();

      expect(versionInfo).toHaveProperty('mcpServer');
      expect(versionInfo).toHaveProperty('webaiServer');
      expect(versionInfo).toHaveProperty('chromeExtension');
      expect(versionInfo).toHaveProperty('system');
      expect(versionInfo).toHaveProperty('compatibility');
      expect(versionInfo).toHaveProperty('updateAvailable');
    });

    it('should handle missing package.json files', async () => {
      mockFs.existsSync.mockReturnValue(false);

      const versionInfo = await VersionChecker.getVersionInfo();

      expect(versionInfo.mcpServer.version).toBe('unknown');
      expect(versionInfo.webaiServer.version).toBe('unknown');
      expect(versionInfo.compatibility.status).toBe('unknown');
    });

    it('should handle malformed package.json files', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue('invalid json');

      const versionInfo = await VersionChecker.getVersionInfo();

      expect(versionInfo.mcpServer.version).toBe('unknown');
      expect(versionInfo.webaiServer.version).toBe('unknown');
    });

    it('should handle NPM registry fetch errors', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({ version: '1.5.0' }));
      
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const versionInfo = await VersionChecker.getVersionInfo();

      expect(versionInfo.updateAvailable.mcp).toBe(false);
      expect(versionInfo.updateAvailable.server).toBe(false);
    });
  });

  describe('checkCompatibility', () => {
    it('should return compatible for matching versions', () => {
      const versions = {
        mcpServer: '1.5.0',
        webaiServer: '1.5.0',
        chromeExtension: '1.5.0'
      };

      const result = VersionChecker.checkCompatibility(versions);

      expect(result.status).toBe('compatible');
      expect(result.issues).toHaveLength(0);
      expect(result.warnings).toHaveLength(0);
    });

    it('should return incompatible for major version mismatches', () => {
      const versions = {
        mcpServer: '2.0.0',
        webaiServer: '1.5.0',
        chromeExtension: '1.5.0'
      };

      const result = VersionChecker.checkCompatibility(versions);

      expect(result.status).toBe('incompatible');
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should return warning for minor version differences', () => {
      const versions = {
        mcpServer: '1.5.0',
        webaiServer: '1.4.0',
        chromeExtension: '1.5.0'
      };

      const result = VersionChecker.checkCompatibility(versions);

      expect(result.status).toBe('warning');
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should handle unknown versions', () => {
      const versions = {
        mcpServer: 'unknown',
        webaiServer: '1.5.0',
        chromeExtension: 'unknown'
      };

      const result = VersionChecker.checkCompatibility(versions);

      expect(result.status).toBe('unknown');
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should handle development versions', () => {
      const versions = {
        mcpServer: '1.5.0-dev.1',
        webaiServer: '1.5.0-dev.2',
        chromeExtension: '1.5.0'
      };

      const result = VersionChecker.checkCompatibility(versions);

      expect(result.warnings.some(w => w.includes('development'))).toBe(true);
    });

    it('should handle pre-release versions', () => {
      const versions = {
        mcpServer: '1.5.0-beta.1',
        webaiServer: '1.5.0-alpha.1',
        chromeExtension: '1.5.0-rc.1'
      };

      const result = VersionChecker.checkCompatibility(versions);

      expect(result.warnings.some(w => w.includes('pre-release'))).toBe(true);
    });
  });

  describe('parseVersion', () => {
    it('should parse standard semantic versions', () => {
      const testCases = [
        { input: '1.5.0', expected: { major: 1, minor: 5, patch: 0, prerelease: null } },
        { input: '2.10.15', expected: { major: 2, minor: 10, patch: 15, prerelease: null } },
        { input: '0.1.0', expected: { major: 0, minor: 1, patch: 0, prerelease: null } }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = VersionChecker.parseVersion(input);
        expect(result).toEqual(expected);
      });
    });

    it('should parse pre-release versions', () => {
      const testCases = [
        { input: '1.5.0-dev.1', expected: { major: 1, minor: 5, patch: 0, prerelease: 'dev.1' } },
        { input: '2.0.0-beta.2', expected: { major: 2, minor: 0, patch: 0, prerelease: 'beta.2' } },
        { input: '1.0.0-alpha', expected: { major: 1, minor: 0, patch: 0, prerelease: 'alpha' } }
      ];

      testCases.forEach(({ input, expected }) => {
        const result = VersionChecker.parseVersion(input);
        expect(result).toEqual(expected);
      });
    });

    it('should handle invalid version strings', () => {
      const invalidVersions = ['invalid', '1.2', '1.2.3.4', '', 'v1.2.3'];

      invalidVersions.forEach(version => {
        const result = VersionChecker.parseVersion(version);
        expect(result).toBeNull();
      });
    });

    it('should handle version strings with v prefix', () => {
      const result = VersionChecker.parseVersion('v1.5.0');
      expect(result).toEqual({ major: 1, minor: 5, patch: 0, prerelease: null });
    });
  });

  describe('compareVersions', () => {
    it('should compare major versions correctly', () => {
      expect(VersionChecker.compareVersions('2.0.0', '1.9.9')).toBe(1);
      expect(VersionChecker.compareVersions('1.0.0', '2.0.0')).toBe(-1);
    });

    it('should compare minor versions correctly', () => {
      expect(VersionChecker.compareVersions('1.5.0', '1.4.9')).toBe(1);
      expect(VersionChecker.compareVersions('1.3.0', '1.4.0')).toBe(-1);
    });

    it('should compare patch versions correctly', () => {
      expect(VersionChecker.compareVersions('1.5.2', '1.5.1')).toBe(1);
      expect(VersionChecker.compareVersions('1.5.0', '1.5.1')).toBe(-1);
    });

    it('should handle equal versions', () => {
      expect(VersionChecker.compareVersions('1.5.0', '1.5.0')).toBe(0);
    });

    it('should handle pre-release versions', () => {
      expect(VersionChecker.compareVersions('1.5.0', '1.5.0-dev.1')).toBe(1);
      expect(VersionChecker.compareVersions('1.5.0-dev.1', '1.5.0')).toBe(-1);
      expect(VersionChecker.compareVersions('1.5.0-dev.2', '1.5.0-dev.1')).toBe(1);
    });

    it('should handle invalid versions', () => {
      expect(VersionChecker.compareVersions('invalid', '1.5.0')).toBe(0);
      expect(VersionChecker.compareVersions('1.5.0', 'invalid')).toBe(0);
      expect(VersionChecker.compareVersions('invalid', 'invalid')).toBe(0);
    });
  });

  describe('formatVersionReport', () => {
    it('should format complete version report', () => {
      const versionInfo = {
        mcpServer: { version: '1.5.0', path: '/path/to/mcp' },
        webaiServer: { version: '1.5.0', path: '/path/to/server' },
        chromeExtension: { version: '1.5.0' },
        system: {
          node: '18.0.0',
          npm: '8.0.0',
          platform: 'linux',
          arch: 'x64'
        },
        compatibility: {
          status: 'compatible' as const,
          issues: [],
          warnings: []
        },
        updateAvailable: {
          mcp: false,
          server: false,
          latestVersions: {
            mcp: '1.5.0',
            server: '1.5.0'
          }
        },
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      const report = VersionChecker.formatVersionReport(versionInfo);

      expect(report).toContain('WebAI-MCP Version Compatibility Check');
      expect(report).toContain('Component Versions:');
      expect(report).toContain('MCP Server: 1.5.0');
      expect(report).toContain('WebAI Server: 1.5.0');
      expect(report).toContain('Chrome Extension: 1.5.0');
      expect(report).toContain('System Information:');
      expect(report).toContain('Overall Compatibility: ✅ Compatible');
    });

    it('should format report with issues and warnings', () => {
      const versionInfo = {
        mcpServer: { version: '2.0.0', path: '/path/to/mcp' },
        webaiServer: { version: '1.5.0', path: '/path/to/server' },
        chromeExtension: { version: 'unknown' },
        system: {
          node: '18.0.0',
          npm: '8.0.0',
          platform: 'win32',
          arch: 'x64'
        },
        compatibility: {
          status: 'incompatible' as const,
          issues: ['Major version mismatch between MCP Server and WebAI Server'],
          warnings: ['Chrome Extension version could not be determined']
        },
        updateAvailable: {
          mcp: true,
          server: true,
          latestVersions: {
            mcp: '2.1.0',
            server: '1.6.0'
          }
        },
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      const report = VersionChecker.formatVersionReport(versionInfo);

      expect(report).toContain('❌ Errors:');
      expect(report).toContain('Major version mismatch');
      expect(report).toContain('⚠️  Warnings:');
      expect(report).toContain('Chrome Extension version could not be determined');
      expect(report).toContain('Overall Compatibility: ❌ Issues Found');
    });

    it('should format report with available updates', () => {
      const versionInfo = {
        mcpServer: { version: '1.4.0', path: '/path/to/mcp' },
        webaiServer: { version: '1.4.0', path: '/path/to/server' },
        chromeExtension: { version: '1.4.0' },
        system: {
          node: '18.0.0',
          npm: '8.0.0',
          platform: 'darwin',
          arch: 'arm64'
        },
        compatibility: {
          status: 'compatible' as const,
          issues: [],
          warnings: []
        },
        updateAvailable: {
          mcp: true,
          server: true,
          latestVersions: {
            mcp: '1.5.0',
            server: '1.5.0'
          }
        },
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      const report = VersionChecker.formatVersionReport(versionInfo);

      expect(report).toContain('🔄 Updates Available:');
      expect(report).toContain('MCP Server: 1.4.0 → 1.5.0');
      expect(report).toContain('WebAI Server: 1.4.0 → 1.5.0');
    });
  });

  describe('getSystemInfo', () => {
    it('should get system information', () => {
      // Mock process.version and process.platform
      const originalProcess = process;
      (global as any).process = {
        ...originalProcess,
        version: 'v18.0.0',
        platform: 'linux',
        arch: 'x64'
      };

      const systemInfo = VersionChecker.getSystemInfo();

      expect(systemInfo).toHaveProperty('node');
      expect(systemInfo).toHaveProperty('platform');
      expect(systemInfo).toHaveProperty('arch');
      expect(systemInfo.node).toBe('18.0.0');
      expect(systemInfo.platform).toBe('linux');
      expect(systemInfo.arch).toBe('x64');

      // Restore original process
      (global as any).process = originalProcess;
    });
  });
});
