# Branch Protection Rules Setup Guide

> Historical hosted-CI branch-protection guide.
> Current repository commit-gating policy is local-only and documented in `docs/LOCAL_CICD.md`.
> Historical index: `docs/legacy/README.md`.
> Note: repository URLs/status-check names here are preserved from the original BrowserTools-era workflow.

## 🛡️ Overview

Branch protection rules ensure code quality and prevent accidental changes to important branches. This guide walks you through setting up protection for both `main` and `dev` branches.

## 🚀 Quick Setup

### **Step 1: Access Branch Protection Settings**

1. Go to your GitHub repository: `https://github.com/cpjet64/browser-tools-mcp`
2. Click **Settings** tab
3. Click **Branches** in the left sidebar
4. Click **Add rule** button

### **Step 2: Configure Main Branch Protection**

**Branch name pattern:** `main`

#### **✅ Required Settings for Main Branch**

**Protect matching branches:**
- ☑️ **Require a pull request before merging**
  - ☑️ **Require approvals**: `1`
  - ☑️ **Dismiss stale reviews when new commits are pushed**
  - ☑️ **Require review from code owners** (if you have CODEOWNERS file)
  - ☑️ **Restrict pushes that create files that change code owner review requirements**

**Status checks:**
- ☑️ **Require status checks to pass before merging**
- ☑️ **Require branches to be up to date before merging**
- **Required status checks** (add these as they become available):
  - `build-and-release`
  - `check-version`
  - `test` (if you have tests)

**Additional restrictions:**
- ☑️ **Restrict pushes to matching branches**
  - **Who can push:** `Restrict pushes to administrators`
- ☑️ **Allow force pushes**: `❌ Disabled`
- ☑️ **Allow deletions**: `❌ Disabled`

#### **🔒 Main Branch Protection Summary**
```
Branch: main
├── Require PR with 1 approval
├── Dismiss stale reviews
├── Require status checks
├── Require up-to-date branches
├── Restrict to administrators only
├── No force pushes
└── No deletions
```

### **Step 3: Configure Dev Branch Protection**

**Branch name pattern:** `dev`

#### **✅ Required Settings for Dev Branch**

**Protect matching branches:**
- ☑️ **Require a pull request before merging**
  - ☑️ **Require approvals**: `1`
  - ☑️ **Dismiss stale reviews when new commits are pushed**
  - ☐ **Require review from code owners** (optional for dev)

**Status checks:**
- ☑️ **Require status checks to pass before merging**
- ☑️ **Require branches to be up to date before merging**
- **Required status checks**:
  - `publish-dev`
  - `test` (if you have tests)

**Additional restrictions:**
- ☐ **Restrict pushes to matching branches** (allow direct pushes for development)
- ☑️ **Allow force pushes**: `✅ Enabled` (for development flexibility)
- ☑️ **Allow deletions**: `❌ Disabled`

#### **🔧 Dev Branch Protection Summary**
```
Branch: dev
├── Require PR with 1 approval
├── Dismiss stale reviews
├── Require status checks
├── Require up-to-date branches
├── Allow direct pushes (for maintainers)
├── Allow force pushes (for rebasing)
└── No deletions
```

## 📋 Step-by-Step Walkthrough

### **Setting Up Main Branch Protection**

1. **Navigate to Branch Protection**
   - Repository → Settings → Branches → Add rule

2. **Enter Branch Pattern**
   ```
   Branch name pattern: main
   ```

3. **Configure Pull Request Requirements**
   - Check: "Require a pull request before merging"
   - Set: "Required number of approvals before merging: 1"
   - Check: "Dismiss stale pull request approvals when new commits are pushed"

4. **Configure Status Checks**
   - Check: "Require status checks to pass before merging"
   - Check: "Require branches to be up to date before merging"
   - Add status checks (these will appear after first workflow runs):
     - `build-and-release`
     - `check-version`

5. **Configure Push Restrictions**
   - Check: "Restrict pushes to matching branches"
   - Select: "Restrict pushes to administrators"

6. **Configure Additional Settings**
   - Uncheck: "Allow force pushes"
   - Uncheck: "Allow deletions"

7. **Click "Create" to save**

### **Setting Up Dev Branch Protection**

1. **Add Another Rule**
   - Click "Add rule" again

2. **Enter Branch Pattern**
   ```
   Branch name pattern: dev
   ```

3. **Configure Pull Request Requirements**
   - Check: "Require a pull request before merging"
   - Set: "Required number of approvals before merging: 1"
   - Check: "Dismiss stale pull request approvals when new commits are pushed"

4. **Configure Status Checks**
   - Check: "Require status checks to pass before merging"
   - Check: "Require branches to be up to date before merging"
   - Add status checks:
     - `publish-dev`

5. **Configure Push Restrictions**
   - Leave unchecked: "Restrict pushes to matching branches" (allows direct pushes)

6. **Configure Additional Settings**
   - Check: "Allow force pushes" (for development flexibility)
   - Uncheck: "Allow deletions"

7. **Click "Create" to save**

## 🔍 Verification

### **Test Main Branch Protection**
```bash
# This should be blocked
git checkout main
echo "test" > test.txt
git add test.txt
git commit -m "test commit"
git push origin main
# Expected: Push rejected due to branch protection
```

### **Test Dev Branch Protection**
```bash
# This should work (if you're a maintainer)
git checkout dev
echo "dev test" > dev-test.txt
git add dev-test.txt
git commit -m "dev test commit"
git push origin dev
# Expected: Push succeeds, triggers dev release workflow
```

## 🎯 Best Practices

### **For Main Branch**
- **Always use PRs** - No direct pushes allowed
- **Require reviews** - At least 1 approval needed
- **Status checks** - All CI/CD must pass
- **Up-to-date branches** - Must rebase/merge latest changes

### **For Dev Branch**
- **Use PRs for features** - Merge feature branches via PR
- **Allow direct pushes** - For quick fixes and maintenance
- **Require status checks** - Ensure dev releases work
- **Allow force pushes** - For rebasing and cleanup

### **Workflow Integration**
- **Feature development**: `feature/name` → PR to `dev`
- **Release preparation**: `dev` → PR to `main`
- **Hotfixes**: `hotfix/name` → PR to `main`

## 🚨 Troubleshooting

### **Status Checks Not Appearing**
- Status checks only appear after the first workflow run
- Push to the branch to trigger workflows
- Check Actions tab for workflow status

### **Can't Push to Protected Branch**
- Ensure you have the right permissions
- Use pull requests instead of direct pushes
- Check if you're an administrator (for main branch)

### **Workflow Failures**
- Check Actions tab for detailed error logs
- Ensure all required secrets are set (NPM_DEPLOY)
- Verify workflow files are in `.github/workflows/`

## 🔧 Advanced Configuration

### **Adding CODEOWNERS File**
Create `.github/CODEOWNERS`:
```
# Global owners
* @cpjet64

# Specific paths
/browser-tools-server/ @cpjet64
/browser-tools-mcp/ @cpjet64
/.github/ @cpjet64
```

### **Custom Status Checks**
Add more status checks as needed:
- `lint` - Code linting
- `security-scan` - Security scanning
- `dependency-check` - Dependency vulnerability check

## ✅ Final Checklist

- [ ] Main branch protection configured
- [ ] Dev branch protection configured
- [ ] Status checks added (after first workflow runs)
- [ ] Push restrictions set appropriately
- [ ] Force push settings configured
- [ ] Deletion protection enabled
- [ ] Test both branches work as expected

Your branch protection is now set up for a professional development workflow!
