import { 
  mockWebAIServerResponse, 
  mockServerDiscovery, 
  createMockApiResponse,
  mockScreenshotResponse 
} from '../setup';
import nock from 'nock';

describe('Screenshot Tool', () => {
  beforeEach(() => {
    mockServerDiscovery();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('takeScreenshot', () => {
    it('should capture screenshot successfully', async () => {
      const mockResponse = createMockApiResponse(mockScreenshotResponse);
      
      nock('http://127.0.0.1:3025')
        .post('/capture-screenshot')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/capture-screenshot', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.file).toBe('screenshot_20240101_000000.png');
      expect(result.data.timestamp).toBeDefined();
    });

    it('should handle screenshot failure', async () => {
      const errorResponse = createMockApiResponse(null, false, 'No active browser connection');
      
      nock('http://127.0.0.1:3025')
        .post('/capture-screenshot')
        .reply(503, errorResponse);

      const response = await fetch('http://127.0.0.1:3025/capture-screenshot', {
        method: 'POST'
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(503);
      expect(result.success).toBe(false);
      expect(result.error).toBe('No active browser connection');
    });

    it('should handle server timeout', async () => {
      nock('http://127.0.0.1:3025')
        .post('/capture-screenshot')
        .delay(10000)
        .reply(200, mockScreenshotResponse);

      const controller = new AbortController();
      setTimeout(() => controller.abort(), 5000);
      
      try {
        await fetch('http://127.0.0.1:3025/capture-screenshot', {
          method: 'POST',
          signal: controller.signal
        });
      } catch (error: any) {
        expect(error.name).toBe('AbortError');
      }
    });

    it('should handle network errors', async () => {
      nock('http://127.0.0.1:3025')
        .post('/capture-screenshot')
        .replyWithError('ECONNREFUSED');

      try {
        await fetch('http://127.0.0.1:3025/capture-screenshot', {
          method: 'POST'
        });
      } catch (error: any) {
        expect(error.message).toContain('ECONNREFUSED');
      }
    });

    it('should handle malformed response', async () => {
      nock('http://127.0.0.1:3025')
        .post('/capture-screenshot')
        .reply(200, 'invalid json');

      const response = await fetch('http://127.0.0.1:3025/capture-screenshot', {
        method: 'POST'
      });
      
      try {
        await response.json();
      } catch (error: any) {
        expect(error).toBeInstanceOf(SyntaxError);
      }
    });

    it('should handle empty response', async () => {
      nock('http://127.0.0.1:3025')
        .post('/capture-screenshot')
        .reply(200, '');

      const response = await fetch('http://127.0.0.1:3025/capture-screenshot', {
        method: 'POST'
      });
      
      const text = await response.text();
      expect(text).toBe('');
    });

    it('should handle different HTTP status codes', async () => {
      const testCases = [
        { status: 400, error: 'Bad Request' },
        { status: 401, error: 'Unauthorized' },
        { status: 403, error: 'Forbidden' },
        { status: 404, error: 'Not Found' },
        { status: 500, error: 'Internal Server Error' },
        { status: 502, error: 'Bad Gateway' },
        { status: 503, error: 'Service Unavailable' }
      ];

      for (const testCase of testCases) {
        nock('http://127.0.0.1:3025')
          .post('/capture-screenshot')
          .reply(testCase.status, { error: testCase.error });

        const response = await fetch('http://127.0.0.1:3025/capture-screenshot', {
          method: 'POST'
        });
        
        expect(response.status).toBe(testCase.status);
        expect(response.ok).toBe(false);
        
        const result = await response.json();
        expect(result.error).toBe(testCase.error);
        
        nock.cleanAll();
      }
    });

    it('should measure response time', async () => {
      const delay = 1000; // 1 second delay
      
      nock('http://127.0.0.1:3025')
        .post('/capture-screenshot')
        .delay(delay)
        .reply(200, mockScreenshotResponse);

      const startTime = Date.now();
      
      const response = await fetch('http://127.0.0.1:3025/capture-screenshot', {
        method: 'POST'
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response.ok).toBe(true);
      expect(duration).toBeGreaterThanOrEqual(delay);
      expect(duration).toBeLessThan(delay + 1200); // Allow generous margin for CI timing
    });

    it('should handle concurrent requests', async () => {
      const requestCount = 5;
      
      for (let i = 0; i < requestCount; i++) {
        nock('http://127.0.0.1:3025')
          .post('/capture-screenshot')
          .reply(200, { ...mockScreenshotResponse, file: `screenshot_${i}.png` });
      }

      const promises = Array.from({ length: requestCount }, (_, i) =>
        fetch('http://127.0.0.1:3025/capture-screenshot', {
          method: 'POST'
        })
      );

      const responses = await Promise.all(promises);
      
      expect(responses).toHaveLength(requestCount);
      responses.forEach((response, index) => {
        expect(response.ok).toBe(true);
      });
    });
  });
});
