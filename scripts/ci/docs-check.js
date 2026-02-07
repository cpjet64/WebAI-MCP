#!/usr/bin/env node
import fs from "fs";
import path from "path";

const requiredFiles = [
  "prompt.md",
  "plans.md",
  "architecture.md",
  "implement.md",
  "documentation.md",
  "todo.md",
  "ci/ci.config.json",
  "ci/tool-versions.json",
  "docs/LOCAL_CICD.md",
  ".github/LOCAL_ONLY.md",
];

function assertExists(relPath) {
  const absPath = path.join(process.cwd(), relPath);
  if (!fs.existsSync(absPath)) {
    throw new Error(`Missing required file: ${relPath}`);
  }
}

function assertGitignoreEntries() {
  const gitignorePath = path.join(process.cwd(), ".gitignore");
  const content = fs.readFileSync(gitignorePath, "utf8");
  const needed = [".ci-tools/", ".ci-artifacts/"];
  for (const entry of needed) {
    if (!content.includes(entry)) {
      throw new Error(`.gitignore missing required entry: ${entry}`);
    }
  }
}

function assertNoActiveCloudWorkflows() {
  const workflowsDir = path.join(process.cwd(), ".github", "workflows");
  if (!fs.existsSync(workflowsDir)) {
    return;
  }
  const active = fs
    .readdirSync(workflowsDir, { withFileTypes: true })
    .filter((dirent) => dirent.isFile())
    .map((dirent) => dirent.name)
    .filter((name) => name.endsWith(".yml") || name.endsWith(".yaml"));
  if (active.length > 0) {
    throw new Error(
      `Active cloud workflows found in .github/workflows: ${active.join(", ")}`
    );
  }
}

function main() {
  for (const relPath of requiredFiles) {
    assertExists(relPath);
  }
  assertGitignoreEntries();
  assertNoActiveCloudWorkflows();
  console.log("[docs-check] Durable memory and local-only CI docs verified.");
}

try {
  main();
} catch (error) {
  console.error(`[docs-check] ${error.message}`);
  process.exit(1);
}
