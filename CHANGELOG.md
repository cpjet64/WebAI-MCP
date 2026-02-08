# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> Historical context: older changelog entries may reference hosted GitHub Actions or `dev` branch workflows from earlier project phases.
> Current commit-gating policy is local-only CI/CD (`docs/LOCAL_CICD.md`).

## [Unreleased] - Development

### 🚀 **Phase 1: Enhanced Core Features (In Progress)**

#### **✨ Added**
- **RefreshBrowser Tool** - Advanced browser refresh functionality with configurable options:
  - `waitForLoad`: Wait for page to fully load after refresh (default: true)
  - `timeout`: Configurable timeout for page load (default: 10000ms)
  - `preserveScrollPosition`: Attempt to preserve scroll position (default: false)
  - `clearCache`: Clear browser cache before refresh (default: false)
- **Dev Release Workflow** - Restored automated development builds and releases
- **Enhanced Documentation** - Restored critical documentation files lost during migration

#### **🔧 Changed**
- **Test Workflow** - Now triggers on both `main` and `dev` branch pushes
- **Dev Versioning** - Automatic dev version bumping (e.g., `1.4.3-dev.0`, `1.4.3-dev.1`)
- **NPM Publishing** - Dev releases published with `@dev` tag for early testing

#### **📚 Documentation**
- **DEV_BRANCH_STRATEGY.md** - Restored development workflow documentation
- **EXTENSION_TROUBLESHOOTING.md** - Restored user troubleshooting guide
- **version.json** - Restored unified version tracking with feature flags
- **Enhanced .gitignore** - Comprehensive Node.js/TypeScript patterns for cleaner repository

#### **🐛 Fixed**
- **Dev Build System** - Restored missing dev-release workflow that was deleted during migration
- **GitHub Actions** - Fixed dev branch continuous integration
- **Documentation** - Restored important files accidentally deleted during WebAI-MCP migration

---

## [1.4.2] - 2025-05-26

### 🎯 **WebAI-MCP Migration & Stabilization**

#### **🔄 Breaking Changes**
- **Project Rebranding** - Complete migration from "Browser Tools MCP" to "WebAI-MCP"
- **Package Names** - Updated to `@cpjet64/webai-mcp` and `@cpjet64/webai-server`
- **Repository Structure** - Migrated directories from `browser-tools-*` to `webai-*`
- **GitHub URLs** - Updated all references to new WebAI-MCP repository structure

#### **✨ Added**
- **Enhanced .gitignore** - Comprehensive patterns for Node.js/TypeScript development:
  - Dependency management patterns (npm, yarn)
  - TypeScript build artifacts and source maps
  - Environment variable and configuration file patterns
  - IDE/editor specific files (VS Code, IntelliJ, Vim, etc.)
  - Cross-platform OS generated files
  - Testing and coverage report patterns
  - Chrome extension development files
  - Development tool caches

#### **🔧 Changed**
- **GitHub Workflows** - Updated all workflows for new directory structure
- **Documentation** - Updated all documentation with WebAI-MCP branding
- **Chrome Extension** - Updated manifest and references to WebAI-MCP
- **Package Metadata** - Updated descriptions, keywords, and repository URLs

#### **🐛 Fixed**
- **GitHub Actions** - Fixed cache-dependency-path errors in workflows
- **Directory References** - Updated all file paths and directory references
- **NPM Publishing** - Fixed package names in publishing workflows
- **Release Assets** - Updated file naming conventions for releases

---

## [1.4.1] - 2025-05-25

### 🔧 **Stability & Dependency Updates**

#### **✨ Added**
- **Express.js 5.x Support** - Major Express.js update with improved performance
- **Enhanced TypeScript Support** - Updated @types/express to 5.0.2
- **Dependency Security** - Updated cookie package from 0.7.1 to 0.7.2

#### **🔧 Changed**
- **Package Dependencies** - Major dependency updates for security and performance
- **Build Process** - Improved build stability and error handling
- **Version Management** - Enhanced version synchronization across components

#### **🐛 Fixed**
- **Merge Conflicts** - Resolved dependency update conflicts
- **Package Names** - Maintained correct package naming during updates
- **Version Consistency** - Ensured version alignment across all components

---

## [1.4.0] - 2024-12-19

### 🎉 **MAJOR RELEASE - Complete Feature Integration**

This release represents a **complete integration** of all feature branches into a unified, production-ready main branch. All previously separate features have been merged, tested, and validated for seamless operation.

### ✨ **Added**

#### **🔧 Automated Diagnostics System**
- **System Diagnostics** - Comprehensive system and environment validation
- **Automated Setup** - Intelligent setup and configuration workflows
- **Installation Validation** - Verify installation integrity and dependencies
- **Platform Detection** - Cross-platform compatibility checking
- **Interactive Diagnostic Workflows** - User-friendly diagnostic processes
- **Troubleshooting Guides** - Automated problem detection and solutions

#### **🛡️ Enhanced Error Handling**
- **Intelligent Error Recovery** - Automatic error detection and recovery mechanisms
- **Detailed Error Reporting** - Comprehensive error context and actionable solutions
- **Graceful Degradation** - Fallback mechanisms for failed operations
- **Error Categorization** - Severity levels and error classification
- **User-friendly Error Messages** - Clear, actionable error descriptions
- **Enhanced Logging** - Detailed debugging information and context

#### **🌐 Network & Proxy Management**
- **Complete Proxy Configuration** - Full proxy setup and management system
- **Network Diagnostics** - Network connectivity and performance testing
- **Proxy Auto-detection** - Automatic system proxy discovery (Windows/macOS/Linux)
- **Network Recommendations** - Environment-specific network optimization
- **HTTP/HTTPS/SOCKS Support** - Complete proxy protocol support
- **Proxy Authentication** - Secure proxy authentication mechanisms
- **Network Validation** - Connection testing and validation tools

#### **🖥️ Platform-Specific Features**
- **Windows Optimization** - Windows-specific path handling and features
- **macOS Integration** - Native macOS compatibility and optimization
- **Linux Support** - Full Linux distribution compatibility
- **Cross-platform Validation** - Unified experience across all platforms
- **Platform-specific Setup** - Automated platform detection and configuration
- **Path Conversion** - Intelligent path handling across operating systems

#### **🧪 Comprehensive Testing Infrastructure**
- **Integrated Test Suite** - Complete validation of all components
- **Cross-component Testing** - Integration testing between all features
- **Performance Validation** - Build time and runtime performance testing
- **Automated Reporting** - Detailed test results and metrics
- **Process Management** - Clean startup and shutdown procedures
- **Error Simulation** - Testing error handling and recovery mechanisms

### 🔧 **Changed**

#### **Architecture Improvements**
- **Unified Main Branch** - All feature branches merged into single, cohesive codebase
- **TypeScript Compliance** - Fixed all TypeScript compilation issues
- **Express.js Optimization** - Proper RequestHandler patterns and Promise<void> return types
- **Modular Design** - Clean separation of concerns across components
- **Configuration Management** - Centralized settings and preferences
- **Process Lifecycle** - Improved startup, operation, and shutdown procedures

#### **Code Quality Enhancements**
- **Professional TypeScript Patterns** - Industry-standard Express.js handler implementations
- **Error Handling Standardization** - Consistent error handling across all components
- **Documentation Updates** - Comprehensive documentation for all new features
- **Testing Standards** - Complete test coverage for all integrated features
- **Performance Optimization** - Faster builds, quicker startup, responsive endpoints

### 🐛 **Fixed**

#### **Critical Bug Fixes**
- **TypeScript Compilation Errors** - Resolved TS2769 errors in proxy-support branch
- **Express.js Handler Issues** - Fixed async route handler return type problems
- **Merge Conflicts** - Resolved all conflicts during feature branch integration
- **Build Process Issues** - Ensured clean builds across all components
- **Process Management** - Fixed process cleanup and port management issues

#### **Integration Issues**
- **Cross-component Communication** - Fixed communication between all integrated features
- **Configuration Conflicts** - Resolved configuration overlaps and conflicts
- **Dependency Management** - Cleaned up and optimized all dependencies
- **Path Resolution** - Fixed cross-platform path handling issues
- **Network Connectivity** - Resolved network and proxy configuration issues

### 🚀 **Performance**

#### **Build Performance**
- **Build Time** - Optimized to ~4 seconds for both servers
- **Startup Time** - Server startup in ~1 second
- **Test Execution** - Complete test suite runs in ~6 seconds
- **Memory Usage** - Optimized memory consumption and cleanup
- **Resource Management** - Efficient process and resource handling

#### **Runtime Performance**
- **Response Times** - Fast endpoint responses and API calls
- **Network Efficiency** - Optimized network request handling
- **Error Recovery** - Quick error detection and recovery
- **Cross-platform** - Consistent performance across all platforms
- **Scalability** - Improved handling of concurrent operations

### 📚 **Documentation**

#### **Updated Documentation**
- **README.md** - Complete feature overview and installation guide
- **Chinese README** - Updated 简体中文 documentation with all new features
- **Installation Guides** - Comprehensive setup instructions for all platforms
- **Usage Examples** - Detailed examples for all new features
- **API Documentation** - Complete API reference for all endpoints

#### **New Documentation**
- **Integration Guide** - How to use all integrated features together
- **Troubleshooting Guide** - Common issues and solutions
- **Platform-specific Guides** - Windows, macOS, and Linux specific instructions
- **Network Configuration** - Proxy and network setup documentation
- **Testing Documentation** - How to run and interpret tests

### 🔄 **Migration**

#### **Breaking Changes**
- **Package Names** - Updated to `@cpjet64/webai-mcp` and `@cpjet64/webai-server`
- **Configuration Format** - Enhanced configuration options for new features
- **API Endpoints** - New proxy and diagnostic endpoints added

#### **Migration Guide**
- **From v1.3.x** - Update package references and configuration
- **Feature Integration** - All features now available in single installation
- **Configuration Updates** - New options for proxy, diagnostics, and platform features

### 🎯 **Compatibility**

#### **Supported Platforms**
- ✅ **Windows** - Full support with path conversion and Windows-specific features
- ✅ **macOS** - Native support with macOS-specific optimizations
- ✅ **Linux** - Complete Linux distribution compatibility

#### **Supported Node.js Versions**
- ✅ **Node.js 18+** - Minimum supported version
- ✅ **Node.js 20** - Fully tested and recommended
- ✅ **Node.js 22** - Latest version support

#### **MCP Client Compatibility**
- ✅ **Cursor IDE** - Primary integration and testing
- ✅ **Claude Desktop** - Full feature support
- ✅ **Cline** - Compatible with all features
- ✅ **Zed** - Complete compatibility
- ✅ **Any MCP-compatible client** - Standard MCP protocol compliance

### 🏆 **Quality Metrics**

#### **Test Results**
- **Test Coverage** - 100% pass rate across all components
- **Integration Tests** - All 8 component categories validated
- **Performance Tests** - All performance benchmarks met
- **Cross-platform Tests** - Validated on Windows, macOS, Linux
- **Error Handling Tests** - All error scenarios tested and validated

#### **Code Quality**
- **TypeScript Compliance** - Zero compilation errors
- **ESLint Compliance** - All linting rules satisfied
- **Documentation Coverage** - Complete documentation for all features
- **Test Coverage** - Comprehensive test suite for all functionality
- **Performance Benchmarks** - All performance targets achieved

---

## [1.3.3] - 2024-12-18

### Added
- Storage access tools (cookies, localStorage, sessionStorage)
- Advanced element inspection with CSS selectors
- Enhanced screenshot capture for separate DevTools windows
- Audit & debug modes via Lighthouse integration
- Windows compatibility improvements
- Multi-language documentation support
- Automated release workflows

### Changed
- Updated to latest dependencies (Express 5.x, body-parser 2.x, node-fetch 3.x)
- Improved cross-platform testing
- Enhanced professional packaging

### Fixed
- stringSizeLimit and other critical bug fixes
- Windows path conversion issues
- Screenshot capture with separate DevTools windows

---

## [1.3.2] - 2024-12-17

### Added
- Initial fork from AgentDeskAI/browser-tools-mcp
- Community contributions integration
- Enhanced error handling
- Improved documentation

### Changed
- Package namespace to @cpjet64
- Repository structure optimization
- Build process improvements

### Fixed
- Various community-reported issues
- Dependency vulnerabilities
- Cross-platform compatibility issues

---

**For complete details on each release, see the [GitHub Releases](https://github.com/cpjet64/WebAI-MCP/releases) page.**
