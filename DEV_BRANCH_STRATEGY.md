# Development Branch Strategy

> Historical branch/workflow strategy reference.
> Local-only CI/CD policy supersedes hosted workflow assumptions in this document; see `docs/LOCAL_CICD.md`.

## 🌿 Branch Structure

### **Main Branches**
- **`main`** - Production-ready code, stable releases
- **`dev`** - Development branch, integration of new features

### **Feature Branches**
- **`feature/feature-name`** - Individual feature development
- **`bugfix/issue-description`** - Bug fixes
- **`hotfix/critical-fix`** - Critical production fixes (branch from main)

## 📦 NPM Publishing Strategy

### **NPM Tags**
- **`latest`** - Stable production releases (from `main`)
- **`dev`** - Development releases (from `dev` branch)

### **Version Numbering**
- **Production**: `1.4.0`, `1.4.1`, `1.5.0`
- **Development**: `1.5.0-dev.1`, `1.5.0-dev.2`, `1.5.0-dev.3`

## 🔄 Workflow

### **Development Workflow**
1. **Create feature branch** from `dev`
   ```bash
   git checkout dev
   git pull origin dev
   git checkout -b feature/new-feature
   ```

2. **Develop and test** feature
3. **Create PR** to `dev` branch
4. **Merge to dev** after review
5. **Publish dev release** to NPM

### **Release Workflow**
1. **Test dev branch** thoroughly
2. **Create PR** from `dev` to `main`
3. **Merge to main** after final review
4. **Auto-publish stable release** to NPM
5. **Create GitHub release** with changelog

### **Hotfix Workflow**
1. **Create hotfix branch** from `main`
2. **Fix critical issue**
3. **Create PR** to `main`
4. **Merge and publish** hotfix release
5. **Merge main back** to `dev`

## 🚀 Automated Publishing

### **Dev Release Workflow**
- Triggers on push to `dev` branch
- Auto-increments dev version (e.g., `1.4.2-dev.1`)
- Publishes to NPM with `@dev` tag
- Creates GitHub prerelease
- Updates all package versions

### **Production Release Workflow**
- Triggers on version changes in `main` branch
- Creates stable GitHub release
- Publishes to NPM with `@latest` tag
- Generates comprehensive release notes

## 📋 Branch Protection Rules

### **Main Branch Protection**
- Require pull request reviews
- Require status checks to pass
- Require branches to be up to date
- Restrict pushes to admins only

### **Dev Branch Protection**
- Require pull request reviews
- Allow force pushes (for development flexibility)
- Require status checks to pass

## 🧪 Testing Strategy

### **Branch-Specific Testing**
- **Feature branches**: Unit tests, basic integration
- **Dev branch**: Full test suite, automated testing, manual testing
- **Main branch**: Production validation, smoke tests

## 📖 Usage Instructions

### **For End Users**
```bash
# Install stable version (recommended)
npx @cpjet64/webai-mcp@latest
npx @cpjet64/webai-server@latest

# Install development version (latest features, may be unstable)
npx @cpjet64/webai-mcp@dev
npx @cpjet64/webai-server@dev
```

### **For Contributors**
```bash
# Start development
git clone https://github.com/cpjet64/WebAI-MCP.git
cd WebAI-MCP
git checkout dev

# Create feature branch
git checkout -b feature/my-new-feature

# Make changes, commit, push
git add .
git commit -m "feat: add new feature"
git push origin feature/my-new-feature

# Create PR to dev branch
```

## 🔍 Monitoring

### **NPM Package Monitoring**
- Monitor download stats for each tag
- Track version adoption rates
- Monitor for security vulnerabilities

### **GitHub Monitoring**
- Track PR merge rates
- Monitor CI/CD success rates
- Review branch health metrics

## 🎯 Benefits

This strategy provides:

1. **Clear separation** - Stable (`main`) vs Development (`dev`)
2. **Simple workflow** - Feature → Dev → Main
3. **Automated publishing** - Push to branch = NPM release
4. **Easy testing** - Users can easily try dev features
5. **Minimal complexity** - Just two main branches to manage
6. **Professional workflow** - Standard for open source projects

## 🚀 Current Implementation

✅ **Dev Release Workflow** - Automatically publishes dev versions
✅ **Test Workflow** - Runs on both main and dev branches
✅ **Production Release** - Automated stable releases
✅ **Version Management** - Semantic versioning with dev tags
