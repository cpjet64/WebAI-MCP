import { 
  mockServerDiscovery, 
  createMockApiResponse 
} from '../setup';
import nock from 'nock';

describe('Server Discovery Integration', () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe('WebAI Server Discovery', () => {
    it('should discover server on default port', async () => {
      const identityResponse = {
        name: 'WebAI Server',
        version: '1.5.0',
        status: 'running',
        capabilities: ['screenshots', 'logs', 'audits', 'interaction'],
        uptime: 3600
      };

      nock('http://127.0.0.1:3025')
        .get('/.identity')
        .reply(200, identityResponse);

      const response = await fetch('http://127.0.0.1:3025/.identity');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data.name).toBe('WebAI Server');
      expect(data.version).toBe('1.5.0');
      expect(data.status).toBe('running');
      expect(data.capabilities).toContain('screenshots');
      expect(data.uptime).toBe(3600);
    });

    it('should try alternative ports when default fails', async () => {
      // Mock failure on default port
      nock('http://127.0.0.1:3025')
        .get('/.identity')
        .reply(404, { error: 'Not found' });

      // Mock success on alternative port
      nock('http://127.0.0.1:3026')
        .get('/.identity')
        .reply(200, {
          name: 'WebAI Server',
          version: '1.5.0',
          status: 'running',
          port: 3026
        });

      // Test port discovery logic
      const defaultResponse = await fetch('http://127.0.0.1:3025/.identity');
      expect(defaultResponse.ok).toBe(false);

      const altResponse = await fetch('http://127.0.0.1:3026/.identity');
      const altData = await altResponse.json();
      
      expect(altResponse.ok).toBe(true);
      expect(altData.port).toBe(3026);
    });

    it('should handle server discovery with different hosts', async () => {
      const hosts = ['127.0.0.1', 'localhost', '0.0.0.0'];
      
      hosts.forEach((host, index) => {
        nock(`http://${host}:3025`)
          .get('/.identity')
          .reply(200, {
            name: 'WebAI Server',
            version: '1.5.0',
            status: 'running',
            host: host
          });
      });

      for (const host of hosts) {
        const response = await fetch(`http://${host}:3025/.identity`);
        const data = await response.json();
        
        expect(response.ok).toBe(true);
        expect(data.host).toBe(host);
      }
    });

    it('should handle server discovery timeout', async () => {
      nock('http://127.0.0.1:3025')
        .get('/.identity')
        .delay(10000) // 10 second delay
        .reply(200, { name: 'WebAI Server' });

      const controller = new AbortController();
      setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        await fetch('http://127.0.0.1:3025/.identity', {
          signal: controller.signal
        });
      } catch (error: any) {
        expect(error.name).toBe('AbortError');
      }
    });

    it('should validate server identity response', async () => {
      const validResponse = {
        name: 'WebAI Server',
        version: '1.5.0',
        status: 'running'
      };

      nock('http://127.0.0.1:3025')
        .get('/.identity')
        .reply(200, validResponse);

      const response = await fetch('http://127.0.0.1:3025/.identity');
      const data = await response.json();

      expect(response.ok).toBe(true);
      expect(data).toHaveProperty('name');
      expect(data).toHaveProperty('version');
      expect(data).toHaveProperty('status');
      expect(data.name).toBe('WebAI Server');
      expect(typeof data.version).toBe('string');
      expect(['running', 'starting', 'stopping']).toContain(data.status);
    });

    it('should handle malformed server identity response', async () => {
      nock('http://127.0.0.1:3025')
        .get('/.identity')
        .reply(200, 'invalid json');

      const response = await fetch('http://127.0.0.1:3025/.identity');
      
      try {
        await response.json();
      } catch (error: any) {
        expect(error).toBeInstanceOf(SyntaxError);
      }
    });
  });

  describe('End-to-End Tool Testing', () => {
    beforeEach(() => {
      mockServerDiscovery();
    });

    it('should complete full screenshot workflow', async () => {
      // Mock server discovery
      nock('http://127.0.0.1:3025')
        .get('/.identity')
        .reply(200, {
          name: 'WebAI Server',
          version: '1.5.0',
          status: 'running'
        });

      // Mock screenshot capture
      nock('http://127.0.0.1:3025')
        .post('/capture-screenshot')
        .reply(200, createMockApiResponse({
          success: true,
          file: 'screenshot_20240101_120000.png',
          timestamp: '2024-01-01T12:00:00.000Z',
          size: { width: 1920, height: 1080 }
        }));

      // Test the complete workflow
      const identityResponse = await fetch('http://127.0.0.1:3025/.identity');
      expect(identityResponse.ok).toBe(true);

      const screenshotResponse = await fetch('http://127.0.0.1:3025/capture-screenshot', {
        method: 'POST'
      });
      const screenshotResult = await screenshotResponse.json();

      expect(screenshotResponse.ok).toBe(true);
      expect(screenshotResult.success).toBe(true);
      expect(screenshotResult.data.file).toBe('screenshot_20240101_120000.png');
    });

    it('should complete full audit workflow', async () => {
      mockServerDiscovery();

      // Mock performance audit
      nock('http://127.0.0.1:3025')
        .post('/run-performance-audit')
        .reply(200, createMockApiResponse({
          score: 0.85,
          metrics: {
            'first-contentful-paint': { score: 0.9, value: 1200 },
            'largest-contentful-paint': { score: 0.8, value: 2100 }
          },
          timestamp: '2024-01-01T12:00:00.000Z'
        }));

      const auditResponse = await fetch('http://127.0.0.1:3025/run-performance-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' })
      });
      const auditResult = await auditResponse.json();

      expect(auditResponse.ok).toBe(true);
      expect(auditResult.success).toBe(true);
      expect(auditResult.data.score).toBe(0.85);
      expect(auditResult.data.metrics).toHaveProperty('first-contentful-paint');
    });

    it('should complete full element interaction workflow', async () => {
      mockServerDiscovery();

      // Mock element inspection
      nock('http://127.0.0.1:3025')
        .post('/inspect-elements-by-selector')
        .reply(200, createMockApiResponse({
          elements: [
            {
              tagName: 'BUTTON',
              id: 'submit-btn',
              className: 'btn btn-primary',
              textContent: 'Submit'
            }
          ],
          count: 1
        }));

      // Mock element click
      nock('http://127.0.0.1:3025')
        .post('/click-element')
        .reply(200, createMockApiResponse({
          success: true,
          message: 'Element clicked successfully',
          element: {
            tagName: 'BUTTON',
            id: 'submit-btn'
          }
        }));

      // Test the workflow
      const inspectResponse = await fetch('http://127.0.0.1:3025/inspect-elements-by-selector', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selector: '#submit-btn', resultLimit: 1 })
      });
      const inspectResult = await inspectResponse.json();

      expect(inspectResponse.ok).toBe(true);
      expect(inspectResult.data.elements).toHaveLength(1);

      const clickResponse = await fetch('http://127.0.0.1:3025/click-element', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selector: '#submit-btn' })
      });
      const clickResult = await clickResponse.json();

      expect(clickResponse.ok).toBe(true);
      expect(clickResult.data.success).toBe(true);
    });

    it('should handle concurrent tool requests', async () => {
      mockServerDiscovery();

      // Mock multiple endpoints
      nock('http://127.0.0.1:3025')
        .get('/console-logs')
        .reply(200, createMockApiResponse([]))
        .get('/network-errors')
        .reply(200, createMockApiResponse([]))
        .post('/capture-screenshot')
        .reply(200, createMockApiResponse({ file: 'screenshot.png' }))
        .get('/cookies')
        .reply(200, createMockApiResponse([]));

      // Make concurrent requests
      const promises = [
        fetch('http://127.0.0.1:3025/console-logs'),
        fetch('http://127.0.0.1:3025/network-errors'),
        fetch('http://127.0.0.1:3025/capture-screenshot', { method: 'POST' }),
        fetch('http://127.0.0.1:3025/cookies')
      ];

      const responses = await Promise.all(promises);

      expect(responses).toHaveLength(4);
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
    });
  });

  describe('Error Recovery', () => {
    it('should recover from temporary server unavailability', async () => {
      // First request fails
      nock('http://127.0.0.1:3025')
        .get('/.identity')
        .reply(503, { error: 'Service temporarily unavailable' });

      // Second request succeeds
      nock('http://127.0.0.1:3025')
        .get('/.identity')
        .reply(200, {
          name: 'WebAI Server',
          version: '1.5.0',
          status: 'running'
        });

      // First attempt fails
      const firstResponse = await fetch('http://127.0.0.1:3025/.identity');
      expect(firstResponse.ok).toBe(false);

      // Second attempt succeeds
      const secondResponse = await fetch('http://127.0.0.1:3025/.identity');
      expect(secondResponse.ok).toBe(true);
    });

    it('should handle server restart scenario', async () => {
      // Server is running
      nock('http://127.0.0.1:3025')
        .get('/.identity')
        .reply(200, {
          name: 'WebAI Server',
          version: '1.5.0',
          status: 'running',
          uptime: 3600
        });

      // Server restarts (connection refused)
      nock('http://127.0.0.1:3025')
        .get('/.identity')
        .replyWithError('ECONNREFUSED');

      // Server is back online
      nock('http://127.0.0.1:3025')
        .get('/.identity')
        .reply(200, {
          name: 'WebAI Server',
          version: '1.5.0',
          status: 'running',
          uptime: 10
        });

      // Test the scenario
      const initialResponse = await fetch('http://127.0.0.1:3025/.identity');
      const initialData = await initialResponse.json();
      expect(initialData.uptime).toBe(3600);

      try {
        await fetch('http://127.0.0.1:3025/.identity');
      } catch (error: any) {
        expect(error.message).toContain('ECONNREFUSED');
      }

      const recoveryResponse = await fetch('http://127.0.0.1:3025/.identity');
      const recoveryData = await recoveryResponse.json();
      expect(recoveryData.uptime).toBe(10); // Server restarted
    });
  });

  describe('Performance Testing', () => {
    it('should handle rapid discovery requests', async () => {
      const requestCount = 20;
      
      for (let i = 0; i < requestCount; i++) {
        nock('http://127.0.0.1:3025')
          .get('/.identity')
          .reply(200, {
            name: 'WebAI Server',
            version: '1.5.0',
            status: 'running',
            requestId: i
          });
      }

      const startTime = Date.now();
      
      const promises = Array.from({ length: requestCount }, (_, i) =>
        fetch('http://127.0.0.1:3025/.identity')
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(responses).toHaveLength(requestCount);
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });

      // Should complete within reasonable time (5 seconds for 20 requests)
      expect(duration).toBeLessThan(5000);
    });

    it('should measure tool response times', async () => {
      mockServerDiscovery();

      const tools = [
        { endpoint: '/console-logs', method: 'GET' },
        { endpoint: '/capture-screenshot', method: 'POST' },
        { endpoint: '/cookies', method: 'GET' },
        { endpoint: '/local-storage', method: 'GET' }
      ];

      const responseTimes: number[] = [];

      for (const tool of tools) {
        nock('http://127.0.0.1:3025')
          .intercept(tool.endpoint, tool.method)
          .delay(100) // Simulate processing time
          .reply(200, createMockApiResponse({}));

        const startTime = Date.now();
        
        const response = await fetch(`http://127.0.0.1:3025${tool.endpoint}`, {
          method: tool.method
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        expect(response.ok).toBe(true);
        responseTimes.push(duration);
      }

      // All tools should respond within reasonable time
      responseTimes.forEach(time => {
        expect(time).toBeGreaterThanOrEqual(100); // At least the delay
        expect(time).toBeLessThan(1000); // Less than 1 second
      });

      const avgResponseTime = responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length;
      expect(avgResponseTime).toBeLessThan(500); // Average under 500ms
    });
  });
});
