import nock from 'nock';

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock WebSocket
const mockWebSocket = {
  send: jest.fn(),
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  readyState: 1, // OPEN
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
};

global.WebSocket = jest.fn(() => mockWebSocket) as any;

// Mock Puppeteer
jest.mock('puppeteer-core', () => ({
  launch: jest.fn(() => Promise.resolve({
    newPage: jest.fn(() => Promise.resolve({
      goto: jest.fn(),
      screenshot: jest.fn(() => Promise.resolve(Buffer.from('mock-screenshot'))),
      evaluate: jest.fn(),
      close: jest.fn(),
      setViewport: jest.fn(),
      setUserAgent: jest.fn(),
      setCookie: jest.fn(),
      setExtraHTTPHeaders: jest.fn(),
      emulate: jest.fn(),
      emulateNetworkConditions: jest.fn(),
      waitForSelector: jest.fn(),
      waitForTimeout: jest.fn(),
    })),
    close: jest.fn(),
    wsEndpoint: jest.fn(() => 'ws://localhost:9222/devtools/browser'),
  })),
  connect: jest.fn(),
}));

// Mock Lighthouse
jest.mock('lighthouse', () => ({
  default: jest.fn(() => Promise.resolve({
    lhr: {
      categories: {
        performance: { score: 0.85 },
        accessibility: { score: 0.92 },
        'best-practices': { score: 0.88 },
        seo: { score: 0.95 },
      },
      audits: {
        'first-contentful-paint': { score: 0.9, displayValue: '1.2s' },
        'largest-contentful-paint': { score: 0.8, displayValue: '2.1s' },
      }
    }
  })),
}));

// Mock Chrome Launcher
jest.mock('chrome-launcher', () => ({
  launch: jest.fn(() => Promise.resolve({
    port: 9222,
    kill: jest.fn(),
  })),
}));

// Mock file system operations
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  readdirSync: jest.fn(),
  createWriteStream: jest.fn(() => ({
    write: jest.fn(),
    end: jest.fn(),
    on: jest.fn(),
  })),
}));

// Setup and teardown for each test
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset nock
  nock.cleanAll();
  
  // Reset fetch mock
  (global.fetch as jest.Mock).mockClear();
  
  // Reset WebSocket mock
  mockWebSocket.send.mockClear();
  mockWebSocket.close.mockClear();
  mockWebSocket.addEventListener.mockClear();
  mockWebSocket.removeEventListener.mockClear();
});

afterEach(() => {
  // Clean up nock after each test
  nock.cleanAll();
});

afterAll(() => {
  // Restore original console
  global.console = originalConsole;
  
  // Clean up nock
  nock.restore();
});

// Helper function to create mock WebSocket connection
export const createMockWebSocketConnection = () => {
  const connection = {
    ...mockWebSocket,
    readyState: 1, // OPEN
  };
  return connection;
};

// Helper function to create mock Express request
export const createMockRequest = (body: any = {}, params: any = {}, query: any = {}) => ({
  body,
  params,
  query,
  headers: {},
  method: 'GET',
  url: '/',
});

// Helper function to create mock Express response
export const createMockResponse = () => {
  const res: any = {
    status: jest.fn(() => res),
    json: jest.fn(() => res),
    send: jest.fn(() => res),
    end: jest.fn(() => res),
    setHeader: jest.fn(() => res),
  };
  return res;
};

// Common test data
export const mockConsoleLog = {
  level: 'info',
  message: 'Test console message',
  timestamp: '2024-01-01T00:00:00.000Z',
  source: 'console-api',
  url: 'https://example.com'
};

export const mockNetworkRequest = {
  url: 'https://api.example.com/data',
  method: 'GET',
  status: 200,
  timestamp: '2024-01-01T00:00:00.000Z',
  responseHeaders: { 'content-type': 'application/json' },
  requestHeaders: { 'user-agent': 'Chrome/120.0.0.0' }
};

export const mockAuditResult = {
  score: 0.85,
  title: 'Performance Audit',
  description: 'Overall performance score',
  details: {
    'first-contentful-paint': { score: 0.9, displayValue: '1.2s' },
    'largest-contentful-paint': { score: 0.8, displayValue: '2.1s' }
  }
};
