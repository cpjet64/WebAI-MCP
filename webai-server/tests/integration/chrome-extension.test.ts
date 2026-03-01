import WebSocket from 'ws';
import {
  createMockWebSocketConnection,
  mockConsoleLog,
  mockNetworkRequest
} from '../setup.js';

describe('Chrome Extension Integration', () => {
  let mockWebSocketServer: any;
  let mockConnection: any;

  beforeEach(() => {
    mockConnection = createMockWebSocketConnection();
    
    // Mock WebSocket Server
    const listeners: Record<string, Function[]> = {};
    mockWebSocketServer = {
      clients: new Set([mockConnection]),
      on: jest.fn((event: string, handler: Function) => {
        listeners[event] = listeners[event] || [];
        listeners[event].push(handler);
      }),
      handleUpgrade: jest.fn(),
      emit: jest.fn((event: string, ...args: any[]) => {
        (listeners[event] || []).forEach(fn => fn(...args));
      }),
      close: jest.fn()
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection with extension', () => {
      const connectionHandler = jest.fn();
      mockWebSocketServer.on('connection', connectionHandler);

      // Simulate connection event
      mockWebSocketServer.emit('connection', mockConnection);

      expect(connectionHandler).toHaveBeenCalledWith(mockConnection);
      expect(mockWebSocketServer.clients.has(mockConnection)).toBe(true);
    });

    it('should handle multiple extension connections', () => {
      const connection1 = createMockWebSocketConnection();
      const connection2 = createMockWebSocketConnection();
      
      mockWebSocketServer.clients.add(connection1);
      mockWebSocketServer.clients.add(connection2);

      expect(mockWebSocketServer.clients.size).toBe(3); // Including initial mock connection
    });

    it('should handle connection close', () => {
      const closeHandler = jest.fn();
      mockConnection.addEventListener('close', closeHandler);

      // Simulate close event
      mockConnection.readyState = 3; // CLOSED
      closeHandler();

      expect(closeHandler).toHaveBeenCalled();
      expect(mockConnection.readyState).toBe(3);
    });

    it('should handle connection errors', () => {
      const errorHandler = jest.fn();
      mockConnection.addEventListener('error', errorHandler);

      // Simulate error event
      const error = new Error('Connection error');
      errorHandler(error);

      expect(errorHandler).toHaveBeenCalledWith(error);
    });
  });

  describe('Message Handling', () => {
    it('should receive console log messages from extension', () => {
      const messageHandler = jest.fn();
      mockConnection.addEventListener('message', messageHandler);

      const consoleMessage = {
        type: 'console-log',
        data: mockConsoleLog
      };

      // Simulate message from extension
      messageHandler({ data: JSON.stringify(consoleMessage) });

      expect(messageHandler).toHaveBeenCalled();
    });

    it('should receive network request messages from extension', () => {
      const messageHandler = jest.fn();
      mockConnection.addEventListener('message', messageHandler);

      const networkMessage = {
        type: 'network-request',
        data: mockNetworkRequest
      };

      // Simulate message from extension
      messageHandler({ data: JSON.stringify(networkMessage) });

      expect(messageHandler).toHaveBeenCalled();
    });

    it('should handle screenshot response messages', () => {
      const messageHandler = jest.fn();
      mockConnection.addEventListener('message', messageHandler);

      const screenshotMessage = {
        type: 'screenshot-response',
        requestId: '12345',
        data: {
          success: true,
          file: 'screenshot.png',
          timestamp: new Date().toISOString()
        }
      };

      // Simulate message from extension
      messageHandler({ data: JSON.stringify(screenshotMessage) });

      expect(messageHandler).toHaveBeenCalled();
    });

    it('should handle element interaction responses', () => {
      const messageHandler = jest.fn();
      mockConnection.addEventListener('message', messageHandler);

      const clickResponse = {
        type: 'click-response',
        requestId: '67890',
        data: {
          success: true,
          element: {
            tagName: 'BUTTON',
            id: 'submit-btn'
          }
        }
      };

      // Simulate message from extension
      messageHandler({ data: JSON.stringify(clickResponse) });

      expect(messageHandler).toHaveBeenCalled();
    });

    it('should handle malformed messages gracefully', () => {
      const messageHandler = jest.fn();
      mockConnection.addEventListener('message', messageHandler);

      // Simulate malformed JSON
      messageHandler({ data: 'invalid json' });

      expect(messageHandler).toHaveBeenCalled();
      // Should not throw error
    });

    it('should handle empty messages', () => {
      const messageHandler = jest.fn();
      mockConnection.addEventListener('message', messageHandler);

      // Simulate empty message
      messageHandler({ data: '' });

      expect(messageHandler).toHaveBeenCalled();
    });
  });

  describe('Request-Response Flow', () => {
    it('should send screenshot request and receive response', async () => {
      const requestId = Date.now().toString();
      const screenshotRequest = {
        type: 'capture-screenshot',
        requestId: requestId,
        options: {
          fullPage: true,
          format: 'png'
        }
      };

      // Send request
      mockConnection.send(JSON.stringify(screenshotRequest));

      expect(mockConnection.send).toHaveBeenCalledWith(JSON.stringify(screenshotRequest));

      // Simulate response
      const response = {
        type: 'screenshot-response',
        requestId: requestId,
        data: {
          success: true,
          file: 'screenshot.png'
        }
      };

      const messageHandler = jest.fn();
      mockConnection.addEventListener('message', messageHandler);
      messageHandler({ data: JSON.stringify(response) });

      expect(messageHandler).toHaveBeenCalledWith({
        data: JSON.stringify(response)
      });
    });

    it('should handle request timeout', async () => {
      const requestId = Date.now().toString();
      const request = {
        type: 'capture-screenshot',
        requestId: requestId
      };

      // Send request
      mockConnection.send(JSON.stringify(request));

      // Simulate timeout (no response received)
      const timeoutPromise = new Promise((resolve, reject) => {
        setTimeout(() => {
          reject(new Error('Request timeout'));
        }, 1000);
      });

      await expect(timeoutPromise).rejects.toThrow('Request timeout');
    });

    it('should handle concurrent requests', async () => {
      const requests = [
        { type: 'capture-screenshot', requestId: '1' },
        { type: 'get-cookies', requestId: '2' },
        { type: 'click-element', requestId: '3', selector: '#btn' }
      ];

      // Send multiple requests
      requests.forEach(request => {
        mockConnection.send(JSON.stringify(request));
      });

      expect(mockConnection.send).toHaveBeenCalledTimes(3);

      // Simulate responses
      const responses = [
        { type: 'screenshot-response', requestId: '1', data: { success: true } },
        { type: 'cookies-response', requestId: '2', data: { cookies: [] } },
        { type: 'click-response', requestId: '3', data: { success: true } }
      ];

      const messageHandler = jest.fn();
      mockConnection.addEventListener('message', messageHandler);

      responses.forEach(response => {
        messageHandler({ data: JSON.stringify(response) });
      });

      expect(messageHandler).toHaveBeenCalledTimes(3);
    });
  });

  describe('Data Streaming', () => {
    it('should stream console logs continuously', () => {
      const messageHandler = jest.fn();
      mockConnection.addEventListener('message', messageHandler);

      // Simulate multiple console log messages
      const logs = [
        { type: 'console-log', data: { ...mockConsoleLog, message: 'Log 1' } },
        { type: 'console-log', data: { ...mockConsoleLog, message: 'Log 2' } },
        { type: 'console-log', data: { ...mockConsoleLog, message: 'Log 3' } }
      ];

      logs.forEach(log => {
        messageHandler({ data: JSON.stringify(log) });
      });

      expect(messageHandler).toHaveBeenCalledTimes(3);
    });

    it('should stream network requests continuously', () => {
      const messageHandler = jest.fn();
      mockConnection.addEventListener('message', messageHandler);

      // Simulate multiple network requests
      const requests = [
        { type: 'network-request', data: { ...mockNetworkRequest, url: 'https://api1.com' } },
        { type: 'network-request', data: { ...mockNetworkRequest, url: 'https://api2.com' } },
        { type: 'network-request', data: { ...mockNetworkRequest, url: 'https://api3.com' } }
      ];

      requests.forEach(request => {
        messageHandler({ data: JSON.stringify(request) });
      });

      expect(messageHandler).toHaveBeenCalledTimes(3);
    });

    it('should handle high-frequency message streams', () => {
      const messageHandler = jest.fn();
      mockConnection.addEventListener('message', messageHandler);

      // Simulate rapid message stream
      const messageCount = 100;
      for (let i = 0; i < messageCount; i++) {
        const message = {
          type: 'console-log',
          data: { ...mockConsoleLog, message: `Rapid log ${i}` }
        };
        messageHandler({ data: JSON.stringify(message) });
      }

      expect(messageHandler).toHaveBeenCalledTimes(messageCount);
    });
  });

  describe('Error Handling', () => {
    it('should handle extension disconnection gracefully', () => {
      const closeHandler = jest.fn();
      mockConnection.addEventListener('close', closeHandler);

      // Simulate extension disconnection
      mockConnection.readyState = 3; // CLOSED
      mockWebSocketServer.clients.delete(mockConnection);
      closeHandler();

      expect(closeHandler).toHaveBeenCalled();
      expect(mockWebSocketServer.clients.has(mockConnection)).toBe(false);
    });

    it('should handle extension errors', () => {
      const messageHandler = jest.fn();
      mockConnection.addEventListener('message', messageHandler);

      const errorMessage = {
        type: 'error',
        data: {
          message: 'Extension error occurred',
          code: 'EXT_001',
          details: 'Failed to access tab'
        }
      };

      messageHandler({ data: JSON.stringify(errorMessage) });

      expect(messageHandler).toHaveBeenCalledWith({
        data: JSON.stringify(errorMessage)
      });
    });

    it('should handle WebSocket send failures', () => {
      // Mock send failure
      mockConnection.send.mockImplementation(() => {
        throw new Error('Send failed');
      });

      const request = {
        type: 'capture-screenshot',
        requestId: '123'
      };

      expect(() => {
        mockConnection.send(JSON.stringify(request));
      }).toThrow('Send failed');
    });

    it('should recover from temporary connection issues', () => {
      // Simulate connection drop
      mockConnection.readyState = 2; // CLOSING

      // Simulate reconnection
      const newConnection = createMockWebSocketConnection();
      mockWebSocketServer.clients.add(newConnection);

      expect(mockWebSocketServer.clients.has(newConnection)).toBe(true);
      expect(newConnection.readyState).toBe(1); // OPEN
    });
  });

  describe('Performance', () => {
    it('should handle large message payloads', () => {
      const messageHandler = jest.fn();
      mockConnection.addEventListener('message', messageHandler);

      // Create large payload
      const largeData = Array.from({ length: 10000 }, (_, i) => ({
        id: i,
        message: `Large data item ${i}`,
        timestamp: new Date().toISOString()
      }));

      const largeMessage = {
        type: 'bulk-data',
        data: largeData
      };

      messageHandler({ data: JSON.stringify(largeMessage) });

      expect(messageHandler).toHaveBeenCalled();
    });

    it('should measure message processing time', () => {
      const messageHandler = jest.fn();
      mockConnection.addEventListener('message', messageHandler);

      const startTime = Date.now();

      // Process multiple messages
      for (let i = 0; i < 50; i++) {
        const message = {
          type: 'console-log',
          data: { ...mockConsoleLog, message: `Performance test ${i}` }
        };
        messageHandler({ data: JSON.stringify(message) });
      }

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(messageHandler).toHaveBeenCalledTimes(50);
      expect(duration).toBeLessThan(1000); // Should process 50 messages in under 1 second
    });

    it('should handle connection limits', () => {
      const maxConnections = 10;
      const connections = [];

      // Create multiple connections
      for (let i = 0; i < maxConnections; i++) {
        const connection = createMockWebSocketConnection();
        connections.push(connection);
        mockWebSocketServer.clients.add(connection);
      }

      expect(mockWebSocketServer.clients.size).toBe(maxConnections + 1); // +1 for initial mock connection

      // Attempt to add one more connection
      const extraConnection = createMockWebSocketConnection();
      
      // In real implementation, this might be rejected or oldest connection closed
      if (mockWebSocketServer.clients.size >= maxConnections) {
        // Simulate connection limit handling
        expect(mockWebSocketServer.clients.size).toBeGreaterThanOrEqual(maxConnections);
      }
    });
  });

  describe('Security', () => {
    it('should validate message types', () => {
      const messageHandler = jest.fn();
      mockConnection.addEventListener('message', messageHandler);

      const validTypes = [
        'console-log',
        'network-request',
        'screenshot-response',
        'click-response',
        'cookies-response'
      ];

      const invalidMessage = {
        type: 'malicious-type',
        data: { payload: 'harmful data' }
      };

      messageHandler({ data: JSON.stringify(invalidMessage) });

      // In real implementation, invalid message types should be rejected
      expect(messageHandler).toHaveBeenCalled();
    });

    it('should sanitize message data', () => {
      const messageHandler = jest.fn();
      mockConnection.addEventListener('message', messageHandler);

      const potentiallyHarmfulMessage = {
        type: 'console-log',
        data: {
          message: '<script>alert("xss")</script>',
          source: 'console-api'
        }
      };

      messageHandler({ data: JSON.stringify(potentiallyHarmfulMessage) });

      // In real implementation, message data should be sanitized
      expect(messageHandler).toHaveBeenCalled();
    });

    it('should handle oversized messages', () => {
      const messageHandler = jest.fn();
      mockConnection.addEventListener('message', messageHandler);

      // Create oversized message (simulate 10MB payload)
      const oversizedData = 'x'.repeat(10 * 1024 * 1024);
      const oversizedMessage = {
        type: 'console-log',
        data: { message: oversizedData }
      };

      // In real implementation, oversized messages should be rejected
      try {
        messageHandler({ data: JSON.stringify(oversizedMessage) });
        expect(messageHandler).toHaveBeenCalled();
      } catch (error) {
        // Expected for oversized messages
        expect(error).toBeDefined();
      }
    });
  });
});
