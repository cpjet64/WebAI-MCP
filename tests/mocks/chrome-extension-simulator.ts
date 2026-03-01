import WebSocket from 'ws';
import { EventEmitter } from 'events';

/**
 * Chrome Extension Simulator
 * Simulates a real Chrome extension for testing purposes
 */
export class ChromeExtensionSimulator extends EventEmitter {
  private ws: WebSocket | null = null;
  private serverUrl: string;
  private isConnected: boolean = false;
  private messageQueue: any[] = [];
  private requestHandlers: Map<string, Function> = new Map();

  constructor(serverUrl: string = 'ws://localhost:3025') {
    super();
    this.serverUrl = serverUrl;
    this.setupRequestHandlers();
  }

  /**
   * Connect to WebAI Server
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.serverUrl);

      this.ws.on('open', () => {
        this.isConnected = true;
        console.log('🔌 Chrome Extension Simulator connected to WebAI Server');
        this.emit('connected');
        
        // Send initial handshake
        this.send({
          type: 'extension-handshake',
          data: {
            extensionId: 'mock-extension-id',
            version: '1.5.0',
            capabilities: ['screenshots', 'dom-access', 'network-monitoring']
          }
        });

        resolve();
      });

      this.ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(data);
        } catch (error) {
          console.error('❌ Failed to parse message from server:', error);
        }
      });

      this.ws.on('close', () => {
        this.isConnected = false;
        console.log('🔌 Chrome Extension Simulator disconnected');
        this.emit('disconnected');
      });

      this.ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        this.emit('error', error);
        reject(error);
      });
    });
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Send message to server
   */
  send(message: any): void {
    if (!this.isConnected || !this.ws) {
      this.messageQueue.push(message);
      return;
    }

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Handle incoming messages from server
   */
  private handleMessage(data: any): void {
    console.log(`📨 Received request: ${data.type}`);
    this.emit('message', data);

    const handler = this.requestHandlers.get(data.type);
    if (handler) {
      handler(data);
    } else {
      console.warn(`⚠️ No handler for message type: ${data.type}`);
    }
  }

  /**
   * Setup request handlers for different message types
   */
  private setupRequestHandlers(): void {
    // Screenshot capture handler
    this.requestHandlers.set('capture-screenshot', (data: any) => {
      setTimeout(() => {
        this.send({
          type: 'screenshot-response',
          requestId: data.requestId,
          data: {
            success: true,
            imageData: this.generateMockScreenshot(),
            metadata: {
              timestamp: new Date().toISOString(),
              url: 'https://example.com',
              title: 'Example Page',
              viewport: { width: 1920, height: 1080 },
              devicePixelRatio: 1
            }
          }
        });
      }, 100); // Simulate processing time
    });

    // Element click handler
    this.requestHandlers.set('click-element', (data: any) => {
      setTimeout(() => {
        this.send({
          type: 'click-response',
          requestId: data.requestId,
          data: {
            success: true,
            element: {
              tagName: 'BUTTON',
              id: data.selector?.replace('#', ''),
              className: 'btn btn-primary',
              textContent: 'Submit'
            }
          }
        });
      }, 50);
    });

    // Form fill handler
    this.requestHandlers.set('fill-input', (data: any) => {
      setTimeout(() => {
        this.send({
          type: 'fill-response',
          requestId: data.requestId,
          data: {
            success: true,
            element: {
              tagName: 'INPUT',
              type: 'text',
              value: data.text,
              id: data.selector?.replace('#', '')
            }
          }
        });
      }, 30);
    });

    // Storage access handlers
    this.requestHandlers.set('get-cookies', (data: any) => {
      this.send({
        type: 'cookies-response',
        requestId: data.requestId,
        data: this.generateMockCookies()
      });
    });

    this.requestHandlers.set('get-local-storage', (data: any) => {
      this.send({
        type: 'local-storage-response',
        requestId: data.requestId,
        data: this.generateMockLocalStorage()
      });
    });
  }

  /**
   * Simulate real-time console logs
   */
  startConsoleLogStream(): void {
    const logLevels = ['info', 'warn', 'error', 'debug'];
    const messages = [
      'Application initialized',
      'User clicked button',
      'API request completed',
      'Form validation failed',
      'Page navigation started',
      'Resource loaded successfully'
    ];

    setInterval(() => {
      if (this.isConnected) {
        this.send({
          type: 'console-log',
          data: {
            level: logLevels[Math.floor(Math.random() * logLevels.length)],
            message: messages[Math.floor(Math.random() * messages.length)],
            timestamp: new Date().toISOString(),
            source: 'console-api',
            url: 'https://example.com',
            lineNumber: Math.floor(Math.random() * 1000) + 1,
            columnNumber: Math.floor(Math.random() * 100) + 1
          }
        });
      }
    }, 2000); // Send log every 2 seconds
  }

  /**
   * Simulate real-time network requests
   */
  startNetworkRequestStream(): void {
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const urls = [
      'https://api.example.com/users',
      'https://api.example.com/data',
      'https://cdn.example.com/assets/style.css',
      'https://analytics.example.com/track'
    ];
    const statuses = [200, 201, 404, 500];

    setInterval(() => {
      if (this.isConnected) {
        this.send({
          type: 'network-request',
          data: {
            url: urls[Math.floor(Math.random() * urls.length)],
            method: methods[Math.floor(Math.random() * methods.length)],
            status: statuses[Math.floor(Math.random() * statuses.length)],
            timestamp: new Date().toISOString(),
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
          }
        });
      }
    }, 3000); // Send network request every 3 seconds
  }

  /**
   * Generate mock screenshot data
   */
  private generateMockScreenshot(): string {
    // Generate a simple base64 encoded "image" (just text for testing)
    const mockImageData = Buffer.from('MOCK_SCREENSHOT_DATA').toString('base64');
    return `data:image/png;base64,${mockImageData}`;
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
   * Simulate page navigation
   */
  simulatePageNavigation(url: string): void {
    this.send({
      type: 'page-navigation',
      data: {
        url: url,
        title: `Page: ${url}`,
        timestamp: new Date().toISOString(),
        loadTime: Math.floor(Math.random() * 2000) + 500
      }
    });
  }

  /**
   * Simulate DOM changes
   */
  simulateDOMChanges(): void {
    this.send({
      type: 'dom-mutation',
      data: {
        type: 'childList',
        target: 'div#main-content',
        addedNodes: 1,
        removedNodes: 0,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Get connection status
   */
  getStatus(): any {
    return {
      connected: this.isConnected,
      serverUrl: this.serverUrl,
      queuedMessages: this.messageQueue.length,
      capabilities: ['screenshots', 'dom-access', 'network-monitoring']
    };
  }
}

/**
 * Factory function to create multiple extension simulators
 */
export function createExtensionSimulators(count: number, serverUrl?: string): ChromeExtensionSimulator[] {
  return Array.from({ length: count }, () => new ChromeExtensionSimulator(serverUrl));
}

/**
 * Helper function for testing scenarios
 */
export async function setupTestScenario(options: {
  extensionCount?: number;
  serverUrl?: string;
  enableStreaming?: boolean;
}): Promise<ChromeExtensionSimulator[]> {
  const { extensionCount = 1, serverUrl, enableStreaming = false } = options;
  
  const extensions = createExtensionSimulators(extensionCount, serverUrl);
  
  // Connect all extensions
  await Promise.all(extensions.map(ext => ext.connect()));
  
  // Enable streaming if requested
  if (enableStreaming) {
    extensions.forEach(ext => {
      ext.startConsoleLogStream();
      ext.startNetworkRequestStream();
    });
  }
  
  return extensions;
}
