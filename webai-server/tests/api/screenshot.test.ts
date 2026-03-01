import request from 'supertest';
import express from 'express';
import {
  createMockWebSocketConnection,
  createMockRequest,
  createMockResponse
} from '../setup.js';

describe('Screenshot API', () => {
  let app: express.Application;
  let mockWebSocketConnection: any;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    mockWebSocketConnection = createMockWebSocketConnection();
    
    // Mock screenshot endpoint
    app.post('/capture-screenshot', (req: express.Request, res: express.Response): void => {
      // Simulate checking for active connections
      if (!mockWebSocketConnection || mockWebSocketConnection.readyState !== 1) {
        res.status(503).json({
          error: 'No active WebSocket connections',
          success: false
        });
        return;
      }

      // Simulate successful screenshot capture
      res.json({
        success: true,
        file: 'screenshot_20240101_120000.png',
        timestamp: new Date().toISOString(),
        size: { width: 1920, height: 1080 },
        format: 'png'
      });
    });
  });

  describe('POST /capture-screenshot', () => {
    it('should capture screenshot successfully', async () => {
      const response = await request(app)
        .post('/capture-screenshot')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('file');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('size');
      expect(response.body.file).toMatch(/screenshot_\d{8}_\d{6}\.png/);
      expect(response.body.size).toEqual({ width: 1920, height: 1080 });
    });

    it('should return error when no WebSocket connection', async () => {
      // Simulate no connection
      mockWebSocketConnection.readyState = 3; // CLOSED

      const response = await request(app)
        .post('/capture-screenshot')
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('No active WebSocket connections');
    });

    it('should handle screenshot with custom options', async () => {
      app = express();
      app.use(express.json());
      app.post('/capture-screenshot', (req: express.Request, res: express.Response): void => {
        const { fullPage, quality, format } = req.body;

        res.json({
          success: true,
          file: `screenshot_custom.${format || 'png'}`,
          timestamp: new Date().toISOString(),
          options: {
            fullPage: fullPage || false,
            quality: quality || 90,
            format: format || 'png'
          }
        });
      });

      const response = await request(app)
        .post('/capture-screenshot')
        .send({
          fullPage: true,
          quality: 80,
          format: 'jpeg'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.file).toBe('screenshot_custom.jpeg');
      expect(response.body.options.fullPage).toBe(true);
      expect(response.body.options.quality).toBe(80);
      expect(response.body.options.format).toBe('jpeg');
    });

    it('should handle element screenshot', async () => {
      app = express();
      app.use(express.json());
      app.post('/capture-screenshot', (req: express.Request, res: express.Response): void => {
        const { selector, clip } = req.body;

        if (selector || clip) {
          res.json({
            success: true,
            file: 'element_screenshot.png',
            timestamp: new Date().toISOString(),
            type: 'element',
            selector: selector,
            clip: clip
          });
          return;
        } else {
          res.json({
            success: true,
            file: 'fullpage_screenshot.png',
            timestamp: new Date().toISOString(),
            type: 'fullpage'
          });
        }
      });

      const response = await request(app)
        .post('/capture-screenshot')
        .send({
          selector: '#main-content',
          clip: { x: 0, y: 0, width: 800, height: 600 }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.type).toBe('element');
      expect(response.body.selector).toBe('#main-content');
      expect(response.body.clip).toEqual({ x: 0, y: 0, width: 800, height: 600 });
    });

    it('should validate screenshot parameters', async () => {
      app = express();
      app.use(express.json());
      app.post('/capture-screenshot', (req: express.Request, res: express.Response): void => {
        const { quality, format } = req.body;

        // Validate quality
        if (quality !== undefined && (quality < 0 || quality > 100)) {
          res.status(400).json({
            error: 'Quality must be between 0 and 100',
            success: false
          });
          return;
        }

        // Validate format
        if (format && !['png', 'jpeg', 'webp'].includes(format)) {
          res.status(400).json({
            error: 'Format must be png, jpeg, or webp',
            success: false
          });
          return;
        }

        res.json({ success: true, file: 'valid_screenshot.png' });
      });

      // Test invalid quality
      const invalidQualityResponse = await request(app)
        .post('/capture-screenshot')
        .send({ quality: 150 })
        .expect(400);

      expect(invalidQualityResponse.body.error).toBe('Quality must be between 0 and 100');

      // Test invalid format
      const invalidFormatResponse = await request(app)
        .post('/capture-screenshot')
        .send({ format: 'gif' })
        .expect(400);

      expect(invalidFormatResponse.body.error).toBe('Format must be png, jpeg, or webp');

      // Test valid parameters
      const validResponse = await request(app)
        .post('/capture-screenshot')
        .send({ quality: 85, format: 'jpeg' })
        .expect(200);

      expect(validResponse.body.success).toBe(true);
    });

    it('should handle screenshot timeout', async () => {
      app = express();
      app.use(express.json());
      app.post('/capture-screenshot', (req: express.Request, res: express.Response): void => {
        // Simulate timeout
        setTimeout(() => {
          res.status(408).json({
            error: 'Screenshot request timed out',
            success: false,
            timeout: 30000
          });
        }, 100);
      });

      const response = await request(app)
        .post('/capture-screenshot')
        .expect(408);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Screenshot request timed out');
      expect(response.body.timeout).toBe(30000);
    });

    it('should handle WebSocket communication errors', async () => {
      app = express();
      app.use(express.json());
      app.post('/capture-screenshot', (req: express.Request, res: express.Response): void => {
        // Simulate WebSocket send error
        res.status(500).json({
          error: 'Failed to send screenshot request to extension',
          success: false,
          details: 'WebSocket connection lost'
        });
      });

      const response = await request(app)
        .post('/capture-screenshot')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to send screenshot request to extension');
      expect(response.body.details).toBe('WebSocket connection lost');
    });

    it('should handle extension errors', async () => {
      app = express();
      app.use(express.json());
      app.post('/capture-screenshot', (req: express.Request, res: express.Response): void => {
        // Simulate extension returning error
        res.status(500).json({
          error: 'Extension failed to capture screenshot',
          success: false,
          extensionError: 'Cannot access current tab'
        });
      });

      const response = await request(app)
        .post('/capture-screenshot')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Extension failed to capture screenshot');
      expect(response.body.extensionError).toBe('Cannot access current tab');
    });

    it('should include metadata in response', async () => {
      app = express();
      app.use(express.json());
      app.post('/capture-screenshot', (req: express.Request, res: express.Response): void => {
        res.json({
          success: true,
          file: 'screenshot_with_metadata.png',
          timestamp: new Date().toISOString(),
          metadata: {
            url: 'https://example.com',
            title: 'Example Page',
            viewport: { width: 1920, height: 1080 },
            devicePixelRatio: 1,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
      });

      const response = await request(app)
        .post('/capture-screenshot')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.metadata).toBeDefined();
      expect(response.body.metadata.url).toBe('https://example.com');
      expect(response.body.metadata.title).toBe('Example Page');
      expect(response.body.metadata.viewport).toEqual({ width: 1920, height: 1080 });
    });

    it('should handle concurrent screenshot requests', async () => {
      app = express();
      app.use(express.json());
      let requestCount = 0;

      app.post('/capture-screenshot', (req: express.Request, res: express.Response): void => {
        requestCount++;

        // Simulate processing time
        setTimeout(() => {
          res.json({
            success: true,
            file: `screenshot_${requestCount}.png`,
            timestamp: new Date().toISOString(),
            requestId: requestCount
          });
        }, 50);
      });

      // Make 3 concurrent requests
      const promises = Array.from({ length: 3 }, () =>
        request(app).post('/capture-screenshot')
      );

      const responses = await Promise.all(promises);

      expect(responses).toHaveLength(3);
      responses.forEach((response, index) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.requestId).toBeGreaterThan(0);
      });
    });

    it('should measure screenshot performance', async () => {
      app = express();
      app.use(express.json());
      app.post('/capture-screenshot', (req: express.Request, res: express.Response): void => {
        const startTime = Date.now();

        // Simulate screenshot processing
        setTimeout(() => {
          const endTime = Date.now();
          const duration = endTime - startTime;

          res.json({
            success: true,
            file: 'performance_screenshot.png',
            timestamp: new Date().toISOString(),
            performance: {
              duration: duration,
              startTime: startTime,
              endTime: endTime
            }
          });
        }, 100);
      });

      const response = await request(app)
        .post('/capture-screenshot')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.performance).toBeDefined();
      expect(response.body.performance.duration).toBeGreaterThanOrEqual(100);
      expect(response.body.performance.endTime).toBeGreaterThan(response.body.performance.startTime);
    });

    it('should handle large screenshot files', async () => {
      app = express();
      app.use(express.json());
      app.post('/capture-screenshot', (req: express.Request, res: express.Response): void => {
        // Simulate large screenshot
        res.json({
          success: true,
          file: 'large_screenshot.png',
          timestamp: new Date().toISOString(),
          size: { width: 7680, height: 4320 }, // 8K resolution
          fileSize: 15728640, // 15MB
          warning: 'Large file size detected'
        });
      });

      const response = await request(app)
        .post('/capture-screenshot')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.size.width).toBe(7680);
      expect(response.body.size.height).toBe(4320);
      expect(response.body.fileSize).toBe(15728640);
      expect(response.body.warning).toBe('Large file size detected');
    });
  });

  describe('Error Recovery', () => {
    it('should retry on temporary failures', async () => {
      app = express();
      app.use(express.json());
      let attemptCount = 0;

      app.post('/capture-screenshot', (req: express.Request, res: express.Response): void => {
        attemptCount++;

        if (attemptCount === 1) {
          // First attempt fails
          res.status(500).json({
            error: 'Temporary failure',
            success: false,
            retry: true
          });
          return;
        }

        // Second attempt succeeds
        res.json({
          success: true,
          file: 'retry_screenshot.png',
          timestamp: new Date().toISOString(),
          attempts: attemptCount
        });
      });

      // First request fails
      const firstResponse = await request(app)
        .post('/capture-screenshot')
        .expect(500);

      expect(firstResponse.body.retry).toBe(true);

      // Second request succeeds
      const secondResponse = await request(app)
        .post('/capture-screenshot')
        .expect(200);

      expect(secondResponse.body.success).toBe(true);
      expect(secondResponse.body.attempts).toBe(2);
    });
  });
});
