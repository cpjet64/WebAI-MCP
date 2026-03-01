import { 
  mockWebAIServerResponse, 
  mockServerDiscovery, 
  createMockApiResponse,
  mockConsoleLog 
} from '../setup';
import nock from 'nock';
import consoleLogsFixture from '../fixtures/console-logs.json';

describe('Console Logs Tool', () => {
  beforeEach(() => {
    mockServerDiscovery();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('getConsoleLogs', () => {
    it('should retrieve console logs successfully', async () => {
      const mockResponse = createMockApiResponse(consoleLogsFixture);
      
      nock('http://127.0.0.1:3025')
        .get('/console-logs')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/console-logs');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(5);
      expect(result.data[0]).toMatchObject({
        level: 'info',
        message: 'Application started successfully',
        source: 'console-api'
      });
    });

    it('should handle empty console logs', async () => {
      const mockResponse = createMockApiResponse([]);
      
      nock('http://127.0.0.1:3025')
        .get('/console-logs')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/console-logs');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should filter logs by level', async () => {
      const errorLogs = consoleLogsFixture.filter(log => log.level === 'error');
      const mockResponse = createMockApiResponse(errorLogs);
      
      nock('http://127.0.0.1:3025')
        .get('/console-logs')
        .query({ level: 'error' })
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/console-logs?level=error');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].level).toBe('error');
    });

    it('should handle server errors', async () => {
      const errorResponse = createMockApiResponse(null, false, 'Failed to retrieve console logs');
      
      nock('http://127.0.0.1:3025')
        .get('/console-logs')
        .reply(500, errorResponse);

      const response = await fetch('http://127.0.0.1:3025/console-logs');
      const result = await response.json();
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to retrieve console logs');
    });

    it('should validate log structure', async () => {
      const mockResponse = createMockApiResponse(consoleLogsFixture);
      
      nock('http://127.0.0.1:3025')
        .get('/console-logs')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/console-logs');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      
      result.data.forEach((log: any) => {
        expect(log).toHaveProperty('level');
        expect(log).toHaveProperty('message');
        expect(log).toHaveProperty('timestamp');
        expect(log).toHaveProperty('source');
        expect(log).toHaveProperty('url');
        
        // Validate timestamp format
        expect(new Date(log.timestamp).toISOString()).toBe(log.timestamp);
        
        // Validate level values
        expect(['info', 'warn', 'error', 'debug', 'log']).toContain(log.level);
        
        // Validate source values
        expect(['console-api', 'network', 'security', 'other']).toContain(log.source);
      });
    });
  });

  describe('getConsoleErrors', () => {
    it('should retrieve only error logs', async () => {
      const errorLogs = consoleLogsFixture.filter(log => log.level === 'error');
      const mockResponse = createMockApiResponse(errorLogs);
      
      nock('http://127.0.0.1:3025')
        .get('/console-errors')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/console-errors');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].level).toBe('error');
    });

    it('should handle no error logs', async () => {
      const mockResponse = createMockApiResponse([]);
      
      nock('http://127.0.0.1:3025')
        .get('/console-errors')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/console-errors');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('wipeLogs', () => {
    it('should clear all logs successfully', async () => {
      const mockResponse = createMockApiResponse(null, true);
      mockResponse.message = 'Logs wiped successfully';
      
      nock('http://127.0.0.1:3025')
        .post('/wipelogs')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/wipelogs', {
        method: 'POST'
      });
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Logs wiped successfully');
    });

    it('should handle wipe logs failure', async () => {
      const errorResponse = createMockApiResponse(null, false, 'Failed to wipe logs');
      
      nock('http://127.0.0.1:3025')
        .post('/wipelogs')
        .reply(500, errorResponse);

      const response = await fetch('http://127.0.0.1:3025/wipelogs', {
        method: 'POST'
      });
      const result = await response.json();
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to wipe logs');
    });
  });

  describe('Performance Tests', () => {
    it('should handle large log datasets efficiently', async () => {
      // Create a large dataset
      const largeLogs = Array.from({ length: 1000 }, (_, i) => ({
        ...mockConsoleLog,
        message: `Log message ${i}`,
        timestamp: new Date(Date.now() + i * 1000).toISOString()
      }));
      
      const mockResponse = createMockApiResponse(largeLogs);
      
      nock('http://127.0.0.1:3025')
        .get('/console-logs')
        .reply(200, mockResponse);

      const startTime = Date.now();
      const response = await fetch('http://127.0.0.1:3025/console-logs');
      const result = await response.json();
      const endTime = Date.now();
      
      expect(response.ok).toBe(true);
      expect(result.data).toHaveLength(1000);
      expect(endTime - startTime).toBeLessThan(5000); // Should complete within 5 seconds
    });

    it('should handle rapid consecutive requests', async () => {
      const requestCount = 10;
      
      for (let i = 0; i < requestCount; i++) {
        nock('http://127.0.0.1:3025')
          .get('/console-logs')
          .reply(200, createMockApiResponse(consoleLogsFixture));
      }

      const promises = Array.from({ length: requestCount }, () =>
        fetch('http://127.0.0.1:3025/console-logs')
      );

      const responses = await Promise.all(promises);
      
      expect(responses).toHaveLength(requestCount);
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
    });
  });
});
