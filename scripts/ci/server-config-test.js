#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  getDefaultServerHost,
  getDefaultServerPort,
} from "../../webai-mcp/dist/server-config.js";

function withTempDir(run) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "webai-server-config-"));
  try {
    return run(tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function testHostSelection() {
  assert.equal(
    getDefaultServerHost({
      env: { WEBAI_HOST: "10.0.0.2", BROWSER_TOOLS_HOST: "127.0.0.9" },
    }),
    "10.0.0.2",
    "WEBAI_HOST should take precedence"
  );

  assert.equal(
    getDefaultServerHost({ env: { BROWSER_TOOLS_HOST: "127.0.0.9" } }),
    "127.0.0.9",
    "legacy host should be used when WEBAI_HOST is unset"
  );

  assert.equal(
    getDefaultServerHost({ env: {} }),
    "127.0.0.1",
    "default host should be localhost"
  );
}

function testPortSelection() {
  withTempDir((tempDir) => {
    fs.writeFileSync(path.join(tempDir, ".port"), "4123\n", "utf8");

    assert.equal(
      getDefaultServerPort({
        env: { WEBAI_PORT: "5100", BROWSER_TOOLS_PORT: "5200" },
        portFileDir: tempDir,
      }),
      5100,
      "WEBAI_PORT should take precedence over legacy and .port file"
    );

    assert.equal(
      getDefaultServerPort({
        env: { BROWSER_TOOLS_PORT: "5200" },
        portFileDir: tempDir,
      }),
      5200,
      "legacy env port should be used when WEBAI_PORT is unset"
    );

    assert.equal(
      getDefaultServerPort({
        env: { WEBAI_PORT: "invalid" },
        portFileDir: tempDir,
      }),
      4123,
      "invalid env port should fall back to .port file value"
    );

    fs.writeFileSync(path.join(tempDir, ".port"), "not-a-port\n", "utf8");
    assert.equal(
      getDefaultServerPort({
        env: {},
        portFileDir: tempDir,
      }),
      3025,
      "invalid .port file should fall back to default"
    );
  });

  withTempDir((tempDir) => {
    assert.equal(
      getDefaultServerPort({
        env: {},
        portFileDir: tempDir,
      }),
      3025,
      "missing .port file should fall back to default"
    );
  });
}

function main() {
  testHostSelection();
  testPortSelection();
  console.log("[server-config] host/port selection checks passed");
}

try {
  main();
} catch (error) {
  console.error(`[server-config] ${error.message}`);
  process.exit(1);
}
