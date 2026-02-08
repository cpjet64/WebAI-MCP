#!/usr/bin/env node
import fs from "fs";
import path from "path";

const forbiddenChecks = [
  {
    file: "README.md",
    tokens: ["BrowserToolsMCP panel", "BrowserTools extension enabled"],
  },
  {
    file: "AUTO_PASTE_GUIDE.md",
    tokens: ["Browser Tools MCP provides comprehensive auto-paste functionality"],
  },
  {
    file: "WINDOWS_AUTO_PASTE_GUIDE.md",
    tokens: ["Browser Tools MCP provides comprehensive Windows auto-paste functionality"],
  },
  {
    file: "chrome-extension/devtools.js",
    tokens: ['chrome.devtools.panels.create("BrowserToolsMCP"'],
  },
  {
    file: "chrome-extension/devtools.html",
    tokens: ["<title>BrowserTools MCP</title>"],
  },
  {
    file: "docs/i18n/README_CN.md",
    tokens: ["BrowserToolsMCP", "BrowserTools连接器"],
  },
  {
    file: "scripts/platform-setup.js",
    tokens: ['start "BrowserTools Server"'],
  },
  {
    file: "scripts/test-all.js",
    tokens: ["testBrowserToolsServer"],
  },
];

const requiredChecks = [
  {
    file: "README.md",
    tokens: ["WebAI-MCP panel", "WebAI extension enabled"],
  },
  {
    file: "chrome-extension/devtools.js",
    tokens: ['chrome.devtools.panels.create("WebAI-MCP"'],
  },
  {
    file: "chrome-extension/devtools.html",
    tokens: ["<title>WebAI-MCP</title>"],
  },
  {
    file: "scripts/platform-setup.js",
    tokens: ['start "WebAI Server"'],
  },
  {
    file: "scripts/test-all.js",
    tokens: ["testWebAIServer"],
  },
];

function readFileOrThrow(relPath) {
  const absPath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Missing file for naming check: ${relPath}`);
  }
  return fs.readFileSync(absPath, "utf8");
}

function runForbiddenChecks() {
  for (const check of forbiddenChecks) {
    const content = readFileOrThrow(check.file);
    for (const token of check.tokens) {
      if (content.includes(token)) {
        throw new Error(
          `Legacy naming token still present in ${check.file}: ${token}`
        );
      }
    }
  }
}

function runRequiredChecks() {
  for (const check of requiredChecks) {
    const content = readFileOrThrow(check.file);
    for (const token of check.tokens) {
      if (!content.includes(token)) {
        throw new Error(
          `Expected naming token missing in ${check.file}: ${token}`
        );
      }
    }
  }
}

function main() {
  runForbiddenChecks();
  runRequiredChecks();
  console.log("[naming-check] Active naming checks passed.");
}

try {
  main();
} catch (error) {
  console.error(`[naming-check] ${error.message}`);
  process.exit(1);
}
