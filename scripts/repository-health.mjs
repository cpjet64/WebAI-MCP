#!/usr/bin/env node

/**
 * Repository health check for local maintenance operations.
 *
 * Checks:
 * - Branch/remotes are aligned with local-only workflow
 * - No active GitHub workflow automation files remain under .github/workflows
 * - No active unresolved marker debt in production directories
 * - Legacy inventory references are indexed consistently in docs
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const UTF8 = 'utf8';
const cliArgs = process.argv.slice(2);
const STRICT_MODE = cliArgs.includes('--strict');
const HELP_ARG = cliArgs.includes('--help') || cliArgs.includes('-h');
const unknownArgs = cliArgs.filter((arg) => arg !== '--strict' && arg !== '--help' && arg !== '-h');

const PASS = '✅';
const FAIL = '❌';
const WARN = '⚠️';
const STRICT_FAIL = '‼️';

const checks = {
  branch: [],
  markers: [],
  legacyIndex: [],
  requirements: []
};

function runCommand(command) {
  try {
    return execSync(command, { encoding: UTF8, cwd: ROOT }).toString().trim();
  } catch (error) {
    return (error.stdout || '').toString().trim();
  }
}

function normalizeLevel(level) {
  if (STRICT_MODE && level === 'warn') {
    return 'error';
  }

  return level;
}

function printUsage() {
  console.log(`Usage:
  node scripts/repository-health.mjs [--strict] [--help]

Options:
  --strict   Treat warnings as hard failures.
  --help, -h Show this help text.`);
}

function checkWorkflowAutomation() {
  const workflowsPath = path.join(ROOT, '.github', 'workflows');
  if (!fs.existsSync(workflowsPath)) {
    addPass('branch', 'No .github/workflows directory present; automation posture is local-only.');
    return;
  }

  let workflowFiles = [];
  try {
    workflowFiles = fs
      .readdirSync(workflowsPath, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isFile() && /\.(ya?ml)$/i.test(entry.name),
      )
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    addIssue('branch', `Unable to inspect .github/workflows: ${error.message}`);
    return;
  }

  if (workflowFiles.length === 0) {
    addPass('branch', 'No workflow files remain under .github/workflows.');
    return;
  }

  addIssue(
    'branch',
    `Workflow files still present under .github/workflows: ${workflowFiles.join(', ')}. Remove them for local-only release/build posture.`,
  );
}

function addIssue(category, message) {
  checks[category].push({ level: 'error', message });
}

function addWarn(category, message) {
  checks[category].push({ level: 'warn', message });
}

function addPass(category, message) {
  checks[category].push({ level: 'pass', message });
}

function listFiles(dir, extensions) {
  const result = [];
  const absoluteDir = path.join(ROOT, dir);
  if (!fs.existsSync(absoluteDir)) {
    return result;
  }

  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  for (const entry of entries) {
    const absPath = path.join(absoluteDir, entry.name);
    const relPath = path.relative(ROOT, absPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (
        entry.name === '.git' ||
        entry.name === 'target' ||
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === 'legacy'
      ) {
        continue;
      }
      result.push(...listFiles(relPath, extensions));
      continue;
    }

    if (!extensions.has(path.extname(entry.name))) {
      continue;
    }

    result.push(relPath);
  }

  return result;
}

function checkBranchRemotes() {
  const branch = runCommand('git branch --show-current');
  if (!branch) {
    addIssue('branch', 'Unable to read current branch. Ensure command is run from the repository root.');
    return;
  }

  if (branch !== 'main') {
    addIssue('branch', `Current branch is "${branch}". Local-only flow requires working on "main" for release posture checks.`);
    return;
  }

  addPass('branch', 'Current branch is main.');

  const remoteOutput = runCommand('git remote');
  const remotes = remoteOutput
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter(Boolean);

  if (!remotes.includes('origin')) {
    addIssue('branch', 'No "origin" remote found; expected at least one origin remote for push/status checks.');
    return;
  }

  const otherRemotes = remotes.filter((remote) => remote !== 'origin');
  if (otherRemotes.length > 0) {
    addWarn('branch', `Additional remotes detected: ${otherRemotes.join(', ')}. Keep local-only workflow clean by using origin only.`);
  }

  const remoteRefs = runCommand('git branch -r --format="%(refname:short)"');
  const originRefs = remoteRefs
    .split(/\r?\n/)
    .map((r) => r.trim())
    .filter((r) => r.startsWith('origin/'));

  if (!originRefs.includes('origin/main')) {
    addIssue('branch', 'Remote does not expose origin/main. Expected origin/main to remain the canonical remote branch.');
    return;
  }

  if (originRefs.some((r) => r.startsWith('origin/feature/') || r.startsWith('origin/dev'))) {
    addWarn('branch', 'Found stale feature/dev remote-tracking refs. Consider pruning if this environment tracks only long-lived workflow references.');
  }

  const localBranches = runCommand('git branch --format="%(refname:short)"')
    .split(/\r?\n/)
    .map((name) => name.trim())
    .filter(Boolean);

  const extraLocalBranches = localBranches.filter((name) => name !== 'main');
  if (extraLocalBranches.length === 0) {
    addPass('branch', 'No additional local branches besides main were detected.');
  } else {
    addWarn(
      'branch',
      `Additional local branches found: ${extraLocalBranches.join(', ')}. Local-only release mode expects main-only local branch posture unless intentionally in transient branches.`,
    );
  }

  addPass('branch', 'Remote branch tracking is aligned with main as the canonical remote branch.');
}

function findDebtMarkers() {
  const scanRoots = ['crates', 'webai-mcp', 'webai-server', 'chrome-extension', 'scripts', 'tests'];
  const checkExts = new Set(['.ts', '.js', '.tsx', '.jsx', '.rs', '.sh', '.ps1', '.toml', '.yml', '.yaml', '.json']);
  const debtPatterns = [
    /\bTODO\b/i,
    /\bFIXME\b/i,
    /\bmutant\b/i,
    /\bmutators\b/i,
    /\bdata-stub\b/i
  ];
  const placeholderPattern = /\bplaceholder\b/i;

  const markerLines = [];

  for (const root of scanRoots) {
    for (const file of listFiles(root, checkExts)) {
      const content = fs.readFileSync(path.join(ROOT, file), UTF8);
      const lines = content.split(/\r?\n/);

      lines.forEach((line, index) => {
        const hasDebtKeyword = debtPatterns.some((pattern) => pattern.test(line));

        const hasPlaceholder = placeholderPattern.test(line);
        const allowedPlaceholder =
          hasPlaceholder &&
          (
            /placeholder:\s*element\.placeholder/i.test(line) ||
            /\.placeholder\s*=/.test(line) ||
            /placeholder\s*=\s*["']/.test(line)
          );

        if (hasDebtKeyword || (hasPlaceholder && !allowedPlaceholder)) {
          markerLines.push({
            file,
            line: index + 1,
            text: line.trim(),
            category: hasDebtKeyword ? 'debt' : 'placeholder'
          });
        }
      });
    }
  }

  if (markerLines.length === 0) {
    addPass('markers', 'No unresolved marker debt found in active scanned code directories.');
    return;
  }

  const debtMatches = markerLines.filter((entry) => entry.category === 'debt');
  const placeholderMatches = markerLines.filter((entry) => entry.category === 'placeholder');

  if (debtMatches.length > 0) {
    for (const hit of debtMatches) {
      addIssue('markers', `${hit.file}:${hit.line}: ${hit.text}`);
    }
  }

  if (placeholderMatches.length > 0) {
    for (const hit of placeholderMatches) {
      addIssue('markers', `${hit.file}:${hit.line}: ${hit.text}`);
    }
  }
}

function buildLegacyArtifacts() {
  return [
    ...listFiles('legacy/plans', new Set(['.md'])).map((file) => file.replace(/\\/g, '/')),
    ...listFiles('legacy/docs/archive', new Set(['.md', '.txt'])).map((file) => file.replace(/\\/g, '/')),
    ...listFiles('legacy/notes', new Set(['.md', '.txt'])).map((file) => file.replace(/\\/g, '/')),
    ...listFiles('legacy/coverage', new Set(['.md', '.txt'])).map((file) => file.replace(/\\/g, '/'))
  ];
}

function checkLegacyInventory() {
  const archiveDocPath = path.join(ROOT, 'docs', 'ARCHIVE.md');
  const legacyReadmePath = path.join(ROOT, 'legacy', 'README.md');

  if (!fs.existsSync(archiveDocPath)) {
    addIssue('legacyIndex', 'docs/ARCHIVE.md is missing.');
    return;
  }

  if (!fs.existsSync(legacyReadmePath)) {
    addIssue('legacyIndex', 'legacy/README.md is missing.');
    return;
  }

  const archiveText = fs.readFileSync(archiveDocPath, UTF8);
  const legacyText = fs.readFileSync(legacyReadmePath, UTF8);

  const artifacts = buildLegacyArtifacts();
  if (artifacts.length === 0) {
    addWarn('legacyIndex', 'No files found under legacy subfolders to index.');
    return;
  }

  let missing = 0;
  for (const artifact of artifacts) {
    const mention = [archiveText, legacyText].some((blob) => blob.includes(artifact));
    if (!mention) {
      addIssue('legacyIndex', `Legacy artifact not indexed: ${artifact}`);
      missing += 1;
    }
  }

  if (missing === 0) {
    addPass('legacyIndex', `Legacy inventory index coverage complete for ${artifacts.length} artifacts.`);
  }
}

function checkMinimumTooling() {
  const nodeVersion = runCommand('node --version');
  if (nodeVersion.startsWith('v')) {
    addPass('requirements', `Node.js available: ${nodeVersion}`);
  } else {
    addIssue('requirements', 'Node.js command unavailable.');
  }

  const npmVersion = runCommand('npm --version');
  if (npmVersion) {
    addPass('requirements', `npm available: ${npmVersion}`);
  } else {
    addIssue('requirements', 'npm command unavailable.');
  }
}

function printResults() {
  const sections = [
    ['branch', 'Branch posture'],
    ['markers', 'Marker/debt scan'],
    ['legacyIndex', 'Legacy inventory indexing'],
    ['requirements', 'Tooling']
  ];

  let hardFailCount = 0;
  let warnCount = 0;
  for (const [key, label] of sections) {
    console.log(`\n${label}`);
    console.log('-'.repeat(label.length + 1));

    for (const item of checks[key]) {
      const level = normalizeLevel(item.level);

      if (level === 'pass') {
        console.log(`${PASS} ${item.message}`);
      } else if (level === 'warn') {
        warnCount += 1;
        console.log(`${WARN} ${item.message}`);
      } else {
        console.log(`${STRICT_MODE ? STRICT_FAIL : FAIL} ${item.message}`);
        hardFailCount += 1;
      }
    }
  }

  if (STRICT_MODE) {
    console.log(`\nSummary: ${hardFailCount} issue(s), ${warnCount} warning(s) (warnings treated as failures)`);
  } else {
    console.log(`\nSummary: ${hardFailCount} issue(s), ${warnCount} warning(s)`);
  }

  process.exitCode = hardFailCount === 0 ? 0 : 1;
}

function main() {
  if (HELP_ARG) {
    printUsage();
    return;
  }

  if (unknownArgs.length > 0) {
    addIssue('requirements', `Unknown option(s): ${unknownArgs.join(', ')}. Use --strict or --help.`);
  }

  checkMinimumTooling();
  checkBranchRemotes();
  checkWorkflowAutomation();
  findDebtMarkers();
  checkLegacyInventory();
  printResults();
}

main();
