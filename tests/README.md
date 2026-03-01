# WebAI-MCP Tests

This directory contains all test files and testing resources for the WebAI-MCP project.

## 📁 Test Files

### **🧪 `test-all.js`**
**Purpose**: Comprehensive test runner script for all WebAI-MCP components

**What it tests**:
- MCP server functionality
- WebAI server connectivity
- Chrome extension integration
- Version compatibility
- Error handling

**Usage**:
```bash
npm run test:all
```

### **🌐 `test-element-interaction.html`**
**Purpose**: Interactive HTML test page for Element Interaction Tools

**What it contains**:
- **Click Element Tests** - Buttons with different selectors and coordinate testing
- **Fill Input Tests** - Text inputs, textareas, email fields
- **Select Option Tests** - Dropdowns with value/text/index selection
- **Form Submit Tests** - Complete form submission workflows
- **Dynamic Content** - Elements that appear after delays (for testing waitForElement)
- **Visual Feedback** - Results display when interactions succeed

**Usage**:
1. Open this HTML file in Chrome
2. Use WebAI-MCP tools to interact with the test elements
3. Test commands like:
   - `clickElement({ selector: "#test-button" })`
   - `fillInput({ selector: "#test-input", text: "Hello World" })`
   - `selectOption({ selector: "#test-select", value: "option2" })`
   - `submitForm({ formSelector: "#test-form" })`

### **📋 `test-prompt-comprehensive.md`**
**Purpose**: Comprehensive testing guide for all WebAI-MCP tools

**What it contains**:
- **Systematic Test Plan** - Step-by-step testing of all 20+ MCP tools
- **Test Categories**:
  - Browser monitoring (screenshots, console, network)
  - Element inspection and interaction
  - Storage access (cookies, localStorage, sessionStorage)
  - Comprehensive audits (accessibility, performance, SEO)
  - Version compatibility checks
  - Error handling validation
- **Expected Results** - Validation criteria for each test
- **Troubleshooting** - Diagnostic commands for failed tests
- **Advanced Scenarios** - Real-world testing with complex pages

**Usage**:
Copy and paste the prompts from this file to systematically test all WebAI-MCP functionality.

## 🎯 Testing Workflow

### **1. Automated Testing**
```bash
# Run all automated tests (JS runner)
npm run test:all

# Check system compatibility
npm run diagnose

# Restricted env: run safe subset
npm run test:restricted

# Optional: server tests (may require elevated perms)
npm run test:restricted:server
```

### **2. Interactive Testing**
```bash
# Open the test HTML page
# Then use MCP tools to interact with elements
open tests/test-element-interaction.html
```

### **3. Comprehensive Manual Testing**
```bash
# Follow the comprehensive test guide
cat tests/test-prompt-comprehensive.md
```

## 🔧 Test Categories

### **Unit Tests**
- Individual MCP tool functionality
- Error handling and edge cases
- Parameter validation

### **Integration Tests**
- MCP server ↔ WebAI server communication
- Chrome extension ↔ MCP server interaction
- End-to-end workflow testing

### **Browser Tests**
- Cross-browser compatibility
- Element interaction reliability
- Performance under load

### **System Tests**
- Version compatibility
- Network connectivity
- Permission handling

## 📊 Test Results

### **Expected Outcomes**
- ✅ All MCP tools respond correctly
- ✅ Browser interactions work reliably
- ✅ Error messages are clear and helpful
- ✅ Performance is acceptable
- ✅ Version compatibility is maintained

### **Common Issues**
- ❌ Chrome extension not connected
- ❌ WebAI server not running
- ❌ Network connectivity problems
- ❌ Permission denied errors
- ❌ Version mismatches

## 🛠️ Adding New Tests

### **For New MCP Tools**
1. Add test cases to `test-prompt-comprehensive.md`
2. Add interactive elements to `test-element-interaction.html` if needed
3. Update `test-all.js` with automated tests

### **For New Features**
1. Create specific test files in this directory
2. Document test procedures in this README
3. Add to the automated test suite

### **Test File Naming Convention**
- `test-*.js` - Automated test scripts
- `test-*.html` - Interactive test pages
- `test-*.md` - Manual test procedures
- `*-test.*` - Alternative naming for test files

## 🔍 Debugging Tests

### **Common Debug Commands**
```bash
# Check MCP server status
npx @cpjet64/webai-mcp@latest --version

# Check WebAI server connectivity
curl http://localhost:3025/.identity

# Check Chrome extension status
# (Use browser developer tools)

# Run diagnostics
npm run diagnose
```

### **Test Environment Setup**
1. Ensure Chrome is running with WebAI extension
2. Start WebAI server: `npx @cpjet64/webai-server@latest`
3. Verify MCP server is accessible
4. Run tests in a clean browser session

## 📚 Additional Resources

- **Main Documentation**: `../README.md`
- **Version Tools**: `../docs/VERSION_TOOLS.md`
- **Installation Guide**: `../docs/INSTALLATION_GUIDE.md`
- **Troubleshooting**: Use `npm run diagnose` for system diagnostics

## 💡 Best Practices

1. **Always test locally** before deploying changes
2. **Use clean browser sessions** for consistent results
3. **Test with different parameter combinations** to ensure robustness
4. **Document any new test cases** you create
5. **Report issues** with detailed reproduction steps

This testing suite ensures WebAI-MCP works reliably across different environments and use cases.
