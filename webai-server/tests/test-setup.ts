/**
 * Test setup configuration for WebAI Server tests
 * Configures DOM environment, global mocks, and test utilities
 */

import { JSDOM } from 'jsdom';

// Configure DOM environment for tests that need browser APIs
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'https://example.com',
  pretendToBeVisual: true,
  resources: 'usable'
});

// Make DOM APIs available globally in test environment
global.window = dom.window as any;
global.document = dom.window.document;
global.navigator = dom.window.navigator;
global.HTMLElement = dom.window.HTMLElement;

// Mock console methods to avoid noise in tests
const originalConsole = global.console;
global.console = {
  ...originalConsole,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn()
};

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset DOM to clean state
  document.body.innerHTML = '';
  
  // Reset any global state
  if (global.window) {
    global.window.location.href = 'https://example.com';
  }
});

// Cleanup after all tests
afterAll(() => {
  dom.window.close();
});

// Export test utilities
export const testUtils = {
  /**
   * Create a mock DOM element for testing
   */
  createElement: (tagName: string, attributes: Record<string, string> = {}) => {
    const element = document.createElement(tagName);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  },

  /**
   * Add element to DOM for testing
   */
  addToDOM: (element: HTMLElement, parent: HTMLElement = document.body) => {
    parent.appendChild(element);
    return element;
  },

  /**
   * Create and add element to DOM in one step
   */
  createAndAddElement: (tagName: string, attributes: Record<string, string> = {}) => {
    const element = testUtils.createElement(tagName, attributes);
    return testUtils.addToDOM(element);
  },

  /**
   * Mock window.location for testing
   */
  mockLocation: (url: string) => {
    Object.defineProperty(global.window, 'location', {
      value: new URL(url),
      writable: true
    });
  },

  /**
   * Wait for next tick (useful for async operations)
   */
  nextTick: () => new Promise(resolve => setImmediate(resolve))
};
