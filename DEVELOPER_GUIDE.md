# WebAI-MCP Developer Guide

> **Current Version**: v1.5.1-dev.3 | **Updated**: January 2025

## 🎯 Overview

This guide covers development workflows, project structure, release processes, and maintenance procedures for WebAI-MCP contributors and maintainers.

## 📁 Project Structure

```
webai-mcp/
├── 📁 webai-mcp/                      # MCP Server Package
│   ├── � mcp-server.ts               # Main MCP server implementation
│   ├── 📄 version-checker.ts          # Version compatibility checker
│   ├── 📄 error-handler.ts            # Error handling utilities
│   ├── 📄 package.json                # Package configuration
│   ├── 📄 tsconfig.json               # TypeScript configuration
│   ├── 📄 jest.config.js              # Jest testing configuration
│   ├── 📄 README.md                   # Package documentation
│   └── 📁 tests/                      # Test files
│       ├── 📄 basic.test.ts           # Basic functionality tests
│       ├── 📄 mcp-server.test.ts      # MCP server tests
│       ├── 📄 setup.ts                # Test setup
│       ├── 📄 jest.d.ts               # Jest type definitions
│       ├── 📁 fixtures/               # Test fixtures
│       ├── 📁 integration/            # Integration tests
│       ├── � tools/                  # Tool-specific tests
│       └── 📁 utils/                  # Utility tests
│
├── 📁 webai-server/                   # WebAI Bridge Server
│   ├── 📄 browser-connector.ts        # Chrome extension bridge
│   ├── 📄 auto-paste-manager.ts       # Auto-paste functionality
│   ├── 📄 puppeteer-service.ts        # Puppeteer automation service
│   ├── 📄 proxy-config.ts             # Proxy configuration
│   ├── 📄 package.json                # Package configuration
│   ├── 📄 tsconfig.json               # TypeScript configuration
│   ├── 📄 jest.config.js              # Jest testing configuration
│   ├── 📄 README.md                   # Package documentation
│   ├── 📁 lighthouse/                 # Lighthouse audit tools
│   │   ├── 📄 index.ts                # Main lighthouse module
│   │   ├── � accessibility.ts        # Accessibility audits
│   │   ├── 📄 performance.ts          # Performance audits
│   │   ├── 📄 seo.ts                  # SEO audits
│   │   ├── 📄 best-practices.ts       # Best practices audits
│   │   └── 📄 types.ts                # Lighthouse type definitions
│   └── � tests/                      # Test files
│       ├── 📄 basic.test.ts           # Basic functionality tests
│       ├── 📄 browser-connector.test.ts # Browser connector tests
│       ├── 📄 setup.ts                # Test setup
│       ├── 📄 test-setup.ts           # Additional test setup
│       ├── 📄 tsconfig.json           # Test TypeScript config
│       ├── 📁 api/                    # API tests
│       ├── 📁 fixtures/               # Test fixtures
│       ├── � integration/            # Integration tests
│       └── 📁 services/               # Service tests
│
├── 📁 chrome-extension/               # Chrome Extension
│   ├── 📄 manifest.json               # Extension manifest (v3)
│   ├── 📄 panel.html                  # DevTools panel UI
│   ├── 📄 panel.js                    # Panel functionality
│   ├── 📄 devtools.html               # DevTools page
│   ├── 📄 devtools.js                 # DevTools integration
│   └── 📄 background.js               # Background service worker
│
├── 📁 .github/                        # GitHub Configuration
│   ├── 📄 CODEOWNERS                  # Code ownership
│   └── 📄 WORKFLOW_SUMMARY.md         # Local workflow and release summary
│
├── 📁 docs/                           # Documentation
│   ├── 📁 i18n/                       # Internationalization
│   │   └── 📄 README_CN.md            # Chinese documentation
│   └── 📎 MCP protocol docs moved to `legacy/docs/archive/mcp-ts-sdk.md`
│
├── � scripts/                        # Utility scripts
│   ├── �📄 README.md                   # Scripts documentation
│   ├── 📄 diagnose.js                 # Diagnostic script
│   ├── 📄 platform-setup.js           # Platform setup
│   ├── 📄 setup-deps.ps1              # Windows dependency setup
│   ├── 📄 setup-deps.sh               # Unix dependency setup
│   ├── 📄 setup.js                    # General setup script
│   ├── 📄 update-changelog.sh         # Changelog update script
│   └── 📄 validate-installation.js    # Installation validator
│
├── 📁 tests/                          # Root-level tests
│   ├── 📄 README.md                   # Test documentation
│   ├── 📄 architecture-demo.test.ts   # Architecture tests
│   ├── 📄 run-full-stack-demo.ts      # Full stack demo
│   ├── 📄 test-all.js                 # Test runner
│   ├── 📄 test-element-interaction.html # Test page
│   ├── 📄 test-prompt-comprehensive.md # Test prompts
│   ├── 📄 verify-simulators.test.ts   # Simulator verification
│   ├── 📄 working-example.test.ts     # Working examples
│   ├── 📁 integration/                # Integration tests
│   └── 📁 mocks/                      # Test mocks
│
├── 📄 package.json                    # Root package configuration
├── 📄 package-lock.json               # NPM lock file
├── 📄 version.json                    # Version tracking
├── 📄 README.md                       # Main project documentation
├── 📄 COMPLETE_USER_GUIDE.md          # Comprehensive user guide
├── 📄 DEVELOPER_GUIDE.md              # This developer guide
├── 📄 CHANGELOG.md                    # Auto-generated changelog
├── 📄 legacy/docs/archive/3tierconversion.md  # Legacy architecture planning document
└── 📄 LICENSE                         # MIT license
```

## 🔧 Development Setup

### **Prerequisites**
- **Node.js**: 18.0.0 or higher
- **NPM**: 8.0.0 or higher
- **Git**: Latest version
- **Chrome**: For extension testing

### **Initial Setup**
```bash
# 1. Clone repository
git clone https://github.com/cpjet64/webai-mcp.git
cd webai-mcp

# 2. Install all dependencies
npm run install:all

# 3. Build all packages
npm run build:all

# 4. Set up development environment
npm run dev:setup
```

### **Development Scripts**
```bash
# Install dependencies for all packages
npm run install:all

# Build all packages
npm run build:all

# Clean all lock files and reinstall
npm run reset:deps

# Start development servers
npm run dev:server          # Start webai-server in dev mode
npm run dev:mcp             # Start MCP server in dev mode

# Testing
npm test                    # Run all tests
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only

# Linting and formatting
npm run lint                # ESLint check
npm run lint:fix            # Fix ESLint issues
npm run format              # Prettier formatting
```

## 🌿 Branch Strategy

### **Branch Structure**
- **`main`**: Canonical production branch.
- Keep active development and validation on `main`; use temporary branches only when required by external review tooling.

### **Workflow**
1. Keep the working tree on `main` and run local verification.
2. Open PR against `main` when review is required.
3. Merge once checks and review are complete.

### **Branch Protection Rules**

#### **Main Branch Protection**
- ✅ **Require pull request reviews**: 1 approval minimum
- ✅ **Require local verification**: `npm run build:all`, `npm run test`, and key diagnostics must pass
- ✅ **Require up-to-date review sources**: Merge sources must be current against `main`
- ✅ **Restrict pushes**: No direct pushes allowed
- ✅ **Dismiss stale reviews**: When new commits are pushed

## 🚀 Release Process (Local-Only)

GitHub Actions release automation has been retired. Release artifacts are prepared and uploaded manually.

### **Local release entry points**

In `package.json`:

- `npm run release:local`
- `npm run release:local:unix`
- `npm run release:local:win`

Equivalent script entry points:

- `scripts/local-release.sh` (Unix/macOS)
- `scripts/local-release.ps1` (Windows)
- `scripts/run-local-release.js` (cross-platform dispatcher)

### **Local release workflow**

```bash
# Build + test + package + optional publish
npm run release:local

# Skip tests for emergency builds only
npm run release:local -- --skip-tests

# Skip build if already prepared
npm run release:local -- --skip-build

# Publish after local build/packaging
npm run release:local -- --publish --tag latest
```

### **Outputs**

- `webai-mcp-v<version>.tgz`
- `webai-server-v<version>.tgz`
- `webai-chrome-extension-v<version>.zip`

### **Manual release steps**

1. Run `npm run release:local` and review generated artifacts.
2. Upload artifacts to the target GitHub Release.
3. Add release notes (use changelog output if desired).

### **Changelog workflow**

- `npm run changelog` (full changelog refresh)
- `npm run changelog:update` (unreleased section only)

## 🏗️ Build System

### **Build Architecture**
WebAI-MCP uses a multi-package build system with TypeScript compilation and workspace management.

#### **Workspace Structure**
```json
{
  "workspaces": ["webai-mcp", "webai-server"],
  "scripts": {
    "build": "npm run build --workspace=webai-mcp && npm run build --workspace=webai-server",
    "build:all": "cd webai-mcp && npm run build && cd ../webai-server && npm run build"
  }
}
```

### **Build Scripts**

#### **Root Level Build Commands**
```bash
# Build all packages (workspace method)
npm run build

# Build all packages (direct method)
npm run build:all

# Build individual packages
npm run build --workspace=webai-mcp
npm run build --workspace=webai-server

# Clean all build artifacts
npm run clean
```

#### **Package-Specific Builds**
```bash
# WebAI-MCP Package
cd webai-mcp
npm run build          # TypeScript compilation
npm run build:watch    # Watch mode for development
npm run clean          # Remove build artifacts

# WebAI-Server Package
cd webai-server
npm run build          # TypeScript compilation
npm run build:watch    # Watch mode for development
npm run clean          # Remove build artifacts
```

### **TypeScript Configuration**

#### **Shared tsconfig.json Settings**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "lib": ["ES2020"],
    "outDir": "./build",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["*.ts", "lighthouse/**/*.ts"],
  "exclude": ["node_modules", "build", "tests"]
}
```

#### **Build Output Structure**
```
webai-mcp/
├── mcp-server.ts           # TypeScript source files
├── version-checker.ts
├── error-handler.ts
└── dist/                   # Compiled output (generated)
    ├── mcp-server.js
    ├── mcp-server.d.ts
    ├── mcp-server.js.map
    ├── version-checker.js
    ├── version-checker.d.ts
    ├── version-checker.js.map
    ├── error-handler.js
    ├── error-handler.d.ts
    └── error-handler.js.map

webai-server/
├── browser-connector.ts    # TypeScript source files
├── auto-paste-manager.ts
├── puppeteer-service.ts
├── proxy-config.ts
├── lighthouse/
│   ├── index.ts
│   ├── accessibility.ts
│   ├── performance.ts
│   ├── seo.ts
│   ├── best-practices.ts
│   └── types.ts
└── dist/                   # Compiled output (generated)
    ├── browser-connector.js
    ├── browser-connector.d.ts
    ├── browser-connector.js.map
    ├── auto-paste-manager.js
    ├── auto-paste-manager.d.ts
    ├── auto-paste-manager.js.map
    ├── puppeteer-service.js
    ├── puppeteer-service.d.ts
    ├── puppeteer-service.js.map
    ├── proxy-config.js
    ├── proxy-config.d.ts
    ├── proxy-config.js.map
    └── lighthouse/
        ├── index.js
        ├── index.d.ts
        ├── index.js.map
        ├── accessibility.js
        ├── accessibility.d.ts
        ├── accessibility.js.map
        ├── performance.js
        ├── performance.d.ts
        ├── performance.js.map
        ├── seo.js
        ├── seo.d.ts
        ├── seo.js.map
        ├── best-practices.js
        ├── best-practices.d.ts
        ├── best-practices.js.map
        ├── types.js
        ├── types.d.ts
        └── types.js.map
```

### **Build Process Details**

#### **Compilation Steps**
1. **Type Checking**: Full TypeScript type validation
2. **Source Compilation**: .ts → .js transformation
3. **Declaration Generation**: .d.ts type definition files
4. **Source Maps**: .js.map files for debugging
5. **Asset Copying**: Non-TypeScript files (if any)

#### **Build Optimization**
- **Incremental Compilation**: Only rebuilds changed files
- **Watch Mode**: Automatic rebuilds during development
- **Parallel Builds**: Workspace packages build independently
- **Error Handling**: Stops on first compilation error

### **Development Build Workflow**

#### **Initial Setup**
```bash
# 1. Install all dependencies
npm run install:all

# 2. Initial build
npm run build:all

# 3. Verify build success
ls webai-mcp/dist/
ls webai-server/dist/
```

#### **Development Cycle**
```bash
# Start development servers with auto-rebuild
npm run dev

# Or manually watch for changes
cd webai-mcp && npm run build:watch &
cd webai-server && npm run build:watch &
```

#### **Build Verification**
```bash
# Check build artifacts exist
test -f webai-mcp/dist/mcp-server.js && echo "MCP build OK"
test -f webai-server/dist/browser-connector.js && echo "Server build OK"

# Verify TypeScript declarations
test -f webai-mcp/dist/mcp-server.d.ts && echo "MCP types OK"
test -f webai-server/dist/browser-connector.d.ts && echo "Server types OK"

# Check lighthouse module build
test -f webai-server/dist/lighthouse/index.js && echo "Lighthouse build OK"
```

### **Local Build Verification**

- `npm run build:all`
- `npm test`
- `npm run lint`

Use the artifact checks in the normal development section to validate outputs.

### **Build Troubleshooting**

#### **Common Build Issues**
```bash
# "Cannot find module" errors
npm run clean && npm run install:all && npm run build:all

# TypeScript compilation errors
npx tsc --noEmit --project webai-mcp/tsconfig.json
npx tsc --noEmit --project webai-server/tsconfig.json

# Build artifacts missing
rm -rf */build && npm run build:all

# Permission issues (Windows)
npm run clean:locks && npm run install:all
```

#### **Build Performance**
- **Parallel Compilation**: Both packages build simultaneously
- **Incremental Builds**: Only changed files recompiled
- **Watch Mode**: Instant rebuilds during development
- **Memory Usage**: Optimized for local multi-platform development

## 🔢 Version Management System

### **Versioning Strategy**
WebAI-MCP follows semantic versioning with automated version management across multiple tracks.

#### **Version Tracks**
```
Production:  1.5.1 → 1.5.2 → 1.6.0 → 2.0.0
Development: 1.5.1-dev.1 → 1.5.1-dev.2 → 1.5.1-dev.3
PR Preview:  1.5.1-pr-main.123 → 1.5.1-pr-main.124
```

### **Automated Version Increment**

#### **Development Versions**
```bash
# Current version: 1.5.1
npm version prerelease --preid=dev --no-git-tag-version
# Result: 1.5.1-dev.1

# Current version: 1.5.1-dev.2
npm version prerelease --preid=dev --no-git-tag-version
# Result: 1.5.1-dev.3
```

#### **Production Versions**
```bash
# Patch increment (bug fixes)
npm version patch --no-git-tag-version
# 1.5.1 → 1.5.2

# Minor increment (new features)
npm version minor --no-git-tag-version
# 1.5.1 → 1.6.0

# Major increment (breaking changes)
npm version major --no-git-tag-version
# 1.5.1 → 2.0.0
```

### **Multi-Package Version Sync**

#### **Synchronized Versioning**
All packages maintain identical version numbers:
```json
// webai-mcp/package.json
{ "version": "1.5.1-dev.3" }

// webai-server/package.json
{ "version": "1.5.1-dev.3" }

// chrome-extension/manifest.json
{ "version": "1.5.1" }  // Removes dev suffix for Chrome
```

#### **Version Update Script**
```bash
# Local release helper
NEW_VERSION="1.5.1-dev.3"

# Update webai-server
cd webai-server
npm version $NEW_VERSION --no-git-tag-version

# Update webai-mcp to same version
cd ../webai-mcp
npm version $NEW_VERSION --no-git-tag-version

# Update Chrome extension (remove dev suffix)
cd ../chrome-extension
MANIFEST_VERSION=$(echo "$NEW_VERSION" | sed 's/-dev\.[0-9]*$//')
node -e "
  const fs = require('fs');
  const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
  manifest.version = '$MANIFEST_VERSION';
  fs.writeFileSync('manifest.json', JSON.stringify(manifest, null, 2) + '\n');
"
```

### **Version Tracking Files**

#### **version.json**
Central version tracking file:
```json
{
  "version": "1.5.1-dev.3",
  "lastUpdated": "2025-01-15T10:30:00.000Z",
  "track": "development",
  "packages": {
    "webai-mcp": "1.5.1-dev.3",
    "webai-server": "1.5.1-dev.3",
    "chrome-extension": "1.5.1"
  }
}
```

#### **Package.json Synchronization**
```bash
# Check version consistency
npm run version:check

# Update all packages to specific version
npm run version:sync 1.5.2

# Bump all packages
npm run version:bump patch|minor|major
```

### **Release Tag Management**

#### **Git Tag Strategy**
```bash
# Development tags
v1.5.1-dev.1, v1.5.1-dev.2, v1.5.1-dev.3

# Production tags
v1.5.1, v1.5.2, v1.6.0

# PR preview tags
v1.5.1-pr-main.123, v1.5.1-pr-main.124
```

#### **Automated Tagging**
```bash
# Manual release path
VERSION="v1.5.1"
git tag "$VERSION"
git push origin "$VERSION"
```

### **Version Validation**

#### **Pre-Release Checks**
```bash
# Verify version format
if [[ ! "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-dev\.[0-9]+)?$ ]]; then
  echo "Invalid version format: $VERSION"
  exit 1
fi

# Check for existing release
if gh release view "v$VERSION" >/dev/null 2>&1; then
  echo "Release v$VERSION already exists"
  exit 1
fi
```

#### **Version Compatibility**
```bash
# Check Node.js version compatibility
node -e "
  const pkg = require('./package.json');
  const nodeVersion = process.version;
  console.log('Node.js:', nodeVersion);
  console.log('Package:', pkg.version);
"

# Verify package dependencies
npm audit --audit-level=high
```

### **Manual Version Management**

#### **Emergency Version Updates**
```bash
# 1. Update version manually
cd webai-server
npm version 1.5.1-hotfix.1 --no-git-tag-version

# 2. Sync other packages
cd ../webai-mcp
npm version 1.5.1-hotfix.1 --no-git-tag-version

# 3. Update Chrome extension
cd ../chrome-extension
# Update manifest.json manually

# 4. Commit and tag
git add .
git commit -m "chore: emergency version bump to 1.5.1-hotfix.1"
git tag v1.5.1-hotfix.1
git push origin main v1.5.1-hotfix.1
```

#### **Version Rollback**
```bash
# Rollback to previous version
PREVIOUS_VERSION="1.5.0"

# Update all packages
cd webai-server && npm version $PREVIOUS_VERSION --no-git-tag-version
cd ../webai-mcp && npm version $PREVIOUS_VERSION --no-git-tag-version

# Update Chrome extension
cd ../chrome-extension
# Manually update manifest.json

# Commit rollback
git add .
git commit -m "chore: rollback to version $PREVIOUS_VERSION"
```

## ⚙️ Workflow Automation

### **Status**

Automated GitHub Actions workflows for build/release are currently disabled.

- `.github/workflows` is not used for CI or release automation.
- Releases are prepared with local release scripts and published manually.
- GitHub is used for source hosting and manual release distribution.

## 🧪 Testing Strategy

### **Test Matrix**
- **Operating Systems**: Ubuntu, macOS, Windows
- **Node.js Versions**: 18.x, 20.x, 22.x
- **Test Types**: Unit, Integration, Cross-platform compatibility

### **Test Commands**
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit                    # Unit tests
npm run test:integration             # Integration tests
npm run test:browser                 # Browser extension tests
npm run test:cross-platform          # Cross-platform compatibility

# Coverage reports
npm run test:coverage                # Generate coverage report
npm run test:coverage:open           # Open coverage report in browser
```

### **Test Structure**
```
tests/
├── unit/                           # Unit tests
│   ├── tools/                      # MCP tool tests
│   ├── utils/                      # Utility function tests
│   └── server/                     # Server component tests
├── integration/                    # Integration tests
│   ├── mcp-server/                 # MCP server integration
│   ├── webai-server/               # WebAI server integration
│   └── chrome-extension/           # Extension integration
└── fixtures/                       # Test data and fixtures
```

## 📦 NPM Package Management

### 🚀 Release Packaging

- Packaging is produced by `npm run release:local` scripts.
- Upload all generated artifacts manually to GitHub Releases.

### 📈 Version Tracking
- **version.json**: central version configuration
- **CHANGELOG.md**: manually curated release notes and history
- **GitHub Releases**: published manually with packaged artifacts

### 🏗️ Build Process Documentation
- **TypeScript Compilation**: `tsc` outputs to the `dist/` directory
- **Package publishing**: run locally with `--publish` as needed
- **Chrome Extension Packaging**: zip generated by local release scripts
- **Documentation updates**: manual or script-assisted as part of release prep

### ✅ Testing Integration
- **Unit Tests**: Jest with TypeScript support
- **Integration Tests**: cross-component compatibility
- **Build Verification**: artifact validation and local checks
- **Cross-Platform Testing**: Windows, macOS, Linux compatibility

### **Package Configuration**

#### **Robust Installation Pattern**
```bash
# Local installation with fallback
npm ci --prefer-offline || (rm -f package-lock.json && npm install)
```

#### **Cross-Platform Scripts**
```json
{
  "scripts": {
    "install:all": "npm install && cd webai-mcp && npm install && cd ../webai-server && npm install",
    "build:all": "cd webai-mcp && npm run build && cd ../webai-server && npm run build",
    "clean:locks": "find . -name 'package-lock.json' -delete 2>/dev/null || Remove-Item -Path .\\*\\package-lock.json -Force -ErrorAction SilentlyContinue",
    "reset:deps": "npm run clean:locks && npm run install:all"
  }
}
```

### **Dependency Management**
- **Update Strategy**: One dependency at a time for better control
- **Version Policy**: Latest compatible versions while respecting requirements
- **Security**: Regular security audits with `npm audit`
- **Lock Files**: Individual package-lock.json files in each package directory

### **Common NPM Issues & Solutions**

#### **"npm ci failed"**
- Workflow automatically falls back to `npm install`
- Lock files regenerated automatically

#### **"Build artifacts missing"**
- Check all dependencies are installed: `npm run install:all`
- Rebuild everything: `npm run build:all`

#### **"Cross-platform path issues"**
- Use provided setup scripts for consistency
- Scripts handle Windows/Unix path differences automatically

## 🔍 Code Quality Standards

### **TypeScript Configuration**
- **Strict mode**: Enabled for type safety
- **Target**: ES2020 for modern JavaScript features
- **Module**: CommonJS for Node.js compatibility
- **Source maps**: Enabled for debugging

### **ESLint Rules**
- **Base**: @typescript-eslint/recommended
- **Style**: Prettier integration
- **Custom rules**: Project-specific linting rules

### **Code Formatting**
- **Prettier**: Automatic code formatting
- **Line length**: 100 characters maximum
- **Indentation**: 2 spaces
- **Semicolons**: Required

### **Commit Convention**
```
type(scope): description

Types: feat, fix, docs, style, refactor, test, chore
Scopes: mcp, server, extension, docs, ci
```

Examples:
```
feat(mcp): add new screenshot tool
fix(server): resolve connection timeout issue
docs(readme): update installation instructions
```

## 🛠️ Troubleshooting Development Issues

### **Build Issues**
```bash
# Clean and rebuild everything
npm run clean:locks
npm run install:all
npm run build:all
```

### **Extension Development**
```bash
# Load unpacked extension
1. Chrome → Extensions → Developer mode ON
2. Click "Load unpacked"
3. Select chrome-extension/ folder
4. Reload extension after changes
```

### **Server Connection Issues**
```bash
# Check server status
curl http://localhost:3025/health

# Check server logs
cd webai-server && npm run dev    # Shows detailed logs
```

### **Version Compatibility Issues**
```bash
# Check component versions
npm run version:check

# Update to latest compatible versions
npm run update:compatible
```

## 📊 Monitoring & Maintenance

### **Performance Monitoring**
- **Memory usage**: Monitor for memory leaks
- **CPU usage**: Optimize resource-intensive operations
- **Network requests**: Minimize unnecessary API calls

### **Security Practices**
- **Dependency audits**: Regular `npm audit` checks
- **Secret management**: Use GitHub secrets for sensitive data
- **Permission reviews**: Minimal required permissions only

### **Maintenance Tasks**
- **Weekly**: Dependency updates and security audits
- **Monthly**: Performance reviews and optimization
- **Quarterly**: Major version updates and architecture reviews

## 🎯 Contributing Guidelines

### **Before Contributing**
1. **Read this developer guide** thoroughly
2. **Set up development environment** following setup instructions
3. **Run tests** to ensure everything works
4. **Check existing issues** to avoid duplicates

### **Contribution Process**
1. **Fork repository** and create feature branch
2. **Make changes** following code quality standards
3. **Add tests** for new functionality
4. **Update documentation** as needed
5. **Submit pull request** with clear description

### **Pull Request Requirements**
 - ✅ **All tests pass**: Required checks in local verification pass
 - ✅ **Code review**: At least one approval required
 - ✅ **Documentation**: Update relevant docs
 - ✅ **Changelog**: Add entry for significant changes

This developer guide provides comprehensive information for contributing to and maintaining the WebAI-MCP project.
