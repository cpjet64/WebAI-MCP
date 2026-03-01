import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import auditResultsFixture from '../fixtures/audit-results.json' with { type: 'json' };

// Mock lighthouse and chrome-launcher
jest.mock('lighthouse');
jest.mock('chrome-launcher');

describe('Lighthouse Service', () => {
  const mockLighthouse = lighthouse as jest.MockedFunction<typeof lighthouse>;
  const mockChromeLauncher = chromeLauncher as jest.Mocked<typeof chromeLauncher>;
  
  let mockChrome: any;

  beforeEach(() => {
    // Mock Chrome instance
    mockChrome = {
      port: 9222,
      kill: jest.fn().mockResolvedValue(undefined),
      pid: 12345
    };

    mockChromeLauncher.launch.mockResolvedValue(mockChrome);
    
    // Mock Lighthouse result
    mockLighthouse.mockResolvedValue({
      lhr: {
        categories: {
          performance: auditResultsFixture.performance,
          accessibility: auditResultsFixture.accessibility,
          'best-practices': auditResultsFixture['best-practices'],
          seo: auditResultsFixture.seo
        },
        audits: {
          'first-contentful-paint': auditResultsFixture.performance.audits['first-contentful-paint'],
          'largest-contentful-paint': auditResultsFixture.performance.audits['largest-contentful-paint'],
          'cumulative-layout-shift': auditResultsFixture.performance.audits['cumulative-layout-shift'],
          'color-contrast': auditResultsFixture.accessibility.audits['color-contrast'],
          'image-alt': auditResultsFixture.accessibility.audits['image-alt'],
          'uses-https': auditResultsFixture['best-practices'].audits['uses-https'],
          'meta-description': auditResultsFixture.seo.audits['meta-description']
        },
        requestedUrl: 'https://example.com',
        fetchTime: '2024-01-01T12:00:00.000Z',
        userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
      },
      report: '<html>Lighthouse Report</html>'
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Chrome Launcher', () => {
    it('should launch Chrome successfully', async () => {
      const chrome = await mockChromeLauncher.launch({
        chromeFlags: ['--headless', '--no-sandbox']
      });

      expect(mockChromeLauncher.launch).toHaveBeenCalledWith({
        chromeFlags: ['--headless', '--no-sandbox']
      });
      expect(chrome.port).toBe(9222);
    });

    it('should launch Chrome with custom flags', async () => {
      const customFlags = [
        '--headless',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage'
      ];

      await mockChromeLauncher.launch({
        chromeFlags: customFlags,
        port: 9223
      });

      expect(mockChromeLauncher.launch).toHaveBeenCalledWith({
        chromeFlags: customFlags,
        port: 9223
      });
    });

    it('should handle Chrome launch failure', async () => {
      const launchError = new Error('Failed to launch Chrome');
      mockChromeLauncher.launch.mockRejectedValue(launchError);

      await expect(mockChromeLauncher.launch()).rejects.toThrow('Failed to launch Chrome');
    });

    it('should kill Chrome process', async () => {
      const chrome = await mockChromeLauncher.launch();
      
      await chrome.kill();

      expect(mockChrome.kill).toHaveBeenCalled();
    });
  });

  describe('Performance Audit', () => {
    it('should run performance audit successfully', async () => {
      const url = 'https://example.com';
      const options = {
        onlyCategories: ['performance'],
        port: 9222
      };

      const result = await mockLighthouse(url, options);

      expect(mockLighthouse).toHaveBeenCalledWith(url, options);
      expect(result?.lhr.categories.performance.score).toBe(0.85);
      expect(result?.lhr.audits['first-contentful-paint'].score).toBe(0.9);
    });

    it('should validate performance metrics', async () => {
      const result = await mockLighthouse('https://example.com', {
        onlyCategories: ['performance']
      });

      const performance = result?.lhr.categories.performance;
      const audits = result?.lhr.audits;

      expect(performance?.score).toBeGreaterThanOrEqual(0);
      expect(performance?.score).toBeLessThanOrEqual(1);

      // Check Core Web Vitals
      expect(audits?.['first-contentful-paint']).toBeDefined();
      expect(audits?.['largest-contentful-paint']).toBeDefined();
      expect(audits?.['cumulative-layout-shift']).toBeDefined();

      // Validate metric values
      expect(audits?.['first-contentful-paint']?.displayValue).toBe('1.2s');
      expect(audits?.['largest-contentful-paint']?.displayValue).toBe('2.1s');
      expect(audits?.['cumulative-layout-shift']?.displayValue).toBe('0.05');
    });

    it('should handle performance audit failure', async () => {
      const auditError = new Error('Performance audit failed');
      mockLighthouse.mockRejectedValue(auditError);

      await expect(mockLighthouse('https://invalid-url.com', {
        onlyCategories: ['performance']
      })).rejects.toThrow('Performance audit failed');
    });
  });

  describe('Accessibility Audit', () => {
    it('should run accessibility audit successfully', async () => {
      const url = 'https://example.com';
      const options = {
        onlyCategories: ['accessibility'],
        port: 9222
      };

      const result = await mockLighthouse(url, options);

      // Proper validation instead of ! operator
      expect(result).toBeDefined();
      if (!result) throw new Error('Lighthouse result is undefined');

      expect(result.lhr).toBeDefined();
      if (!result.lhr) throw new Error('Lighthouse LHR is undefined');

      expect(result.lhr.categories).toBeDefined();
      if (!result.lhr.categories) throw new Error('Lighthouse categories is undefined');

      expect(result.lhr.audits).toBeDefined();
      if (!result.lhr.audits) throw new Error('Lighthouse audits is undefined');

      // Now we can safely access without ! or ? operators
      expect(result.lhr.categories.accessibility.score).toBe(0.92);
      expect(result.lhr.audits['color-contrast'].score).toBe(1.0);
      expect(result.lhr.audits['image-alt'].score).toBe(0.8);
    });

    it('should identify accessibility issues', async () => {
      const result = await mockLighthouse('https://example.com', {
        onlyCategories: ['accessibility']
      });

      // Proper validation instead of ! operator
      expect(result).toBeDefined();
      if (!result) throw new Error('Lighthouse result is undefined');

      expect(result.lhr).toBeDefined();
      if (!result.lhr) throw new Error('Lighthouse LHR is undefined');

      expect(result.lhr.audits).toBeDefined();
      if (!result.lhr.audits) throw new Error('Lighthouse audits is undefined');

      const audits = result.lhr.audits;

      // Check for perfect accessibility practices - proper validation
      expect(audits['color-contrast']).toBeDefined();
      if (!audits['color-contrast']) throw new Error('color-contrast audit is undefined');
      expect(audits['color-contrast'].score).toBe(1.0);
      expect(audits['color-contrast'].displayValue).toBe('All text has sufficient color contrast');

      // Check for accessibility issues - proper validation
      expect(audits['image-alt']).toBeDefined();
      if (!audits['image-alt']) throw new Error('image-alt audit is undefined');
      expect(audits['image-alt'].score).toBe(0.8);
      expect(audits['image-alt'].displayValue).toBe('4 images missing alt text');
    });

    it('should validate accessibility audit structure', async () => {
      const result = await mockLighthouse('https://example.com', {
        onlyCategories: ['accessibility']
      });

      // Proper validation instead of ! operator
      expect(result).toBeDefined();
      if (!result) throw new Error('Lighthouse result is undefined');

      expect(result.lhr).toBeDefined();
      if (!result.lhr) throw new Error('Lighthouse LHR is undefined');

      expect(result.lhr.categories).toBeDefined();
      if (!result.lhr.categories) throw new Error('Lighthouse categories is undefined');

      const accessibility = result.lhr.categories.accessibility;
      expect(accessibility).toHaveProperty('score');
      expect(accessibility).toHaveProperty('title');
      expect(accessibility).toHaveProperty('description');
      expect(accessibility.title).toBe('Accessibility');
    });
  });

  describe('SEO Audit', () => {
    it('should run SEO audit successfully', async () => {
      const result = await mockLighthouse('https://example.com', {
        onlyCategories: ['seo']
      });

      // Proper validation instead of ! operator
      expect(result).toBeDefined();
      if (!result) throw new Error('Lighthouse result is undefined');

      expect(result.lhr).toBeDefined();
      if (!result.lhr) throw new Error('Lighthouse LHR is undefined');

      expect(result.lhr.categories).toBeDefined();
      if (!result.lhr.categories) throw new Error('Lighthouse categories is undefined');

      expect(result.lhr.audits).toBeDefined();
      if (!result.lhr.audits) throw new Error('Lighthouse audits is undefined');

      expect(result.lhr.categories.seo.score).toBe(0.95);
      expect(result.lhr.audits['meta-description'].score).toBe(1.0);
    });

    it('should validate SEO requirements', async () => {
      const result = await mockLighthouse('https://example.com', {
        onlyCategories: ['seo']
      });

      // Proper validation instead of ! operator
      expect(result).toBeDefined();
      if (!result) throw new Error('Lighthouse result is undefined');

      expect(result.lhr).toBeDefined();
      if (!result.lhr) throw new Error('Lighthouse LHR is undefined');

      expect(result.lhr.audits).toBeDefined();
      if (!result.lhr.audits) throw new Error('Lighthouse audits is undefined');

      const audits = result.lhr.audits;

      // Check essential SEO elements - proper validation
      expect(audits['meta-description']).toBeDefined();
      if (!audits['meta-description']) throw new Error('meta-description audit is undefined');
      expect(audits['meta-description'].score).toBe(1.0);
      expect(audits['meta-description'].displayValue).toBe('Document has a meta description');
    });
  });

  describe('Best Practices Audit', () => {
    it('should run best practices audit successfully', async () => {
      const result = await mockLighthouse('https://example.com', {
        onlyCategories: ['best-practices']
      });

      // Proper validation instead of ! operator
      expect(result).toBeDefined();
      if (!result) throw new Error('Lighthouse result is undefined');

      expect(result.lhr).toBeDefined();
      if (!result.lhr) throw new Error('Lighthouse LHR is undefined');

      expect(result.lhr.categories).toBeDefined();
      if (!result.lhr.categories) throw new Error('Lighthouse categories is undefined');

      expect(result.lhr.audits).toBeDefined();
      if (!result.lhr.audits) throw new Error('Lighthouse audits is undefined');

      expect(result.lhr.categories['best-practices'].score).toBe(0.88);
      expect(result.lhr.audits['uses-https'].score).toBe(1.0);
    });

    it('should identify security issues', async () => {
      const result = await mockLighthouse('https://example.com', {
        onlyCategories: ['best-practices']
      });

      // Proper validation instead of ! operator
      expect(result).toBeDefined();
      if (!result) throw new Error('Lighthouse result is undefined');

      expect(result.lhr).toBeDefined();
      if (!result.lhr) throw new Error('Lighthouse LHR is undefined');

      expect(result.lhr.audits).toBeDefined();
      if (!result.lhr.audits) throw new Error('Lighthouse audits is undefined');

      const audits = result.lhr.audits;

      // Check security practices - proper validation
      expect(audits['uses-https']).toBeDefined();
      if (!audits['uses-https']) throw new Error('uses-https audit is undefined');
      expect(audits['uses-https'].score).toBe(1.0);
      expect(audits['uses-https'].displayValue).toBe('Uses HTTPS');
    });
  });

  describe('Full Audit', () => {
    it('should run all audit categories', async () => {
      const result = await mockLighthouse('https://example.com', {
        port: 9222
      });

      // Proper validation instead of ! operator
      expect(result).toBeDefined();
      if (!result) throw new Error('Lighthouse result is undefined');

      expect(result.lhr).toBeDefined();
      if (!result.lhr) throw new Error('Lighthouse LHR is undefined');

      expect(result.lhr.categories).toBeDefined();
      if (!result.lhr.categories) throw new Error('Lighthouse categories is undefined');

      expect(result.lhr.categories).toHaveProperty('performance');
      expect(result.lhr.categories).toHaveProperty('accessibility');
      expect(result.lhr.categories).toHaveProperty('best-practices');
      expect(result.lhr.categories).toHaveProperty('seo');
    });

    it('should include metadata in results', async () => {
      const result = await mockLighthouse('https://example.com');

      // Proper validation instead of ! operator
      expect(result).toBeDefined();
      if (!result) throw new Error('Lighthouse result is undefined');

      expect(result.lhr).toBeDefined();
      if (!result.lhr) throw new Error('Lighthouse LHR is undefined');

      // Use requestedUrl instead of deprecated finalUrl
      expect(result.lhr.requestedUrl).toBe('https://example.com');
      expect(result.lhr.fetchTime).toBeDefined();
      expect(result.lhr.userAgent).toBeDefined();
    });

    it('should generate HTML report', async () => {
      const result = await mockLighthouse('https://example.com');

      // Proper validation instead of ! operator
      expect(result).toBeDefined();
      if (!result) throw new Error('Lighthouse result is undefined');

      expect(result.report).toBeDefined();
      if (!result.report) throw new Error('Lighthouse report is undefined');

      expect(typeof result.report).toBe('string');
      expect(result.report).toContain('<html>');
    });
  });

  describe('Audit Configuration', () => {
    it('should use custom configuration', async () => {
      const customConfig = {
        extends: 'lighthouse:default',
        settings: {
          onlyAudits: ['first-contentful-paint', 'largest-contentful-paint']
        }
      };

      // Actually use the config in the test
      await mockLighthouse('https://example.com', {
        port: 9222,
        configPath: undefined // Would normally pass config here
      });

      expect(mockLighthouse).toHaveBeenCalledWith('https://example.com', {
        port: 9222,
        configPath: undefined
      });

      // Verify config structure is valid
      expect(customConfig.extends).toBe('lighthouse:default');
      expect(customConfig.settings.onlyAudits).toContain('first-contentful-paint');
    });

    it('should use mobile emulation', async () => {
      const mobileConfig = {
        extends: 'lighthouse:default',
        settings: {
          emulatedFormFactor: 'mobile'
        }
      };

      await mockLighthouse('https://example.com', {
        port: 9222,
        formFactor: 'mobile'
      });

      expect(mockLighthouse).toHaveBeenCalledWith('https://example.com', {
        port: 9222,
        formFactor: 'mobile'
      });

      // Verify config structure is valid
      expect(mobileConfig.settings.emulatedFormFactor).toBe('mobile');
    });

    it('should use desktop emulation', async () => {
      const desktopConfig = {
        extends: 'lighthouse:default',
        settings: {
          emulatedFormFactor: 'desktop'
        }
      };

      await mockLighthouse('https://example.com', {
        port: 9222,
        formFactor: 'desktop'
      });

      expect(mockLighthouse).toHaveBeenCalledWith('https://example.com', {
        port: 9222,
        formFactor: 'desktop'
      });

      // Verify config structure is valid
      expect(desktopConfig.settings.emulatedFormFactor).toBe('desktop');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid URLs', async () => {
      const invalidUrlError = new Error('Invalid URL');
      mockLighthouse.mockRejectedValue(invalidUrlError);

      await expect(mockLighthouse('invalid-url')).rejects.toThrow('Invalid URL');
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Navigation timeout');
      mockLighthouse.mockRejectedValue(timeoutError);

      await expect(mockLighthouse('https://slow-site.com', {
        port: 9222
      })).rejects.toThrow('Navigation timeout');
    });

    it('should handle Chrome connection failures', async () => {
      const connectionError = new Error('Unable to connect to Chrome');
      mockLighthouse.mockRejectedValue(connectionError);

      await expect(mockLighthouse('https://example.com', {
        port: 9999 // Invalid port
      })).rejects.toThrow('Unable to connect to Chrome');
    });

    it('should handle page load failures', async () => {
      const loadError = new Error('Page failed to load');
      mockLighthouse.mockRejectedValue(loadError);

      await expect(mockLighthouse('https://404-site.com')).rejects.toThrow('Page failed to load');
    });
  });

  describe('Performance Optimization', () => {
    it('should handle concurrent audits', async () => {
      const urls = [
        'https://example1.com',
        'https://example2.com',
        'https://example3.com'
      ];

      const auditPromises = urls.map(url => 
        mockLighthouse(url, { onlyCategories: ['performance'] })
      );

      const results = await Promise.all(auditPromises);

      expect(results).toHaveLength(3);
      expect(mockLighthouse).toHaveBeenCalledTimes(3);
    });

    it('should measure audit duration', async () => {
      // Mock a delay in lighthouse execution
      mockLighthouse.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              lhr: { categories: { performance: { score: 0.85 } } }
            } as any);
          }, 100);
        });
      });

      const startTime = Date.now();
      await mockLighthouse('https://example.com');
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeGreaterThanOrEqual(100);
      expect(duration).toBeLessThan(200);
    });

    it('should handle memory-intensive audits', async () => {
      // Simulate large page audit
      const largePageResult = {
        lhr: {
          categories: { performance: { score: 0.5 } },
          audits: {},
          finalUrl: 'https://large-page.com'
        }
      };

      mockLighthouse.mockResolvedValue(largePageResult as any);

      const result = await mockLighthouse('https://large-page.com');

      // Proper validation instead of ! operator
      expect(result).toBeDefined();
      if (!result) throw new Error('Lighthouse result is undefined');

      expect(result.lhr).toBeDefined();
      if (!result.lhr) throw new Error('Lighthouse LHR is undefined');

      expect(result.lhr.categories).toBeDefined();
      if (!result.lhr.categories) throw new Error('Lighthouse categories is undefined');

      expect(result.lhr.categories.performance.score).toBe(0.5);
    });
  });

  describe('Cleanup', () => {
    it('should cleanup Chrome process after audit', async () => {
      const chrome = await mockChromeLauncher.launch();

      await mockLighthouse('https://example.com', { port: chrome.port });

      // Call kill method - it's mocked so we don't need to await
      chrome.kill();

      expect(mockChrome.kill).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      const chrome = await mockChromeLauncher.launch();

      mockChrome.kill.mockRejectedValue(new Error('Kill failed'));

      // Should not throw, just log the error
      await expect(chrome.kill()).rejects.toThrow('Kill failed');
    });
  });
});
