#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import path from "node:path";

const rootDir = process.cwd();
const scriptPath = process.platform === "win32"
  ? path.join(rootDir, "scripts", "local-release.ps1")
  : path.join(rootDir, "scripts", "local-release.sh");

const args = (() => {
  const parsed = process.argv.slice(2);
  if (parsed.length > 0 && parsed[0] === "--") {
    return parsed.slice(1);
  }
  return parsed;
})();

if (process.platform === "win32") {
  const escapeSingleQuotes = (value) => String(value).replaceAll("'", "''");
  const escapedScriptPath = `'${escapeSingleQuotes(scriptPath)}'`;
  const escapedArgs = args.map((arg) => `'${escapeSingleQuotes(arg)}'`).join(", ");
  const command = `& { & ${escapedScriptPath} -RemainingArguments @(${escapedArgs}) }`;
  const result = spawnSync(
    "powershell",
    ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", command],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    process.exit(result.status ?? 0);
  }
  process.exit(0);
}

const result = spawnSync("bash", [scriptPath, ...args], { stdio: "inherit" });
if (result.status !== 0) {
  process.exit(result.status ?? 0);
}
