#!/bin/bash
# WebAI-MCP Dependency Setup Script (Unix/Linux/macOS)
# This script ensures all dependencies are properly installed and lock files are generated

set -e

echo "🔧 WebAI-MCP Dependency Setup"
echo "=============================="

# Check Node.js and npm
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 20.11.0 or later."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install npm."
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js version: $NODE_VERSION"

NPM_VERSION=$(npm --version)
echo "✅ npm version: $NPM_VERSION"

# Clean existing lock files if requested
if [[ "$1" == "--clean" ]]; then
    echo "🧹 Cleaning existing lock files..."
    
    find . -name "package-lock.json" -delete 2>/dev/null || true
    echo "   Removed all package-lock.json files"
fi

# Function to install dependencies with fallback
install_dependencies() {
    local dir=$1
    local name=$2
    
    echo "📦 Installing dependencies for $name..."
    cd "$dir"
    
    # Try npm ci first (faster)
    if npm ci --prefer-offline; then
        echo "✅ npm ci succeeded for $name"
    else
        echo "⚠️ npm ci failed for $name, falling back to npm install"
        rm -f package-lock.json
        npm install
        echo "✅ npm install succeeded for $name" 
    fi
    
    cd - > /dev/null
}

# Install dependencies for each package
echo ""
install_dependencies "webai-mcp" "MCP Server"
install_dependencies "webai-server" "WebAI Server"
install_dependencies "." "Root Workspace"

# Verify builds work
echo ""
echo "🏗️ Verifying builds..."

cd webai-mcp
npm run build
echo "✅ MCP build successful"
cd ..

cd webai-server
npm run build
echo "✅ Server build successful"
cd ..

echo ""
echo "🎉 All dependencies installed and builds verified!"
echo ""
echo "📋 Next steps:"
echo "   1. Commit the new package-lock.json files"
echo "   2. Run your local verification pipeline"
echo "   3. Publish/release manually as needed"
