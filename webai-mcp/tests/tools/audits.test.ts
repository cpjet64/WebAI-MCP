import { 
  mockWebAIServerResponse, 
  mockServerDiscovery, 
  createMockApiResponse,
  mockAuditResult 
} from '../setup';
import nock from 'nock';
import auditResultsFixture from '../fixtures/audit-results.json';

describe('Audit Tools', () => {
  beforeEach(() => {
    mockServerDiscovery();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('runPerformanceAudit', () => {
    it('should run performance audit successfully', async () => {
      const mockResponse = createMockApiResponse(auditResultsFixture.performance);
      
      nock('http://127.0.0.1:3025')
        .post('/run-performance-audit')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/run-performance-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.score).toBe(0.85);
      expect(result.data.title).toBe('Performance');
      expect(result.data.audits).toHaveProperty('first-contentful-paint');
      expect(result.data.audits).toHaveProperty('largest-contentful-paint');
    });

    it('should validate performance audit structure', async () => {
      const mockResponse = createMockApiResponse(auditResultsFixture.performance);
      
      nock('http://127.0.0.1:3025')
        .post('/run-performance-audit')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/run-performance-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.data).toHaveProperty('score');
      expect(result.data).toHaveProperty('title');
      expect(result.data).toHaveProperty('description');
      expect(result.data).toHaveProperty('audits');
      
      // Validate score range
      expect(result.data.score).toBeGreaterThanOrEqual(0);
      expect(result.data.score).toBeLessThanOrEqual(1);
      
      // Validate audit metrics
      const audits = result.data.audits;
      Object.keys(audits).forEach(auditKey => {
        const audit = audits[auditKey];
        expect(audit).toHaveProperty('score');
        expect(audit).toHaveProperty('displayValue');
        expect(audit).toHaveProperty('description');
        expect(audit.score).toBeGreaterThanOrEqual(0);
        expect(audit.score).toBeLessThanOrEqual(1);
      });
    });

    it('should handle performance audit failure', async () => {
      const errorResponse = createMockApiResponse(null, false, 'Failed to run performance audit');
      
      nock('http://127.0.0.1:3025')
        .post('/run-performance-audit')
        .reply(500, errorResponse);

      const response = await fetch('http://127.0.0.1:3025/run-performance-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(500);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to run performance audit');
    });

    it('should handle invalid URL', async () => {
      const errorResponse = createMockApiResponse(null, false, 'Invalid URL provided');
      
      nock('http://127.0.0.1:3025')
        .post('/run-performance-audit')
        .reply(400, errorResponse);

      const response = await fetch('http://127.0.0.1:3025/run-performance-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'invalid-url' })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(false);
      expect(response.status).toBe(400);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid URL provided');
    });
  });

  describe('runAccessibilityAudit', () => {
    it('should run accessibility audit successfully', async () => {
      const mockResponse = createMockApiResponse(auditResultsFixture.accessibility);
      
      nock('http://127.0.0.1:3025')
        .post('/run-accessibility-audit')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/run-accessibility-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.score).toBe(0.92);
      expect(result.data.title).toBe('Accessibility');
      expect(result.data.audits).toHaveProperty('color-contrast');
      expect(result.data.audits).toHaveProperty('image-alt');
    });

    it('should identify accessibility issues', async () => {
      const mockResponse = createMockApiResponse(auditResultsFixture.accessibility);
      
      nock('http://127.0.0.1:3025')
        .post('/run-accessibility-audit')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/run-accessibility-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      
      const audits = result.data.audits;
      
      // Check for perfect scores
      expect(audits['color-contrast'].score).toBe(1.0);
      expect(audits['heading-order'].score).toBe(1.0);
      
      // Check for issues
      expect(audits['image-alt'].score).toBe(0.8);
      expect(audits['image-alt'].displayValue).toContain('4 images missing alt text');
    });
  });

  describe('runSEOAudit', () => {
    it('should run SEO audit successfully', async () => {
      const mockResponse = createMockApiResponse(auditResultsFixture.seo);
      
      nock('http://127.0.0.1:3025')
        .post('/run-seo-audit')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/run-seo-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.score).toBe(0.95);
      expect(result.data.title).toBe('SEO');
      expect(result.data.audits).toHaveProperty('meta-description');
      expect(result.data.audits).toHaveProperty('document-title');
    });

    it('should validate SEO requirements', async () => {
      const mockResponse = createMockApiResponse(auditResultsFixture.seo);
      
      nock('http://127.0.0.1:3025')
        .post('/run-seo-audit')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/run-seo-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      
      const audits = result.data.audits;
      
      // Check essential SEO elements
      expect(audits['meta-description'].score).toBe(1.0);
      expect(audits['document-title'].score).toBe(1.0);
      
      // Check for minor issues
      expect(audits['robots-txt'].score).toBe(0.8);
      expect(audits['robots-txt'].displayValue).toContain('minor issues');
    });
  });

  describe('runBestPracticesAudit', () => {
    it('should run best practices audit successfully', async () => {
      const mockResponse = createMockApiResponse(auditResultsFixture['best-practices']);
      
      nock('http://127.0.0.1:3025')
        .post('/run-best-practices-audit')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/run-best-practices-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      expect(result.success).toBe(true);
      expect(result.data.score).toBe(0.88);
      expect(result.data.title).toBe('Best Practices');
      expect(result.data.audits).toHaveProperty('uses-https');
      expect(result.data.audits).toHaveProperty('no-vulnerable-libraries');
    });

    it('should identify security issues', async () => {
      const mockResponse = createMockApiResponse(auditResultsFixture['best-practices']);
      
      nock('http://127.0.0.1:3025')
        .post('/run-best-practices-audit')
        .reply(200, mockResponse);

      const response = await fetch('http://127.0.0.1:3025/run-best-practices-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' })
      });
      
      const result = await response.json();
      
      expect(response.ok).toBe(true);
      
      const audits = result.data.audits;
      
      // Check security practices
      expect(audits['uses-https'].score).toBe(1.0);
      
      // Check for vulnerabilities
      expect(audits['no-vulnerable-libraries'].score).toBe(0.5);
      expect(audits['no-vulnerable-libraries'].displayValue).toContain('2 vulnerable libraries');
      
      // Check for missing security headers
      expect(audits['csp-xss'].score).toBe(0.0);
      expect(audits['csp-xss'].displayValue).toContain('No CSP found');
    });
  });

  describe('Audit Performance', () => {
    it('should complete audits within reasonable time', async () => {
      const mockResponse = createMockApiResponse(auditResultsFixture.performance);
      
      nock('http://127.0.0.1:3025')
        .post('/run-performance-audit')
        .delay(2000) // 2 second delay
        .reply(200, mockResponse);

      const startTime = Date.now();
      
      const response = await fetch('http://127.0.0.1:3025/run-performance-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' })
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      expect(response.ok).toBe(true);
      expect(duration).toBeGreaterThanOrEqual(2000);
      expect(duration).toBeLessThan(10000); // Should complete within 10 seconds
    });

    it('should handle concurrent audit requests', async () => {
      const auditTypes = ['performance', 'accessibility', 'seo', 'best-practices'];
      
      auditTypes.forEach(type => {
        nock('http://127.0.0.1:3025')
          .post(`/run-${type}-audit`)
          .reply(200, createMockApiResponse(auditResultsFixture[type] || mockAuditResult));
      });

      const promises = auditTypes.map(type =>
        fetch(`http://127.0.0.1:3025/run-${type}-audit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'https://example.com' })
        })
      );

      const responses = await Promise.all(promises);
      
      expect(responses).toHaveLength(4);
      responses.forEach(response => {
        expect(response.ok).toBe(true);
      });
    });
  });

  describe('Audit Error Handling', () => {
    it('should handle audit timeout', async () => {
      nock('http://127.0.0.1:3025')
        .post('/run-performance-audit')
        .delay(15000) // 15 second delay
        .reply(200, mockAuditResult);

      const controller = new AbortController();
      setTimeout(() => controller.abort(), 5000); // Abort earlier than test timeout
      
      try {
        await fetch('http://127.0.0.1:3025/run-performance-audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: 'https://example.com' }),
          signal: controller.signal
        });
      } catch (error: any) {
        expect(error.name).toBe('AbortError');
      }
    });

    it('should handle malformed audit results', async () => {
      nock('http://127.0.0.1:3025')
        .post('/run-performance-audit')
        .reply(200, 'invalid json');

      const response = await fetch('http://127.0.0.1:3025/run-performance-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com' })
      });
      
      try {
        await response.json();
      } catch (error: any) {
        expect(error).toBeInstanceOf(SyntaxError);
      }
    });
  });
});
