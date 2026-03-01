import { ErrorHandler, type ErrorContext } from '../../error-handler';

describe('ErrorHandler', () => {
  let originalConsole: typeof console;
  
  beforeEach(() => {
    originalConsole = global.console;
    global.console = {
      ...originalConsole,
      error: jest.fn(),
      warn: jest.fn(),
      log: jest.fn(),
    };
  });

  afterEach(() => {
    global.console = originalConsole;
  });

  describe('handleError', () => {
    it('should handle Error objects correctly', () => {
      const error = new Error('Test error message');
      const context: ErrorContext = {
        operation: 'test-operation',
        tool: 'test-tool',
        details: { param: 'value' }
      };

      const result = ErrorHandler.handleError(error, context);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error in test-operation: Test error message'
          }
        ],
        isError: true
      });

      expect(console.error).toHaveBeenCalledWith(
        'Error in test-operation (test-tool):',
        'Test error message',
        { param: 'value' }
      );
    });

    it('should handle string errors correctly', () => {
      const error = 'String error message';
      const context: ErrorContext = {
        operation: 'string-test',
        tool: 'string-tool'
      };

      const result = ErrorHandler.handleError(error, context);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error in string-test: String error message'
          }
        ],
        isError: true
      });

      expect(console.error).toHaveBeenCalledWith(
        'Error in string-test (string-tool):',
        'String error message',
        undefined
      );
    });

    it('should handle unknown error types', () => {
      const error = { unknown: 'object' };
      const context: ErrorContext = {
        operation: 'unknown-test',
        tool: 'unknown-tool'
      };

      const result = ErrorHandler.handleError(error, context);

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Error in unknown-test: [object Object]'
          }
        ],
        isError: true
      });

      expect(console.error).toHaveBeenCalledWith(
        'Error in unknown-test (unknown-tool):',
        '[object Object]',
        undefined
      );
    });

    it('should handle null and undefined errors', () => {
      const nullContext: ErrorContext = {
        operation: 'null-test',
        tool: 'null-tool'
      };

      const nullResult = ErrorHandler.handleError(null, nullContext);
      expect(nullResult.content[0].text).toBe('Error in null-test: null');

      const undefinedResult = ErrorHandler.handleError(undefined, nullContext);
      expect(undefinedResult.content[0].text).toBe('Error in null-test: undefined');
    });

    it('should handle context without tool', () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        operation: 'no-tool-test'
      };

      const result = ErrorHandler.handleError(error, context);

      expect(result.content[0].text).toBe('Error in no-tool-test: Test error');
      expect(console.error).toHaveBeenCalledWith(
        'Error in no-tool-test (undefined):',
        'Test error',
        undefined
      );
    });

    it('should handle context without details', () => {
      const error = new Error('Test error');
      const context: ErrorContext = {
        operation: 'no-details-test',
        tool: 'no-details-tool'
      };

      const result = ErrorHandler.handleError(error, context);

      expect(result.content[0].text).toBe('Error in no-details-test: Test error');
      expect(console.error).toHaveBeenCalledWith(
        'Error in no-details-test (no-details-tool):',
        'Test error',
        undefined
      );
    });
  });

  describe('formatError', () => {
    it('should format Error objects correctly', () => {
      const error = new Error('Formatted error message');
      const result = ErrorHandler.formatError(error);
      
      expect(result).toBe('Formatted error message');
    });

    it('should format string errors correctly', () => {
      const error = 'String error';
      const result = ErrorHandler.formatError(error);
      
      expect(result).toBe('String error');
    });

    it('should format unknown types correctly', () => {
      const error = { message: 'Object error' };
      const result = ErrorHandler.formatError(error);
      
      expect(result).toBe('[object Object]');
    });

    it('should handle null and undefined', () => {
      expect(ErrorHandler.formatError(null)).toBe('null');
      expect(ErrorHandler.formatError(undefined)).toBe('undefined');
    });

    it('should handle numbers and booleans', () => {
      expect(ErrorHandler.formatError(42)).toBe('42');
      expect(ErrorHandler.formatError(true)).toBe('true');
      expect(ErrorHandler.formatError(false)).toBe('false');
    });
  });

  describe('createErrorResponse', () => {
    it('should create error response with message', () => {
      const result = ErrorHandler.createErrorResponse('Test error message');

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Test error message'
          }
        ],
        isError: true
      });
    });

    it('should create error response with empty message', () => {
      const result = ErrorHandler.createErrorResponse('');

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: ''
          }
        ],
        isError: true
      });
    });
  });

  describe('Network Error Handling', () => {
    it('should handle fetch errors correctly', () => {
      const fetchError = new Error('fetch failed');
      fetchError.name = 'TypeError';
      
      const context: ErrorContext = {
        operation: 'fetch-data',
        tool: 'network-tool',
        details: { url: 'https://example.com' }
      };

      const result = ErrorHandler.handleError(fetchError, context);

      expect(result.content[0].text).toBe('Error in fetch-data: fetch failed');
      expect(console.error).toHaveBeenCalledWith(
        'Error in fetch-data (network-tool):',
        'fetch failed',
        { url: 'https://example.com' }
      );
    });

    it('should handle timeout errors correctly', () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      
      const context: ErrorContext = {
        operation: 'api-request',
        tool: 'timeout-tool'
      };

      const result = ErrorHandler.handleError(timeoutError, context);

      expect(result.content[0].text).toBe('Error in api-request: Request timeout');
    });

    it('should handle abort errors correctly', () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      
      const context: ErrorContext = {
        operation: 'aborted-request',
        tool: 'abort-tool'
      };

      const result = ErrorHandler.handleError(abortError, context);

      expect(result.content[0].text).toBe('Error in aborted-request: The operation was aborted');
    });
  });

  describe('Validation Error Handling', () => {
    it('should handle validation errors with details', () => {
      const validationError = new Error('Validation failed');
      const context: ErrorContext = {
        operation: 'validate-input',
        tool: 'validation-tool',
        details: {
          field: 'email',
          value: 'invalid-email',
          rule: 'email-format'
        }
      };

      const result = ErrorHandler.handleError(validationError, context);

      expect(result.content[0].text).toBe('Error in validate-input: Validation failed');
      expect(console.error).toHaveBeenCalledWith(
        'Error in validate-input (validation-tool):',
        'Validation failed',
        {
          field: 'email',
          value: 'invalid-email',
          rule: 'email-format'
        }
      );
    });
  });

  describe('Complex Error Scenarios', () => {
    it('should handle nested errors correctly', () => {
      const innerError = new Error('Inner error');
      const outerError = new Error('Outer error');
      (outerError as any).cause = innerError;
      
      const context: ErrorContext = {
        operation: 'nested-operation',
        tool: 'nested-tool'
      };

      const result = ErrorHandler.handleError(outerError, context);

      expect(result.content[0].text).toBe('Error in nested-operation: Outer error');
    });

    it('should handle errors with stack traces', () => {
      const error = new Error('Stack trace error');
      error.stack = 'Error: Stack trace error\n    at test.js:1:1';
      
      const context: ErrorContext = {
        operation: 'stack-test',
        tool: 'stack-tool'
      };

      const result = ErrorHandler.handleError(error, context);

      expect(result.content[0].text).toBe('Error in stack-test: Stack trace error');
      // Stack trace should be logged but not included in response
    });

    it('should handle very long error messages', () => {
      const longMessage = 'A'.repeat(1000);
      const error = new Error(longMessage);
      
      const context: ErrorContext = {
        operation: 'long-error',
        tool: 'long-tool'
      };

      const result = ErrorHandler.handleError(error, context);

      expect(result.content[0].text).toBe(`Error in long-error: ${longMessage}`);
    });

    it('should handle errors with special characters', () => {
      const specialError = new Error('Error with special chars: 🚨 "quotes" & <tags>');
      
      const context: ErrorContext = {
        operation: 'special-chars',
        tool: 'special-tool'
      };

      const result = ErrorHandler.handleError(specialError, context);

      expect(result.content[0].text).toBe('Error in special-chars: Error with special chars: 🚨 "quotes" & <tags>');
    });
  });

  describe('Performance', () => {
    it('should handle errors efficiently', () => {
      const startTime = Date.now();
      
      for (let i = 0; i < 100; i++) {
        const error = new Error(`Error ${i}`);
        const context: ErrorContext = {
          operation: `operation-${i}`,
          tool: `tool-${i}`
        };
        
        ErrorHandler.handleError(error, context);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should handle 100 errors in less than 100ms
      expect(duration).toBeLessThan(100);
    });
  });
});
