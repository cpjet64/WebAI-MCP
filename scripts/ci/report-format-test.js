#!/usr/bin/env node
import assert from "node:assert/strict";

import { ErrorHandler } from "../../webai-mcp/dist/error-handler.js";
import { VersionChecker } from "../../webai-mcp/dist/version-checker.js";

function assertNoMojibake(text, label) {
  const suspiciousTokens = ["â", "ð", "ï¸", "�"];
  for (const token of suspiciousTokens) {
    assert.equal(
      text.includes(token),
      false,
      `${label} contains suspicious encoding token: ${token}`
    );
  }
}

function testErrorHandlerFormatting() {
  const formatted = ErrorHandler.formatErrorForUser({
    type: "server",
    message: "raw error message",
    userMessage: "friendly message",
    solutions: [
      {
        title: "Restart service",
        description: "Restart webai-server and retry.",
        commands: ["npx @cpjet64/webai-server"],
        links: ["https://github.com/cpjet64/WebAI-MCP"],
        priority: "high",
      },
    ],
    context: { operation: "unit-test" },
    isRetryable: true,
  });

  assert.ok(formatted.includes("ERROR: friendly message"));
  assert.ok(formatted.includes("Suggested Solutions:"));
  assert.ok(formatted.includes("[HIGH] **Restart service**"));
  assert.ok(formatted.includes("Link: https://github.com/cpjet64/WebAI-MCP"));
  assert.ok(formatted.includes("RETRY:"));
  assertNoMojibake(formatted, "ErrorHandler.formatErrorForUser");
}

function testVersionCheckerFormatting() {
  const formatted = VersionChecker.formatCompatibilityReport({
    isCompatible: false,
    mcpServer: {
      component: "MCP Server",
      version: "1.0.0",
      path: "webai-mcp/package.json",
      isValid: true,
    },
    webaiServer: {
      component: "WebAI Server",
      version: "2.0.0",
      path: "webai-server/package.json",
      isValid: true,
    },
    chromeExtension: {
      component: "Chrome Extension",
      version: "1.0.0",
      path: "chrome-extension/manifest.json",
      isValid: false,
    },
    errors: ["Version mismatch detected"],
    warnings: ["Extension version unknown"],
    recommendations: ["Update all components to the same major version"],
  });

  assert.ok(formatted.includes("WebAI-MCP Version Compatibility Check"));
  assert.ok(formatted.includes("Component Versions:"));
  assert.ok(formatted.includes("[OK]"));
  assert.ok(formatted.includes("[FAIL]"));
  assert.ok(formatted.includes("Errors:"));
  assert.ok(formatted.includes("Warnings:"));
  assert.ok(formatted.includes("Recommendations:"));
  assert.ok(formatted.includes("[ISSUES FOUND]"));
  assertNoMojibake(formatted, "VersionChecker.formatCompatibilityReport");
}

function main() {
  testErrorHandlerFormatting();
  testVersionCheckerFormatting();
  console.log("[report-format] formatting checks passed");
}

try {
  main();
} catch (error) {
  console.error(`[report-format] ${error.message}`);
  process.exit(1);
}
