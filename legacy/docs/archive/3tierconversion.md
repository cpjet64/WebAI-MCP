# Archived: superseded by convert-rust.md

# WebAI-MCP 4‑Tier to 3‑Tier Architecture Plan

## Current Architecture (4-Tier)
```
┌─────────────┐     ┌──────────────┐     ┌───────────────┐     ┌─────────────┐
│  MCP Client │ ──► │  MCP Server  │ ──► │  Node Server  │ ──► │   Chrome    │
│  (Cursor,   │ ◄── │ (webai-mcp)  │ ◄── │(webai-server) │ ◄── │  Extension  │
│  Claude)    │     │              │     │               │     │             │
└─────────────┘     └──────────────┘     └───────────────┘     └─────────────┘
    Tier 1              Tier 2              Tier 3              Tier 4
```

## Target Architecture (3-Tier)
```
┌─────────────┐     ┌──────────────────────────┐     ┌─────────────┐
│  MCP Client │ ──► │    Unified MCP Server    │ ──► │   Chrome    │
│  (Cursor,   │ ◄── │  (webai-mcp + embedded   │ ◄── │  Extension  │
│  Claude)    │     │   webai-server logic)    │     │             │
└─────────────┘     └──────────────────────────┘     └─────────────┘
    Tier 1                    Tier 2                      Tier 3
```

## Phase 1: Dependency Analysis and Preparation

### 1.1 Analyze Current Dependencies

#### webai-mcp dependencies (to keep):
```json
{
  "@modelcontextprotocol/sdk": "^1.4.1",
  "body-parser": "^2.2.0",
  "cors": "^2.8.5", 
  "express": "^5.1.0",
  "llm-cost": "^1.0.5",
  "node-fetch": "^3.3.2",
  "ws": "^8.18.0"
}
```

#### webai-server dependencies (to merge):
```json
{
  "@modelcontextprotocol/sdk": "^1.12.0", // UPDATE VERSION
  "lighthouse": "^12.6.0",                // ADD
  "puppeteer-core": "^24.9.0",           // ADD
  "chrome-launcher": "^1.2.0"            // ADD (optional)
}
```

### 1.2 Update webai-mcp package.json
- Merge all dependencies from webai-server
- Update @modelcontextprotocol/sdk to latest version
- Add new dependencies: lighthouse, puppeteer-core, chrome-launcher
- Update devDependencies with additional types

### 1.3 Create New Directory Structure
```
webai-mcp/
├── src/
│   ├── mcp-server.ts                    # Main MCP server (existing)
│   ├── browser-automation/              # NEW: Embedded webai-server logic
│   │   ├── browser-connector.ts         # Moved from webai-server
│   │   ├── puppeteer-service.ts         # Moved from webai-server  
│   │   ├── auto-paste-manager.ts        # Moved from webai-server
│   │   ├── proxy-config.ts              # Moved from webai-server
│   │   └── websocket-server.ts          # NEW: Extracted WebSocket logic
│   ├── lighthouse/                      # Moved from webai-server
│   │   ├── index.ts
│   │   ├── accessibility.ts
│   │   ├── performance.ts
│   │   ├── seo.ts
│   │   ├── best-practices.ts
│   │   └── types.ts
│   ├── utils/                           # Existing + new utilities
│   └── types/                           # Shared type definitions
├── dist/                                # Compiled output
├── tests/                               # Updated test suite
└── package.json                         # Updated dependencies
```

## Phase 2: Core File Migration

### 2.1 Copy Core Files from webai-server to webai-mcp

#### Files to copy directly:
- `webai-server/puppeteer-service.ts` → `webai-mcp/src/browser-automation/puppeteer-service.ts`
- `webai-server/auto-paste-manager.ts` → `webai-mcp/src/browser-automation/auto-paste-manager.ts`
- `webai-server/proxy-config.ts` → `webai-mcp/src/browser-automation/proxy-config.ts`
- `webai-server/lighthouse/` → `webai-mcp/src/lighthouse/` (entire directory)

#### Files to refactor and copy:
- `webai-server/browser-connector.ts` → Split into multiple files:
  - Core logic → `webai-mcp/src/browser-automation/browser-connector.ts`
  - WebSocket server → `webai-mcp/src/browser-automation/websocket-server.ts`
  - Express endpoints → Integrate directly into mcp-server.ts

### 2.2 Update Import Paths
- Change all relative imports to match new directory structure
- Update module resolution for moved files
- Ensure TypeScript compilation works with new structure

## Phase 3: WebSocket Server Integration

### 3.1 Extract WebSocket Logic from browser-connector.ts

Create `webai-mcp/src/browser-automation/websocket-server.ts`:
```typescript
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Socket } from 'net';

export class ExtensionWebSocketServer {
  private wss: WebSocketServer;
  private activeConnections = new Set<WebSocket>();
  
  constructor(server: any) {
    this.wss = new WebSocketServer({
      noServer: true,
      path: "/extension-ws",
    });
    
    this.setupWebSocketHandlers(server);
  }
  
  private setupWebSocketHandlers(server: any) {
    // Handle upgrade requests for WebSocket
    server.on("upgrade", (request: IncomingMessage, socket: Socket, head: Buffer) => {
      if (request.url === "/extension-ws") {
        this.wss.handleUpgrade(request, socket, head, (ws: WebSocket) => {
          this.wss.emit("connection", ws, request);
        });
      }
    });
    
    // Handle WebSocket connections
    this.wss.on("connection", (ws: WebSocket) => {
      this.activeConnections.add(ws);
      this.setupConnectionHandlers(ws);
    });
  }
  
  // ... rest of WebSocket logic
}
```

### 3.2 Integrate WebSocket Server into MCP Server

Modify `webai-mcp/src/mcp-server.ts`:
```typescript
import { ExtensionWebSocketServer } from './browser-automation/websocket-server.js';
import express from 'express';
import { createServer } from 'http';

// Create Express app for WebSocket server
const expressApp = express();
const httpServer = createServer(expressApp);

// Initialize WebSocket server
const wsServer = new ExtensionWebSocketServer(httpServer);

// Start HTTP server for WebSocket connections
httpServer.listen(discoveredPort, () => {
  console.log(`WebSocket server listening on port ${discoveredPort}`);
});
```

## Phase 4: Replace HTTP Calls with Direct Function Calls

### 4.1 Create Browser Automation Service

Create `webai-mcp/src/browser-automation/browser-service.ts`:
```typescript
import { PuppeteerService } from './puppeteer-service.js';
import { AutoPasteManager } from './auto-paste-manager.js';
import { ProxyManager } from './proxy-config.js';

export class BrowserAutomationService {
  private puppeteerService: PuppeteerService;
  private autoPasteManager: AutoPasteManager;
  private proxyManager: ProxyManager;
  
  constructor() {
    this.puppeteerService = new PuppeteerService();
    this.autoPasteManager = new AutoPasteManager();
    this.proxyManager = ProxyManager.createFromEnvironment();
  }
  
  // Direct methods instead of HTTP endpoints
  async captureScreenshot(options: any) {
    // Direct implementation instead of HTTP call
  }
  
  async runAccessibilityAudit(url: string) {
    // Direct Lighthouse call instead of HTTP endpoint
  }
  
  // ... other methods
}
```

### 4.2 Update MCP Tool Implementations

Replace all HTTP fetch calls in `mcp-server.ts` with direct function calls:

#### Before (HTTP call):
```typescript
server.tool("takeScreenshot", "Take a screenshot", async () => {
  return await withServerConnection(async () => {
    const response = await fetch(
      `http://${discoveredHost}:${discoveredPort}/capture-screenshot`,
      { method: "POST" }
    );
    // ... handle response
  });
});
```

#### After (Direct call):
```typescript
server.tool("takeScreenshot", "Take a screenshot", async () => {
  try {
    const result = await browserService.captureScreenshot();
    return {
      content: [{ type: "text", text: "Screenshot captured successfully" }]
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true
    };
  }
});
```

## Phase 5: Data Storage Integration

### 5.1 Move In-Memory Storage from webai-server

Copy storage arrays and management from `browser-connector.ts`:
```typescript
// Move these from webai-server to webai-mcp
const consoleLogs: any[] = [];
const consoleErrors: any[] = [];
const networkErrors: any[] = [];
const networkSuccess: any[] = [];
let selectedElement: any = null;
let currentUrl: string = "";
let currentTabId: string | number | null = null;
```

### 5.2 Create Data Management Service

Create `webai-mcp/src/browser-automation/data-manager.ts`:
```typescript
export class BrowserDataManager {
  private consoleLogs: any[] = [];
  private consoleErrors: any[] = [];
  private networkErrors: any[] = [];
  private networkSuccess: any[] = [];
  private selectedElement: any = null;
  private currentUrl: string = "";
  private currentTabId: string | number | null = null;
  
  // Methods for data management
  addConsoleLog(log: any) { /* ... */ }
  addNetworkRequest(request: any) { /* ... */ }
  getConsoleLogs() { /* ... */ }
  // ... other methods
}
```

## Phase 6: Express Endpoints Integration

### 6.1 Embed Express Server in MCP Server

Instead of running separate Express server, embed endpoints directly:
```typescript
// In mcp-server.ts
import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

// Create Express app for Chrome extension communication
const extensionApp = express();
extensionApp.use(cors());
extensionApp.use(bodyParser.json({ limit: "50mb" }));

// Add endpoints for Chrome extension
extensionApp.post("/extension-log", (req, res) => {
  // Handle extension logs directly
  dataManager.processExtensionLog(req.body);
  res.json({ status: "ok" });
});

extensionApp.get("/console-logs", (req, res) => {
  res.json(dataManager.getConsoleLogs());
});

// ... other endpoints

// Start Express server alongside MCP
const httpServer = createServer(extensionApp);
httpServer.listen(discoveredPort);
```

## Phase 7: Error Handling and Logging Updates

### 7.1 Unified Error Handling

Update error handling to work with direct function calls instead of HTTP responses:
```typescript
// Remove withServerConnection wrapper
// Replace with direct try/catch in each tool

server.tool("getConsoleLogs", "Get console logs", async () => {
  try {
    const logs = dataManager.getConsoleLogs();
    return {
      content: [{ type: "text", text: JSON.stringify(logs, null, 2) }]
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true
    };
  }
});
```

### 7.2 Update Logging

- Remove server discovery logic (no longer needed)
- Update logging to reflect direct function calls
- Maintain Chrome extension communication logging

## Phase 8: Testing and Validation

### 8.1 Update Test Suite

- Update all tests to work with new architecture
- Test direct function calls instead of HTTP mocking
- Ensure Chrome extension communication still works
- Validate all MCP tools function correctly

### 8.2 Integration Testing

- Test complete flow: MCP Client → Unified Server → Chrome Extension
- Verify WebSocket communication remains intact
- Test all audit tools (accessibility, performance, SEO)
- Validate screenshot capture and auto-paste functionality

## Phase 9: Documentation and Cleanup

### 9.1 Update Documentation

- Update README.md to reflect new architecture
- Update installation instructions (single package)
- Update configuration examples
- Document new unified server structure

### 9.2 Package Cleanup

- Remove webai-server as separate dependency
- Update package.json scripts
- Update build process for new structure
- Ensure proper TypeScript compilation

## Phase 10: Deployment and Migration

### 10.1 Version Management

- Bump major version (2.0.0) to indicate breaking changes
- Maintain backward compatibility where possible
- Provide migration guide for existing users

### 10.2 Release Strategy

- Create release candidate for testing
- Test with multiple MCP clients
- Validate Chrome extension compatibility
- Release stable version with comprehensive documentation

## Expected Benefits After Conversion

1. **Performance**: Eliminate HTTP overhead between MCP and browser automation
2. **Simplicity**: Single package installation (`npx @cpjet64/webai-mcp`)
3. **Reliability**: Fewer network dependencies and points of failure
4. **Maintenance**: Single codebase for core functionality
5. **Resource Usage**: Single Node.js process instead of two

## Risks and Mitigation

1. **Increased Package Size**: Mitigated by optional dependencies
2. **Memory Usage**: Mitigated by proper resource cleanup
3. **Complexity**: Mitigated by clear separation of concerns in code structure
4. **Chrome Extension Compatibility**: Mitigated by maintaining exact WebSocket protocol

## Success Criteria

- [ ] All existing MCP tools work identically
- [ ] Chrome extension connects and functions normally
- [ ] Performance improvement measurable
- [ ] Single package installation works
- [ ] All tests pass
- [ ] Documentation updated and accurate

## Detailed Implementation Steps

### Step 1: Backup and Preparation
1. Create backup branch of current webai-mcp
2. Create new feature branch: `feature/3tier-conversion`
3. Document current functionality for regression testing
4. Set up development environment with both packages

### Step 2: Package.json Updates
```json
{
  "name": "@cpjet64/webai-mcp",
  "version": "2.0.0-beta.1",
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "body-parser": "^2.2.0",
    "cors": "^2.8.5",
    "express": "^5.1.0",
    "lighthouse": "^12.6.0",
    "llm-cost": "^1.0.5",
    "node-fetch": "^3.3.2",
    "puppeteer-core": "^24.9.0",
    "ws": "^8.18.2"
  },
  "optionalDependencies": {
    "chrome-launcher": "^1.2.0"
  }
}
```

### Step 3: Directory Structure Creation
```bash
mkdir -p webai-mcp/src/browser-automation
mkdir -p webai-mcp/src/lighthouse
mkdir -p webai-mcp/src/types
mkdir -p webai-mcp/src/utils
```

### Step 4: File Migration Checklist
- [ ] Copy `puppeteer-service.ts`
- [ ] Copy `auto-paste-manager.ts`
- [ ] Copy `proxy-config.ts`
- [ ] Copy entire `lighthouse/` directory
- [ ] Extract WebSocket logic from `browser-connector.ts`
- [ ] Extract Express endpoints from `browser-connector.ts`
- [ ] Update all import statements

### Step 5: Core Integration Points

#### 5.1 Main Server Initialization
```typescript
// In mcp-server.ts
import { BrowserAutomationService } from './browser-automation/browser-service.js';
import { ExtensionWebSocketServer } from './browser-automation/websocket-server.js';
import { BrowserDataManager } from './browser-automation/data-manager.js';

// Initialize services
const browserService = new BrowserAutomationService();
const dataManager = new BrowserDataManager();
const wsServer = new ExtensionWebSocketServer(httpServer);
```

#### 5.2 Tool Implementation Pattern
```typescript
// Replace HTTP pattern with direct call pattern
server.tool("toolName", "description", schema, async (params) => {
  try {
    const result = await browserService.methodName(params);
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
    };
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true
    };
  }
});
```

### Step 6: Chrome Extension Compatibility

#### 6.1 Maintain Exact WebSocket Protocol
- Keep all message types identical
- Preserve request/response format
- Maintain heartbeat mechanism
- Keep connection handling logic

#### 6.2 HTTP Endpoints for Extension
```typescript
// Preserve these endpoints for Chrome extension
app.post("/extension-log", handleExtensionLog);
app.get("/console-logs", getConsoleLogs);
app.get("/console-errors", getConsoleErrors);
app.get("/network-errors", getNetworkErrors);
app.get("/network-success", getNetworkSuccess);
app.post("/current-url", updateCurrentUrl);
app.get("/current-url", getCurrentUrl);
app.post("/wipelogs", wipeLogs);
app.get("/.identity", getIdentity);
```

### Step 7: Testing Strategy

#### 7.1 Unit Tests
- Test each migrated service independently
- Test MCP tool implementations
- Test WebSocket message handling
- Test data management operations

#### 7.2 Integration Tests
- Test MCP Client → Unified Server flow
- Test Chrome Extension → Unified Server flow
- Test end-to-end screenshot capture
- Test audit tool execution

#### 7.3 Performance Tests
- Measure tool execution time before/after
- Monitor memory usage
- Test concurrent operations
- Validate resource cleanup

### Step 8: Migration Validation

#### 8.1 Functional Validation
- [ ] All 20+ MCP tools execute successfully
- [ ] Chrome extension connects and sends data
- [ ] Screenshots capture and save correctly
- [ ] Lighthouse audits run and return results
- [ ] Browser automation (click, fill, etc.) works
- [ ] Storage access (cookies, localStorage) functions

#### 8.2 Performance Validation
- [ ] Tool execution time improved
- [ ] Memory usage within acceptable limits
- [ ] No resource leaks detected
- [ ] Concurrent operations stable

### Step 9: Documentation Updates

#### 9.1 User Documentation
- Update installation instructions
- Update configuration examples
- Update troubleshooting guide
- Create migration guide from v1.x

#### 9.2 Developer Documentation
- Document new architecture
- Update API documentation
- Create contribution guidelines
- Document testing procedures

### Step 10: Release Process

#### 10.1 Beta Release
1. Release 2.0.0-beta.1 for testing
2. Gather feedback from early adopters
3. Fix any compatibility issues
4. Performance optimization

#### 10.2 Stable Release
1. Release 2.0.0 stable
2. Update npm package
3. Update GitHub releases
4. Announce breaking changes

## Implementation Timeline

- **Week 1**: Setup, dependency updates, directory structure
- **Week 2**: File migration, import updates, basic integration
- **Week 3**: WebSocket integration, Express endpoint embedding
- **Week 4**: Tool implementation updates, direct function calls
- **Week 5**: Testing, debugging, performance optimization
- **Week 6**: Documentation, beta release preparation
- **Week 7**: Beta testing, feedback incorporation
- **Week 8**: Stable release, deployment

## Risk Mitigation Strategies

### Technical Risks
1. **WebSocket conflicts**: Use different ports if needed
2. **Memory leaks**: Implement proper cleanup in all services
3. **Chrome extension breaks**: Maintain exact protocol compatibility
4. **Performance regression**: Benchmark and optimize critical paths

### User Experience Risks
1. **Breaking changes**: Provide clear migration guide
2. **Installation complexity**: Simplify to single command
3. **Configuration changes**: Maintain backward compatibility where possible
4. **Feature loss**: Ensure 100% feature parity

## Rollback Plan

If critical issues arise:
1. Revert to v1.x stable release
2. Fix issues in separate branch
3. Re-release as v2.0.1 with fixes
4. Maintain v1.x support during transition period
