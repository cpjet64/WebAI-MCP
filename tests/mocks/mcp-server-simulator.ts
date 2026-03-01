import express from 'express';
import { Server } from 'http';

/**
 * MCP Server Simulator
 * Simulates the webai-mcp package for testing the full stack
 */
export class McpServerSimulator {
  private app: express.Application;
  private server: Server | null = null;
  private port: number;
  private isRunning: boolean = false;

  constructor(port: number = 3030) {
    this.port = port;
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    
    // CORS for cross-origin requests
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      next();
    });

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`🔧 MCP Server: ${req.method} ${req.path}`);
      next();
    });
  }

  /**
   * Setup API routes that simulate MCP tools
   */
  private setupRoutes(): void {
    // Server identity
    this.app.get('/.identity', (req, res) => {
      res.json({
        name: 'WebAI-MCP Server',
        version: '1.5.0',
        status: 'running',
        capabilities: [
          'screenshots',
          'console-logs',
          'network-logs',
          'audits',
          'element-interaction',
          'storage-access',
          'version-checking'
        ],
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      });
    });

    // Screenshot tool
    this.app.post('/tools/screenshot', (req, res) => {
      const { fullPage, format, quality, selector, clip } = req.body;
      
      setTimeout(() => {
        res.json({
          success: true,
          data: {
            file: `screenshot_${Date.now()}.${format || 'png'}`,
            timestamp: new Date().toISOString(),
            size: { width: 1920, height: 1080 },
            format: format || 'png',
            quality: quality || 90,
            fullPage: fullPage || false,
            selector: selector || null,
            clip: clip || null,
            fileSize: Math.floor(Math.random() * 1000000) + 100000 // Random file size
          }
        });
      }, 100); // Simulate processing time
    });

    // Console logs tool
    this.app.post('/tools/console-logs', (req, res) => {
      const { filters } = req.body;
      
      const mockLogs = this.generateMockConsoleLogs(filters);
      
      res.json({
        success: true,
        data: mockLogs,
        count: mockLogs.length,
        timestamp: new Date().toISOString()
      });
    });

    // Network logs tool
    this.app.post('/tools/network-logs', (req, res) => {
      const { filters } = req.body;
      
      const mockRequests = this.generateMockNetworkRequests(filters);
      
      res.json({
        success: true,
        data: mockRequests,
        count: mockRequests.length,
        timestamp: new Date().toISOString()
      });
    });

    // Performance audit tool
    this.app.post('/tools/performance-audit', (req, res) => {
      const { url, options } = req.body;
      
      setTimeout(() => {
        res.json({
          success: true,
          data: {
            url: url,
            score: 0.85,
            metrics: {
              'first-contentful-paint': { score: 0.9, value: 1200, displayValue: '1.2s' },
              'largest-contentful-paint': { score: 0.8, value: 2100, displayValue: '2.1s' },
              'cumulative-layout-shift': { score: 0.95, value: 0.05, displayValue: '0.05' },
              'total-blocking-time': { score: 0.7, value: 150, displayValue: '150ms' }
            },
            timestamp: new Date().toISOString(),
            duration: Math.floor(Math.random() * 5000) + 2000 // 2-7 seconds
          }
        });
      }, 2000); // Simulate audit time
    });

    // Element interaction tools
    this.app.post('/tools/click-element', (req, res) => {
      const { selector, coordinates } = req.body;
      
      setTimeout(() => {
        res.json({
          success: true,
          data: {
            element: {
              tagName: 'BUTTON',
              id: selector?.replace('#', '') || 'unknown',
              className: 'btn btn-primary',
              textContent: 'Submit'
            },
            coordinates: coordinates || null,
            timestamp: new Date().toISOString()
          }
        });
      }, 50);
    });

    this.app.post('/tools/fill-input', (req, res) => {
      const { selector, text } = req.body;
      
      setTimeout(() => {
        res.json({
          success: true,
          data: {
            element: {
              tagName: 'INPUT',
              type: 'text',
              value: text,
              id: selector?.replace('#', '') || 'unknown'
            },
            timestamp: new Date().toISOString()
          }
        });
      }, 30);
    });

    // Storage access tools
    this.app.post('/tools/get-cookies', (req, res) => {
      res.json({
        success: true,
        data: this.generateMockCookies(),
        timestamp: new Date().toISOString()
      });
    });

    this.app.post('/tools/get-local-storage', (req, res) => {
      res.json({
        success: true,
        data: this.generateMockLocalStorage(),
        timestamp: new Date().toISOString()
      });
    });

    // Version checking tool
    this.app.post('/tools/check-versions', (req, res) => {
      res.json({
        success: true,
        data: {
          mcpServer: { version: '1.5.0', status: 'compatible' },
          webaiServer: { version: '1.5.0', status: 'compatible' },
          chromeExtension: { version: '1.5.0', status: 'compatible' },
          compatibility: {
            status: 'compatible',
            issues: [],
            warnings: []
          },
          timestamp: new Date().toISOString()
        }
      });
    });

    // Error simulation endpoint
    this.app.post('/tools/simulate-error', (req, res) => {
      const { errorType } = req.body;
      
      switch (errorType) {
        case 'timeout':
          setTimeout(() => {
            res.status(408).json({
              success: false,
              error: 'Request timeout',
              code: 'TIMEOUT'
            });
          }, 10000);
          break;
        case 'server-error':
          res.status(500).json({
            success: false,
            error: 'Internal server error',
            code: 'INTERNAL_ERROR'
          });
          break;
        case 'not-found':
          res.status(404).json({
            success: false,
            error: 'Tool not found',
            code: 'NOT_FOUND'
          });
          break;
        default:
          res.status(400).json({
            success: false,
            error: 'Invalid error type',
            code: 'INVALID_REQUEST'
          });
      }
    });

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Start the MCP server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.port, () => {
        this.isRunning = true;
        console.log(`🚀 Mock MCP Server running on port ${this.port}`);
        resolve();
      });

      this.server.on('error', (error) => {
        console.error('❌ Failed to start MCP server:', error);
        reject(error);
      });
    });
  }

  /**
   * Stop the MCP server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.isRunning = false;
          console.log('🛑 Mock MCP Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Generate mock console logs
   */
  private generateMockConsoleLogs(filters?: any): any[] {
    const levels = ['info', 'warn', 'error', 'debug', 'log'];
    const messages = [
      'Application initialized successfully',
      'User authentication completed',
      'API request failed with status 404',
      'Form validation error: email required',
      'Page navigation to /dashboard',
      'WebSocket connection established'
    ];

    return Array.from({ length: 10 }, (_, i) => ({
      level: levels[Math.floor(Math.random() * levels.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      timestamp: new Date(Date.now() - i * 60000).toISOString(),
      source: 'console-api',
      url: 'https://example.com',
      lineNumber: Math.floor(Math.random() * 1000) + 1,
      columnNumber: Math.floor(Math.random() * 100) + 1
    }));
  }

  /**
   * Generate mock network requests
   */
  private generateMockNetworkRequests(filters?: any): any[] {
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const urls = [
      'https://api.example.com/users',
      'https://api.example.com/data',
      'https://cdn.example.com/assets/style.css',
      'https://analytics.example.com/track'
    ];
    const statuses = [200, 201, 404, 500];

    return Array.from({ length: 8 }, (_, i) => ({
      url: urls[Math.floor(Math.random() * urls.length)],
      method: methods[Math.floor(Math.random() * methods.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      timestamp: new Date(Date.now() - i * 30000).toISOString(),
      responseHeaders: {
        'content-type': 'application/json',
        'cache-control': 'max-age=3600'
      },
      requestHeaders: {
        'user-agent': 'Chrome/120.0.0.0',
        'accept': 'application/json'
      },
      duration: Math.floor(Math.random() * 1000) + 50,
      responseSize: Math.floor(Math.random() * 10000) + 100
    }));
  }

  /**
   * Generate mock cookies
   */
  private generateMockCookies(): any[] {
    return [
      {
        name: 'session_id',
        value: 'abc123def456',
        domain: '.example.com',
        path: '/',
        expires: new Date(Date.now() + 86400000).toISOString(),
        httpOnly: true,
        secure: true,
        sameSite: 'Strict'
      },
      {
        name: 'user_preferences',
        value: 'theme%3Ddark%26lang%3Den',
        domain: 'example.com',
        path: '/',
        expires: null,
        httpOnly: false,
        secure: true,
        sameSite: 'Lax'
      }
    ];
  }

  /**
   * Generate mock localStorage data
   */
  private generateMockLocalStorage(): any {
    return {
      user_id: 'user_12345',
      theme: 'dark',
      language: 'en',
      last_visit: new Date().toISOString(),
      cart_items: JSON.stringify([
        { id: 1, name: 'Product A', price: 29.99 },
        { id: 2, name: 'Product B', price: 19.99 }
      ])
    };
  }

  /**
   * Get server status
   */
  getStatus(): any {
    return {
      running: this.isRunning,
      port: this.port,
      uptime: process.uptime(),
      endpoints: [
        '/.identity',
        '/tools/screenshot',
        '/tools/console-logs',
        '/tools/network-logs',
        '/tools/performance-audit',
        '/tools/click-element',
        '/tools/fill-input',
        '/tools/get-cookies',
        '/tools/get-local-storage',
        '/tools/check-versions',
        '/health'
      ]
    };
  }
}
