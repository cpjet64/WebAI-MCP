#!/usr/bin/env node
import { spawn } from "child_process";
import path from "path";

function runSmoke({ name, cwd, args, timeoutMs }) {
  return new Promise((resolve, reject) => {
    let timedOut = false;
    const child = spawn("node", args, {
      cwd,
      stdio: "pipe",
      windowsHide: true,
    });

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill();
      console.log(`[smoke] ${name}: running after ${timeoutMs}ms (pass)`);
      resolve();
    }, timeoutMs);

    child.on("exit", (code) => {
      clearTimeout(timer);
      if (timedOut) {
        return;
      }
      if (code === 0) {
        console.log(`[smoke] ${name}: exited cleanly (pass)`);
        resolve();
      } else {
        reject(
          new Error(
            `[smoke] ${name}: exited with code ${code}\n${stderr.trim()}`
          )
        );
      }
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(new Error(`[smoke] ${name}: failed to start - ${error.message}`));
    });
  });
}

async function main() {
  const repoRoot = process.cwd();
  await runSmoke({
    name: "webai-mcp",
    cwd: path.join(repoRoot, "webai-mcp"),
    args: ["dist/mcp-server.js"],
    timeoutMs: 6000,
  });
  await runSmoke({
    name: "webai-server",
    cwd: path.join(repoRoot, "webai-server"),
    args: ["dist/browser-connector.js"],
    timeoutMs: 6000,
  });
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
