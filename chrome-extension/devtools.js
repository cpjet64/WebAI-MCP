// devtools.js

// Store settings with defaults
let settings = {
  logLimit: 50,
  queryLimit: 30000,
  stringSizeLimit: 500,
  maxLogSize: 20000,
  showRequestHeaders: false,
  showResponseHeaders: false,
  sensitiveDataMode: "hide-all", // hide-all, hide-sensitive, show-all
  screenshotPath: "", // Add new setting for screenshot path
  serverHost: "localhost", // Default server host
  serverPort: 3025, // Default server port
  allowAutoPaste: false, // Default auto-paste setting
  targetIDE: "cursor", // Default target IDE
  customAppName: "", // Custom application name
};

// Keep track of debugger state
let isDebuggerAttached = false;
let attachDebuggerRetries = 0;
const currentTabId = chrome.devtools.inspectedWindow.tabId;
const MAX_ATTACH_RETRIES = 3;
const ATTACH_RETRY_DELAY = 1000; // 1 second

// Sensitive key patterns - these match keys that typically contain sensitive data
const SENSITIVE_KEY_PATTERNS = [
  // Authentication related
  /auth/i,
  /token/i,
  /jwt/i,
  /session/i,
  /api[-_]?key/i,
  /secret/i,
  /password/i,
  /pwd/i,
  /pass/i,
  /credential/i,
  /oauth/i,
  /refresh[-_]?token/i,
  /access[-_]?token/i,
  /private[-_]?key/i,

  // Personal information
  /ssn/i,
  /social[-_]?security/i,
  /dob/i,
  /birth/i,
  /phone/i,
  /address/i,
  /zip/i,
  /postal/i,
  /license/i,
  /credit[-_]?card/i,
  /card[-_]?number/i,
  /cvv/i,
  /ccv/i,

  // Financial
  /bank/i,
  /account/i,
  /payment/i,
  /tax/i,
  /salary/i,
  /income/i,

  // Health related
  /medical/i,
  /insurance/i,
  /diagnos/i,

  // Other common sensitive data keys
  /private/i,
  /confidential/i,
  /secure/i,
  /key/i,
];

// Value patterns that might indicate sensitive data regardless of key name
const SENSITIVE_VALUE_PATTERNS = [
  // JWT token pattern (three base64-encoded segments separated by periods)
  /^ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/,

  // API Keys (various formats)
  /^[A-Za-z0-9_-]{16,128}$/, // generic api key
  /^AKIA[0-9A-Z]{16}$/, // aws access key
  /^[A-Za-z0-9/+=]{40}$/, // aws secret key
  /^sk-[A-Za-z0-9]{32,}$/, // popular api keys
  /^(sk|pk)_(test|live)_[A-Za-z0-9]{24,}$/, // stripe api key
  /^AIza[0-9A-Za-z-_]{35}$/, // google api key
  /^gh[pousr]_[A-Za-z0-9_]{36,255}$/, // github token

  // General API key patterns
  /^[A-Za-z0-9._-]{32,}$/,
  /^[A-Za-z0-9]{8,}[-_][A-Za-z0-9]{4,}[-_][A-Za-z0-9]{4,}[-_][A-Za-z0-9]{4,}[-_][A-Za-z0-9]{12,}$/,

  // OAuth token patterns
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  /^bearer [A-Za-z0-9._-]+$/i, // oauth bearer token

  // Credit card patterns (simplified, real implementation would use Luhn algorithm)
  /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$/,

  // Social Security Number pattern (US)
  /^\d{3}-\d{2}-\d{4}$/,

  // Email addresses
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
];

// Add entropy calculation helper before isSensitiveValue function
function calculateNormalizedEntropy(str) {
  // Create frequency map
  const freq = new Map();
  for (const char of str) {
    freq.set(char, (freq.get(char) || 0) + 1);
  }

  // Calculate entropy using Shannon's formula
  let entropy = 0;
  const len = str.length;
  for (const count of freq.values()) {
    const p = count / len;
    entropy -= p * Math.log2(p);
  }

  // Calculate normalized entropy
  const uniqueChars = new Set(str).size;
  if (uniqueChars === 0) {
    return 0;
  }
  const maxEntropy = Math.log2(uniqueChars);
  return entropy / maxEntropy;
}

function isSensitiveValue(value) {
  // Only check strings
  if (typeof value !== "string") return false;

  // Skip very short values
  if (value.length < 8) return false;

  // Check against regex patterns first
  if (SENSITIVE_VALUE_PATTERNS.some((pattern) => pattern.test(value))) {
    return true;
  }

  // Entropy-based checks
  if (value.length > 16) {
    const normalizedEntropy = calculateNormalizedEntropy(value);
    // Strings which achieve > 65% of their maximum possible entropy are likely to contain sensitive data
    if (normalizedEntropy > 0.65) {
      return true;
    }
  }

  return false;
}

function isSensitiveKey(key) {
  return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
}

function filterSensitiveCookies(cookies) {
  if (!Array.isArray(cookies)) return [];

  return cookies.map((cookie) => {
    if (!cookie || typeof cookie !== "object") return cookie;

    const { name, value } = cookie;

    if (
      settings.sensitiveDataMode === "hide-all" ||
      (settings.sensitiveDataMode === "hide-sensitive" &&
        (isSensitiveKey(name) || isSensitiveValue(value)))
    ) {
      return {
        ...cookie,
        value: "[SENSITIVE DATA REDACTED]",
      };
    }

    return cookie;
  });
}

function filterSensitiveStorage(storage) {
  if (!storage || typeof storage !== "object") return {};

  const result = {};

  for (const [key, value] of Object.entries(storage)) {
    if (
      settings.sensitiveDataMode === "hide-all" ||
      (settings.sensitiveDataMode === "hide-sensitive" &&
        (isSensitiveKey(key) || isSensitiveValue(value)))
    ) {
      result[key] = "[SENSITIVE DATA REDACTED]";
    } else {
      result[key] = value;
    }
  }

  return result;
}

function filterSensitiveInString(text) {
  if (typeof text !== "string") return text;

  // If hide-all mode, redact everything that looks sensitive
  if (settings.sensitiveDataMode === "hide-all") {
    // Replace potential sensitive patterns with redacted text
    return text
      .replace(/ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[JWT_TOKEN_REDACTED]")
      .replace(/sk-[A-Za-z0-9]{32,}/g, "[API_KEY_REDACTED]")
      .replace(/AKIA[0-9A-Z]{16}/g, "[AWS_KEY_REDACTED]")
      .replace(/gh[pousr]_[A-Za-z0-9_]{36,255}/g, "[GITHUB_TOKEN_REDACTED]")
      .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, "[EMAIL_REDACTED]")
      .replace(/\d{3}-\d{2}-\d{4}/g, "[SSN_REDACTED]")
      .replace(/(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})/g, "[CREDIT_CARD_REDACTED]");
  }

  // If hide-sensitive mode, only redact obvious sensitive patterns
  if (settings.sensitiveDataMode === "hide-sensitive") {
    return text
      .replace(/ey[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, "[JWT_TOKEN_REDACTED]")
      .replace(/sk-[A-Za-z0-9]{32,}/g, "[API_KEY_REDACTED]")
      .replace(/AKIA[0-9A-Z]{16}/g, "[AWS_KEY_REDACTED]")
      .replace(/gh[pousr]_[A-Za-z0-9_]{36,255}/g, "[GITHUB_TOKEN_REDACTED]")
      .replace(/\d{3}-\d{2}-\d{4}/g, "[SSN_REDACTED]")
      .replace(/(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})/g, "[CREDIT_CARD_REDACTED]");
  }

  // If show-all mode, return original text
  return text;
}

// Load saved settings on startup
chrome.storage.local.get(["browserConnectorSettings"], (result) => {
  if (result.browserConnectorSettings) {
    settings = { ...settings, ...result.browserConnectorSettings };
  }
});

// Listen for settings updates
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "SETTINGS_UPDATED") {
    settings = message.settings;

    // If server settings changed and we have a WebSocket, reconnect
    if (
      ws &&
      (message.settings.serverHost !== settings.serverHost ||
        message.settings.serverPort !== settings.serverPort)
    ) {
      console.log("Server settings changed, reconnecting WebSocket...");
      setupWebSocket();
    }
  }

  // Handle connection status updates from page refreshes
  if (message.type === "CONNECTION_STATUS_UPDATE") {
    console.log(
      `DevTools received connection status update: ${
        message.isConnected ? "Connected" : "Disconnected"
      }`
    );

    // If connection is lost, try to reestablish WebSocket only if we had a previous connection
    if (!message.isConnected && ws) {
      console.log(
        "Connection lost after page refresh, will attempt to reconnect WebSocket"
      );

      // Only reconnect if we actually have a WebSocket that might be stale
      if (
        ws &&
        (ws.readyState === WebSocket.CLOSED ||
          ws.readyState === WebSocket.CLOSING)
      ) {
        console.log("WebSocket is already closed or closing, will reconnect");
        setupWebSocket();
      }
    }
  }

  // Handle auto-discovery requests after page refreshes
  if (message.type === "INITIATE_AUTO_DISCOVERY") {
    console.log(
      `DevTools initiating WebSocket reconnect after page refresh (reason: ${message.reason})`
    );

    // For page refreshes with forceRestart, we should always reconnect if our current connection is not working
    if (
      (message.reason === "page_refresh" || message.forceRestart === true) &&
      (!ws || ws.readyState !== WebSocket.OPEN)
    ) {
      console.log(
        "Page refreshed and WebSocket not open - forcing reconnection"
      );

      // Close existing WebSocket if any
      if (ws) {
        console.log("Closing existing WebSocket due to page refresh");
        intentionalClosure = true; // Mark as intentional to prevent auto-reconnect
        try {
          ws.close();
        } catch (e) {
          console.error("Error closing WebSocket:", e);
        }
        ws = null;
        intentionalClosure = false; // Reset flag
      }

      // Clear any pending reconnect timeouts
      if (wsReconnectTimeout) {
        clearTimeout(wsReconnectTimeout);
        wsReconnectTimeout = null;
      }

      // Try to reestablish the WebSocket connection
      setupWebSocket();
    }
  }
});

// Utility to recursively truncate strings in any data structure
function truncateStringsInData(data, maxLength, depth = 0, path = "") {
  // Add depth limit to prevent circular references
  if (depth > 100) {
    console.warn("Max depth exceeded at path:", path);
    return "[MAX_DEPTH_EXCEEDED]";
  }

  console.log(`Processing at path: ${path}, type:`, typeof data);

  if (typeof data === "string") {
    if (data.length > maxLength) {
      console.log(
        `Truncating string at path ${path} from ${data.length} to ${maxLength}`
      );
      return data.substring(0, maxLength) + "... (truncated)";
    }
    return data;
  }

  if (Array.isArray(data)) {
    console.log(`Processing array at path ${path} with length:`, data.length);
    return data.map((item, index) =>
      truncateStringsInData(item, maxLength, depth + 1, `${path}[${index}]`)
    );
  }

  if (typeof data === "object" && data !== null) {
    console.log(
      `Processing object at path ${path} with keys:`,
      Object.keys(data)
    );
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      try {
        result[key] = truncateStringsInData(
          value,
          maxLength,
          depth + 1,
          path ? `${path}.${key}` : key
        );
      } catch (e) {
        console.error(`Error processing key ${key} at path ${path}:`, e);
        result[key] = "[ERROR_PROCESSING]";
      }
    }
    return result;
  }

  return data;
}

// Helper to calculate the size of an object
function calculateObjectSize(obj) {
  return JSON.stringify(obj).length;
}

// Helper to process array of objects with size limit
function processArrayWithSizeLimit(array, maxTotalSize, processFunc) {
  let currentSize = 0;
  const result = [];

  for (const item of array) {
    // Process the item first
    const processedItem = processFunc(item);
    const itemSize = calculateObjectSize(processedItem);

    // Check if adding this item would exceed the limit
    if (currentSize + itemSize > maxTotalSize) {
      console.log(
        `Reached size limit (${currentSize}/${maxTotalSize}), truncating array`
      );
      break;
    }

    // Add item and update size
    result.push(processedItem);
    currentSize += itemSize;
    console.log(
      `Added item of size ${itemSize}, total size now: ${currentSize}`
    );
  }

  return result;
}

// Modified processJsonString to handle arrays with size limit
function processJsonString(jsonString, maxLength) {
  console.log("Processing string of length:", jsonString?.length);
  try {
    let parsed;
    try {
      parsed = JSON.parse(jsonString);
      console.log(
        "Successfully parsed as JSON, structure:",
        JSON.stringify(Object.keys(parsed))
      );
    } catch (e) {
      console.log("Not valid JSON, treating as string");
      return truncateStringsInData(jsonString, maxLength, 0, "root");
    }

    // If it's an array, process with size limit
    if (Array.isArray(parsed)) {
      console.log("Processing array of objects with size limit");
      const processed = processArrayWithSizeLimit(
        parsed,
        settings.maxLogSize,
        (item) => truncateStringsInData(item, maxLength, 0, "root")
      );
      const result = JSON.stringify(processed);
      console.log(
        `Processed array: ${parsed.length} -> ${processed.length} items`
      );
      return result;
    }

    // Otherwise process as before
    const processed = truncateStringsInData(parsed, maxLength, 0, "root");
    const result = JSON.stringify(processed);
    console.log("Processed JSON string length:", result.length);
    return result;
  } catch (e) {
    console.error("Error in processJsonString:", e);
    return jsonString.substring(0, maxLength) + "... (truncated)";
  }
}

// Helper to send logs to browser-connector
async function sendToBrowserConnector(logData) {
  if (!logData) {
    console.error("No log data provided to sendToBrowserConnector");
    return;
  }

  // First, ensure we're connecting to the right server
  if (!(await validateServerIdentity())) {
    console.error(
      "Cannot send logs: Not connected to a valid browser tools server"
    );
    return;
  }

  console.log("Sending log data to browser connector:", {
    type: logData.type,
    timestamp: logData.timestamp,
  });

  // Process any string fields that might contain JSON
  const processedData = { ...logData };

  if (logData.type === "network-request") {
    console.log("Processing network request");
    if (processedData.requestBody) {
      console.log(
        "Request body size before:",
        processedData.requestBody.length
      );

      // Apply sensitive data filtering to request bodies
      if (settings.sensitiveDataMode !== "show-all") {
        console.log("Chrome Extension: Filtering sensitive request body data");
        processedData.requestBody = filterSensitiveInString(processedData.requestBody);
      }

      processedData.requestBody = processJsonString(
        processedData.requestBody,
        settings.stringSizeLimit
      );
      console.log("Request body size after:", processedData.requestBody.length);
    }
    if (processedData.responseBody) {
      console.log(
        "Response body size before:",
        processedData.responseBody.length
      );

      // Apply sensitive data filtering to response bodies
      if (settings.sensitiveDataMode !== "show-all") {
        console.log("Chrome Extension: Filtering sensitive response body data");
        processedData.responseBody = filterSensitiveInString(processedData.responseBody);
      }

      processedData.responseBody = processJsonString(
        processedData.responseBody,
        settings.stringSizeLimit
      );
      console.log(
        "Response body size after:",
        processedData.responseBody.length
      );
    }
  } else if (
    logData.type === "console-log" ||
    logData.type === "console-error"
  ) {
    console.log("Processing console message");
    if (processedData.message) {
      console.log("Message size before:", processedData.message.length);

      // Apply sensitive data filtering to console messages
      if (settings.sensitiveDataMode !== "show-all") {
        console.log("Chrome Extension: Filtering sensitive console data");
        processedData.message = filterSensitiveInString(processedData.message);
      }

      processedData.message = processJsonString(
        processedData.message,
        settings.stringSizeLimit
      );
      console.log("Message size after:", processedData.message.length);
    }
  }

  // Add settings to the request
  const payload = {
    data: {
      ...processedData,
      timestamp: Date.now(),
    },
    settings: {
      logLimit: settings.logLimit,
      queryLimit: settings.queryLimit,
      showRequestHeaders: settings.showRequestHeaders,
      showResponseHeaders: settings.showResponseHeaders,
      sensitiveDataMode: settings.sensitiveDataMode,
    },
  };

  const finalPayloadSize = JSON.stringify(payload).length;
  console.log("Final payload size:", finalPayloadSize);

  if (finalPayloadSize > 1000000) {
    console.warn("Warning: Large payload detected:", finalPayloadSize);
    console.warn(
      "Payload preview:",
      JSON.stringify(payload).substring(0, 1000) + "..."
    );
  }

  const serverUrl = `http://${settings.serverHost}:${settings.serverPort}/extension-log`;
  console.log(`Sending log to ${serverUrl}`);

  fetch(serverUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Log sent successfully:", data);
    })
    .catch((error) => {
      console.error("Error sending log:", error);
    });
}

// Validate server identity
async function validateServerIdentity() {
  try {
    console.log(
      `Validating server identity at ${settings.serverHost}:${settings.serverPort}...`
    );

    // Use fetch with a timeout to prevent long-hanging requests
    const response = await fetch(
      `http://${settings.serverHost}:${settings.serverPort}/.identity`,
      {
        signal: AbortSignal.timeout(3000), // 3 second timeout
      }
    );

    if (!response.ok) {
      console.error(
        `Server identity validation failed: HTTP ${response.status}`
      );

      // Notify about the connection failure
      chrome.runtime.sendMessage({
        type: "SERVER_VALIDATION_FAILED",
        reason: "http_error",
        status: response.status,
        serverHost: settings.serverHost,
        serverPort: settings.serverPort,
      });

      return false;
    }

    const identity = await response.json();

    // Validate signature
    if (identity.signature !== "mcp-browser-connector-24x7") {
      console.error("Server identity validation failed: Invalid signature");

      // Notify about the invalid signature
      chrome.runtime.sendMessage({
        type: "SERVER_VALIDATION_FAILED",
        reason: "invalid_signature",
        serverHost: settings.serverHost,
        serverPort: settings.serverPort,
      });

      return false;
    }

    console.log(
      `Server identity confirmed: ${identity.name} v${identity.version}`
    );

    // Notify about successful validation
    chrome.runtime.sendMessage({
      type: "SERVER_VALIDATION_SUCCESS",
      serverInfo: identity,
      serverHost: settings.serverHost,
      serverPort: settings.serverPort,
    });

    return true;
  } catch (error) {
    console.error("Server identity validation failed:", error);

    // Notify about the connection error
    chrome.runtime.sendMessage({
      type: "SERVER_VALIDATION_FAILED",
      reason: "connection_error",
      error: error.message,
      serverHost: settings.serverHost,
      serverPort: settings.serverPort,
    });

    return false;
  }
}

// Function to clear logs on the server
function wipeLogs() {
  console.log("Wiping all logs...");

  const serverUrl = `http://${settings.serverHost}:${settings.serverPort}/wipelogs`;
  console.log(`Sending wipe request to ${serverUrl}`);

  fetch(serverUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Logs wiped successfully:", data);
    })
    .catch((error) => {
      console.error("Error wiping logs:", error);
    });
}

// Listen for page refreshes
chrome.devtools.network.onNavigated.addListener((url) => {
  console.log("Page navigated/refreshed - wiping logs");
  wipeLogs();

  // Send the new URL to the server
  if (ws && ws.readyState === WebSocket.OPEN && url) {
    console.log(
      "Chrome Extension: Sending page-navigated event with URL:",
      url
    );
    ws.send(
      JSON.stringify({
        type: "page-navigated",
        url: url,
        tabId: chrome.devtools.inspectedWindow.tabId,
        timestamp: Date.now(),
      })
    );
  }
});

// 1) Listen for network requests
chrome.devtools.network.onRequestFinished.addListener((request) => {
  if (request._resourceType === "xhr" || request._resourceType === "fetch") {
    request.getContent((responseBody) => {
      const entry = {
        type: "network-request",
        url: request.request.url,
        method: request.request.method,
        status: request.response.status,
        requestHeaders: request.request.headers,
        responseHeaders: request.response.headers,
        requestBody: request.request.postData?.text ?? "",
        responseBody: responseBody ?? "",
      };
      sendToBrowserConnector(entry);
    });
  }
});

// Helper function to attach debugger
async function attachDebugger() {
  // First check if we're already attached to this tab
  chrome.debugger.getTargets((targets) => {
    const isAlreadyAttached = targets.some(
      (target) => target.tabId === currentTabId && target.attached
    );

    if (isAlreadyAttached) {
      console.log("Found existing debugger attachment, detaching first...");
      // Force detach first to ensure clean state
      chrome.debugger.detach({ tabId: currentTabId }, () => {
        // Ignore any errors during detach
        if (chrome.runtime.lastError) {
          console.log("Error during forced detach:", chrome.runtime.lastError);
        }
        // Now proceed with fresh attachment
        performAttach();
      });
    } else {
      // No existing attachment, proceed directly
      performAttach();
    }
  });
}

function performAttach() {
  console.log("Performing debugger attachment to tab:", currentTabId);
  chrome.debugger.attach({ tabId: currentTabId }, "1.3", () => {
    if (chrome.runtime.lastError) {
      console.error("Failed to attach debugger:", chrome.runtime.lastError);
      isDebuggerAttached = false;
      return;
    }

    isDebuggerAttached = true;
    console.log("Debugger successfully attached");

    // Add the event listener when attaching
    chrome.debugger.onEvent.addListener(consoleMessageListener);

    chrome.debugger.sendCommand(
      { tabId: currentTabId },
      "Runtime.enable",
      {},
      () => {
        if (chrome.runtime.lastError) {
          console.error("Failed to enable runtime:", chrome.runtime.lastError);
          return;
        }
        console.log("Runtime API successfully enabled");
      }
    );
  });
}

// Helper function to detach debugger
function detachDebugger() {
  // Remove the event listener first
  chrome.debugger.onEvent.removeListener(consoleMessageListener);

  // Check if debugger is actually attached before trying to detach
  chrome.debugger.getTargets((targets) => {
    const isStillAttached = targets.some(
      (target) => target.tabId === currentTabId && target.attached
    );

    if (!isStillAttached) {
      console.log("Debugger already detached");
      isDebuggerAttached = false;
      return;
    }

    chrome.debugger.detach({ tabId: currentTabId }, () => {
      if (chrome.runtime.lastError) {
        console.warn(
          "Warning during debugger detach:",
          chrome.runtime.lastError
        );
      }
      isDebuggerAttached = false;
      console.log("Debugger detached");
    });
  });
}

// Move the console message listener outside the panel creation
const consoleMessageListener = (source, method, params) => {
  // Only process events for our tab
  if (source.tabId !== currentTabId) {
    return;
  }

  if (method === "Runtime.exceptionThrown") {
    const entry = {
      type: "console-error",
      message:
        params.exceptionDetails.exception?.description ||
        JSON.stringify(params.exceptionDetails),
      level: "error",
      timestamp: Date.now(),
    };
    console.log("Sending runtime exception:", entry);
    sendToBrowserConnector(entry);
  }

  if (method === "Runtime.consoleAPICalled") {
    // Process all arguments from the console call
    let formattedMessage = "";
    const args = params.args || [];

    // Extract all arguments and combine them
    if (args.length > 0) {
      // Try to build a meaningful representation of all arguments
      try {
        formattedMessage = args
          .map((arg) => {
            // Handle different types of arguments
            if (arg.type === "string") {
              return arg.value;
            } else if (arg.type === "object" && arg.preview) {
              // For objects, include their preview or description
              return JSON.stringify(arg.preview);
            } else if (arg.description) {
              // Some objects have descriptions
              return arg.description;
            } else {
              // Fallback for other types
              return arg.value || arg.description || JSON.stringify(arg);
            }
          })
          .join(" ");
      } catch (e) {
        // Fallback if processing fails
        console.error("Failed to process console arguments:", e);
        formattedMessage =
          args[0]?.value || "Unable to process console arguments";
      }
    }

    const entry = {
      type: params.type === "error" ? "console-error" : "console-log",
      level: params.type,
      message: formattedMessage,
      timestamp: Date.now(),
    };
    console.log("Sending console entry:", entry);
    sendToBrowserConnector(entry);
  }
};

// 2) Use DevTools Protocol to capture console logs
chrome.devtools.panels.create("WebAI MCP", "", "panel.html", (panel) => {
  // Initial attach - we'll keep the debugger attached as long as DevTools is open
  attachDebugger();

  // Handle panel showing
  panel.onShown.addListener((panelWindow) => {
    if (!isDebuggerAttached) {
      attachDebugger();
    }
  });
});

// Clean up when DevTools closes
window.addEventListener("unload", () => {
  // Detach debugger
  detachDebugger();

  // Set intentional closure flag before closing
  intentionalClosure = true;

  if (ws) {
    try {
      ws.close();
    } catch (e) {
      console.error("Error closing WebSocket during unload:", e);
    }
    ws = null;
  }

  if (wsReconnectTimeout) {
    clearTimeout(wsReconnectTimeout);
    wsReconnectTimeout = null;
  }

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
});

// Function to capture and send element data
function captureAndSendElement() {
  chrome.devtools.inspectedWindow.eval(
    `(function() {
      const el = $0;  // $0 is the currently selected element in DevTools
      if (!el) return null;

      const rect = el.getBoundingClientRect();

      return {
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        textContent: el.textContent?.substring(0, 100),
        attributes: Array.from(el.attributes).map(attr => ({
          name: attr.name,
          value: attr.value
        })),
        dimensions: {
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left
        },
        innerHTML: el.innerHTML.substring(0, ${settings.stringSizeLimit})
      };
    })()`,
    (result, isException) => {
      if (isException || !result) return;

      console.log("Element selected:", result);

      // Send to browser connector
      sendToBrowserConnector({
        type: "selected-element",
        timestamp: Date.now(),
        element: result,
      });
    }
  );
}

// Listen for element selection in the Elements panel
chrome.devtools.panels.elements.onSelectionChanged.addListener(() => {
  captureAndSendElement();
});

// WebSocket connection management
let ws = null;
let wsReconnectTimeout = null;
let heartbeatInterval = null;
const WS_RECONNECT_DELAY = 5000; // 5 seconds
const HEARTBEAT_INTERVAL = 30000; // 30 seconds
// Add a flag to track if we need to reconnect after identity validation
let reconnectAfterValidation = false;
// Track if we're intentionally closing the connection
let intentionalClosure = false;

// Function to send a heartbeat to keep the WebSocket connection alive
function sendHeartbeat() {
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log("Chrome Extension: Sending WebSocket heartbeat");
    ws.send(JSON.stringify({ type: "heartbeat" }));
  }
}

async function setupWebSocket() {
  // Clear any pending timeouts
  if (wsReconnectTimeout) {
    clearTimeout(wsReconnectTimeout);
    wsReconnectTimeout = null;
  }

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }

  // Close existing WebSocket if any
  if (ws) {
    // Set flag to indicate this is an intentional closure
    intentionalClosure = true;
    try {
      ws.close();
    } catch (e) {
      console.error("Error closing existing WebSocket:", e);
    }
    ws = null;
    intentionalClosure = false; // Reset flag
  }

  // Validate server identity before connecting
  console.log("Validating server identity before WebSocket connection...");
  const isValid = await validateServerIdentity();

  if (!isValid) {
    console.error(
      "Cannot establish WebSocket: Not connected to a valid browser tools server"
    );
    // Set flag to indicate we need to reconnect after a page refresh check
    reconnectAfterValidation = true;

    // Try again after delay
    wsReconnectTimeout = setTimeout(() => {
      console.log("Attempting to reconnect WebSocket after validation failure");
      setupWebSocket();
    }, WS_RECONNECT_DELAY);
    return;
  }

  // Reset reconnect flag since validation succeeded
  reconnectAfterValidation = false;

  const wsUrl = `ws://${settings.serverHost}:${settings.serverPort}/extension-ws`;
  console.log(`Connecting to WebSocket at ${wsUrl}`);

  try {
    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log(`Chrome Extension: WebSocket connected to ${wsUrl}`);

      // Start heartbeat to keep connection alive
      heartbeatInterval = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

      // Notify that connection is successful
      chrome.runtime.sendMessage({
        type: "WEBSOCKET_CONNECTED",
        serverHost: settings.serverHost,
        serverPort: settings.serverPort,
      });

      // Send the current URL to the server right after connection
      // This ensures the server has the URL even if no navigation occurs
      chrome.runtime.sendMessage(
        {
          type: "GET_CURRENT_URL",
          tabId: chrome.devtools.inspectedWindow.tabId,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Chrome Extension: Error getting URL from background on connection:",
              chrome.runtime.lastError
            );

            // If normal method fails, try fallback to chrome.tabs API directly
            tryFallbackGetUrl();
            return;
          }

          if (response && response.url) {
            console.log(
              "Chrome Extension: Sending initial URL to server:",
              response.url
            );

            // Send the URL to the server via the background script
            chrome.runtime.sendMessage({
              type: "UPDATE_SERVER_URL",
              tabId: chrome.devtools.inspectedWindow.tabId,
              url: response.url,
              source: "initial_connection",
            });
          } else {
            // If response exists but no URL, try fallback
            tryFallbackGetUrl();
          }
        }
      );

      // Fallback method to get URL directly
      function tryFallbackGetUrl() {
        console.log("Chrome Extension: Trying fallback method to get URL");

        // Try to get the URL directly using the tabs API
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Chrome Extension: Fallback URL retrieval failed:",
              chrome.runtime.lastError
            );
            return;
          }

          if (tabs && tabs.length > 0 && tabs[0].url) {
            console.log(
              "Chrome Extension: Got URL via fallback method:",
              tabs[0].url
            );

            // Send the URL to the server
            chrome.runtime.sendMessage({
              type: "UPDATE_SERVER_URL",
              tabId: chrome.devtools.inspectedWindow.tabId,
              url: tabs[0].url,
              source: "fallback_method",
            });
          } else {
            console.warn(
              "Chrome Extension: Could not retrieve URL through fallback method"
            );
          }
        });
      }
    };

    ws.onerror = (error) => {
      console.error(`Chrome Extension: WebSocket error for ${wsUrl}:`, error);
    };

    ws.onclose = (event) => {
      console.log(`Chrome Extension: WebSocket closed for ${wsUrl}:`, event);

      // Stop heartbeat
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
      }

      // Don't reconnect if this was an intentional closure
      if (intentionalClosure) {
        console.log(
          "Chrome Extension: Intentional WebSocket closure, not reconnecting"
        );
        return;
      }

      // Only attempt to reconnect if the closure wasn't intentional
      // Code 1000 (Normal Closure) and 1001 (Going Away) are normal closures
      // Code 1005 often happens with clean closures in Chrome
      const isAbnormalClosure = !(event.code === 1000 || event.code === 1001);

      // Check if this was an abnormal closure or if we need to reconnect after validation
      if (isAbnormalClosure || reconnectAfterValidation) {
        console.log(
          `Chrome Extension: Will attempt to reconnect WebSocket (closure code: ${event.code})`
        );

        // Try to reconnect after delay
        wsReconnectTimeout = setTimeout(() => {
          console.log(
            `Chrome Extension: Attempting to reconnect WebSocket to ${wsUrl}`
          );
          setupWebSocket();
        }, WS_RECONNECT_DELAY);
      } else {
        console.log(
          `Chrome Extension: Normal WebSocket closure, not reconnecting automatically`
        );
      }
    };

    ws.onmessage = async (event) => {
      try {
        const message = JSON.parse(event.data);

        // Don't log heartbeat responses to reduce noise
        if (message.type !== "heartbeat-response") {
          console.log("Chrome Extension: Received WebSocket message:", message);

          if (message.type === "server-shutdown") {
            console.log("Chrome Extension: Received server shutdown signal");
            // Clear any reconnection attempts
            if (wsReconnectTimeout) {
              clearTimeout(wsReconnectTimeout);
              wsReconnectTimeout = null;
            }
            // Close the connection gracefully
            ws.close(1000, "Server shutting down");
            return;
          }
        }

        if (message.type === "heartbeat-response") {
          // Just a heartbeat response, no action needed
          // Uncomment the next line for debug purposes only
          // console.log("Chrome Extension: Received heartbeat response");
        } else if (message.type === "take-screenshot") {
          console.log("Chrome Extension: Taking screenshot...");

          // Try to capture screenshot directly first
          chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
            if (chrome.runtime.lastError) {
              console.log(
                "Chrome Extension: Direct screenshot capture failed, delegating to background:",
                chrome.runtime.lastError.message
              );

              // If direct capture fails (e.g., DevTools in separate window), delegate to background
              chrome.runtime.sendMessage(
                {
                  type: "DELEGATE_SCREENSHOT",
                  tabId: chrome.devtools.inspectedWindow.tabId,
                },
                (response) => {
                  if (chrome.runtime.lastError) {
                    console.error(
                      "Chrome Extension: Background screenshot delegation failed:",
                      chrome.runtime.lastError
                    );
                    ws.send(
                      JSON.stringify({
                        type: "screenshot-error",
                        error: chrome.runtime.lastError.message,
                        requestId: message.requestId,
                      })
                    );
                    return;
                  }

                  if (response && response.success && response.dataUrl) {
                    console.log("Chrome Extension: Background screenshot captured successfully");
                    const screenshotResponse = {
                      type: "screenshot-data",
                      data: response.dataUrl,
                      requestId: message.requestId,
                      // Only include path if it's configured in settings
                      ...(settings.screenshotPath && { path: settings.screenshotPath }),
                      // Include auto-paste settings
                      autoPaste: settings.allowAutoPaste,
                      targetIDE: settings.targetIDE,
                      customAppName: settings.customAppName,
                    };

                    console.log("Chrome Extension: Sending background screenshot data response", {
                      ...screenshotResponse,
                      data: "[base64 data]",
                    });

                    ws.send(JSON.stringify(screenshotResponse));
                  } else {
                    console.error("Chrome Extension: Background screenshot failed:", response?.error);
                    ws.send(
                      JSON.stringify({
                        type: "screenshot-error",
                        error: response?.error || "Background screenshot capture failed",
                        requestId: message.requestId,
                      })
                    );
                  }
                }
              );
              return;
            }

            console.log("Chrome Extension: Direct screenshot captured successfully");
            // Just send the screenshot data, let the server handle paths
            const response = {
              type: "screenshot-data",
              data: dataUrl,
              requestId: message.requestId,
              // Only include path if it's configured in settings
              ...(settings.screenshotPath && { path: settings.screenshotPath }),
              // Include auto-paste settings
              autoPaste: settings.allowAutoPaste,
              targetIDE: settings.targetIDE,
              customAppName: settings.customAppName,
            };

            console.log("Chrome Extension: Sending direct screenshot data response", {
              ...response,
              data: "[base64 data]",
            });

            ws.send(JSON.stringify(response));
          });
        } else if (message.type === "inspect-elements-by-selector") {
          console.log("Chrome Extension: Received request for inspecting elements by selector:", message.selector);
          const resultLimit = message.resultLimit || 1;
          const includeComputedStyles = message.includeComputedStyles || [];

          // Define the inspection function separately for better readability
          const inspectionFunction = function(selector, limit, includeComputedStyles) {
            try {
              // Find all elements matching the selector
              const elements = document.querySelectorAll(selector);

              if (elements.length === 0) {
                return { error: "No elements found matching selector" };
              }

              // Calculate specificity of a selector (simplified)
              function calculateSpecificity(selector) {
                let specificity = 0;
                const idCount = (selector.match(/#[\w-]+/g) || []).length;
                const classCount = (selector.match(/\.[\w-]+/g) || []).length;
                const elementCount = (selector.match(/[a-z][\w-]*/ig) || []).length -
                                    (selector.match(/:[a-z][\w-]*/ig) || []).length;

                return idCount * 100 + classCount * 10 + elementCount;
              }

              // FNV-1a hash function implementation
              function fnv1a(str) {
                let h = 0x811c9dc5;
                for (let i = 0; i < str.length; i++) {
                  h ^= str.charCodeAt(i);
                  h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
                }
                // Convert to base36 string representation for readability and compactness
                return (h >>> 0).toString(36);
              }

              function getStartTag(element) {
                if (!element || !element.outerHTML) {
                  return "";
                }

                let outerHTML = element.outerHTML;
                const tagName = element.tagName.toLowerCase();
                const closingTag = `</${tagName}>`;

                if (outerHTML.endsWith(closingTag)) {
                  outerHTML = outerHTML.slice(0, outerHTML.length - closingTag.length);
                }

                const startTag = outerHTML.replace(element.innerHTML, "");
                return startTag;
              }

              // Storage for HTML and rule hashes to avoid duplication
              const htmlStore = {};
              const ruleStore = {};
              const seenHtml = new Set();
              const seenRules = new Set();

              // Process a single element to get its HTML and CSS details
              function processElement(element, index) {
                // Get the HTML and hash it
                const html = element.outerHTML;
                const htmlHash = fnv1a(html);

                // Store the HTML if we haven't seen it before
                let seenHtmlBefore = false;
                if (!seenHtml.has(htmlHash)) {
                  htmlStore[htmlHash] = html;
                  seenHtml.add(htmlHash);
                } else {
                  seenHtmlBefore = true;
                }

                // Get computed styles if requested
                let computedStyles;
                if (Array.isArray(includeComputedStyles) && includeComputedStyles.length > 0) {
                  computedStyles = {};
                  const styles = window.getComputedStyle(element);
                  for (const prop of includeComputedStyles) {
                    if (prop in styles) {
                      computedStyles[prop] = styles.getPropertyValue(prop);
                    }
                  }
                }

                // Find matching rules
                const matchedRules = [];

                for (let i = 0; i < document.styleSheets.length; i++) {
                  try {
                    const sheet = document.styleSheets[i];
                    let rules = [];

                    try {
                      rules = sheet.cssRules || sheet.rules || [];
                    } catch (e) {
                      // Skip cross-origin stylesheets
                      continue;
                    }

                    // Determine stylesheet origin
                    let originType = 'author';
                    if (sheet.href && (
                      sheet.href.includes('user-agent') ||
                      sheet.href.includes('chrome://') ||
                      !sheet.ownerNode)) {
                      originType = 'user-agent';
                    }

                    for (let j = 0; j < rules.length; j++) {
                      const rule = rules[j];

                      try {
                        if (rule.selectorText && element.matches(rule.selectorText)) {
                          matchedRules.push({
                            cssText: rule.cssText,
                            styleSheet: {
                              href: sheet.href || 'inline',
                              index: i,
                              // Include style tag's attributes. This may be needed for CSS-in-JS solutions'
                              ...(!sheet.href && { tag: getStartTag(sheet.ownerNode) })
                            },
                            specificity: calculateSpecificity(rule.selectorText),
                          });
                        }
                      } catch (e) {
                        // Skip non-standard rules
                        continue;
                      }
                    }
                  } catch (e) {
                    // Skip inaccessible stylesheets
                    continue;
                  }
                }

                // Sort rules by specificity (higher values first)
                matchedRules.sort((a, b) => {
                  if (b.specificity === a.specificity) {
                    return b.styleSheet.index - a.styleSheet.index;
                  }
                  return b.specificity - a.specificity
                });

                // Hash the entire matchedRules array
                const rulesJson = JSON.stringify(matchedRules);
                const rulesHash = fnv1a(rulesJson);

                // Store the rules if we haven't seen this exact set before
                let seenRulesBefore = false;
                if (!seenRules.has(rulesHash)) {
                  ruleStore[rulesHash] = matchedRules;
                  seenRules.add(rulesHash);
                } else {
                  seenRulesBefore = true;
                }

                return {
                  index: index,
                  // Only send full HTML if it's the first occurrence
                  ...(!seenHtmlBefore && { html }),
                  htmlHash: htmlHash,
                  // Include minimal dimensional info that isn't in the HTML
                  dimensions: {
                    offsetWidth: element.offsetWidth,
                    offsetHeight: element.offsetHeight,
                    clientWidth: element.clientWidth,
                    clientHeight: element.clientHeight
                  },
                  boundingClientRect: element.getBoundingClientRect(),
                  styles: {
                    // Only include full rules if it's the first occurrence
                    ...(!seenRulesBefore && { matchedRules }),
                    matchedRulesHash: rulesHash,
                    computedStyles,
                  }
                };
              }

              // Process up to resultLimit elements
              const elementsToProcess = Math.min(elements.length, limit);
              const results = [];

              for (let i = 0; i < elementsToProcess; i++) {
                results.push(processElement(elements[i], i));
              }

              return {
                elements: results,
                totalCount: elements.length,
                processedCount: elementsToProcess,
                // selector: selector,
                // Include the stores for the hashed content
                // htmlStore,
                // ruleStore,
              };
            } catch (error) {
              return { error: "Error processing elements: " + error.message };
            }
          };

          // Execute script in the inspected window with cleaner syntax
          chrome.devtools.inspectedWindow.eval(
            `(${inspectionFunction.toString()})('${message.selector.replace(/'/g, "\\'")}', ${resultLimit}, ${JSON.stringify(includeComputedStyles)})`,
            (result, isException) => {
              if (isException || !result) {
                console.error("Chrome Extension: Error inspecting elements by selector:", isException || "No result");
                ws.send(
                  JSON.stringify({
                    type: "inspect-elements-error",
                    error: isException?.value || "Failed to inspect elements by selector",
                    requestId: message.requestId,
                  })
                );
                return;
              }

              // Check if result is an error object
              if (result && result.error) {
                console.error("Chrome Extension: Inspect elements by selector error:", result.error);
                ws.send(
                  JSON.stringify({
                    type: "inspect-elements-error",
                    error: result.error,
                    requestId: message.requestId,
                  })
                );
                return;
              }

              console.log(`Chrome Extension: Found ${result.totalCount} elements, processed ${result.processedCount}`);

              // Send back the elements with styles data
              ws.send(
                JSON.stringify({
                  type: "inspect-elements-response",
                  data: result,
                  requestId: message.requestId,
                })
              );
            }
          );
        } else if (message.type === "get-current-url") {
          console.log("Chrome Extension: Received request for current URL");

          // Get the current URL from the background script instead of inspectedWindow.eval
          let retryCount = 0;
          const maxRetries = 2;

          const requestCurrentUrl = () => {
            chrome.runtime.sendMessage(
              {
                type: "GET_CURRENT_URL",
                tabId: chrome.devtools.inspectedWindow.tabId,
              },
              (response) => {
                if (chrome.runtime.lastError) {
                  console.error(
                    "Chrome Extension: Error getting URL from background:",
                    chrome.runtime.lastError
                  );

                  // Retry logic
                  if (retryCount < maxRetries) {
                    retryCount++;
                    console.log(
                      `Retrying URL request (${retryCount}/${maxRetries})...`
                    );
                    setTimeout(requestCurrentUrl, 500); // Wait 500ms before retrying
                    return;
                  }

                  ws.send(
                    JSON.stringify({
                      type: "current-url-response",
                      url: null,
                      tabId: chrome.devtools.inspectedWindow.tabId,
                      error:
                        "Failed to get URL from background: " +
                        chrome.runtime.lastError.message,
                      requestId: message.requestId,
                    })
                  );
                  return;
                }

                if (response && response.success && response.url) {
                  console.log(
                    "Chrome Extension: Got URL from background:",
                    response.url
                  );
                  ws.send(
                    JSON.stringify({
                      type: "current-url-response",
                      url: response.url,
                      tabId: chrome.devtools.inspectedWindow.tabId,
                      requestId: message.requestId,
                    })
                  );
                } else {
                  console.error(
                    "Chrome Extension: Invalid URL response from background:",
                    response
                  );

                  // Last resort - try to get URL directly from the tab
                  chrome.tabs.query(
                    { active: true, currentWindow: true },
                    (tabs) => {
                      const url = tabs && tabs[0] && tabs[0].url;
                      console.log(
                        "Chrome Extension: Got URL directly from tab:",
                        url
                      );

                      ws.send(
                        JSON.stringify({
                          type: "current-url-response",
                          url: url || null,
                          tabId: chrome.devtools.inspectedWindow.tabId,
                          error:
                            response?.error ||
                            "Failed to get URL from background",
                          requestId: message.requestId,
                        })
                      );
                    }
                  );
                }
              }
            );
          };

          requestCurrentUrl();
        } else if (message.type === "get-cookies") {
          console.log("Chrome Extension: Getting cookies...");
          // Get cookies from the current tab
          chrome.devtools.inspectedWindow.eval(
            `(function() {
              // Check if document.cookie is empty
              if (!document.cookie.trim()) {
                return [];
              }

              // Split the cookie string and filter out any empty entries
              return document.cookie.split(';')
                .map(cookie => cookie.trim())
                .filter(cookie => cookie) // Remove empty strings
                .map(cookie => {
                  const equalsPos = cookie.indexOf('=');
                  // Handle cookies with no value (name only)
                  if (equalsPos === -1) {
                    return { name: cookie, value: '' };
                  }
                  // Handle normal cookies with name=value
                  const name = cookie.substring(0, equalsPos);
                  const value = cookie.substring(equalsPos + 1);
                  return { name, value };
                });
            })()`,
            (result, isException) => {
              if (isException || !result) {
                console.error(
                  "Chrome Extension: Error getting cookies:",
                  isException
                );
                ws.send(
                  JSON.stringify({
                    type: "cookies-error",
                    error: isException || "Failed to get cookies",
                    requestId: message.requestId,
                  })
                );
                return;
              }

              console.log(
                "Chrome Extension: Cookies retrieved successfully:",
                result
              );

              // Make sure cookies is an array, even if empty
              let cookies = Array.isArray(result) ? result : [];

              // Filter sensitive data if showSensitive is false
              if (settings.sensitiveDataMode !== "show-all") {
                console.log(
                  "Chrome Extension: Filtering sensitive cookie data"
                );
                cookies = filterSensitiveCookies(cookies);
              }

              ws.send(
                JSON.stringify({
                  type: "cookies-data",
                  cookies: cookies,
                  requestId: message.requestId,
                })
              );
            }
          );
        } else if (message.type === "get-local-storage") {
          console.log("Chrome Extension: Getting localStorage...");
          // Get localStorage from the current tab
          chrome.devtools.inspectedWindow.eval(
            `(function() {
              const storage = {};
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                storage[key] = localStorage.getItem(key);
              }
              return storage;
            })()`,
            (result, isException) => {
              if (isException || !result) {
                console.error(
                  "Chrome Extension: Error getting localStorage:",
                  isException
                );
                ws.send(
                  JSON.stringify({
                    type: "local-storage-error",
                    error: isException || "Failed to get localStorage",
                    requestId: message.requestId,
                  })
                );
                return;
              }

              console.log(
                "Chrome Extension: localStorage retrieved successfully:",
                result
              );

              // Filter sensitive data if showSensitive is false
              let storageData = result;
              if (settings.sensitiveDataMode !== "show-all") {
                console.log(
                  "Chrome Extension: Filtering sensitive localStorage data"
                );
                storageData = filterSensitiveStorage(result);
              }

              ws.send(
                JSON.stringify({
                  type: "local-storage-data",
                  storage: storageData,
                  requestId: message.requestId,
                })
              );
            }
          );
        } else if (message.type === "get-session-storage") {
          console.log("Chrome Extension: Getting sessionStorage...");
          // Get sessionStorage from the current tab
          chrome.devtools.inspectedWindow.eval(
            `(function() {
              const storage = {};
              for (let i = 0; i < sessionStorage.length; i++) {
                const key = sessionStorage.key(i);
                storage[key] = sessionStorage.getItem(key);
              }
              return storage;
            })()`,
            (result, isException) => {
              if (isException || !result) {
                console.error(
                  "Chrome Extension: Error getting sessionStorage:",
                  isException
                );
                ws.send(
                  JSON.stringify({
                    type: "session-storage-error",
                    error: isException || "Failed to get sessionStorage",
                    requestId: message.requestId,
                  })
                );
                return;
              }

              console.log(
                "Chrome Extension: sessionStorage retrieved successfully:",
                result
              );

              // Filter sensitive data if showSensitive is false
              let storageData = result;
              if (settings.sensitiveDataMode !== "show-all") {
                console.log(
                  "Chrome Extension: Filtering sensitive sessionStorage data"
                );
                storageData = filterSensitiveStorage(result);
              }

              ws.send(
                JSON.stringify({
                  type: "session-storage-data",
                  storage: storageData,
                  requestId: message.requestId,
                })
              );
            }
          );
        } else if (message.type === "refresh-browser") {
          console.log("Chrome Extension: Refreshing browser...");

          const { waitForLoad, timeout, preserveScrollPosition, clearCache } = message;

          try {
            // Store scroll position if requested
            let scrollPosition = null;
            if (preserveScrollPosition) {
              chrome.devtools.inspectedWindow.eval(
                `({ x: window.scrollX || window.pageXOffset, y: window.scrollY || window.pageYOffset })`,
                (result, isException) => {
                  if (!isException && result) {
                    scrollPosition = result;
                    console.log("Chrome Extension: Stored scroll position:", scrollPosition);
                  }
                }
              );
            }

            // Clear cache if requested
            if (clearCache) {
              console.log("Chrome Extension: Clearing browser cache...");
              chrome.devtools.network.clear();
            }

            // Perform the refresh
            console.log("Chrome Extension: Performing page refresh...");
            chrome.devtools.inspectedWindow.reload({
              ignoreCache: clearCache || false,
              userAgent: null, // Use default user agent
              injectedScript: preserveScrollPosition && scrollPosition ?
                `setTimeout(() => { window.scrollTo(${scrollPosition.x}, ${scrollPosition.y}); }, 100);` :
                null
            });

            // If waitForLoad is true, wait for the page to load
            if (waitForLoad) {
              const startTime = Date.now();
              const checkInterval = 100; // Check every 100ms
              const maxTimeout = timeout || 10000;

              const checkPageLoad = () => {
                chrome.devtools.inspectedWindow.eval(
                  `document.readyState === 'complete'`,
                  (isComplete, isException) => {
                    const elapsed = Date.now() - startTime;

                    if (isException) {
                      console.error("Chrome Extension: Error checking page load state:", isException);
                      ws.send(
                        JSON.stringify({
                          type: "refresh-browser-error",
                          error: "Failed to check page load state",
                          requestId: message.requestId,
                        })
                      );
                      return;
                    }

                    if (isComplete) {
                      console.log("Chrome Extension: Page refresh completed successfully");
                      ws.send(
                        JSON.stringify({
                          type: "refresh-browser-response",
                          success: true,
                          message: "Browser refreshed successfully",
                          timestamp: Date.now(),
                          loadTime: elapsed,
                          requestId: message.requestId,
                        })
                      );
                    } else if (elapsed >= maxTimeout) {
                      console.log("Chrome Extension: Page refresh timed out");
                      ws.send(
                        JSON.stringify({
                          type: "refresh-browser-response",
                          success: true,
                          message: "Browser refreshed (timed out waiting for complete load)",
                          timestamp: Date.now(),
                          loadTime: elapsed,
                          requestId: message.requestId,
                        })
                      );
                    } else {
                      // Continue checking
                      setTimeout(checkPageLoad, checkInterval);
                    }
                  }
                );
              };

              // Start checking after a brief delay to allow refresh to begin
              setTimeout(checkPageLoad, 500);
            } else {
              // Don't wait for load, respond immediately
              console.log("Chrome Extension: Page refresh initiated (not waiting for load)");
              ws.send(
                JSON.stringify({
                  type: "refresh-browser-response",
                  success: true,
                  message: "Browser refresh initiated",
                  timestamp: Date.now(),
                  requestId: message.requestId,
                })
              );
            }

          } catch (error) {
            console.error("Chrome Extension: Error refreshing browser:", error);
            ws.send(
              JSON.stringify({
                type: "refresh-browser-error",
                error: error.message || "Failed to refresh browser",
                requestId: message.requestId,
              })
            );
          }
        } else if (message.type === "click-element") {
          console.log("Chrome Extension: Clicking element...");

          const { selector, coordinates, waitForElement, timeout, scrollIntoView } = message;

          try {
            // Build the script to execute
            let script = `
              (function() {
                const timeout = ${timeout || 5000};
                const waitForElement = ${waitForElement !== false};
                const scrollIntoView = ${scrollIntoView !== false};

                function clickElement() {
                  let element = null;

                  // Find element by selector or coordinates
                  ${selector ? `
                    element = document.querySelector('${selector.replace(/'/g, "\\'")}');
                    if (!element) {
                      throw new Error('Element not found with selector: ${selector.replace(/'/g, "\\'")}');
                    }
                  ` : coordinates ? `
                    element = document.elementFromPoint(${coordinates.x}, ${coordinates.y});
                    if (!element) {
                      throw new Error('No element found at coordinates (${coordinates.x}, ${coordinates.y})');
                    }
                  ` : `
                    throw new Error('Either selector or coordinates must be provided');
                  `}

                  // Scroll into view if requested
                  if (scrollIntoView) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }

                  // Check if element is visible and clickable
                  const rect = element.getBoundingClientRect();
                  if (rect.width === 0 || rect.height === 0) {
                    throw new Error('Element is not visible (zero dimensions)');
                  }

                  // Perform the click
                  element.click();

                  return {
                    success: true,
                    message: 'Element clicked successfully',
                    element: {
                      tagName: element.tagName,
                      id: element.id,
                      className: element.className,
                      textContent: element.textContent?.substring(0, 100),
                      rect: {
                        x: rect.x,
                        y: rect.y,
                        width: rect.width,
                        height: rect.height
                      }
                    },
                    timestamp: Date.now()
                  };
                }

                if (waitForElement && ${selector ? 'true' : 'false'}) {
                  // Wait for element to be available
                  const startTime = Date.now();

                  function checkElement() {
                    try {
                      const element = document.querySelector('${selector ? selector.replace(/'/g, "\\'") : ''}');
                      if (element) {
                        return clickElement();
                      } else if (Date.now() - startTime >= timeout) {
                        throw new Error('Timeout waiting for element to appear');
                      } else {
                        // Continue waiting
                        setTimeout(checkElement, 100);
                        return null; // Indicates still waiting
                      }
                    } catch (error) {
                      throw error;
                    }
                  }

                  return checkElement();
                } else {
                  return clickElement();
                }
              })();
            `;

            chrome.devtools.inspectedWindow.eval(script, (result, isException) => {
              if (isException) {
                console.error("Chrome Extension: Error clicking element:", isException);
                ws.send(
                  JSON.stringify({
                    type: "click-element-error",
                    error: isException.value || "Failed to click element",
                    requestId: message.requestId,
                  })
                );
              } else if (result === null) {
                // Still waiting for element, this shouldn't happen with our current implementation
                console.log("Chrome Extension: Still waiting for element...");
              } else {
                console.log("Chrome Extension: Element clicked successfully");
                ws.send(
                  JSON.stringify({
                    type: "click-element-response",
                    ...result,
                    requestId: message.requestId,
                  })
                );
              }
            });

          } catch (error) {
            console.error("Chrome Extension: Error in click element handler:", error);
            ws.send(
              JSON.stringify({
                type: "click-element-error",
                error: error.message || "Failed to click element",
                requestId: message.requestId,
              })
            );
          }
        } else if (message.type === "fill-input") {
          console.log("Chrome Extension: Filling input...");

          const { selector, text, clearFirst, waitForElement, timeout, triggerEvents } = message;

          try {
            let script = `
              (function() {
                const timeout = ${timeout || 5000};
                const waitForElement = ${waitForElement !== false};
                const clearFirst = ${clearFirst !== false};
                const triggerEvents = ${triggerEvents !== false};
                const text = ${JSON.stringify(text)};

                function fillInput() {
                  const element = document.querySelector('${selector.replace(/'/g, "\\'")}');
                  if (!element) {
                    throw new Error('Input element not found with selector: ${selector.replace(/'/g, "\\'")}');
                  }

                  // Check if it's an input element
                  if (!['INPUT', 'TEXTAREA'].includes(element.tagName)) {
                    throw new Error('Element is not an input or textarea');
                  }

                  // Clear the input if requested
                  if (clearFirst) {
                    element.value = '';
                  }

                  // Set the value
                  element.value = text;

                  // Trigger events if requested
                  if (triggerEvents) {
                    element.dispatchEvent(new Event('input', { bubbles: true }));
                    element.dispatchEvent(new Event('change', { bubbles: true }));
                  }

                  return {
                    success: true,
                    message: 'Input filled successfully',
                    element: {
                      tagName: element.tagName,
                      id: element.id,
                      className: element.className,
                      type: element.type,
                      value: element.value?.substring(0, 100),
                      placeholder: element.placeholder
                    },
                    timestamp: Date.now()
                  };
                }

                if (waitForElement) {
                  const startTime = Date.now();

                  function checkElement() {
                    try {
                      const element = document.querySelector('${selector.replace(/'/g, "\\'")}');
                      if (element) {
                        return fillInput();
                      } else if (Date.now() - startTime >= timeout) {
                        throw new Error('Timeout waiting for input element to appear');
                      } else {
                        setTimeout(checkElement, 100);
                        return null;
                      }
                    } catch (error) {
                      throw error;
                    }
                  }

                  return checkElement();
                } else {
                  return fillInput();
                }
              })();
            `;

            chrome.devtools.inspectedWindow.eval(script, (result, isException) => {
              if (isException) {
                console.error("Chrome Extension: Error filling input:", isException);
                ws.send(
                  JSON.stringify({
                    type: "fill-input-error",
                    error: isException.value || "Failed to fill input",
                    requestId: message.requestId,
                  })
                );
              } else if (result === null) {
                console.log("Chrome Extension: Still waiting for input element...");
              } else {
                console.log("Chrome Extension: Input filled successfully");
                ws.send(
                  JSON.stringify({
                    type: "fill-input-response",
                    ...result,
                    requestId: message.requestId,
                  })
                );
              }
            });

          } catch (error) {
            console.error("Chrome Extension: Error in fill input handler:", error);
            ws.send(
              JSON.stringify({
                type: "fill-input-error",
                error: error.message || "Failed to fill input",
                requestId: message.requestId,
              })
            );
          }
        } else if (message.type === "select-option") {
          console.log("Chrome Extension: Selecting option...");

          const { selector, value, text, index, waitForElement, timeout, triggerEvents } = message;

          try {
            let script = `
              (function() {
                const timeout = ${timeout || 5000};
                const waitForElement = ${waitForElement !== false};
                const triggerEvents = ${triggerEvents !== false};
                const value = ${JSON.stringify(value)};
                const text = ${JSON.stringify(text)};
                const index = ${index !== undefined ? index : 'undefined'};

                function selectOption() {
                  const selectElement = document.querySelector('${selector.replace(/'/g, "\\'")}');
                  if (!selectElement) {
                    throw new Error('Select element not found with selector: ${selector.replace(/'/g, "\\'")}');
                  }

                  if (selectElement.tagName !== 'SELECT') {
                    throw new Error('Element is not a select element');
                  }

                  let optionToSelect = null;

                  // Find option by value, text, or index
                  if (value !== null && value !== undefined) {
                    optionToSelect = selectElement.querySelector(\`option[value="\${value}"]\`);
                    if (!optionToSelect) {
                      throw new Error(\`Option with value "\${value}" not found\`);
                    }
                  } else if (text !== null && text !== undefined) {
                    const options = Array.from(selectElement.options);
                    optionToSelect = options.find(opt => opt.textContent.trim() === text);
                    if (!optionToSelect) {
                      throw new Error(\`Option with text "\${text}" not found\`);
                    }
                  } else if (index !== undefined) {
                    if (index < 0 || index >= selectElement.options.length) {
                      throw new Error(\`Option index \${index} is out of range (0-\${selectElement.options.length - 1})\`);
                    }
                    optionToSelect = selectElement.options[index];
                  } else {
                    throw new Error('Either value, text, or index must be provided');
                  }

                  // Select the option
                  optionToSelect.selected = true;
                  selectElement.value = optionToSelect.value;

                  // Trigger events if requested
                  if (triggerEvents) {
                    selectElement.dispatchEvent(new Event('change', { bubbles: true }));
                    selectElement.dispatchEvent(new Event('input', { bubbles: true }));
                  }

                  return {
                    success: true,
                    message: 'Option selected successfully',
                    element: {
                      tagName: selectElement.tagName,
                      id: selectElement.id,
                      className: selectElement.className,
                      value: selectElement.value,
                      selectedIndex: selectElement.selectedIndex,
                      selectedOption: {
                        value: optionToSelect.value,
                        text: optionToSelect.textContent,
                        index: optionToSelect.index
                      }
                    },
                    timestamp: Date.now()
                  };
                }

                if (waitForElement) {
                  const startTime = Date.now();

                  function checkElement() {
                    try {
                      const element = document.querySelector('${selector.replace(/'/g, "\\'")}');
                      if (element) {
                        return selectOption();
                      } else if (Date.now() - startTime >= timeout) {
                        throw new Error('Timeout waiting for select element to appear');
                      } else {
                        setTimeout(checkElement, 100);
                        return null;
                      }
                    } catch (error) {
                      throw error;
                    }
                  }

                  return checkElement();
                } else {
                  return selectOption();
                }
              })();
            `;

            chrome.devtools.inspectedWindow.eval(script, (result, isException) => {
              if (isException) {
                console.error("Chrome Extension: Error selecting option:", isException);
                ws.send(
                  JSON.stringify({
                    type: "select-option-error",
                    error: isException.value || "Failed to select option",
                    requestId: message.requestId,
                  })
                );
              } else if (result === null) {
                console.log("Chrome Extension: Still waiting for select element...");
              } else {
                console.log("Chrome Extension: Option selected successfully");
                ws.send(
                  JSON.stringify({
                    type: "select-option-response",
                    ...result,
                    requestId: message.requestId,
                  })
                );
              }
            });

          } catch (error) {
            console.error("Chrome Extension: Error in select option handler:", error);
            ws.send(
              JSON.stringify({
                type: "select-option-error",
                error: error.message || "Failed to select option",
                requestId: message.requestId,
              })
            );
          }
        } else if (message.type === "submit-form") {
          console.log("Chrome Extension: Submitting form...");

          const { formSelector, submitButtonSelector, waitForElement, timeout, waitForNavigation, navigationTimeout } = message;

          try {
            let script = `
              (function() {
                const timeout = ${timeout || 5000};
                const waitForElement = ${waitForElement !== false};
                const waitForNavigation = ${waitForNavigation || false};
                const navigationTimeout = ${navigationTimeout || 10000};

                function submitForm() {
                  let element = null;
                  let isFormSubmit = false;

                  if (${JSON.stringify(formSelector)}) {
                    element = document.querySelector('${formSelector ? formSelector.replace(/'/g, "\\'") : ''}');
                    if (!element) {
                      throw new Error('Form element not found with selector: ${formSelector ? formSelector.replace(/'/g, "\\'") : ''}');
                    }
                    if (element.tagName !== 'FORM') {
                      throw new Error('Element is not a form element');
                    }
                    isFormSubmit = true;
                  } else if (${JSON.stringify(submitButtonSelector)}) {
                    element = document.querySelector('${submitButtonSelector ? submitButtonSelector.replace(/'/g, "\\'") : ''}');
                    if (!element) {
                      throw new Error('Submit button not found with selector: ${submitButtonSelector ? submitButtonSelector.replace(/'/g, "\\'") : ''}');
                    }
                    isFormSubmit = false;
                  } else {
                    throw new Error('Either formSelector or submitButtonSelector must be provided');
                  }

                  // Get element info before submission
                  const elementInfo = {
                    tagName: element.tagName,
                    id: element.id,
                    className: element.className,
                    type: element.type || null,
                    action: isFormSubmit ? element.action : null,
                    method: isFormSubmit ? element.method : null
                  };

                  // Submit the form or click the button
                  if (isFormSubmit) {
                    element.submit();
                  } else {
                    element.click();
                  }

                  return {
                    success: true,
                    message: isFormSubmit ? 'Form submitted successfully' : 'Submit button clicked successfully',
                    element: elementInfo,
                    timestamp: Date.now()
                  };
                }

                if (waitForElement) {
                  const startTime = Date.now();
                  const selector = ${JSON.stringify(formSelector)} || ${JSON.stringify(submitButtonSelector)};

                  function checkElement() {
                    try {
                      const element = document.querySelector(selector);
                      if (element) {
                        return submitForm();
                      } else if (Date.now() - startTime >= timeout) {
                        throw new Error('Timeout waiting for form/submit element to appear');
                      } else {
                        setTimeout(checkElement, 100);
                        return null;
                      }
                    } catch (error) {
                      throw error;
                    }
                  }

                  return checkElement();
                } else {
                  return submitForm();
                }
              })();
            `;

            chrome.devtools.inspectedWindow.eval(script, (result, isException) => {
              if (isException) {
                console.error("Chrome Extension: Error submitting form:", isException);
                ws.send(
                  JSON.stringify({
                    type: "submit-form-error",
                    error: isException.value || "Failed to submit form",
                    requestId: message.requestId,
                  })
                );
              } else if (result === null) {
                console.log("Chrome Extension: Still waiting for form/submit element...");
              } else {
                console.log("Chrome Extension: Form submitted successfully");

                // If waitForNavigation is true, wait for page navigation
                if (waitForNavigation) {
                  const startTime = Date.now();
                  const maxWait = navigationTimeout || 10000;

                  const checkNavigation = () => {
                    chrome.devtools.inspectedWindow.eval(
                      `document.readyState === 'complete'`,
                      (isComplete, navException) => {
                        const elapsed = Date.now() - startTime;

                        if (navException) {
                          console.error("Chrome Extension: Error checking navigation:", navException);
                          ws.send(
                            JSON.stringify({
                              type: "submit-form-response",
                              ...result,
                              message: result.message + " (navigation check failed)",
                              requestId: message.requestId,
                            })
                          );
                          return;
                        }

                        if (isComplete || elapsed >= maxWait) {
                          ws.send(
                            JSON.stringify({
                              type: "submit-form-response",
                              ...result,
                              message: result.message + (isComplete ? " and navigation completed" : " (navigation timeout)"),
                              navigationTime: elapsed,
                              requestId: message.requestId,
                            })
                          );
                        } else {
                          // Continue checking
                          setTimeout(checkNavigation, 100);
                        }
                      }
                    );
                  };

                  // Start checking after a brief delay
                  setTimeout(checkNavigation, 500);
                } else {
                  // Don't wait for navigation
                  ws.send(
                    JSON.stringify({
                      type: "submit-form-response",
                      ...result,
                      requestId: message.requestId,
                    })
                  );
                }
              }
            });

          } catch (error) {
            console.error("Chrome Extension: Error in submit form handler:", error);
            ws.send(
              JSON.stringify({
                type: "submit-form-error",
                error: error.message || "Failed to submit form",
                requestId: message.requestId,
              })
            );
          }
        }
      } catch (error) {
        console.error(
          "Chrome Extension: Error processing WebSocket message:",
          error
        );
      }
    };
  } catch (error) {
    console.error("Error creating WebSocket:", error);
    // Try again after delay
    wsReconnectTimeout = setTimeout(setupWebSocket, WS_RECONNECT_DELAY);
  }
}

// Initialize WebSocket connection when DevTools opens
setupWebSocket();

// Clean up WebSocket when DevTools closes
window.addEventListener("unload", () => {
  if (ws) {
    ws.close();
  }
  if (wsReconnectTimeout) {
    clearTimeout(wsReconnectTimeout);
  }
});
