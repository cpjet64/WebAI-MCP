# Windows Auto-Paste Setup & Testing Guide

## 🎯 **Windows Auto-Paste Overview**

WebAI-MCP provides comprehensive Windows auto-paste functionality using PowerShell automation. This guide covers setup, testing, and troubleshooting for Windows users.

## ✅ **Windows Requirements**

### **Built-in Components (No Installation Needed)**
- ✅ **Windows 10/11** - Full support
- ✅ **PowerShell 5.1+** - Included with Windows
- ✅ **System.Windows.Forms** - Built-in .NET assembly
- ✅ **System.Drawing** - Built-in .NET assembly

### **Supported IDEs on Windows**
- ✅ **Cursor** - Process name: `Cursor.exe`
- ✅ **VS Code** - Process name: `Code.exe`
- ✅ **VS Code Insiders** - Process name: `Code - Insiders.exe`
- ✅ **Zed** - Process name: `Zed.exe`
- ✅ **Claude Desktop** - Process name: `Claude.exe`
- ✅ **Custom Applications** - User-defined process names

## 🔧 **How Windows Auto-Paste Works**

### **1. Process Detection**
```powershell
# Enhanced process detection with multiple name variations
$processNames = @("Code", "Code - Insiders", "VSCode")
foreach ($processName in $processNames) {
    $processes = Get-Process -Name $processName -ErrorAction SilentlyContinue
    if ($processes.Count -gt 0) {
        # Found target IDE
        break
    }
}
```

### **2. Window Management**
```powershell
# Advanced window activation using Win32 API
[Win32]::ShowWindow($hwnd, 9)           # SW_RESTORE (unminimize)
[Win32]::BringWindowToTop($hwnd)        # Bring to front
[Win32]::SetForegroundWindow($hwnd)     # Set focus
```

### **3. Clipboard & Automation**
```powershell
# Copy image to clipboard
$image = [System.Drawing.Image]::FromFile($imagePath)
[System.Windows.Forms.Clipboard]::SetImage($image)

# Send keyboard commands
[System.Windows.Forms.SendKeys]::SendWait("^v")              # Ctrl+V
[System.Windows.Forms.SendKeys]::SendWait(" here is the screenshot")
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")         # Enter
```

## 🚀 **Setup Instructions**

### **Step 1: Configure Chrome Extension**
1. Open Chrome extension panel
2. Check **"Enable Auto-paste"**
3. Select your target IDE from dropdown:
   - **Cursor** (default)
   - **VS Code**
   - **Zed**
   - **Claude Desktop**
   - **Custom Application** (enter process name)

### **Step 2: Test PowerShell Permissions**
```powershell
# Test if PowerShell can run automation scripts
Get-ExecutionPolicy
# Should show: RemoteSigned, Unrestricted, or Bypass
```

If restricted, run as Administrator:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### **Step 3: Verify IDE Process Names**
```powershell
# Check running IDE processes
Get-Process | Where-Object {$_.ProcessName -like "*Code*" -or $_.ProcessName -like "*Cursor*" -or $_.ProcessName -like "*Zed*"}
```

## 🧪 **Testing Auto-Paste on Windows**

### **Test 1: Basic Functionality**
1. **Open your target IDE** (VS Code, Cursor, etc.)
2. **Open Chrome** with the extension
3. **Navigate to any webpage**
4. **Take a screenshot** using the extension
5. **Verify** the image appears in your IDE with "here is the screenshot" text

### **Test 2: Multiple IDEs**
1. **Open multiple IDEs** (VS Code + Cursor)
2. **Set target IDE** in extension settings
3. **Take screenshot**
4. **Verify** it pastes to the correct IDE

### **Test 3: Window States**
1. **Minimize your IDE**
2. **Take screenshot**
3. **Verify** IDE window is restored and receives paste

### **Test 4: Custom Applications**
1. **Select "Custom Application"** in settings
2. **Enter process name** (e.g., "notepad" for testing)
3. **Open Notepad**
4. **Take screenshot**
5. **Verify** paste works in custom app

## 🔍 **Windows-Specific Features**

### **Enhanced Process Detection**
- **Multiple name variations** for each IDE
- **Insiders/Beta versions** automatically detected
- **Visible window preference** (prioritizes visible windows)
- **Fallback to any process** if no visible windows

### **Advanced Window Management**
- **Automatic window restoration** from minimized state
- **Focus stealing prevention** handling
- **Multi-monitor support**
- **Window handle validation**

### **Robust Error Handling**
- **Process not found** → Clear error message with process names tried
- **Window activation failure** → Fallback to global SendKeys
- **Clipboard errors** → Detailed error reporting
- **Permission issues** → Troubleshooting guidance

## 🛠️ **Troubleshooting**

### **Issue: "IDE is not running"**
**Solution:**
```powershell
# Check if your IDE is actually running
Get-Process | Where-Object {$_.ProcessName -like "*YourIDE*"}

# For VS Code, try these process names:
Get-Process | Where-Object {$_.ProcessName -in @("Code", "Code - Insiders", "VSCode")}
```

### **Issue: "Failed to copy image to clipboard"**
**Solution:**
1. **Check file permissions** on screenshot folder
2. **Verify PowerShell execution policy**
3. **Try running as Administrator**

### **Issue: "Window activation failed"**
**Solution:**
1. **Disable focus stealing prevention:**
   - Windows Settings → System → Focus assist → Off
2. **Check if IDE has multiple windows open**
3. **Try clicking on IDE window manually first**

### **Issue: "SendKeys not working"**
**Solution:**
1. **Check if IDE is in full-screen mode** (exit full-screen)
2. **Verify keyboard layout** (US layout recommended)
3. **Check for conflicting keyboard shortcuts**

### **Issue: Custom Application Not Working**
**Solution:**
1. **Get exact process name:**
   ```powershell
   Get-Process | Select-Object ProcessName, MainWindowTitle
   ```
2. **Use process name without .exe extension**
3. **Ensure application has a main window**

## 📊 **Performance Optimization**

### **Timing Adjustments**
- **Window activation delay**: 800ms (adjustable)
- **Clipboard operation delay**: 200ms
- **SendKeys delays**: 100-300ms between operations

### **Memory Management**
- **Image disposal** after clipboard copy
- **Process handle cleanup**
- **Automatic garbage collection**

## 🎉 **Windows Auto-Paste Benefits**

1. **✅ No Additional Software** - Uses built-in Windows components
2. **✅ Multiple IDE Support** - Works with any Windows application
3. **✅ Robust Process Detection** - Handles various IDE versions
4. **✅ Advanced Window Management** - Proper focus and restoration
5. **✅ Error Recovery** - Graceful fallbacks and clear error messages
6. **✅ Performance Optimized** - Fast execution with minimal resource usage

## 📝 **Next Steps**

1. **Test the auto-paste functionality** with your preferred IDE
2. **Report any issues** with specific IDE versions or Windows configurations
3. **Suggest additional IDEs** for built-in support
4. **Share feedback** on performance and reliability

The Windows auto-paste implementation provides a robust, native solution using built-in Windows components for seamless IDE integration!
