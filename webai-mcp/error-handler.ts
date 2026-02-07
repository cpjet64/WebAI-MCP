/**
 * Enhanced Error Handler for WebAI MCP
 *
 * Provides intelligent error analysis, user-friendly messages,
 * and actionable troubleshooting suggestions.
 */

export interface ErrorContext {
  operation: string;
  host?: string;
  port?: number;
  endpoint?: string;
  httpStatus?: number;
  originalError?: Error;
  platform?: string;
}

export interface ErrorSolution {
  title: string;
  description: string;
  commands?: string[];
  links?: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface EnhancedError {
  type: 'connection' | 'server' | 'client' | 'configuration' | 'platform' | 'unknown';
  message: string;
  userMessage: string;
  solutions: ErrorSolution[];
  context: ErrorContext;
  isRetryable: boolean;
}

export class ErrorHandler {
  private static readonly ERROR_PATTERNS = {
    // Connection errors
    ECONNREFUSED: /ECONNREFUSED|Connection refused|connect ECONNREFUSED/i,
    ENOTFOUND: /ENOTFOUND|getaddrinfo ENOTFOUND/i,
    TIMEOUT: /timeout|ETIMEDOUT/i,
    NETWORK_ERROR: /network error|fetch failed/i,

    // Server errors
    SERVER_NOT_FOUND: /Failed to discover|No server found|server not found/i,
    WRONG_SIGNATURE: /wrong signature|not the (Browser Tools|WebAI) server/i,
    SERVER_ERROR: /Server returned [45]\d\d/i,

    // Platform errors
    SPAWN_ENOENT: /spawn.*ENOENT/i,
    PERMISSION_DENIED: /EACCES|permission denied/i,
    PATH_NOT_FOUND: /cannot find|not found.*path/i,

    // Chrome/Browser errors
    CHROME_NOT_FOUND: /Chrome.*not found|No Chrome installations/i,
    EXTENSION_ERROR: /extension.*error|manifest.*invalid/i,
    DEBUGGER_ERROR: /debugger.*failed|attach.*failed/i,

    // Build errors
    BUILD_FAILED: /build failed|compilation error/i,
    MISSING_DEPS: /Cannot find module|MODULE_NOT_FOUND/i,
  };

  static analyzeError(error: Error | string, context: ErrorContext): EnhancedError {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const errorType = this.categorizeError(errorMessage);

    return {
      type: errorType,
      message: errorMessage,
      userMessage: this.generateUserMessage(errorType, errorMessage, context),
      solutions: this.generateSolutions(errorType, errorMessage, context),
      context,
      isRetryable: this.isRetryable(errorType, errorMessage)
    };
  }

  private static categorizeError(errorMessage: string): EnhancedError['type'] {
    if (this.ERROR_PATTERNS.ECONNREFUSED.test(errorMessage) ||
        this.ERROR_PATTERNS.ENOTFOUND.test(errorMessage) ||
        this.ERROR_PATTERNS.TIMEOUT.test(errorMessage) ||
        this.ERROR_PATTERNS.NETWORK_ERROR.test(errorMessage)) {
      return 'connection';
    }

    if (this.ERROR_PATTERNS.SERVER_NOT_FOUND.test(errorMessage) ||
        this.ERROR_PATTERNS.WRONG_SIGNATURE.test(errorMessage) ||
        this.ERROR_PATTERNS.SERVER_ERROR.test(errorMessage)) {
      return 'server';
    }

    if (this.ERROR_PATTERNS.SPAWN_ENOENT.test(errorMessage) ||
        this.ERROR_PATTERNS.PERMISSION_DENIED.test(errorMessage) ||
        this.ERROR_PATTERNS.PATH_NOT_FOUND.test(errorMessage)) {
      return 'platform';
    }

    if (this.ERROR_PATTERNS.CHROME_NOT_FOUND.test(errorMessage) ||
        this.ERROR_PATTERNS.EXTENSION_ERROR.test(errorMessage) ||
        this.ERROR_PATTERNS.DEBUGGER_ERROR.test(errorMessage)) {
      return 'client';
    }

    if (this.ERROR_PATTERNS.BUILD_FAILED.test(errorMessage) ||
        this.ERROR_PATTERNS.MISSING_DEPS.test(errorMessage)) {
      return 'configuration';
    }

    return 'unknown';
  }

  private static generateUserMessage(
    type: EnhancedError['type'],
    errorMessage: string,
    context: ErrorContext
  ): string {
    switch (type) {
      case 'connection':
        if (this.ERROR_PATTERNS.ECONNREFUSED.test(errorMessage)) {
          return `Cannot connect to WebAI Server at ${context.host}:${context.port}. The server appears to be offline or not running.`;
        }
        if (this.ERROR_PATTERNS.TIMEOUT.test(errorMessage)) {
          return `Connection to WebAI Server timed out. The server may be overloaded or unreachable.`;
        }
        return `Network connection failed while trying to reach the WebAI Server.`;

      case 'server':
        if (this.ERROR_PATTERNS.SERVER_NOT_FOUND.test(errorMessage)) {
          return `WebAI Server not found. Please start the server before using MCP tools.`;
        }
        if (this.ERROR_PATTERNS.WRONG_SIGNATURE.test(errorMessage)) {
          return `Found a server at ${context.host}:${context.port}, but it's not the WebAI Server. Another application may be using this port.`;
        }
        return `WebAI Server encountered an error while processing your request.`;

      case 'platform':
        if (this.ERROR_PATTERNS.SPAWN_ENOENT.test(errorMessage)) {
          return `Cannot find required executable. This usually means Node.js, NPM, or NPX is not properly installed or not in your system PATH.`;
        }
        if (this.ERROR_PATTERNS.PERMISSION_DENIED.test(errorMessage)) {
          return `Permission denied. You may need to run with elevated privileges or check file permissions.`;
        }
        return `Platform-specific error detected. This may be related to your operating system configuration.`;

      case 'client':
        if (this.ERROR_PATTERNS.CHROME_NOT_FOUND.test(errorMessage)) {
          return `Chrome browser not found. WebAI requires Chrome or a Chromium-based browser to be installed.`;
        }
        if (this.ERROR_PATTERNS.EXTENSION_ERROR.test(errorMessage)) {
          return `Chrome extension error. The WebAI Chrome extension may not be properly installed or configured.`;
        }
        return `Browser-related error. Please check your Chrome installation and extension setup.`;

      case 'configuration':
        if (this.ERROR_PATTERNS.BUILD_FAILED.test(errorMessage)) {
          return `Build process failed. The WebAI packages may not be properly built.`;
        }
        if (this.ERROR_PATTERNS.MISSING_DEPS.test(errorMessage)) {
          return `Missing dependencies. Some required packages are not installed.`;
        }
        return `Configuration error. Please check your WebAI setup.`;

      default:
        return `An unexpected error occurred: ${errorMessage}`;
    }
  }

  private static generateSolutions(
    type: EnhancedError['type'],
    errorMessage: string,
    context: ErrorContext
  ): ErrorSolution[] {
    const solutions: ErrorSolution[] = [];

    switch (type) {
      case 'connection':
        solutions.push({
          title: 'Start WebAI Server',
          description: 'The most common cause is that the server is not running.',
          commands: ['npx @cpjet64/webai-server'],
          priority: 'high'
        });

        if (context.port && context.port !== 3025) {
          solutions.push({
            title: 'Check Port Configuration',
            description: `Server is expected on port ${context.port}. Verify the server is running on the correct port.`,
            commands: [`netstat -an | grep ${context.port}`, `lsof -i :${context.port}`],
            priority: 'medium'
          });
        }

        solutions.push({
          title: 'Run Diagnostics',
          description: 'Use the diagnostic tool to identify connection issues.',
          commands: ['node scripts/diagnose.js'],
          priority: 'medium'
        });
        break;

      case 'server':
        solutions.push({
          title: 'Restart WebAI Server',
          description: 'Stop any running instances and start fresh.',
          commands: [
            'pkill -f webai-server',
            'npx @cpjet64/webai-server'
          ],
          priority: 'high'
        });

        solutions.push({
          title: 'Check for Port Conflicts',
          description: 'Another application might be using the default port.',
          commands: ['netstat -tulpn | grep 3025'],
          priority: 'medium'
        });
        break;

      case 'platform':
        if (this.ERROR_PATTERNS.SPAWN_ENOENT.test(errorMessage)) {
          solutions.push({
            title: 'Verify Node.js Installation',
            description: 'Ensure Node.js and NPM are properly installed and in PATH.',
            commands: ['node --version', 'npm --version', 'which node', 'which npm'],
            priority: 'high'
          });

          solutions.push({
            title: 'Reinstall Node.js',
            description: 'Download and reinstall Node.js from the official website.',
            links: ['https://nodejs.org/'],
            priority: 'medium'
          });
        }

        if (this.ERROR_PATTERNS.PERMISSION_DENIED.test(errorMessage)) {
          solutions.push({
            title: 'Fix Permissions',
            description: 'Resolve permission issues with npm and node directories.',
            commands: [
              'sudo chown -R $(whoami) ~/.npm',
              'sudo chown -R $(whoami) /usr/local/lib/node_modules'
            ],
            priority: 'high'
          });
        }
        break;

      case 'client':
        if (this.ERROR_PATTERNS.CHROME_NOT_FOUND.test(errorMessage)) {
          solutions.push({
            title: 'Install Chrome',
            description: 'Download and install Google Chrome or a Chromium-based browser.',
            links: ['https://www.google.com/chrome/'],
            priority: 'high'
          });
        }

        solutions.push({
          title: 'Install Chrome Extension',
          description: 'Load the WebAI extension in Chrome Developer mode.',
          commands: [
            'Open Chrome → chrome://extensions/',
            'Enable "Developer mode"',
            'Click "Load unpacked" → Select chrome-extension folder'
          ],
          priority: 'high'
        });
        break;

      case 'configuration':
        solutions.push({
          title: 'Rebuild Packages',
          description: 'Clean and rebuild all WebAI-MCP packages.',
          commands: [
            'cd webai-mcp && npm install && npm run build',
            'cd webai-server && npm install && npm run build'
          ],
          priority: 'high'
        });

        solutions.push({
          title: 'Run Setup Script',
          description: 'Use the automated setup tool to fix configuration issues.',
          commands: ['node scripts/setup.js --verbose'],
          priority: 'medium'
        });
        break;

      default:
        solutions.push({
          title: 'Run Full Diagnostics',
          description: 'Use the diagnostic tool to identify the root cause.',
          commands: ['node scripts/diagnose.js'],
          priority: 'high'
        });
    }

    // Always add general troubleshooting
    solutions.push({
      title: 'Get Help',
      description: 'If the issue persists, check the documentation or report the issue.',
      links: [
        'https://github.com/cpjet64/WebAI-MCP/issues',
        'https://github.com/cpjet64/WebAI-MCP/blob/main/README.md'
      ],
      priority: 'low'
    });

    return solutions;
  }

  private static isRetryable(type: EnhancedError['type'], errorMessage: string): boolean {
    // Connection errors are usually retryable
    if (type === 'connection') {
      return true;
    }

    // Server errors might be retryable
    if (type === 'server' && !this.ERROR_PATTERNS.WRONG_SIGNATURE.test(errorMessage)) {
      return true;
    }

    // Platform and configuration errors usually require manual intervention
    return false;
  }

  static formatErrorForUser(enhancedError: EnhancedError): string {
    let output = `❌ ${enhancedError.userMessage}\n\n`;

    if (enhancedError.solutions.length > 0) {
      output += '🔧 **Suggested Solutions:**\n\n';

      const highPriority = enhancedError.solutions.filter(s => s.priority === 'high');
      const mediumPriority = enhancedError.solutions.filter(s => s.priority === 'medium');
      const lowPriority = enhancedError.solutions.filter(s => s.priority === 'low');

      [...highPriority, ...mediumPriority, ...lowPriority].forEach((solution, index) => {
        const priority = solution.priority === 'high' ? '🔥' : solution.priority === 'medium' ? '⚠️' : 'ℹ️';
        output += `${priority} **${solution.title}**\n`;
        output += `   ${solution.description}\n`;

        if (solution.commands && solution.commands.length > 0) {
          output += '   ```bash\n';
          solution.commands.forEach(cmd => {
            output += `   ${cmd}\n`;
          });
          output += '   ```\n';
        }

        if (solution.links && solution.links.length > 0) {
          solution.links.forEach(link => {
            output += `   📎 ${link}\n`;
          });
        }

        output += '\n';
      });
    }

    if (enhancedError.isRetryable) {
      output += '🔄 This error may be temporary. You can try the operation again after applying the suggested solutions.\n';
    }

    return output;
  }
}
