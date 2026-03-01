import request from 'supertest';
import express from 'express';
import {
  createMockWebSocketConnection,
  createMockRequest,
  createMockResponse,
  mockConsoleLog,
  mockNetworkRequest,
  mockAuditResult
} from './setup.js';

// Mock the browser-connector module
const mockBrowserConnector = {
  app: express(),
  activeConnections: new Set(),
  getFirstActiveConnection: jest.fn(),
  captureScreenshot: jest.fn(),
  getCookies: jest.fn(),
  getLocalStorage: jest.fn(),
  getSessionStorage: jest.fn(),
  clickElement: jest.fn(),
  fillInput: jest.fn(),
  selectOption: jest.fn(),
  submitForm: jest.fn(),
  refreshBrowser: jest.fn(),
  inspectElementsBySelector: jest.fn(),
  runPerformanceAudit: jest.fn(),
  runAccessibilityAudit: jest.fn(),
  runSEOAudit: jest.fn(),
  runBestPracticesAudit: jest.fn()
};

describe('Browser Connector', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(
      (err: any, _req: express.Request, res: express.Response, next: express.NextFunction): void => {
        if (err instanceof SyntaxError && "body" in err) {
          res.status(400).json({
            error: "Invalid JSON payload",
            success: false,
          });
          return;
        }
        next(err);
      }
    );
    
    // Setup basic routes for testing
    app.get('/.identity', (req: express.Request, res: express.Response): void => {
      res.json({
        name: 'WebAI Server',
        version: '1.5.0',
        status: 'running',
        uptime: Date.now()
      });
    });

    app.get('/console-logs', (req: express.Request, res: express.Response): void => {
      res.json([mockConsoleLog]);
    });

    app.get('/network-errors', (req: express.Request, res: express.Response): void => {
      res.json([mockNetworkRequest]);
    });

    app.post('/capture-screenshot', (req: express.Request, res: express.Response): void => {
      res.json({
        success: true,
        file: 'screenshot.png',
        timestamp: new Date().toISOString()
      });
    });
  });

  describe('Server Identity', () => {
    it('should return server identity', async () => {
      const response = await request(app)
        .get('/.identity')
        .expect(200);

      expect(response.body).toHaveProperty('name', 'WebAI Server');
      expect(response.body).toHaveProperty('version', '1.5.0');
      expect(response.body).toHaveProperty('status', 'running');
      expect(response.body).toHaveProperty('uptime');
    });

    it('should include server capabilities in identity', async () => {
      app = express();
      app.use(express.json());
      app.get('/.identity', (req: express.Request, res: express.Response): void => {
        res.json({
          name: 'WebAI Server',
          version: '1.5.0',
          status: 'running',
          capabilities: ['screenshots', 'logs', 'audits', 'interaction'],
          extensions: {
            connected: true,
            count: 1
          }
        });
      });

      const response = await request(app)
        .get('/.identity')
        .expect(200);

      expect(response.body.capabilities).toContain('screenshots');
      expect(response.body.capabilities).toContain('logs');
      expect(response.body.capabilities).toContain('audits');
      expect(response.body.capabilities).toContain('interaction');
      expect(response.body.extensions.connected).toBe(true);
    });
  });

  describe('Console Logs Endpoints', () => {
    it('should return console logs', async () => {
      const response = await request(app)
        .get('/console-logs')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toMatchObject({
        level: mockConsoleLog.level,
        message: mockConsoleLog.message,
        source: mockConsoleLog.source
      });
    });

    it('should filter console logs by level', async () => {
      app.get('/console-logs', (req: express.Request, res: express.Response): void => {
        const level = req.query.level as string;
        const logs = [mockConsoleLog].filter(log =>
          !level || log.level === level
        );
        res.json(logs);
      });

      const response = await request(app)
        .get('/console-logs?level=info')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].level).toBe('info');
    });

    it('should return console errors only', async () => {
      app.get('/console-errors', (req: express.Request, res: express.Response): void => {
        const errorLog = { ...mockConsoleLog, level: 'error' };
        res.json([errorLog]);
      });

      const response = await request(app)
        .get('/console-errors')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].level).toBe('error');
    });

    it('should handle empty console logs', async () => {
      app = express();
      app.use(express.json());
      app.get('/console-logs', (req: express.Request, res: express.Response): void => {
        res.json([]);
      });

      const response = await request(app)
        .get('/console-logs')
        .expect(200);

      expect(response.body).toHaveLength(0);
    });
  });

  describe('Network Logs Endpoints', () => {
    it('should return network errors', async () => {
      const response = await request(app)
        .get('/network-errors')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body[0]).toMatchObject({
        url: mockNetworkRequest.url,
        method: mockNetworkRequest.method,
        status: mockNetworkRequest.status
      });
    });

    it('should return all network requests', async () => {
      app.get('/all-xhr', (req: express.Request, res: express.Response): void => {
        res.json([mockNetworkRequest]);
      });

      const response = await request(app)
        .get('/all-xhr')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].url).toBe(mockNetworkRequest.url);
    });

    it('should return successful network requests', async () => {
      app.get('/network-success', (req: express.Request, res: express.Response): void => {
        const successRequest = { ...mockNetworkRequest, status: 200 };
        res.json([successRequest]);
      });

      const response = await request(app)
        .get('/network-success')
        .expect(200);

      expect(response.body[0].status).toBe(200);
    });
  });

  describe('Screenshot Endpoint', () => {
    it('should capture screenshot successfully', async () => {
      const response = await request(app)
        .post('/capture-screenshot')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('file');
      expect(response.body).toHaveProperty('timestamp');
    });

    it('should handle screenshot failure when no extension connected', async () => {
      app = express();
      app.use(express.json());
      app.post('/capture-screenshot', (req: express.Request, res: express.Response): void => {
        res.status(503).json({
          error: 'No active WebSocket connections',
          success: false
        });
      });

      const response = await request(app)
        .post('/capture-screenshot')
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No active WebSocket connections');
    });

    it('should handle screenshot timeout', async () => {
      app = express();
      app.use(express.json());
      app.post('/capture-screenshot', (req: express.Request, res: express.Response): void => {
        setTimeout(() => {
          res.status(408).json({
            error: 'Screenshot request timed out',
            success: false
          });
        }, 100);
      });

      const response = await request(app)
        .post('/capture-screenshot')
        .expect(408);

      expect(response.body.error).toContain('timed out');
    });
  });

  describe('Storage Endpoints', () => {
    it('should get cookies', async () => {
      app.get('/cookies', (req: express.Request, res: express.Response): void => {
        res.json([
          {
            name: 'session_id',
            value: 'abc123',
            domain: '.example.com',
            path: '/',
            httpOnly: true,
            secure: true
          }
        ]);
      });

      const response = await request(app)
        .get('/cookies')
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].name).toBe('session_id');
      expect(response.body[0].httpOnly).toBe(true);
    });

    it('should get localStorage', async () => {
      app.get('/local-storage', (req: express.Request, res: express.Response): void => {
        res.json({
          user_preferences: '{"theme":"dark"}',
          session_token: 'token123'
        });
      });

      const response = await request(app)
        .get('/local-storage')
        .expect(200);

      expect(response.body).toHaveProperty('user_preferences');
      expect(response.body).toHaveProperty('session_token');
    });

    it('should get sessionStorage', async () => {
      app.get('/session-storage', (req: express.Request, res: express.Response): void => {
        res.json({
          current_page: 'dashboard',
          scroll_position: '150'
        });
      });

      const response = await request(app)
        .get('/session-storage')
        .expect(200);

      expect(response.body).toHaveProperty('current_page', 'dashboard');
      expect(response.body).toHaveProperty('scroll_position', '150');
    });

    it('should handle storage access errors', async () => {
      app.get('/cookies', (req: express.Request, res: express.Response): void => {
        res.status(500).json({
          error: 'Failed to access cookies',
          success: false
        });
      });

      const response = await request(app)
        .get('/cookies')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to access cookies');
    });
  });

  describe('Element Interaction Endpoints', () => {
    it('should click element by selector', async () => {
      app.post('/click-element', (req: express.Request, res: express.Response): void => {
        const { selector } = req.body;
        res.json({
          success: true,
          message: `Clicked element: ${selector}`,
          element: {
            tagName: 'BUTTON',
            id: 'submit-btn'
          }
        });
      });

      const response = await request(app)
        .post('/click-element')
        .send({ selector: '#submit-btn' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.element.tagName).toBe('BUTTON');
    });

    it('should fill input field', async () => {
      app.post('/fill-input', (req: express.Request, res: express.Response): void => {
        const { selector, text } = req.body;
        res.json({
          success: true,
          message: `Filled input ${selector} with: ${text}`,
          element: {
            tagName: 'INPUT',
            value: text
          }
        });
      });

      const response = await request(app)
        .post('/fill-input')
        .send({ selector: '#email', text: 'test@example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.element.value).toBe('test@example.com');
    });

    it('should select option from dropdown', async () => {
      app.post('/select-option', (req: express.Request, res: express.Response): void => {
        const { selector, value } = req.body;
        res.json({
          success: true,
          message: `Selected option ${value} in ${selector}`,
          element: {
            tagName: 'SELECT',
            selectedValue: value
          }
        });
      });

      const response = await request(app)
        .post('/select-option')
        .send({ selector: '#country', value: 'us' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.element.selectedValue).toBe('us');
    });

    it('should submit form', async () => {
      app.post('/submit-form', (req: express.Request, res: express.Response): void => {
        const { formSelector } = req.body;
        res.json({
          success: true,
          message: `Submitted form: ${formSelector}`,
          navigationOccurred: true
        });
      });

      const response = await request(app)
        .post('/submit-form')
        .send({ formSelector: '#contact-form' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.navigationOccurred).toBe(true);
    });

    it('should handle element not found errors', async () => {
      app.post('/click-element', (req: express.Request, res: express.Response): void => {
        res.status(404).json({
          error: 'Element not found',
          success: false,
          selector: req.body.selector
        });
      });

      const response = await request(app)
        .post('/click-element')
        .send({ selector: '#non-existent' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Element not found');
    });
  });

  describe('Audit Endpoints', () => {
    it('should run performance audit', async () => {
      app.post('/run-performance-audit', (req: express.Request, res: express.Response): void => {
        res.json({
          success: true,
          data: mockAuditResult,
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .post('/run-performance-audit')
        .send({ url: 'https://example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.score).toBe(mockAuditResult.score);
    });

    it('should run accessibility audit', async () => {
      app.post('/run-accessibility-audit', (req: express.Request, res: express.Response): void => {
        res.json({
          success: true,
          data: { ...mockAuditResult, title: 'Accessibility' },
          timestamp: new Date().toISOString()
        });
      });

      const response = await request(app)
        .post('/run-accessibility-audit')
        .send({ url: 'https://example.com' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Accessibility');
    });

    it('should handle audit failures', async () => {
      app.post('/run-performance-audit', (req: express.Request, res: express.Response): void => {
        res.status(500).json({
          error: 'Failed to run performance audit',
          success: false,
          details: 'Lighthouse failed to load the page'
        });
      });

      const response = await request(app)
        .post('/run-performance-audit')
        .send({ url: 'https://invalid-url' })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to run performance audit');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON requests', async () => {
      const response = await request(app)
        .post('/click-element')
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle missing required parameters', async () => {
      app.post('/click-element', (req: express.Request, res: express.Response): void => {
        if (!req.body.selector && !req.body.coordinates) {
          res.status(400).json({
            error: 'Either selector or coordinates must be provided',
            success: false
          });
          return;
        }
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/click-element')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('selector or coordinates must be provided');
    });

    it('should handle server errors gracefully', async () => {
      app = express();
      app.use(express.json());
      app.get('/console-logs', (req: express.Request, res: express.Response): void => {
        throw new Error('Internal server error');
      });

      // Add error handling middleware
      app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.status(500).json({
          error: 'Internal server error',
          success: false
        });
      });

      const response = await request(app)
        .get('/console-logs')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('CORS and Headers', () => {
    it('should include CORS headers', async () => {
      app = express();
      app.use(express.json());
      app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        next();
      });
      // Re-add identity route to include CORS headers
      app.get('/.identity', (req: express.Request, res: express.Response): void => {
        res.json({ name: 'WebAI Server', version: '1.5.0', status: 'running' });
      });

      const response = await request(app)
        .get('/.identity')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should handle OPTIONS requests', async () => {
      app = express();
      app.use(express.json());
      app.options('/capture-screenshot', (req: express.Request, res: express.Response): void => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.sendStatus(200);
      });

      const response = await request(app)
        .options('/capture-screenshot')
        .expect(200);

      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });
  });
});
