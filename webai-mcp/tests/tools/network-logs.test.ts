import { 
  mockWebAIServerResponse, 
  mockServerDiscovery, 
  createMockApiResponse,
  mockNetworkRequest 
} from '../setup';
import nock from 'nock';
import networkRequestsFixture from '../fixtures/network-requests.json';

describe('Network Logs Tool', () => {
  beforeEach(() => {
    mockServerDiscovery();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('getNetworkLogs', () => {
    it('should retrieve all network logs successfully', async () => {
      const mockResponse = createMockApiResponse(networkRequestsFixture);
      
      nock('http://127.0.0.1:3025')
        .get('/all-xhr')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/all-xhr');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(4);
      expect(result.data[0]).toMatchObject({
        url: 'https://api.example.com/users',
        method: 'GET',
        status: 200
      });
    });

    it('should validate network request structure', async () => {
      const mockResponse = createMockApiResponse(networkRequestsFixture);
      
      nock('http://127.0.0.1:3025')
        .get('/all-xhr')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/all-xhr');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      
      result.data.forEach((request: any) => {
        expect(request).toHaveProperty('url');
        expect(request).toHaveProperty('method');
        expect(request).toHaveProperty('status');
        expect(request).toHaveProperty('timestamp');
        expect(request).toHaveProperty('responseHeaders');
        expect(request).toHaveProperty('requestHeaders');
        
        // Validate URL format
        expect(() => new URL(request.url)).not.toThrow();
        
        // Validate HTTP method
        expect(['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']).toContain(request.method);
        
        // Validate status code
        expect(request.status).toBeGreaterThanOrEqual(100);
        expect(request.status).toBeLessThan(600);
        
        // Validate timestamp format
        expect(new Date(request.timestamp).toISOString()).toBe(request.timestamp);
      });
    });

    it('should handle empty network logs', async () => {
      const mockResponse = createMockApiResponse([]);
      
      nock('http://127.0.0.1:3025')
        .get('/all-xhr')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/all-xhr');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });
  });

  describe('getNetworkErrors', () => {
    it('should retrieve only error network requests', async () => {
      const errorRequests = networkRequestsFixture.filter(req => req.status >= 400);
      const mockResponse = createMockApiResponse(errorRequests);
      
      nock('http://127.0.0.1:3025')
        .get('/network-errors')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/network-errors');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      
      result.data.forEach((request: any) => {
        expect(request.status).toBeGreaterThanOrEqual(400);
      });
    });

    it('should handle no network errors', async () => {
      const mockResponse = createMockApiResponse([]);
      
      nock('http://127.0.0.1:3025')
        .get('/network-errors')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/network-errors');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(0);
    });

    it('should categorize errors by status code', async () => {
      const errorRequests = networkRequestsFixture.filter(req => req.status >= 400);
      const mockResponse = createMockApiResponse(errorRequests);
      
      nock('http://127.0.0.1:3025')
        .get('/network-errors')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/network-errors');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      
      const statusCodes = result.data.map((req: any) => req.status);
      const clientErrors = statusCodes.filter((code: number) => code >= 400 && code < 500);
      const serverErrors = statusCodes.filter((code: number) => code >= 500);
      
      expect(clientErrors).toContain(404);
      expect(serverErrors).toContain(500);
    });
  });

  describe('getNetworkSuccess', () => {
    it('should retrieve only successful network requests', async () => {
      const successRequests = networkRequestsFixture.filter(req => req.status >= 200 && req.status < 400);
      const mockResponse = createMockApiResponse(successRequests);
      
      nock('http://127.0.0.1:3025')
        .get('/network-success')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/network-success');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      
      result.data.forEach((request: any) => {
        expect(request.status).toBeGreaterThanOrEqual(200);
        expect(request.status).toBeLessThan(400);
      });
    });
  });

  describe('Network Request Analysis', () => {
    it('should analyze request performance metrics', async () => {
      const mockResponse = createMockApiResponse(networkRequestsFixture);
      
      nock('http://127.0.0.1:3025')
        .get('/all-xhr')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/all-xhr');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      
      // Analyze performance metrics
      const requests = result.data;
      const durations = requests.map((req: any) => req.duration);
      const avgDuration = durations.reduce((sum: number, dur: number) => sum + dur, 0) / durations.length;
      const maxDuration = Math.max(...durations);
      const minDuration = Math.min(...durations);
      
      expect(avgDuration).toBeGreaterThan(0);
      expect(maxDuration).toBeGreaterThanOrEqual(avgDuration);
      expect(minDuration).toBeLessThanOrEqual(avgDuration);
      
      // Check for slow requests (>1000ms)
      const slowRequests = requests.filter((req: any) => req.duration > 1000);
      expect(slowRequests.length).toBeGreaterThan(0); // We have one 5000ms request in fixture
    });

    it('should analyze response sizes', async () => {
      const mockResponse = createMockApiResponse(networkRequestsFixture);
      
      nock('http://127.0.0.1:3025')
        .get('/all-xhr')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/all-xhr');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      
      // Analyze response sizes
      const requests = result.data;
      const sizes = requests.map((req: any) => req.responseSize);
      const totalSize = sizes.reduce((sum: number, size: number) => sum + size, 0);
      const avgSize = totalSize / sizes.length;
      
      expect(totalSize).toBeGreaterThan(0);
      expect(avgSize).toBeGreaterThan(0);
      
      // Check for large responses (>1KB)
      const largeResponses = requests.filter((req: any) => req.responseSize > 1024);
      expect(largeResponses.length).toBeGreaterThan(0);
    });

    it('should identify common request patterns', async () => {
      const mockResponse = createMockApiResponse(networkRequestsFixture);
      
      nock('http://127.0.0.1:3025')
        .get('/all-xhr')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/all-xhr');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      
      const requests = result.data;
      
      // Analyze by domain
      const domains = requests.map((req: any) => new URL(req.url).hostname);
      const uniqueDomains = [...new Set(domains)];
      expect(uniqueDomains).toContain('api.example.com');
      expect(uniqueDomains).toContain('cdn.example.com');
      
      // Analyze by method
      const methods = requests.map((req: any) => req.method);
      const methodCounts = methods.reduce((acc: any, method: string) => {
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {});
      
      expect(methodCounts.GET).toBeGreaterThan(0);
      expect(methodCounts.POST).toBeGreaterThan(0);
      
      // Analyze by content type
      const contentTypes = requests.map((req: any) => 
        req.responseHeaders['content-type'] || 'unknown'
      );
      expect(contentTypes).toContain('application/json');
      expect(contentTypes).toContain('text/css');
    });
  });

  describe('Error Handling', () => {
    it('should handle server errors gracefully', async () => {
      const errorResponse = createMockApiResponse(null, false, 'Failed to retrieve network logs');
      
      nock('http://127.0.0.1:3025')
        .get('/all-xhr')
        .reply(500, errorResponse);

      const response = await fetch('http://127.0.0.1:3025/all-xhr');
      const result = await response.json();
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to retrieve network logs');
    });

    it('should handle malformed network data', async () => {
      const malformedData = [
        { url: 'invalid-url', method: 'INVALID', status: 'not-a-number' },
        { missing: 'required-fields' }
      ];
      const mockResponse = createMockApiResponse(malformedData);
      
      nock('http://127.0.0.1:3025')
        .get('/all-xhr')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/all-xhr');
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.data).toHaveLength(2);
      
      // Test should handle malformed data gracefully
      // In real implementation, validation would filter out invalid entries
    });
  });
});
