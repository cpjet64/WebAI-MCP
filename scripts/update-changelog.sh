#!/bin/bash

# WebAI-MCP Changelog Update Script
# Usage: ./scripts/update-changelog.sh [version] [type]
# Example: ./scripts/update-changelog.sh 1.5.0 release
# Example: ./scripts/update-changelog.sh auto dev

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -f "CHANGELOG.md" ]; then
    print_error "This script must be run from the WebAI-MCP root directory"
    exit 1
fi

# Get parameters
VERSION=${1:-"auto"}
TYPE=${2:-"dev"}

# Auto-detect version if needed
if [ "$VERSION" = "auto" ]; then
    if [ "$TYPE" = "dev" ]; then
        # Get current dev version and increment
        CURRENT_VERSION=$(node -p "require('./webai-server/package.json').version")
        if [[ $CURRENT_VERSION == *"-dev."* ]]; then
            # Increment dev number
            VERSION=$(echo $CURRENT_VERSION | sed -E 's/(.+)-dev\.([0-9]+)/echo "\1-dev.$((\\2+1))"/e')
        else
            # Create first dev version
            VERSION="${CURRENT_VERSION}-dev.1"
        fi
    else
        # Get current version from package.json
        VERSION=$(node -p "require('./webai-server/package.json').version")
    fi
fi

print_status "Updating CHANGELOG.md for version $VERSION (type: $TYPE)"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Generate changelog entry
TODAY=$(date +%Y-%m-%d)
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "HEAD~10")

# Get recent changes
CHANGES=$(git log $LAST_TAG..HEAD --oneline --pretty=format:"- %s" --no-merges | head -10)

# Create changelog entry based on type
if [ "$TYPE" = "dev" ]; then
    cat > temp_changelog.md << EOF
## [${VERSION}] - ${TODAY}

### 🧪 **Development Release**

This is an automated development release with the latest features and improvements.

#### **✨ Recent Changes**
${CHANGES}

#### **🚀 Installation**
\`\`\`bash
npx @cpjet64/webai-mcp@dev
npx @cpjet64/webai-server@dev
\`\`\`

---

EOF
else
    cat > temp_changelog.md << EOF
## [${VERSION}] - ${TODAY}

### 🚀 **Production Release**

#### **✨ What's New**
${CHANGES}

#### **📦 Installation**
\`\`\`bash
npx @cpjet64/webai-mcp@latest
npx @cpjet64/webai-server@latest
\`\`\`

#### **🔗 Links**
- [GitHub Release](https://github.com/cpjet64/WebAI-MCP/releases/tag/v${VERSION})
- [NPM Package (MCP)](https://www.npmjs.com/package/@cpjet64/webai-mcp)
- [NPM Package (Server)](https://www.npmjs.com/package/@cpjet64/webai-server)

---

EOF
fi

# Update CHANGELOG.md
if grep -q "## \[Unreleased\]" CHANGELOG.md; then
    if [ "$TYPE" = "release" ]; then
        # Replace [Unreleased] with new version for production releases
        sed -i "s/## \[Unreleased\] - Development/## [${VERSION}] - ${TODAY}/" CHANGELOG.md
        # Add new [Unreleased] section
        sed -i "/^## \[${VERSION}\]/i\\## [Unreleased] - Development\n\n### 🚀 **Future Features (In Development)**\n\nUpcoming features and improvements will be listed here.\n\n---\n" CHANGELOG.md
    else
        # Insert dev release after [Unreleased] section
        UNRELEASED_LINE=$(grep -n "## \[Unreleased\]" CHANGELOG.md | cut -d: -f1)
        NEXT_RELEASE_LINE=$(tail -n +$((UNRELEASED_LINE + 1)) CHANGELOG.md | grep -n "^## \[" | head -1 | cut -d: -f1)
        if [ -n "$NEXT_RELEASE_LINE" ]; then
            NEXT_RELEASE_LINE=$((UNRELEASED_LINE + NEXT_RELEASE_LINE))
            head -n $((NEXT_RELEASE_LINE - 1)) CHANGELOG.md > temp_full_changelog.md
            cat temp_changelog.md >> temp_full_changelog.md
            tail -n +$NEXT_RELEASE_LINE CHANGELOG.md >> temp_full_changelog.md
            mv temp_full_changelog.md CHANGELOG.md
        else
            cat CHANGELOG.md temp_changelog.md > temp_full_changelog.md
            mv temp_full_changelog.md CHANGELOG.md
        fi
    fi
else
    # No [Unreleased] section, prepend to file
    cat temp_changelog.md CHANGELOG.md > temp_full_changelog.md
    mv temp_full_changelog.md CHANGELOG.md
fi

# Clean up
rm -f temp_changelog.md

print_success "CHANGELOG.md updated for version $VERSION"
print_status "Changes:"
echo "  - Added new $TYPE release entry"
echo "  - Date: $TODAY"
echo "  - Version: $VERSION"

# Ask if user wants to commit changes
read -p "Do you want to commit these changes? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add CHANGELOG.md
    git commit -m "docs: update CHANGELOG.md for $VERSION $TYPE release"
    print_success "Changes committed to git"
else
    print_warning "Changes not committed. You can review and commit manually."
fi

print_success "Changelog update complete!"
