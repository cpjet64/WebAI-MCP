# Changelog Automation System

> Legacy cloud-workflow notes: preserved for provenance.
> For active commit gating and CI flow, use local-only policy in `docs/LOCAL_CICD.md`.
> Historical index: `docs/legacy/README.md`.

## 🤖 **Overview**

WebAI-MCP now features a fully automated changelog system that updates `CHANGELOG.md` automatically during releases. This ensures the changelog is always current and follows consistent formatting.

## 🔄 **How It Works**

### **Automated Updates**

#### **1. Dev Releases (Automatic)**
- **Trigger**: Push to `dev` branch
- **Workflow**: `.github/workflows/dev-release.yml`
- **Action**: Automatically adds dev release entry to changelog
- **Format**: `[1.4.3-dev.1] - 2025-05-26`

#### **2. Production Releases (Automatic)**
- **Trigger**: Manual workflow dispatch or version change on `main`
- **Workflow**: `.github/workflows/complete-release.yml`
- **Action**: Converts `[Unreleased]` section to production release
- **Format**: `[1.5.0] - 2025-05-26`

### **Manual Updates**

#### **3. Manual Script**
- **Script**: `scripts/update-changelog.sh`
- **Usage**: For custom changelog updates
- **Interactive**: Prompts for commit confirmation

## 📋 **Changelog Format**

### **Automated Entry Structure**

#### **Development Releases**
```markdown
## [1.4.3-dev.1] - 2025-05-26

### 🧪 **Development Release**

This is an automated development release with the latest features and improvements.

#### **✨ Recent Changes**
- feat: implement RefreshBrowser tool for Phase 1
- fix: restore dev-release workflow and enable dev branch testing
- docs: update CHANGELOG.md with recent developments

#### **🚀 Installation**
```bash
npx @cpjet64/webai-mcp@dev
npx @cpjet64/webai-server@dev
```

---
```

#### **Production Releases**
```markdown
## [1.5.0] - 2025-05-26

### 🚀 **Production Release**

#### **✨ What's New**
- feat: complete Phase 1 implementation with all core tools
- feat: add element interaction capabilities
- fix: improve error handling and stability

#### **📦 Installation**
```bash
npx @cpjet64/webai-mcp@latest
npx @cpjet64/webai-server@latest
```

#### **🔗 Links**
- [GitHub Release](https://github.com/cpjet64/WebAI-MCP/releases/tag/v1.5.0)
- [NPM Package (MCP)](https://www.npmjs.com/package/@cpjet64/webai-mcp)
- [NPM Package (Server)](https://www.npmjs.com/package/@cpjet64/webai-server)

---
```

## 🛠️ **Manual Usage**

### **Using the Update Script**

```bash
# Auto-detect version for dev release
./scripts/update-changelog.sh auto dev

# Specific version for production release
./scripts/update-changelog.sh 1.5.0 release

# Auto-detect current version for production
./scripts/update-changelog.sh auto release
```

### **Script Options**

| Parameter | Description | Example |
|-----------|-------------|---------|
| `version` | Version number or "auto" | `1.5.0`, `auto` |
| `type` | Release type | `dev`, `release` |

### **Manual Editing**

You can still manually edit `CHANGELOG.md` for:
- **Custom release notes**
- **Detailed feature descriptions**
- **Breaking change documentation**
- **Migration guides**

## 🔧 **Configuration**

### **Auto-Changelog Settings**

The system uses `.auto-changelog` configuration:

```json
{
  "output": "CHANGELOG.md",
  "template": "keepachangelog",
  "unreleased": true,
  "commitLimit": false,
  "tagPrefix": "v",
  "sortCommits": "date",
  "includeBranch": ["main", "dev"]
}
```

### **Commit Message Patterns**

The automation recognizes conventional commit patterns:

| Type | Icon | Description |
|------|------|-------------|
| `feat` | ✨ | New features |
| `fix` | 🐛 | Bug fixes |
| `docs` | 📚 | Documentation |
| `style` | 💄 | Code style |
| `refactor` | ♻️ | Code refactoring |
| `perf` | ⚡ | Performance |
| `test` | ✅ | Tests |
| `chore` | 🔧 | Maintenance |
| `ci` | 👷 | CI/CD |
| `build` | 📦 | Build system |

## 📊 **Workflow Integration**

### **Dev Release Workflow**
1. **Trigger**: Push to `dev` branch
2. **Version Bump**: Auto-increment dev version
3. **Changelog Update**: Add dev release entry
4. **Commit**: Commit version and changelog changes
5. **Publish**: Create NPM dev release and GitHub prerelease

### **Production Release Workflow**
1. **Trigger**: Manual workflow dispatch
2. **Version Bump**: Set production version
3. **Changelog Update**: Convert [Unreleased] to release
4. **Commit**: Commit all changes
5. **Publish**: Create NPM latest release and GitHub release

## 🎯 **Benefits**

### **Consistency**
- **Standardized Format**: All entries follow the same structure
- **Automatic Dating**: Correct dates for all releases
- **Version Tracking**: Accurate version numbers

### **Automation**
- **No Manual Work**: Changelog updates automatically
- **Always Current**: Never falls behind releases
- **Reduced Errors**: No human mistakes in formatting

### **Transparency**
- **Clear History**: Easy to see what changed when
- **Installation Instructions**: Always up-to-date install commands
- **Links**: Direct links to releases and packages

## 🔍 **Troubleshooting**

### **Common Issues**

#### **Changelog Not Updating**
- Check if root `package.json` dependencies are installed
- Verify workflow has write permissions
- Check for merge conflicts in CHANGELOG.md

#### **Incorrect Formatting**
- Review `.auto-changelog` configuration
- Check commit message format
- Verify script permissions

#### **Missing Entries**
- Ensure commits follow conventional format
- Check if commits are being filtered out
- Verify branch inclusion in configuration

### **Manual Recovery**

If automation fails, you can:

1. **Run manual script**:
   ```bash
   ./scripts/update-changelog.sh auto dev
   ```

2. **Edit manually**:
   - Follow the format examples above
   - Maintain consistent structure
   - Update version numbers correctly

3. **Reset from template**:
   - Use existing entries as templates
   - Copy format from recent releases
   - Ensure proper markdown syntax

## 🚀 **Future Enhancements**

Planned improvements:
- **AI-Generated Summaries**: Use AI to create better release descriptions
- **Breaking Change Detection**: Automatically detect and highlight breaking changes
- **Contributor Recognition**: Automatically credit contributors
- **Release Notes Integration**: Sync with GitHub release notes
- **Semantic Analysis**: Better categorization of changes

---

**The automated changelog system ensures WebAI-MCP maintains professional, up-to-date documentation with minimal manual effort!** 🎉
