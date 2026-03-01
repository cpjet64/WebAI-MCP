import nock from 'nock';
import './jest.d.ts';
import testFetch from './test-fetch';

// Mock fetch globally with an HTTP(S)-based shim so nock can intercept.
// Do NOT override global Headers/Request/Response to keep compatibility with
// libraries (nock/msw interceptors) that rely on WHATWG Fetch classes.
global.fetch = jest.fn((input: any, init?: any) => (testFetch as any)(input, init)) as any;

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

// Mock file system operations
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  readdirSync: jest.fn(),
}));

// Mock path operations
jest.mock('path', () => ({
  join: jest.fn((...args) => args.join('/')),
  resolve: jest.fn((...args) => args.join('/')),
  dirname: jest.fn((path) => path.split('/').slice(0, -1).join('/')),
  basename: jest.fn((path) => path.split('/').pop()),
  extname: jest.fn((path) => {
    const parts = path.split('.');
    return parts.length > 1 ? '.' + parts.pop() : '';
  }),
}));

// Mock os module
jest.mock('os', () => ({
  homedir: jest.fn(() => '/mock/home'),
  tmpdir: jest.fn(() => '/mock/tmp'),
  platform: jest.fn(() => 'linux'),
  arch: jest.fn(() => 'x64'),
}));

// Setup and teardown for each test
beforeEach(() => {
  // Clear all mocks
  jest.clearAllMocks();
  
  // Reset nock
  nock.cleanAll();
  
  // Reset fetch mock
  (global.fetch as jest.Mock).mockClear();
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

// Helper function to create mock API responses
export const createMockApiResponse = (data: any, success = true, error?: string) => ({
  success,
  data,
  error,
  timestamp: new Date().toISOString(),
});

// Helper function to mock webai-server responses
export const mockWebAIServerResponse = (endpoint: string, response: any, status = 200) => {
  return nock('http://127.0.0.1:3025')
    .persist()
    .intercept(endpoint, 'GET')
    .reply(status, response)
    .intercept(endpoint, 'POST')
    .reply(status, response);
};

// Helper function to mock server discovery
export const mockServerDiscovery = (host = '127.0.0.1', port = 3025) => {
  return nock(`http://${host}:${port}`)
    .persist()
    .get('/.identity')
    .reply(200, { 
      name: 'WebAI Server',
      version: '1.5.0',
      status: 'running'
    });
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

export const mockScreenshotResponse = {
  success: true,
  file: 'screenshot_20240101_000000.png',
  timestamp: '2024-01-01T00:00:00.000Z'
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
