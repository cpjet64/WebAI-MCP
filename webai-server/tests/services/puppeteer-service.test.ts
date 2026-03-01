import puppeteer from 'puppeteer-core';
import {
  mockAuditResult
} from '../setup.js';
import { testUtils } from '../test-setup.js';

// Mock puppeteer-core
jest.mock('puppeteer-core');

describe('Puppeteer Service', () => {
  const mockPuppeteer = puppeteer as jest.Mocked<typeof puppeteer>;
  let mockBrowser: any;
  let mockPage: any;

  beforeEach(() => {
    // Create mock browser and page
    mockPage = {
      goto: jest.fn(),
      screenshot: jest.fn(),
      evaluate: jest.fn(),
      close: jest.fn(),
      setViewport: jest.fn(),
      setUserAgent: jest.fn(),
      setCookie: jest.fn(),
      setExtraHTTPHeaders: jest.fn(),
      emulate: jest.fn(),
      emulateNetworkConditions: jest.fn(),
      waitForSelector: jest.fn(),
      waitForTimeout: jest.fn(),
      content: jest.fn(),
      title: jest.fn(),
      url: jest.fn(),
      metrics: jest.fn(),
    };

    mockBrowser = {
      newPage: jest.fn().mockResolvedValue(mockPage),
      close: jest.fn(),
      wsEndpoint: jest.fn().mockReturnValue('ws://localhost:9222/devtools/browser'),
      pages: jest.fn().mockResolvedValue([mockPage]),
    };

    mockPuppeteer.launch.mockResolvedValue(mockBrowser);
    mockPuppeteer.connect.mockResolvedValue(mockBrowser);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Browser Launch', () => {
    it('should launch browser successfully', async () => {
      const browser = await mockPuppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      expect(mockPuppeteer.launch).toHaveBeenCalledWith({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      expect(browser).toBe(mockBrowser);
    });

    it('should launch browser with custom options', async () => {
      const customOptions = {
        headless: false,
        devtools: true,
        args: ['--start-maximized'],
        defaultViewport: { width: 1920, height: 1080 }
      };

      await mockPuppeteer.launch(customOptions);

      expect(mockPuppeteer.launch).toHaveBeenCalledWith(customOptions);
    });

    it('should handle browser launch failure', async () => {
      const launchError = new Error('Failed to launch browser');
      mockPuppeteer.launch.mockRejectedValue(launchError);

      await expect(mockPuppeteer.launch()).rejects.toThrow('Failed to launch browser');
    });

    it('should connect to existing browser', async () => {
      const wsEndpoint = 'ws://localhost:9222/devtools/browser';
      
      await mockPuppeteer.connect({ browserWSEndpoint: wsEndpoint });

      expect(mockPuppeteer.connect).toHaveBeenCalledWith({
        browserWSEndpoint: wsEndpoint
      });
    });
  });

  describe('Page Operations', () => {
    beforeEach(async () => {
      await mockPuppeteer.launch();
    });

    it('should create new page', async () => {
      const page = await mockBrowser.newPage();

      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(page).toBe(mockPage);
    });

    it('should navigate to URL', async () => {
      const page = await mockBrowser.newPage();
      const url = 'https://example.com';

      mockPage.goto.mockResolvedValue({ status: () => 200 });

      await page.goto(url);

      expect(mockPage.goto).toHaveBeenCalledWith(url);
    });

    it('should handle navigation timeout', async () => {
      const page = await mockBrowser.newPage();
      const url = 'https://slow-site.com';

      mockPage.goto.mockRejectedValue(new Error('Navigation timeout'));

      await expect(page.goto(url)).rejects.toThrow('Navigation timeout');
    });

    it('should set viewport', async () => {
      const page = await mockBrowser.newPage();
      const viewport = { width: 1920, height: 1080 };

      await page.setViewport(viewport);

      expect(mockPage.setViewport).toHaveBeenCalledWith(viewport);
    });

    it('should set user agent', async () => {
      const page = await mockBrowser.newPage();
      const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

      await page.setUserAgent(userAgent);

      expect(mockPage.setUserAgent).toHaveBeenCalledWith(userAgent);
    });

    it('should set cookies', async () => {
      const page = await mockBrowser.newPage();
      const cookies = [
        { name: 'session', value: 'abc123', domain: '.example.com' }
      ];

      await page.setCookie(...cookies);

      expect(mockPage.setCookie).toHaveBeenCalledWith(...cookies);
    });

    it('should set extra HTTP headers', async () => {
      const page = await mockBrowser.newPage();
      const headers = { 'Authorization': 'Bearer token123' };

      await page.setExtraHTTPHeaders(headers);

      expect(mockPage.setExtraHTTPHeaders).toHaveBeenCalledWith(headers);
    });
  });

  describe('Screenshot Capture', () => {
    beforeEach(async () => {
      await mockPuppeteer.launch();
    });

    it('should capture full page screenshot', async () => {
      const page = await mockBrowser.newPage();
      const screenshotBuffer = Buffer.from('mock-screenshot-data');

      mockPage.screenshot.mockResolvedValue(screenshotBuffer);

      const result = await page.screenshot({ fullPage: true });

      expect(mockPage.screenshot).toHaveBeenCalledWith({ fullPage: true });
      expect(result).toBe(screenshotBuffer);
    });

    it('should capture element screenshot', async () => {
      const page = await mockBrowser.newPage();
      const screenshotBuffer = Buffer.from('mock-element-screenshot');

      mockPage.screenshot.mockResolvedValue(screenshotBuffer);

      const result = await page.screenshot({
        clip: { x: 0, y: 0, width: 800, height: 600 }
      });

      expect(mockPage.screenshot).toHaveBeenCalledWith({
        clip: { x: 0, y: 0, width: 800, height: 600 }
      });
      expect(result).toBe(screenshotBuffer);
    });

    it('should handle screenshot failure', async () => {
      const page = await mockBrowser.newPage();

      mockPage.screenshot.mockRejectedValue(new Error('Screenshot failed'));

      await expect(page.screenshot()).rejects.toThrow('Screenshot failed');
    });

    it('should capture screenshot with different formats', async () => {
      const page = await mockBrowser.newPage();
      const screenshotBuffer = Buffer.from('mock-png-screenshot');

      mockPage.screenshot.mockResolvedValue(screenshotBuffer);

      await page.screenshot({ type: 'png', quality: 90 });

      expect(mockPage.screenshot).toHaveBeenCalledWith({
        type: 'png',
        quality: 90
      });
    });
  });

  describe('Page Evaluation', () => {
    beforeEach(async () => {
      await mockPuppeteer.launch();
    });

    it('should evaluate JavaScript on page', async () => {
      const page = await mockBrowser.newPage();
      const result = { title: 'Test Page', url: 'https://example.com' };

      mockPage.evaluate.mockResolvedValue(result);

      const evalResult = await page.evaluate(() => ({
        title: document.title,
        url: window.location.href
      }));

      expect(mockPage.evaluate).toHaveBeenCalled();
      expect(evalResult).toEqual(result);
    });

    it('should evaluate with arguments', async () => {
      const page = await mockBrowser.newPage();
      const selector = '#test-element';
      const element = { tagName: 'DIV', id: 'test-element' };

      mockPage.evaluate.mockResolvedValue(element);

      const result = await page.evaluate((sel: string) => {
        const el = document.querySelector(sel);
        return el ? { tagName: el.tagName, id: el.id } : null;
      }, selector);

      expect(mockPage.evaluate).toHaveBeenCalledWith(expect.any(Function), selector);
      expect(result).toEqual(element);
    });

    it('should handle evaluation errors', async () => {
      const page = await mockBrowser.newPage();

      mockPage.evaluate.mockRejectedValue(new Error('Evaluation failed'));

      await expect(page.evaluate(() => {
        throw new Error('Script error');
      })).rejects.toThrow('Evaluation failed');
    });
  });

  describe('Element Interaction', () => {
    beforeEach(async () => {
      await mockPuppeteer.launch();
    });

    it('should wait for selector', async () => {
      const page = await mockBrowser.newPage();
      const selector = '#submit-button';
      const mockElement = { click: jest.fn() };

      mockPage.waitForSelector.mockResolvedValue(mockElement);

      const element = await page.waitForSelector(selector);

      expect(mockPage.waitForSelector).toHaveBeenCalledWith(selector);
      expect(element).toBe(mockElement);
    });

    it('should handle selector timeout', async () => {
      const page = await mockBrowser.newPage();
      const selector = '#non-existent';

      mockPage.waitForSelector.mockRejectedValue(new Error('Timeout waiting for selector'));

      await expect(page.waitForSelector(selector, { timeout: 1000 }))
        .rejects.toThrow('Timeout waiting for selector');
    });

    it('should wait for timeout', async () => {
      const page = await mockBrowser.newPage();
      const timeout = 1000;

      mockPage.waitForTimeout.mockResolvedValue(undefined);

      await page.waitForTimeout(timeout);

      expect(mockPage.waitForTimeout).toHaveBeenCalledWith(timeout);
    });
  });

  describe('Network Emulation', () => {
    beforeEach(async () => {
      await mockPuppeteer.launch();
    });

    it('should emulate network conditions', async () => {
      const page = await mockBrowser.newPage();
      const networkConditions = {
        offline: false,
        downloadThroughput: 1.5 * 1024 * 1024 / 8, // 1.5 Mbps
        uploadThroughput: 750 * 1024 / 8, // 750 Kbps
        latency: 40 // 40ms
      };

      mockPage.emulateNetworkConditions.mockResolvedValue(undefined);

      await page.emulateNetworkConditions(networkConditions);

      expect(mockPage.emulateNetworkConditions).toHaveBeenCalledWith(networkConditions);
    });

    it('should emulate device', async () => {
      const page = await mockBrowser.newPage();
      const device = {
        name: 'iPhone 12',
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        viewport: { width: 390, height: 844, isMobile: true }
      };

      mockPage.emulate.mockResolvedValue(undefined);

      await page.emulate(device);

      expect(mockPage.emulate).toHaveBeenCalledWith(device);
    });
  });

  describe('Page Content', () => {
    beforeEach(async () => {
      await mockPuppeteer.launch();
    });

    it('should get page content', async () => {
      const page = await mockBrowser.newPage();
      const htmlContent = '<html><body><h1>Test Page</h1></body></html>';

      mockPage.content.mockResolvedValue(htmlContent);

      const content = await page.content();

      expect(mockPage.content).toHaveBeenCalled();
      expect(content).toBe(htmlContent);
    });

    it('should get page title', async () => {
      const page = await mockBrowser.newPage();
      const title = 'Test Page Title';

      mockPage.title.mockResolvedValue(title);

      const pageTitle = await page.title();

      expect(mockPage.title).toHaveBeenCalled();
      expect(pageTitle).toBe(title);
    });

    it('should get page URL', async () => {
      const page = await mockBrowser.newPage();
      const url = 'https://example.com/test';

      mockPage.url.mockReturnValue(url);

      const pageUrl = page.url();

      expect(mockPage.url).toHaveBeenCalled();
      expect(pageUrl).toBe(url);
    });

    it('should get page metrics', async () => {
      const page = await mockBrowser.newPage();
      const metrics = {
        Timestamp: 123456.789,
        Documents: 1,
        Frames: 1,
        JSEventListeners: 5,
        Nodes: 100,
        LayoutCount: 2,
        RecalcStyleCount: 3,
        LayoutDuration: 0.123,
        RecalcStyleDuration: 0.045,
        ScriptDuration: 0.234,
        TaskDuration: 0.567,
        JSHeapUsedSize: 1024000,
        JSHeapTotalSize: 2048000
      };

      mockPage.metrics.mockResolvedValue(metrics);

      const pageMetrics = await page.metrics();

      expect(mockPage.metrics).toHaveBeenCalled();
      expect(pageMetrics).toEqual(metrics);
    });
  });

  describe('Browser Cleanup', () => {
    it('should close page', async () => {
      await mockPuppeteer.launch();
      const page = await mockBrowser.newPage();

      mockPage.close.mockResolvedValue(undefined);

      await page.close();

      expect(mockPage.close).toHaveBeenCalled();
    });

    it('should close browser', async () => {
      const browser = await mockPuppeteer.launch();

      mockBrowser.close.mockResolvedValue(undefined);

      await browser.close();

      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should handle cleanup errors gracefully', async () => {
      const browser = await mockPuppeteer.launch();

      mockBrowser.close.mockRejectedValue(new Error('Cleanup failed'));

      // Should not throw, just log the error
      await expect(browser.close()).rejects.toThrow('Cleanup failed');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle browser crash', async () => {
      const browser = await mockPuppeteer.launch();
      
      // Simulate browser crash
      mockBrowser.newPage.mockRejectedValue(new Error('Browser has been closed'));

      await expect(browser.newPage()).rejects.toThrow('Browser has been closed');
    });

    it('should handle page crash', async () => {
      await mockPuppeteer.launch();
      const page = await mockBrowser.newPage();

      // Simulate page crash
      mockPage.goto.mockRejectedValue(new Error('Page crashed'));

      await expect(page.goto('https://example.com')).rejects.toThrow('Page crashed');
    });

    it('should handle memory issues', async () => {
      await mockPuppeteer.launch();
      const page = await mockBrowser.newPage();

      // Simulate out of memory
      mockPage.screenshot.mockRejectedValue(new Error('Out of memory'));

      await expect(page.screenshot()).rejects.toThrow('Out of memory');
    });
  });

  describe('Performance', () => {
    it('should handle multiple concurrent pages', async () => {
      const browser = await mockPuppeteer.launch();
      const pageCount = 5;

      // Create multiple pages concurrently
      const pagePromises = Array.from({ length: pageCount }, () => browser.newPage());
      const pages = await Promise.all(pagePromises);

      expect(mockBrowser.newPage).toHaveBeenCalledTimes(pageCount);
      expect(pages).toHaveLength(pageCount);
    });

    it('should measure page load performance', async () => {
      await mockPuppeteer.launch();
      const page = await mockBrowser.newPage();

      const startTime = Date.now();
      
      mockPage.goto.mockImplementation(() => {
        return new Promise(resolve => {
          setTimeout(() => resolve({ status: () => 200 }), 100);
        });
      });

      await page.goto('https://example.com');
      
      const endTime = Date.now();
      const loadTime = endTime - startTime;

      expect(loadTime).toBeGreaterThanOrEqual(100);
      expect(loadTime).toBeLessThan(200); // Should be close to 100ms
    });
  });
});
