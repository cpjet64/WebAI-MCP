import { ChromeExtensionSimulator } from './mocks/chrome-extension-simulator';
import { McpServerSimulator } from './mocks/mcp-server-simulator';

describe('Simulator Verification', () => {
  let mcpServer: McpServerSimulator;
  let extension: ChromeExtensionSimulator;

  beforeAll(async () => {
    // Start MCP server simulator
    mcpServer = new McpServerSimulator(3031); // Use different port to avoid conflicts
    await mcpServer.start();
  });

  afterAll(async () => {
    if (extension) {
      extension.disconnect();
    }
    if (mcpServer) {
      await mcpServer.stop();
    }
  });

  describe('MCP Server Simulator', () => {
    it('should start and respond to identity requests', async () => {
      const response = await fetch('http://localhost:3031/.identity');
      const data = await response.json() as any;

      expect(response.ok).toBe(true);
      expect(data.name).toBe('WebAI-MCP Server');
      expect(data.version).toBe('1.5.0');
      expect(data.capabilities).toContain('screenshots');
    });

    it('should handle screenshot requests', async () => {
      const response = await fetch('http://localhost:3031/tools/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullPage: true, format: 'png' })
      });

      const data = await response.json() as any;

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.file).toMatch(/screenshot_\d+\.png/);
      expect(data.data.size).toEqual({ width: 1920, height: 1080 });
    });

    it('should handle console logs requests', async () => {
      const response = await fetch('http://localhost:3031/tools/console-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters: {} })
      });

      const data = await response.json() as any;

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
    });

    it('should handle performance audit requests', async () => {
      const response = await fetch('http://localhost:3031/tools/performance-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' })
      });

      const data = await response.json() as any;

      expect(response.ok).toBe(true);
      expect(data.success).toBe(true);
      expect(data.data.score).toBe(0.85);
      expect(data.data.metrics).toHaveProperty('first-contentful-paint');
    });

    it('should provide health check', async () => {
      const response = await fetch('http://localhost:3031/health');
      const data = await response.json() as any;

      expect(response.ok).toBe(true);
      expect(data.status).toBe('healthy');
      expect(data.uptime).toBeGreaterThan(0);
    });
  });

  describe('Chrome Extension Simulator', () => {
    beforeEach(() => {
      extension = new ChromeExtensionSimulator();
    });

    afterEach(() => {
      if (extension) {
        extension.disconnect();
      }
    });

    it('should create extension simulator with correct status', () => {
      const status = extension.getStatus();

      expect(status.connected).toBe(false);
      expect(status.serverUrl).toBe('ws://localhost:3025');
      expect(status.capabilities).toContain('screenshots');
      expect(status.capabilities).toContain('dom-access');
      expect(status.capabilities).toContain('network-monitoring');
    });

    it('should generate mock screenshot data', () => {
      // Access private method through any cast for testing
      const mockData = (extension as any).generateMockScreenshot();

      expect(typeof mockData).toBe('string');
      expect(mockData).toMatch(/^data:image\/png;base64,/);
    });

    it('should generate mock cookies', () => {
      // Access private method through any cast for testing
      const cookies = (extension as any).generateMockCookies();

      expect(Array.isArray(cookies)).toBe(true);
      expect(cookies.length).toBeGreaterThan(0);
      expect(cookies[0]).toHaveProperty('name');
      expect(cookies[0]).toHaveProperty('value');
      expect(cookies[0]).toHaveProperty('domain');
    });

    it('should generate mock localStorage data', () => {
      // Access private method through any cast for testing
      const localStorage = (extension as any).generateMockLocalStorage();

      expect(typeof localStorage).toBe('object');
      expect(localStorage).toHaveProperty('user_id');
      expect(localStorage).toHaveProperty('theme');
      expect(localStorage).toHaveProperty('language');
    });

    it('should handle page navigation simulation', () => {
      const mockSend = jest.fn();
      (extension as any).send = mockSend;

      extension.simulatePageNavigation('https://example.com/test');

      expect(mockSend).toHaveBeenCalledWith({
        type: 'page-navigation',
        data: expect.objectContaining({
          url: 'https://example.com/test',
          title: 'Page: https://example.com/test',
          timestamp: expect.any(String),
          loadTime: expect.any(Number)
        })
      });
    });

    it('should handle DOM changes simulation', () => {
      const mockSend = jest.fn();
      (extension as any).send = mockSend;

      extension.simulateDOMChanges();

      expect(mockSend).toHaveBeenCalledWith({
        type: 'dom-mutation',
        data: expect.objectContaining({
          type: 'childList',
          target: 'div#main-content',
          addedNodes: 1,
          removedNodes: 0,
          timestamp: expect.any(String)
        })
      });
    });
  });

  describe('Integration Between Simulators', () => {
    it('should demonstrate the complete flow concept', async () => {
      // This test demonstrates how the simulators would work together
      // In a real test, we'd have:
      // 1. Extension simulator connects to WebAI server
      // 2. WebAI server forwards requests to MCP server
      // 3. MCP server processes and responds
      // 4. Response flows back through the chain

      // Test MCP server capabilities
      const mcpResponse = await fetch('http://localhost:3031/.identity');
      const mcpData = await mcpResponse.json() as any;
      expect(mcpData.capabilities).toContain('screenshots');

      // Test extension simulator capabilities
      const extensionStatus = extension.getStatus();
      expect(extensionStatus.capabilities).toContain('screenshots');

      // Both have screenshot capability - they can work together
      expect(mcpData.capabilities.includes('screenshots')).toBe(true);
      expect(extensionStatus.capabilities.includes('screenshots')).toBe(true);
    });

    it('should verify all required endpoints exist', async () => {
      const endpoints = [
        '/.identity',
        '/tools/screenshot',
        '/tools/console-logs',
        '/tools/network-logs',
        '/tools/performance-audit',
        '/tools/click-element',
        '/tools/fill-input',
        '/tools/get-cookies',
        '/tools/get-local-storage',
        '/health'
      ];

      for (const endpoint of endpoints) {
        const response = await fetch(`http://localhost:3031${endpoint}`, {
          method: endpoint.startsWith('/tools/') ? 'POST' : 'GET',
          headers: { 'Content-Type': 'application/json' },
          body: endpoint.startsWith('/tools/') ? JSON.stringify({}) : undefined
        });

        expect(response.status).toBeLessThan(500); // Should not be server error
      }
    });

    it('should handle error scenarios', async () => {
      // Test error simulation endpoint
      const response = await fetch('http://localhost:3031/tools/simulate-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errorType: 'server-error' })
      });

      expect(response.status).toBe(500);
      
      const data = await response.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toBe('Internal server error');
      expect(data.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Performance and Reliability', () => {
    it('should handle multiple concurrent requests to MCP server', async () => {
      const requestCount = 5;
      const promises = Array.from({ length: requestCount }, () =>
        fetch('http://localhost:3031/tools/screenshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fullPage: true })
        })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });

      const results = await Promise.all(responses.map(r => r.json()));
      results.forEach(result => {
        expect(result.success).toBe(true);
        expect(result.data.file).toMatch(/screenshot_\d+\.png/);
      });
    });

    it('should measure response times', async () => {
      const startTime = Date.now();
      
      const response = await fetch('http://localhost:3031/tools/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullPage: true })
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.ok).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should provide consistent data formats', async () => {
      // Test that all responses follow consistent patterns
      const screenshotResponse = await fetch('http://localhost:3031/tools/screenshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const screenshotData = await screenshotResponse.json() as any;
      expect(screenshotData).toHaveProperty('success');
      expect(screenshotData).toHaveProperty('data');

      const logsResponse = await fetch('http://localhost:3031/tools/console-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const logsData = await logsResponse.json() as any;
      expect(logsData).toHaveProperty('success');
      expect(logsData).toHaveProperty('data');
      expect(logsData).toHaveProperty('count');
    });
  });
});
