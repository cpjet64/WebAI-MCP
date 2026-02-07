# WebAI-MCP: Technical Implementation Reference

> Archived planning reference (2026-02-07): this document is preserved for provenance and historical context.
> Active execution planning now lives in `plans.md` and `todo.md`.

> **AI Coding Agent Reference Document**
> Technical specifications for enhancing the existing WebAI-MCP browser analysis platform

## 🎯 Project Context

WebAI-MCP is an established browser analysis platform that provides AI agents with deep insights into browser behavior and user experience. This document serves as a technical reference for implementing new features and enhancements.

**Repository Structure:**
- `main` branch: Production-ready code with auto-versioning
- `dev` branch: Development branch with auto-versioning
- Project has been rebranded from browser-tools-mcp to WebAI-MCP

## 🚀 Development Roadmap

### **Phase 1: Enhanced Core Features (Current Priority)**
1. **Advanced DOM Analysis**
   - Element inspection with CSS selectors and computed styles
   - Interactive element manipulation (click, hover, scroll, fill)
   - Advanced DOM querying with filters and sorting
   - Element-specific screenshot capture with precise targeting

2. **Browser Storage Enhancement**
   - Secure access to cookies, localStorage, sessionStorage
   - Three-tier privacy system with intelligent sensitive data detection
   - Entropy-based token detection for security

3. **Browser Control & Navigation**
   - RefreshBrowser tool for programmatic page reloading
   - Navigation state management and URL manipulation
   - Page lifecycle event handling and monitoring

4. **Tool Management System**
   - Dynamic tool enable/disable functionality via MCP commands
   - Tool configuration and permission management
   - Runtime tool discovery and capability reporting

### **Phase 2: Security & Monitoring (Next)**
1. **Authentication Analysis**
   - JWT token analysis from browser storage and headers
   - CSRF protection detection and validation
   - Authentication flow tracking

2. **Real-time Browser Monitoring**
   - Live event streaming (console, network, DOM changes)
   - Performance metrics collection and analysis
   - User interaction pattern tracking

### **Phase 3: Advanced Browser APIs (Future)**
1. **Modern Web Technologies**
   - Service Workers and PWA analysis
   - WebSocket and WebRTC monitoring
   - Advanced storage mechanisms (IndexedDB, Cache API)

2. **Performance & Memory**
   - Memory leak detection and garbage collection analysis
   - Rendering performance optimization
   - Resource loading waterfall analysis

### **Phase 4: AI-Powered Analysis (Future)**
1. **Intelligent Pattern Recognition**
   - Automated issue detection from browser behavior
   - Predictive analysis for performance degradation
   - Natural language query interface for browser state

2. **Test Automation Integration**
   - Stagehand integration for self-healing test automation
   - AI-powered test generation and maintenance
   - Cross-browser compatibility testing

3. **Distribution & Discovery**
   - MCP directory registration and marketplace integration
   - Community tool sharing and collaboration
   - Automated documentation and tutorial generation

## 🔧 Core Implementation Specifications

### **1. DOM Manipulation & Inspection**

#### Element Interaction Tools
```typescript
// File: src/tools/dom-interaction.ts
server.tool("clickElement", "Click on an element using CSS selector", {
  selector: z.string().describe("CSS selector for target element"),
  waitForNavigation: z.boolean().optional().default(false).describe("Wait for page navigation after click"),
  timeout: z.number().optional().default(5000).describe("Timeout in milliseconds")
}, async ({ selector, waitForNavigation, timeout }) => {
  return await withBrowserConnection(async () => {
    const result = await chrome.devtools.inspectedWindow.eval(`
      (function() {
        const element = document.querySelector('${selector}');
        if (!element) return { success: false, error: 'Element not found' };

        element.click();
        return { success: true, clicked: true };
      })()
    `);

    if (waitForNavigation) {
      await new Promise(resolve => setTimeout(resolve, timeout));
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  });
});

server.tool("fillInput", "Fill input fields with text", {
  selector: z.string().describe("CSS selector for input element"),
  value: z.string().describe("Value to enter into the input"),
  clearFirst: z.boolean().optional().default(true).describe("Clear existing value first")
}, async ({ selector, value, clearFirst }) => {
  return await withBrowserConnection(async () => {
    const result = await chrome.devtools.inspectedWindow.eval(`
      (function() {
        const input = document.querySelector('${selector}');
        if (!input) return { success: false, error: 'Input element not found' };

        if (${clearFirst}) input.value = '';
        input.value = '${value}';
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));

        return { success: true, value: input.value };
      })()
    `);

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  });
});
```

#### Advanced Element Inspection
```typescript
// File: src/tools/element-inspection.ts
server.tool("inspectElementsBySelector", "Get HTML elements and computed styles", {
  selector: z.string().describe("CSS selector (use $0 for currently selected element)"),
  resultLimit: z.number().optional().default(1).describe("Maximum elements to return"),
  includeComputedStyles: z.array(z.string()).optional().default([]).describe("CSS properties to include"),
  includeEventListeners: z.boolean().optional().default(false).describe("Include event listeners")
}, async ({ selector, resultLimit, includeComputedStyles, includeEventListeners }) => {
  return await withBrowserConnection(async () => {
    const inspectionScript = `
      (function() {
        const elements = document.querySelectorAll('${selector}');
        const results = Array.from(elements).slice(0, ${resultLimit}).map(el => {
          const computedStyles = {};
          ${includeComputedStyles.map(prop =>
            `computedStyles['${prop}'] = getComputedStyle(el).getPropertyValue('${prop}');`
          ).join('\n')}

          const rect = el.getBoundingClientRect();

          return {
            html: el.outerHTML,
            tagName: el.tagName,
            id: el.id,
            className: el.className,
            computedStyles: computedStyles,
            boundingRect: {
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            },
            isVisible: rect.width > 0 && rect.height > 0,
            ${includeEventListeners ? 'eventListeners: getEventListeners(el),' : ''}
          };
        });

        return { elements: results, count: results.length };
      })()
    `;

    const result = await chrome.devtools.inspectedWindow.eval(inspectionScript);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  });
});
```

### **2. Browser Storage with Privacy Controls**

#### Storage Access Implementation
```typescript
// File: src/tools/storage-analysis.ts
import { detectSensitiveData, filterSensitiveContent } from '../utils/privacy-filter';

server.tool("analyzeBrowserStorage", "Analyze all browser storage with privacy controls", {
  storageTypes: z.array(z.enum(['cookies', 'localStorage', 'sessionStorage', 'indexedDB'])).default(['cookies', 'localStorage', 'sessionStorage']),
  privacyMode: z.enum(['hide-all', 'hide-sensitive', 'show-all']).default('hide-sensitive'),
  includeSizes: z.boolean().optional().default(true),
  includeExpiration: z.boolean().optional().default(true)
}, async ({ storageTypes, privacyMode, includeSizes, includeExpiration }) => {
  return await withBrowserConnection(async () => {
    const storageData = {};

    for (const storageType of storageTypes) {
      const script = generateStorageScript(storageType, includeSizes, includeExpiration);
      const rawData = await chrome.devtools.inspectedWindow.eval(script);

      // Apply privacy filtering
      storageData[storageType] = privacyMode === 'show-all'
        ? rawData
        : filterSensitiveContent(rawData, privacyMode);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(storageData, null, 2) }]
    };
  });
});

// File: src/utils/privacy-filter.ts
export function detectSensitiveData(key: string, value: string): boolean {
  const SENSITIVE_PATTERNS = {
    keys: [/auth/i, /token/i, /jwt/i, /session/i, /api[-_]?key/i, /secret/i, /password/i],
    values: [
      /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/, // JWT
      /^sk-[A-Za-z0-9]{32,}$/, // API keys
      /^[A-Za-z0-9]{32,128}$/ // Generic tokens
    ]
  };

  // Check key patterns
  if (SENSITIVE_PATTERNS.keys.some(pattern => pattern.test(key))) return true;

  // Check value patterns
  if (SENSITIVE_PATTERNS.values.some(pattern => pattern.test(value))) return true;

  // Entropy-based detection for strings > 16 chars
  if (value.length > 16) {
    const entropy = calculateNormalizedEntropy(value);
    return entropy > 0.65; // High entropy indicates random data (likely tokens)
  }

  return false;
}

function calculateNormalizedEntropy(str: string): number {
  const freq = new Map<string, number>();
  for (const char of str) {
    freq.set(char, (freq.get(char) || 0) + 1);
  }

  let entropy = 0;
  const len = str.length;
  for (const count of freq.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }

  const uniqueChars = freq.size;
  const maxEntropy = Math.log2(uniqueChars);
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}
```

### **3. Real-time Browser Monitoring**

#### Event Streaming Implementation
```typescript
// File: src/tools/real-time-monitoring.ts
server.tool("startBrowserMonitoring", "Start real-time browser event monitoring", {
  events: z.array(z.enum(['console', 'network', 'dom-changes', 'errors', 'user-interactions'])),
  duration: z.number().optional().default(30000),
  bufferSize: z.number().optional().default(1000)
}, async ({ events, duration, bufferSize }) => {
  return await withBrowserConnection(async () => {
    const monitoringId = generateMonitoringId();

    // Set up event listeners in the browser
    for (const eventType of events) {
      await setupEventListener(eventType, monitoringId, bufferSize);
    }

    // Schedule cleanup
    setTimeout(() => cleanupMonitoring(monitoringId), duration);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          monitoringId,
          status: 'started',
          events,
          duration
        }, null, 2)
      }]
    };
  });
});

// File: src/monitoring/event-collectors.ts
async function setupEventListener(eventType: string, monitoringId: string, bufferSize: number) {
  const listenerScript = `
    (function() {
      window.webaiMonitors = window.webaiMonitors || {};
      const buffer = [];

      function flushBuffer() {
        if (buffer.length > 0) {
          chrome.runtime.sendMessage({
            type: 'monitoring-data',
            monitoringId: '${monitoringId}',
            eventType: '${eventType}',
            events: buffer.splice(0, buffer.length)
          });
        }
      }

      ${generateEventListenerCode(eventType)}

      // Flush buffer periodically
      setInterval(flushBuffer, 1000);

      window.webaiMonitors['${monitoringId}'] = { stop: () => flushBuffer() };
    })()
  `;

  await chrome.devtools.inspectedWindow.eval(listenerScript);
}

function generateEventListenerCode(eventType: string): string {
  switch (eventType) {
    case 'console':
      return `
        const originalLog = console.log;
        console.log = function(...args) {
          buffer.push({ type: 'console', level: 'log', args, timestamp: Date.now() });
          if (buffer.length >= ${bufferSize}) flushBuffer();
          originalLog.apply(console, args);
        };
      `;

    case 'network':
      return `
        const originalFetch = window.fetch;
        window.fetch = function(url, options) {
          const startTime = Date.now();
          buffer.push({ type: 'network', method: 'fetch', url, timestamp: startTime });
          return originalFetch(url, options).then(response => {
            buffer.push({ type: 'network-response', url, status: response.status, duration: Date.now() - startTime });
            return response;
          });
        };
      `;

    case 'dom-changes':
      return `
        const observer = new MutationObserver(mutations => {
          mutations.forEach(mutation => {
            buffer.push({ type: 'dom-change', mutation: mutation.type, target: mutation.target.tagName, timestamp: Date.now() });
          });
          if (buffer.length >= ${bufferSize}) flushBuffer();
        });
        observer.observe(document, { childList: true, subtree: true, attributes: true });
      `;

    default:
      return '';
  }
}
```

### **4. Security Analysis Tools**

#### JWT and Authentication Analysis
```typescript
// File: src/tools/security-analysis.ts
server.tool("analyzeAuthentication", "Analyze authentication mechanisms in browser", {
  includeJWTAnalysis: z.boolean().optional().default(true),
  includeCSRFCheck: z.boolean().optional().default(true),
  includeSecurityHeaders: z.boolean().optional().default(true),
  checkTokenLeakage: z.boolean().optional().default(true)
}, async ({ includeJWTAnalysis, includeCSRFCheck, includeSecurityHeaders, checkTokenLeakage }) => {
  return await withBrowserConnection(async () => {
    const analysis = {};

    if (includeJWTAnalysis) {
      analysis.jwt = await analyzeJWTTokens();
    }

    if (includeCSRFCheck) {
      analysis.csrf = await analyzeCSRFProtection();
    }

    if (includeSecurityHeaders) {
      analysis.headers = await analyzeSecurityHeaders();
    }

    if (checkTokenLeakage) {
      analysis.leakage = await checkForTokenLeakage();
    }

    return {
      content: [{ type: "text", text: JSON.stringify(analysis, null, 2) }]
    };
  });
});

async function analyzeJWTTokens() {
  const script = `
    (function() {
      const tokens = [];

      // Check localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const value = localStorage.getItem(key);
        if (value && value.match(/^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)) {
          tokens.push({ source: 'localStorage', key, token: value });
        }
      }

      // Check sessionStorage
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const value = sessionStorage.getItem(key);
        if (value && value.match(/^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/)) {
          tokens.push({ source: 'sessionStorage', key, token: value });
        }
      }

      // Analyze each token
      return tokens.map(tokenInfo => {
        try {
          const parts = tokenInfo.token.split('.');
          const header = JSON.parse(atob(parts[0]));
          const payload = JSON.parse(atob(parts[1]));

          return {
            ...tokenInfo,
            header,
            payload,
            expired: payload.exp ? Date.now() / 1000 > payload.exp : null,
            expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : null
          };
        } catch (e) {
          return { ...tokenInfo, error: 'Invalid JWT format' };
        }
      });
    })()
  `;

  return await chrome.devtools.inspectedWindow.eval(script);
}
```

### **5. Performance Monitoring**

#### Browser Performance Analysis
```typescript
// File: src/tools/performance-monitoring.ts
server.tool("monitorBrowserPerformance", "Monitor comprehensive browser performance", {
  metrics: z.array(z.enum(['memory', 'timing', 'vitals', 'resources', 'user-timing'])).default(['memory', 'timing', 'vitals']),
  interval: z.number().optional().default(1000),
  duration: z.number().optional().default(30000)
}, async ({ metrics, interval, duration }) => {
  return await withBrowserConnection(async () => {
    const performanceData = [];
    const startTime = Date.now();

    const collectMetrics = async () => {
      const script = `
        (function() {
          const data = { timestamp: Date.now() };

          ${metrics.includes('memory') ? `
            if (performance.memory) {
              data.memory = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
              };
            }
          ` : ''}

          ${metrics.includes('timing') ? `
            data.timing = performance.timing;
          ` : ''}

          ${metrics.includes('vitals') ? `
            data.vitals = {};
            // Get Core Web Vitals
            new PerformanceObserver((list) => {
              for (const entry of list.getEntries()) {
                if (entry.entryType === 'largest-contentful-paint') {
                  data.vitals.lcp = entry.renderTime || entry.loadTime;
                }
                if (entry.entryType === 'first-input') {
                  data.vitals.fid = entry.processingStart - entry.startTime;
                }
                if (entry.entryType === 'layout-shift') {
                  data.vitals.cls = (data.vitals.cls || 0) + entry.value;
                }
              }
            }).observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
          ` : ''}

          ${metrics.includes('resources') ? `
            data.resources = performance.getEntriesByType('resource').slice(-10);
          ` : ''}

          return data;
        })()
      `;

      const result = await chrome.devtools.inspectedWindow.eval(script);
      performanceData.push(result);
    };

    // Collect initial metrics
    await collectMetrics();

    // Set up interval collection
    const intervalId = setInterval(collectMetrics, interval);

    // Stop after duration
    setTimeout(() => {
      clearInterval(intervalId);
    }, duration);

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          status: 'monitoring-started',
          config: { metrics, interval, duration },
          initialData: performanceData[0]
        }, null, 2)
      }]
    };
  });
});
```

### **6. Browser Control & Navigation**

#### RefreshBrowser Tool Implementation
```typescript
// File: src/tools/browser-control.ts
server.tool("refreshBrowser", "Refresh the current browser page", {
  waitForLoad: z.boolean().optional().default(true).describe("Wait for page to fully load after refresh"),
  timeout: z.number().optional().default(10000).describe("Timeout in milliseconds for page load"),
  preserveScrollPosition: z.boolean().optional().default(false).describe("Attempt to preserve scroll position"),
  clearCache: z.boolean().optional().default(false).describe("Clear browser cache before refresh")
}, async ({ waitForLoad, timeout, preserveScrollPosition, clearCache }) => {
  return await withBrowserConnection(async () => {
    const script = `
      (function() {
        const currentScrollY = window.scrollY;
        const currentScrollX = window.scrollX;

        // Store scroll position if requested
        if (${preserveScrollPosition}) {
          sessionStorage.setItem('webai_scroll_position', JSON.stringify({
            x: currentScrollX,
            y: currentScrollY
          }));
        }

        // Clear cache if requested
        if (${clearCache} && 'caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => caches.delete(name));
          });
        }

        // Perform refresh
        window.location.reload(${clearCache});

        return {
          success: true,
          action: 'refresh_initiated',
          scrollPosition: { x: currentScrollX, y: currentScrollY },
          timestamp: Date.now()
        };
      })()
    `;

    const result = await chrome.devtools.inspectedWindow.eval(script);

    if (waitForLoad) {
      // Wait for page load completion
      await new Promise((resolve) => {
        const checkLoad = () => {
          chrome.devtools.inspectedWindow.eval('document.readyState', (readyState) => {
            if (readyState === 'complete') {
              // Restore scroll position if requested
              if (preserveScrollPosition) {
                chrome.devtools.inspectedWindow.eval(`
                  (function() {
                    const stored = sessionStorage.getItem('webai_scroll_position');
                    if (stored) {
                      const pos = JSON.parse(stored);
                      window.scrollTo(pos.x, pos.y);
                      sessionStorage.removeItem('webai_scroll_position');
                    }
                  })()
                `);
              }
              resolve(true);
            } else {
              setTimeout(checkLoad, 100);
            }
          });
        };

        setTimeout(checkLoad, 500); // Initial delay for refresh to start
        setTimeout(() => resolve(false), timeout); // Timeout fallback
      });
    }

    return {
      content: [{ type: "text", text: JSON.stringify({
        ...result,
        waitedForLoad: waitForLoad,
        preservedScroll: preserveScrollPosition,
        clearedCache: clearCache
      }, null, 2) }]
    };
  });
});

server.tool("navigateToUrl", "Navigate to a specific URL", {
  url: z.string().describe("URL to navigate to"),
  waitForLoad: z.boolean().optional().default(true).describe("Wait for page to fully load"),
  timeout: z.number().optional().default(10000).describe("Timeout in milliseconds")
}, async ({ url, waitForLoad, timeout }) => {
  return await withBrowserConnection(async () => {
    const script = `
      (function() {
        try {
          window.location.href = '${url}';
          return { success: true, action: 'navigation_initiated', url: '${url}' };
        } catch (error) {
          return { success: false, error: error.message };
        }
      })()
    `;

    const result = await chrome.devtools.inspectedWindow.eval(script);

    if (waitForLoad && result.success) {
      await new Promise((resolve) => {
        const checkLoad = () => {
          chrome.devtools.inspectedWindow.eval('document.readyState', (readyState) => {
            if (readyState === 'complete') {
              resolve(true);
            } else {
              setTimeout(checkLoad, 100);
            }
          });
        };

        setTimeout(checkLoad, 1000); // Initial delay for navigation to start
        setTimeout(() => resolve(false), timeout); // Timeout fallback
      });
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  });
});
```

### **7. Element-Specific Screenshot Capture**

#### Targeted Screenshot Implementation
```typescript
// File: src/tools/element-screenshots.ts
server.tool("captureElementScreenshot", "Capture screenshot of a specific element", {
  selector: z.string().describe("CSS selector for target element"),
  padding: z.number().optional().default(10).describe("Padding around element in pixels"),
  highlightElement: z.boolean().optional().default(false).describe("Highlight element with border"),
  includeBackground: z.boolean().optional().default(true).describe("Include element background"),
  quality: z.number().optional().default(0.9).describe("Image quality (0.1 to 1.0)")
}, async ({ selector, padding, highlightElement, includeBackground, quality }) => {
  return await withBrowserConnection(async () => {
    // First, get element dimensions and position
    const elementInfo = await chrome.devtools.inspectedWindow.eval(`
      (function() {
        const element = document.querySelector('${selector}');
        if (!element) return { success: false, error: 'Element not found' };

        const rect = element.getBoundingClientRect();
        const computedStyle = getComputedStyle(element);

        // Add highlight if requested
        let originalBorder = null;
        if (${highlightElement}) {
          originalBorder = element.style.border;
          element.style.border = '3px solid #ff0000';
        }

        return {
          success: true,
          rect: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left,
            bottom: rect.bottom,
            right: rect.right
          },
          scrollPosition: {
            x: window.scrollX,
            y: window.scrollY
          },
          elementVisible: rect.width > 0 && rect.height > 0,
          originalBorder: originalBorder
        };
      })()
    `);

    if (!elementInfo.success) {
      return {
        content: [{ type: "text", text: JSON.stringify(elementInfo, null, 2) }]
      };
    }

    // Scroll element into view if needed
    await chrome.devtools.inspectedWindow.eval(`
      (function() {
        const element = document.querySelector('${selector}');
        if (element) {
          element.scrollIntoView({ behavior: 'instant', block: 'center', inline: 'center' });
        }
      })()
    `);

    // Wait a moment for scroll to complete
    await new Promise(resolve => setTimeout(resolve, 200));

    // Capture full page screenshot
    const fullScreenshot = await new Promise((resolve) => {
      chrome.tabs.captureVisibleTab(null, { format: 'png' }, resolve);
    });

    // Calculate crop dimensions with padding
    const cropArea = {
      x: Math.max(0, elementInfo.rect.x - padding),
      y: Math.max(0, elementInfo.rect.y - padding),
      width: elementInfo.rect.width + (padding * 2),
      height: elementInfo.rect.height + (padding * 2)
    };

    // Create canvas for cropping
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const croppedImage = await new Promise((resolve) => {
      img.onload = () => {
        canvas.width = cropArea.width;
        canvas.height = cropArea.height;

        // Set background if requested
        if (includeBackground) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Draw cropped portion
        ctx.drawImage(
          img,
          cropArea.x, cropArea.y, cropArea.width, cropArea.height,
          0, 0, cropArea.width, cropArea.height
        );

        resolve(canvas.toDataURL('image/png', quality));
      };
      img.src = fullScreenshot;
    });

    // Remove highlight if it was added
    if (highlightElement) {
      await chrome.devtools.inspectedWindow.eval(`
        (function() {
          const element = document.querySelector('${selector}');
          if (element) {
            element.style.border = '${elementInfo.originalBorder || ''}';
          }
        })()
      `);
    }

    // Send to server for saving (similar to existing screenshot logic)
    const response = await fetch('http://localhost:3025/save-screenshot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageData: croppedImage,
        filename: `element_${selector.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.png`,
        elementInfo: elementInfo.rect
      })
    });

    const saveResult = await response.json();

    return {
      content: [{ type: "text", text: JSON.stringify({
        success: true,
        elementInfo: elementInfo.rect,
        cropArea,
        savedPath: saveResult.path,
        imageSize: {
          width: cropArea.width,
          height: cropArea.height
        }
      }, null, 2) }]
    };
  });
});
```

### **8. Tool Management System**

#### Dynamic Tool Enable/Disable Implementation
```typescript
// File: src/tools/tool-management.ts
interface ToolConfig {
  enabled: boolean;
  permissions: string[];
  rateLimit?: number;
  lastUsed?: number;
  usageCount?: number;
}

class ToolManager {
  private toolConfigs = new Map<string, ToolConfig>();
  private defaultConfig: ToolConfig = {
    enabled: true,
    permissions: ['read'],
    rateLimit: 100, // requests per minute
    usageCount: 0
  };

  constructor() {
    this.loadToolConfigs();
  }

  private loadToolConfigs() {
    // Load from storage or use defaults
    const savedConfigs = localStorage.getItem('webai_tool_configs');
    if (savedConfigs) {
      const configs = JSON.parse(savedConfigs);
      Object.entries(configs).forEach(([toolName, config]) => {
        this.toolConfigs.set(toolName, config as ToolConfig);
      });
    }
  }

  private saveToolConfigs() {
    const configs = Object.fromEntries(this.toolConfigs);
    localStorage.setItem('webai_tool_configs', JSON.stringify(configs));
  }

  public isToolEnabled(toolName: string): boolean {
    const config = this.toolConfigs.get(toolName) || this.defaultConfig;
    return config.enabled;
  }

  public checkRateLimit(toolName: string): boolean {
    const config = this.toolConfigs.get(toolName) || this.defaultConfig;
    if (!config.rateLimit) return true;

    const now = Date.now();
    const oneMinute = 60 * 1000;

    // Reset usage count if more than a minute has passed
    if (config.lastUsed && (now - config.lastUsed) > oneMinute) {
      config.usageCount = 0;
    }

    return (config.usageCount || 0) < config.rateLimit;
  }

  public recordToolUsage(toolName: string) {
    const config = this.toolConfigs.get(toolName) || { ...this.defaultConfig };
    config.lastUsed = Date.now();
    config.usageCount = (config.usageCount || 0) + 1;
    this.toolConfigs.set(toolName, config);
    this.saveToolConfigs();
  }
}

const toolManager = new ToolManager();

server.tool("configureTools", "Configure tool settings and permissions", {
  toolName: z.string().describe("Name of the tool to configure"),
  enabled: z.boolean().optional().describe("Enable or disable the tool"),
  rateLimit: z.number().optional().describe("Rate limit (requests per minute)"),
  permissions: z.array(z.string()).optional().describe("Tool permissions")
}, async ({ toolName, enabled, rateLimit, permissions }) => {
  return await withBrowserConnection(async () => {
    const currentConfig = toolManager.toolConfigs.get(toolName) || { ...toolManager.defaultConfig };

    // Update configuration
    if (enabled !== undefined) currentConfig.enabled = enabled;
    if (rateLimit !== undefined) currentConfig.rateLimit = rateLimit;
    if (permissions !== undefined) currentConfig.permissions = permissions;

    toolManager.toolConfigs.set(toolName, currentConfig);
    toolManager.saveToolConfigs();

    return {
      content: [{ type: "text", text: JSON.stringify({
        success: true,
        toolName,
        configuration: currentConfig,
        message: `Tool ${toolName} configuration updated`
      }, null, 2) }]
    };
  });
});

server.tool("listToolConfigurations", "List all tool configurations and status", {
  includeUsageStats: z.boolean().optional().default(false).describe("Include usage statistics")
}, async ({ includeUsageStats }) => {
  return await withBrowserConnection(async () => {
    const allConfigs = {};

    // Get all registered tools
    const availableTools = [
      'takeScreenshot', 'getConsoleLogs', 'getNetworkLogs', 'inspectElementsBySelector',
      'getCookies', 'getLocalStorage', 'getSessionStorage', 'runAccessibilityAudit',
      'runPerformanceAudit', 'runSEOAudit', 'refreshBrowser', 'captureElementScreenshot',
      'clickElement', 'fillInput', 'analyzeBrowserStorage', 'startBrowserMonitoring'
    ];

    availableTools.forEach(toolName => {
      const config = toolManager.toolConfigs.get(toolName) || toolManager.defaultConfig;
      allConfigs[toolName] = {
        enabled: config.enabled,
        permissions: config.permissions,
        rateLimit: config.rateLimit,
        ...(includeUsageStats && {
          usageCount: config.usageCount || 0,
          lastUsed: config.lastUsed ? new Date(config.lastUsed).toISOString() : null
        })
      };
    });

    return {
      content: [{ type: "text", text: JSON.stringify({
        success: true,
        toolConfigurations: allConfigs,
        totalTools: availableTools.length,
        enabledTools: Object.values(allConfigs).filter(config => config.enabled).length
      }, null, 2) }]
    };
  });
});

// Middleware to check tool permissions before execution
function withToolPermissionCheck(toolName: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args: any[]) {
      // Check if tool is enabled
      if (!toolManager.isToolEnabled(toolName)) {
        return {
          content: [{ type: "text", text: JSON.stringify({
            success: false,
            error: `Tool '${toolName}' is currently disabled`,
            code: 'TOOL_DISABLED'
          }, null, 2) }]
        };
      }

      // Check rate limit
      if (!toolManager.checkRateLimit(toolName)) {
        return {
          content: [{ type: "text", text: JSON.stringify({
            success: false,
            error: `Rate limit exceeded for tool '${toolName}'`,
            code: 'RATE_LIMIT_EXCEEDED'
          }, null, 2) }]
        };
      }

      // Record usage
      toolManager.recordToolUsage(toolName);

      // Execute original method
      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
```

### **9. Chrome Extension UI Enhancements**

#### Copy Button and NPX Command Integration
```typescript
// File: chrome-extension/enhanced-ui.js
class WebAIUIEnhancements {
  constructor() {
    this.initializeCopyButtons();
    this.setupNPXCommandHelper();
    this.createToolManagementUI();
  }

  initializeCopyButtons() {
    // Add copy button for NPX commands
    const npxCommands = [
      'npx @cpjet64/webai-mcp',
      'npx @cpjet64/webai-server',
      'npx @cpjet64/webai-mcp@dev',
      'npx @cpjet64/webai-server@dev'
    ];

    npxCommands.forEach(command => {
      this.createCopyButton(command, `copy-${command.replace(/[^a-zA-Z0-9]/g, '-')}`);
    });
  }

  createCopyButton(text, id) {
    const button = document.createElement('button');
    button.id = id;
    button.className = 'copy-button';
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
      </svg>
      Copy
    `;

    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(text);
        this.showCopyFeedback(button);
      } catch (err) {
        console.error('Failed to copy text: ', err);
        this.showCopyError(button);
      }
    });

    return button;
  }

  showCopyFeedback(button) {
    const originalContent = button.innerHTML;
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20,6 9,17 4,12"></polyline>
      </svg>
      Copied!
    `;
    button.style.backgroundColor = '#4CAF50';

    setTimeout(() => {
      button.innerHTML = originalContent;
      button.style.backgroundColor = '';
    }, 2000);
  }

  showCopyError(button) {
    const originalContent = button.innerHTML;
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      Error
    `;
    button.style.backgroundColor = '#f44336';

    setTimeout(() => {
      button.innerHTML = originalContent;
      button.style.backgroundColor = '';
    }, 2000);
  }

  setupNPXCommandHelper() {
    // Create NPX command helper section in the panel
    const npxSection = document.createElement('div');
    npxSection.className = 'npx-commands-section';
    npxSection.innerHTML = `
      <h4>Quick Install Commands</h4>
      <div class="command-group">
        <div class="command-item">
          <code>npx @cpjet64/webai-mcp</code>
          ${this.createCopyButton('npx @cpjet64/webai-mcp', 'copy-mcp').outerHTML}
        </div>
        <div class="command-item">
          <code>npx @cpjet64/webai-server</code>
          ${this.createCopyButton('npx @cpjet64/webai-server', 'copy-server').outerHTML}
        </div>
      </div>
      <div class="command-group">
        <h5>Development Versions</h5>
        <div class="command-item">
          <code>npx @cpjet64/webai-mcp@dev</code>
          ${this.createCopyButton('npx @cpjet64/webai-mcp@dev', 'copy-mcp-dev').outerHTML}
        </div>
        <div class="command-item">
          <code>npx @cpjet64/webai-server@dev</code>
          ${this.createCopyButton('npx @cpjet64/webai-server@dev', 'copy-server-dev').outerHTML}
        </div>
      </div>
    `;

    // Add to panel
    const settingsSection = document.querySelector('.settings-section');
    if (settingsSection) {
      settingsSection.appendChild(npxSection);
    }
  }

  createToolManagementUI() {
    const toolManagementSection = document.createElement('div');
    toolManagementSection.className = 'tool-management-section';
    toolManagementSection.innerHTML = `
      <h4>Tool Management</h4>
      <div class="tool-controls">
        <button id="refresh-tool-list" class="action-button">Refresh Tool List</button>
        <button id="export-tool-config" class="action-button">Export Config</button>
        <button id="import-tool-config" class="action-button">Import Config</button>
      </div>
      <div id="tool-list" class="tool-list">
        <!-- Tool list will be populated dynamically -->
      </div>
    `;

    // Add event listeners
    toolManagementSection.querySelector('#refresh-tool-list').addEventListener('click', () => {
      this.refreshToolList();
    });

    toolManagementSection.querySelector('#export-tool-config').addEventListener('click', () => {
      this.exportToolConfiguration();
    });

    toolManagementSection.querySelector('#import-tool-config').addEventListener('click', () => {
      this.importToolConfiguration();
    });

    // Add to panel
    const settingsSection = document.querySelector('.settings-section');
    if (settingsSection) {
      settingsSection.appendChild(toolManagementSection);
    }

    // Initial load
    this.refreshToolList();
  }

  async refreshToolList() {
    try {
      // This would call the MCP server to get tool configurations
      const response = await fetch('http://localhost:3025/tool-configurations');
      const toolConfigs = await response.json();

      this.renderToolList(toolConfigs);
    } catch (error) {
      console.error('Failed to refresh tool list:', error);
    }
  }

  renderToolList(toolConfigs) {
    const toolListContainer = document.getElementById('tool-list');
    if (!toolListContainer) return;

    toolListContainer.innerHTML = '';

    Object.entries(toolConfigs).forEach(([toolName, config]) => {
      const toolItem = document.createElement('div');
      toolItem.className = 'tool-item';
      toolItem.innerHTML = `
        <div class="tool-header">
          <span class="tool-name">${toolName}</span>
          <label class="toggle-switch">
            <input type="checkbox" ${config.enabled ? 'checked' : ''}
                   onchange="toggleTool('${toolName}', this.checked)">
            <span class="slider"></span>
          </label>
        </div>
        <div class="tool-details">
          <span class="usage-count">Used: ${config.usageCount || 0} times</span>
          <span class="rate-limit">Limit: ${config.rateLimit || 'None'}/min</span>
        </div>
      `;

      toolListContainer.appendChild(toolItem);
    });
  }

  async exportToolConfiguration() {
    try {
      const response = await fetch('http://localhost:3025/tool-configurations');
      const config = await response.json();

      const dataStr = JSON.stringify(config, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });

      const link = document.createElement('a');
      link.href = URL.createObjectURL(dataBlob);
      link.download = `webai-tool-config-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
    } catch (error) {
      console.error('Failed to export configuration:', error);
    }
  }

  async importToolConfiguration() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async (event) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        const config = JSON.parse(text);

        // Send to server to update configurations
        await fetch('http://localhost:3025/tool-configurations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config)
        });

        this.refreshToolList();
      } catch (error) {
        console.error('Failed to import configuration:', error);
      }
    };

    input.click();
  }
}

// Global function for tool toggling
window.toggleTool = async function(toolName, enabled) {
  try {
    await fetch('http://localhost:3025/configure-tool', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ toolName, enabled })
    });
  } catch (error) {
    console.error('Failed to toggle tool:', error);
  }
};

// Initialize UI enhancements when the panel loads
document.addEventListener('DOMContentLoaded', () => {
  new WebAIUIEnhancements();
});
```

### **10. Stagehand Integration for Test Automation**

#### Self-Healing Test Framework Integration
```typescript
// File: src/tools/stagehand-integration.ts
import { Stagehand } from '@browserbase/stagehand';

interface TestStep {
  action: 'click' | 'type' | 'wait' | 'assert' | 'navigate';
  selector?: string;
  text?: string;
  url?: string;
  timeout?: number;
  expected?: any;
}

interface TestScenario {
  name: string;
  description: string;
  steps: TestStep[];
  retryCount?: number;
  healingEnabled?: boolean;
}

class StagehandTestManager {
  private stagehand: Stagehand;
  private testResults = new Map<string, any>();

  constructor() {
    this.stagehand = new Stagehand({
      env: 'LOCAL',
      headless: false,
      logger: console,
      enableCaching: true
    });
  }

  async initializeStagehand() {
    await this.stagehand.init();
    return this.stagehand.page;
  }

  async executeTestScenario(scenario: TestScenario): Promise<any> {
    const startTime = Date.now();
    const results = {
      scenarioName: scenario.name,
      success: false,
      steps: [],
      errors: [],
      duration: 0,
      healingActions: []
    };

    try {
      await this.initializeStagehand();

      for (let i = 0; i < scenario.steps.length; i++) {
        const step = scenario.steps[i];
        const stepResult = await this.executeTestStep(step, scenario.healingEnabled);

        results.steps.push({
          stepIndex: i,
          action: step.action,
          success: stepResult.success,
          duration: stepResult.duration,
          error: stepResult.error,
          healingApplied: stepResult.healingApplied
        });

        if (stepResult.healingApplied) {
          results.healingActions.push(stepResult.healingAction);
        }

        if (!stepResult.success && !scenario.healingEnabled) {
          throw new Error(`Step ${i + 1} failed: ${stepResult.error}`);
        }
      }

      results.success = true;
    } catch (error) {
      results.errors.push(error.message);
    } finally {
      results.duration = Date.now() - startTime;
      await this.stagehand.close();
    }

    this.testResults.set(scenario.name, results);
    return results;
  }

  async executeTestStep(step: TestStep, healingEnabled: boolean = true): Promise<any> {
    const stepStartTime = Date.now();
    const result = {
      success: false,
      duration: 0,
      error: null,
      healingApplied: false,
      healingAction: null
    };

    try {
      switch (step.action) {
        case 'navigate':
          await this.stagehand.page.goto(step.url);
          break;

        case 'click':
          try {
            await this.stagehand.page.act({ action: `click on "${step.selector}"` });
          } catch (error) {
            if (healingEnabled) {
              const healingResult = await this.attemptSelfHealing('click', step.selector);
              if (healingResult.success) {
                result.healingApplied = true;
                result.healingAction = healingResult.action;
                await this.stagehand.page.act({ action: healingResult.action });
              } else {
                throw error;
              }
            } else {
              throw error;
            }
          }
          break;

        case 'type':
          try {
            await this.stagehand.page.act({
              action: `type "${step.text}" in "${step.selector}"`
            });
          } catch (error) {
            if (healingEnabled) {
              const healingResult = await this.attemptSelfHealing('type', step.selector, step.text);
              if (healingResult.success) {
                result.healingApplied = true;
                result.healingAction = healingResult.action;
                await this.stagehand.page.act({ action: healingResult.action });
              } else {
                throw error;
              }
            } else {
              throw error;
            }
          }
          break;

        case 'wait':
          await new Promise(resolve => setTimeout(resolve, step.timeout || 1000));
          break;

        case 'assert':
          const element = await this.stagehand.page.$(step.selector);
          if (!element) {
            throw new Error(`Assertion failed: Element ${step.selector} not found`);
          }
          break;
      }

      result.success = true;
    } catch (error) {
      result.error = error.message;
    } finally {
      result.duration = Date.now() - stepStartTime;
    }

    return result;
  }

  async attemptSelfHealing(action: string, selector: string, text?: string): Promise<any> {
    // AI-powered self-healing logic
    const healingStrategies = [
      // Try similar selectors
      async () => {
        const alternatives = await this.generateAlternativeSelectors(selector);
        for (const altSelector of alternatives) {
          try {
            const element = await this.stagehand.page.$(altSelector);
            if (element) {
              return {
                success: true,
                action: text
                  ? `type "${text}" in "${altSelector}"`
                  : `click on "${altSelector}"`
              };
            }
          } catch (e) {
            continue;
          }
        }
        return { success: false };
      },

      // Try waiting and retrying
      async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        try {
          const element = await this.stagehand.page.$(selector);
          if (element) {
            return {
              success: true,
              action: text
                ? `type "${text}" in "${selector}"`
                : `click on "${selector}"`
            };
          }
        } catch (e) {
          return { success: false };
        }
      },

      // Try scrolling to element
      async () => {
        try {
          await this.stagehand.page.evaluate((sel) => {
            const element = document.querySelector(sel);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
              return true;
            }
            return false;
          }, selector);

          await new Promise(resolve => setTimeout(resolve, 1000));

          const element = await this.stagehand.page.$(selector);
          if (element) {
            return {
              success: true,
              action: text
                ? `type "${text}" in "${selector}"`
                : `click on "${selector}"`
            };
          }
        } catch (e) {
          return { success: false };
        }
      }
    ];

    for (const strategy of healingStrategies) {
      const result = await strategy();
      if (result.success) {
        return result;
      }
    }

    return { success: false };
  }

  async generateAlternativeSelectors(originalSelector: string): Promise<string[]> {
    // Generate alternative selectors based on the original
    const alternatives = [];

    // If it's an ID selector, try class-based alternatives
    if (originalSelector.startsWith('#')) {
      const id = originalSelector.substring(1);
      alternatives.push(
        `[id="${id}"]`,
        `[id*="${id}"]`,
        `.${id}`,
        `[class*="${id}"]`
      );
    }

    // If it's a class selector, try other approaches
    if (originalSelector.startsWith('.')) {
      const className = originalSelector.substring(1);
      alternatives.push(
        `[class="${className}"]`,
        `[class*="${className}"]`,
        `#${className}`,
        `[id*="${className}"]`
      );
    }

    // Try data attributes
    alternatives.push(
      `[data-testid*="${originalSelector.replace(/[#.]/g, '')}"]`,
      `[data-test*="${originalSelector.replace(/[#.]/g, '')}"]`,
      `[aria-label*="${originalSelector.replace(/[#.]/g, '')}"]`
    );

    return alternatives;
  }
}

const stagehandManager = new StagehandTestManager();

server.tool("runStagehandTest", "Execute automated test scenario with self-healing", {
  scenario: z.object({
    name: z.string(),
    description: z.string(),
    steps: z.array(z.object({
      action: z.enum(['click', 'type', 'wait', 'assert', 'navigate']),
      selector: z.string().optional(),
      text: z.string().optional(),
      url: z.string().optional(),
      timeout: z.number().optional(),
      expected: z.any().optional()
    })),
    retryCount: z.number().optional().default(3),
    healingEnabled: z.boolean().optional().default(true)
  })
}, async ({ scenario }) => {
  return await withBrowserConnection(async () => {
    const results = await stagehandManager.executeTestScenario(scenario);

    return {
      content: [{ type: "text", text: JSON.stringify({
        success: results.success,
        testResults: results,
        summary: {
          totalSteps: results.steps.length,
          successfulSteps: results.steps.filter(s => s.success).length,
          healingActionsApplied: results.healingActions.length,
          totalDuration: results.duration
        }
      }, null, 2) }]
    };
  });
});
```

### **11. MCP Directory Registration & Distribution**

#### Marketplace Integration Implementation
```typescript
// File: src/tools/mcp-directory.ts
interface MCPDirectoryEntry {
  name: string;
  version: string;
  description: string;
  author: string;
  repository: string;
  keywords: string[];
  category: string;
  tools: string[];
  compatibility: {
    mcpVersion: string;
    nodeVersion: string;
    platforms: string[];
  };
  documentation: {
    readme: string;
    examples: string[];
    tutorials: string[];
  };
  metrics: {
    downloads: number;
    rating: number;
    reviews: number;
  };
}

class MCPDirectoryManager {
  private directoryApiUrl = 'https://api.mcp-directory.org';
  private packageInfo: MCPDirectoryEntry;

  constructor() {
    this.packageInfo = {
      name: '@cpjet64/webai-mcp',
      version: '1.4.0',
      description: 'Comprehensive browser automation and monitoring solution for AI applications',
      author: 'cpjet64',
      repository: 'https://github.com/cpjet64/webai-mcp',
      keywords: [
        'browser-automation', 'mcp', 'ai-tools', 'screenshot', 'monitoring',
        'web-scraping', 'testing', 'accessibility', 'performance'
      ],
      category: 'Browser Tools',
      tools: [
        'takeScreenshot', 'getConsoleLogs', 'getNetworkLogs', 'inspectElementsBySelector',
        'getCookies', 'getLocalStorage', 'getSessionStorage', 'runAccessibilityAudit',
        'runPerformanceAudit', 'runSEOAudit', 'refreshBrowser', 'captureElementScreenshot',
        'clickElement', 'fillInput', 'analyzeBrowserStorage', 'startBrowserMonitoring',
        'configureTools', 'listToolConfigurations', 'runStagehandTest'
      ],
      compatibility: {
        mcpVersion: '^1.0.0',
        nodeVersion: '>=18.0.0',
        platforms: ['win32', 'darwin', 'linux']
      },
      documentation: {
        readme: 'https://github.com/cpjet64/webai-mcp/blob/main/README.md',
        examples: [
          'https://github.com/cpjet64/webai-mcp/tree/main/examples',
          'https://github.com/cpjet64/webai-mcp/blob/main/docs/examples'
        ],
        tutorials: [
          'https://github.com/cpjet64/webai-mcp/blob/main/docs/tutorial.md',
          'https://github.com/cpjet64/webai-mcp/blob/main/AUTO_PASTE_GUIDE.md'
        ]
      },
      metrics: {
        downloads: 0,
        rating: 0,
        reviews: 0
      }
    };
  }

  async registerWithDirectory(): Promise<any> {
    try {
      const response = await fetch(`${this.directoryApiUrl}/packages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MCP_DIRECTORY_TOKEN}`
        },
        body: JSON.stringify(this.packageInfo)
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        registrationId: result.id,
        status: result.status,
        message: 'Successfully registered with MCP Directory'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to register with MCP Directory'
      };
    }
  }

  async updateDirectoryEntry(updates: Partial<MCPDirectoryEntry>): Promise<any> {
    try {
      const updatedInfo = { ...this.packageInfo, ...updates };

      const response = await fetch(`${this.directoryApiUrl}/packages/${this.packageInfo.name}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MCP_DIRECTORY_TOKEN}`
        },
        body: JSON.stringify(updatedInfo)
      });

      if (!response.ok) {
        throw new Error(`Update failed: ${response.statusText}`);
      }

      const result = await response.json();
      this.packageInfo = updatedInfo;

      return {
        success: true,
        message: 'Directory entry updated successfully',
        updatedFields: Object.keys(updates)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to update directory entry'
      };
    }
  }

  async generatePackageMetadata(): Promise<any> {
    // Auto-generate package metadata from codebase
    const metadata = {
      toolCount: this.packageInfo.tools.length,
      lastUpdated: new Date().toISOString(),
      features: [
        'Cross-platform auto-paste functionality',
        'Real-time browser monitoring',
        'Advanced element inspection',
        'Security analysis tools',
        'Performance monitoring',
        'Test automation integration',
        'Tool management system'
      ],
      requirements: {
        chrome: '>=90.0.0',
        node: '>=18.0.0',
        mcp: '>=1.0.0'
      },
      installation: {
        npm: `npm install ${this.packageInfo.name}`,
        npx: `npx ${this.packageInfo.name}`,
        yarn: `yarn add ${this.packageInfo.name}`
      },
      configuration: {
        mcpServers: {
          'webai-mcp': {
            command: 'npx',
            args: [this.packageInfo.name]
          }
        }
      }
    };

    return metadata;
  }

  async submitToMarketplace(): Promise<any> {
    try {
      const metadata = await this.generatePackageMetadata();

      const submissionData = {
        ...this.packageInfo,
        metadata,
        submissionType: 'update',
        timestamp: new Date().toISOString()
      };

      const response = await fetch(`${this.directoryApiUrl}/marketplace/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MCP_DIRECTORY_TOKEN}`
        },
        body: JSON.stringify(submissionData)
      });

      if (!response.ok) {
        throw new Error(`Marketplace submission failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        submissionId: result.submissionId,
        status: result.status,
        reviewUrl: result.reviewUrl,
        message: 'Successfully submitted to MCP Marketplace'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        message: 'Failed to submit to marketplace'
      };
    }
  }
}

const directoryManager = new MCPDirectoryManager();

server.tool("registerMCPDirectory", "Register WebAI-MCP with the MCP Directory", {
  updateExisting: z.boolean().optional().default(false).describe("Update existing entry if it exists")
}, async ({ updateExisting }) => {
  return await withBrowserConnection(async () => {
    let result;

    if (updateExisting) {
      result = await directoryManager.updateDirectoryEntry({
        version: directoryManager.packageInfo.version,
        tools: directoryManager.packageInfo.tools
      });
    } else {
      result = await directoryManager.registerWithDirectory();
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  });
});

server.tool("submitToMarketplace", "Submit WebAI-MCP to the MCP Marketplace", {
  includeMetadata: z.boolean().optional().default(true).describe("Include auto-generated metadata")
}, async ({ includeMetadata }) => {
  return await withBrowserConnection(async () => {
    const result = await directoryManager.submitToMarketplace();

    if (includeMetadata) {
      const metadata = await directoryManager.generatePackageMetadata();
      result.metadata = metadata;
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  });
});

server.tool("generateTutorialVideo", "Generate tutorial video script and metadata", {
  topic: z.string().describe("Tutorial topic (e.g., 'getting-started', 'advanced-features')"),
  duration: z.number().optional().default(300).describe("Target duration in seconds"),
  includeCode: z.boolean().optional().default(true).describe("Include code examples")
}, async ({ topic, duration, includeCode }) => {
  return await withBrowserConnection(async () => {
    const tutorialScript = {
      title: `WebAI-MCP: ${topic.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
      duration: duration,
      sections: [],
      codeExamples: [],
      resources: []
    };

    // Generate tutorial content based on topic
    switch (topic) {
      case 'getting-started':
        tutorialScript.sections = [
          { title: 'Introduction to WebAI-MCP', duration: 30 },
          { title: 'Installation Process', duration: 60 },
          { title: 'Basic Configuration', duration: 90 },
          { title: 'First Screenshot', duration: 60 },
          { title: 'Next Steps', duration: 60 }
        ];
        break;

      case 'advanced-features':
        tutorialScript.sections = [
          { title: 'Element-Specific Screenshots', duration: 80 },
          { title: 'Tool Management System', duration: 70 },
          { title: 'Stagehand Integration', duration: 90 },
          { title: 'Performance Monitoring', duration: 60 }
        ];
        break;
    }

    if (includeCode) {
      tutorialScript.codeExamples = [
        {
          title: 'Basic MCP Configuration',
          code: `{
  "mcpServers": {
    "webai-mcp": {
      "command": "npx",
      "args": ["@cpjet64/webai-mcp"]
    }
  }
}`
        },
        {
          title: 'Taking a Screenshot',
          code: 'Take a screenshot of the current page'
        }
      ];
    }

    tutorialScript.resources = [
      'https://github.com/cpjet64/webai-mcp/blob/main/README.md',
      'https://github.com/cpjet64/webai-mcp/blob/main/docs/examples'
    ];

    return {
      content: [{ type: "text", text: JSON.stringify({
        success: true,
        tutorialScript,
        metadata: {
          topic,
          generatedAt: new Date().toISOString(),
          estimatedProductionTime: `${Math.ceil(duration / 60)} hours`,
          targetAudience: topic === 'getting-started' ? 'beginners' : 'advanced users'
        }
      }, null, 2) }]
    };
  });
});
```

## 🔧 Core Architecture Components

### **Browser Connection Management**
```typescript
// File: src/core/browser-connection.ts
export async function withBrowserConnection<T>(operation: () => Promise<T>): Promise<T> {
  if (!chrome?.devtools?.inspectedWindow) {
    throw new Error('Browser connection not available. Ensure Chrome extension is loaded.');
  }

  try {
    return await operation();
  } catch (error) {
    console.error('Browser operation failed:', error);
    throw new Error(`Browser operation failed: ${error.message}`);
  }
}

export function generateMonitoringId(): string {
  return `webai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function validateBrowserEnvironment(): Promise<boolean> {
  try {
    const result = await chrome.devtools.inspectedWindow.eval('!!window');
    return result === true;
  } catch {
    return false;
  }
}
```

### **Message Passing System**
```typescript
// File: src/core/message-handler.ts
export class BrowserMessageHandler {
  private listeners = new Map<string, Function[]>();

  constructor() {
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
  }

  private handleMessage(message: any, sender: chrome.runtime.MessageSender, sendResponse: Function) {
    const { type, data } = message;
    const handlers = this.listeners.get(type) || [];

    handlers.forEach(handler => {
      try {
        handler(data, sender, sendResponse);
      } catch (error) {
        console.error(`Message handler error for type ${type}:`, error);
      }
    });
  }

  public addListener(type: string, handler: Function) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    this.listeners.get(type)!.push(handler);
  }

  public removeListener(type: string, handler: Function) {
    const handlers = this.listeners.get(type);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) handlers.splice(index, 1);
    }
  }
}
```

### **Error Handling Standards**
```typescript
// File: src/utils/error-handling.ts
export class WebAIError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'WebAIError';
  }
}

export function handleToolError(error: unknown, context: string): { content: Array<{ type: string; text: string }> } {
  const errorMessage = error instanceof Error ? error.message : String(error);

  console.error(`${context} error:`, error);

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        success: false,
        error: errorMessage,
        context,
        timestamp: new Date().toISOString(),
        suggestions: generateErrorSuggestions(errorMessage)
      }, null, 2)
    }]
  };
}

function generateErrorSuggestions(errorMessage: string): string[] {
  const suggestions = [];

  if (errorMessage.includes('not found')) {
    suggestions.push('Verify the CSS selector is correct');
    suggestions.push('Ensure the element exists on the current page');
  }

  if (errorMessage.includes('permission')) {
    suggestions.push('Check browser permissions for the extension');
    suggestions.push('Try refreshing the page and reopening DevTools');
  }

  if (errorMessage.includes('timeout')) {
    suggestions.push('Increase the timeout value');
    suggestions.push('Check if the page is fully loaded');
  }

  return suggestions;
}
```

## 📋 Implementation Guidelines

### **Code Organization**
```
src/
├── tools/               # MCP tool implementations
│   ├── dom-interaction.ts          # Element manipulation and interaction
│   ├── storage-analysis.ts         # Browser storage access with privacy controls
│   ├── security-analysis.ts        # JWT and authentication analysis
│   ├── performance-monitoring.ts   # Browser performance metrics
│   ├── browser-control.ts          # Navigation and refresh tools
│   ├── element-screenshots.ts      # Element-specific screenshot capture
│   ├── tool-management.ts          # Dynamic tool enable/disable system
│   ├── stagehand-integration.ts    # Self-healing test automation
│   └── mcp-directory.ts            # MCP marketplace integration
├── core/               # Core system components
│   ├── browser-connection.ts       # Browser API connection management
│   ├── message-handler.ts          # Chrome extension message passing
│   └── mcp-server.ts              # Main MCP server implementation
├── utils/              # Utility functions
│   ├── privacy-filter.ts          # Sensitive data detection and filtering
│   ├── error-handling.ts          # Comprehensive error management
│   └── validation.ts              # Input validation and sanitization
├── monitoring/         # Real-time monitoring
│   ├── event-collectors.ts        # Browser event collection
│   └── data-processors.ts         # Event data processing and analysis
├── chrome-extension/   # Chrome extension components
│   ├── enhanced-ui.js             # UI enhancements and copy buttons
│   ├── panel.js                   # DevTools panel functionality
│   ├── devtools.js               # DevTools integration
│   └── background.js             # Background script and tab management
└── types/              # TypeScript definitions
    ├── browser-api.ts             # Browser API type definitions
    ├── tool-responses.ts          # Tool response interfaces
    ├── test-automation.ts         # Stagehand integration types
    └── mcp-directory.ts           # Directory registration types
```

### **Testing Strategy**
- Unit tests for utility functions (privacy filtering, validation)
- Integration tests for browser API interactions
- End-to-end tests for complete tool workflows
- Performance tests for real-time monitoring features

### **Development Standards**

- All tools must include comprehensive error handling
- TypeScript interfaces required for all parameters and responses
- Logging must include context and actionable error messages
- Privacy filtering must be applied to all sensitive data access
- Performance monitoring tools must not impact browser performance significantly
- Self-healing test automation should gracefully degrade when healing fails
- MCP directory integration must handle API failures gracefully
- Chrome extension UI enhancements must be accessible and responsive

### **Implementation Priority**

**Phase 1 (High Priority):**
1. RefreshBrowser tool implementation
2. Element-specific screenshot capture
3. Tool management system with enable/disable functionality
4. Copy buttons for NPX commands in Chrome extension

**Phase 2 (Medium Priority):**
5. Stagehand integration for test automation
6. MCP directory registration and marketplace submission
7. Tutorial video script generation

**Phase 3 (Future Enhancement):**
8. Advanced self-healing algorithms
9. Community tool sharing platform
10. AI-powered test generation

## 🎯 **Conclusion**

This comprehensive technical reference document provides detailed implementation specifications for all missing features identified in the WebAI-MCP task board. The implementations cover:

- **Browser Control**: RefreshBrowser tool with advanced options
- **Enhanced Screenshots**: Element-specific capture with highlighting
- **Tool Management**: Dynamic enable/disable with rate limiting
- **UI Enhancements**: Copy buttons and NPX command helpers
- **Test Automation**: Stagehand integration with self-healing capabilities
- **Distribution**: MCP directory registration and marketplace integration
- **Documentation**: Tutorial video generation and metadata

Each implementation includes comprehensive error handling, TypeScript interfaces, and follows established patterns from the existing codebase. The modular architecture ensures easy integration and maintenance while providing a solid foundation for future enhancements.

**Total New Tools Added**: 11 new MCP tools
**Chrome Extension Enhancements**: 4 major UI improvements
**Integration Points**: 3 external service integrations (Stagehand, MCP Directory, Tutorial Generation)

This reference document provides the technical foundation for implementing the next phase of WebAI-MCP enhancements.
