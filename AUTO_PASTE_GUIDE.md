# Auto-Paste Functionality

## 🎯 **What is Auto-Paste?**

Auto-paste automatically copies screenshots to your clipboard and pastes them directly into your IDE with a descriptive message. This eliminates the manual copy-paste workflow when sharing screenshots with AI assistants.

## 🔧 **How It Works**

WebAI-MCP provides comprehensive auto-paste functionality with:
- ✅ **Cross-platform** - macOS, Windows, Linux
- ✅ **Multi-IDE** - Cursor, VS Code, Zed, Claude Desktop, Custom apps
- ✅ **Configurable** - User selects target IDE
- ✅ **Robust** - Advanced error handling and fallback methods

## 🚀 **Supported Platforms & IDEs**

### **macOS (AppleScript)**
- **Cursor** - Full support with element detection
- **VS Code** - Full support with element detection
- **Zed** - Full support with element detection
- **Claude Desktop** - Full support with element detection
- **Custom Apps** - User-defined application names

### **Windows (PowerShell)**
- **Cursor** - Process activation + SendKeys
- **VS Code** - Process activation + SendKeys
- **Zed** - Process activation + SendKeys
- **Claude Desktop** - Process activation + SendKeys
- **Custom Apps** - User-defined application names

### **Linux (Bash + xdotool)**
- **Cursor** - Window detection + xdotool automation
- **VS Code** - Window detection + xdotool automation
- **Zed** - Window detection + xdotool automation
- **Claude Desktop** - Window detection + xdotool automation
- **Custom Apps** - User-defined application names

## ⚙️ **Configuration**

### **Chrome Extension Settings**

1. **Enable Auto-paste** - Checkbox to enable/disable functionality
2. **Target IDE** - Dropdown selection:
   - Cursor (default)
   - VS Code
   - Zed
   - Claude Desktop
   - Custom Application
3. **Custom Application Name** - Text input (shown when "Custom" is selected)

### **Settings Storage**
```javascript
settings = {
  allowAutoPaste: true,           // Enable/disable auto-paste
  targetIDE: "cursor",           // Selected IDE
  customAppName: "MyIDE"         // Custom app name (if targetIDE === "custom")
}
```

## 🔄 **Auto-Paste Flow**

### **1. User Takes Screenshot**
- User clicks screenshot button in Chrome extension
- Extension captures screenshot with auto-paste settings

### **2. Data Transmission**
```javascript
// Extension sends to server
{
  type: "screenshot-data",
  data: base64ImageData,
  autoPaste: true,
  targetIDE: "vscode",
  customAppName: ""
}
```

### **3. Server Processing**
```typescript
// Server receives and processes
const autoPasteConfig: AutoPasteConfig = {
  enabled: autoPaste,
  targetIDE: targetIDE || "cursor",
  customAppName: customAppName,
  imagePath: savedScreenshotPath
};

const result = await AutoPasteManager.executePaste(autoPasteConfig);
```

### **4. Platform-Specific Execution**

#### **macOS (AppleScript)**
```applescript
-- Copy image to clipboard
set the clipboard to (read (POSIX file imagePath) as «class PNGf»)

-- Activate target application
tell application "VS Code" to activate

-- Find text input and paste
tell application "System Events"
  tell process "Code"
    keystroke "v" using command down
    keystroke "here is the screenshot"
    key code 36 -- Enter
  end tell
end tell
```

#### **Windows (PowerShell)**
```powershell
# Copy image to clipboard
$image = [System.Drawing.Image]::FromFile($imagePath)
[System.Windows.Forms.Clipboard]::SetImage($image)

# Activate VS Code
$process = Get-Process -Name "Code"
[Win32]::SetForegroundWindow($process.MainWindowHandle)

# Send paste commands
[System.Windows.Forms.SendKeys]::SendWait("^v")
[System.Windows.Forms.SendKeys]::SendWait("here is the screenshot")
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
```

#### **Linux (Bash + xdotool)**
```bash
# Copy image to clipboard
xclip -selection clipboard -t image/png -i "$imagePath"

# Find and activate VS Code window
WINDOW_ID=$(xdotool search --name "Visual Studio Code" | head -1)
xdotool windowactivate $WINDOW_ID

# Send paste commands
xdotool key ctrl+v
xdotool type "here is the screenshot"
xdotool key Return
```

## 🛠️ **Installation Requirements**

### **macOS**
- ✅ **Built-in** - AppleScript is included with macOS
- ✅ **No additional dependencies**
- ✅ **Accessibility permissions** may be required for some IDEs

### **Windows**
- ✅ **Built-in** - PowerShell 5.1+ is included with Windows 10/11
- ✅ **No additional dependencies**
- ✅ **Enhanced process detection** with multiple IDE name variations
- ✅ **Advanced window management** with Win32 API integration

### **Linux**
- ❗ **Requires installation**:
  ```bash
  # Ubuntu/Debian
  sudo apt-get install xclip xdotool

  # Fedora/RHEL
  sudo dnf install xclip xdotool

  # Arch Linux
  sudo pacman -S xclip xdotool
  ```

## 🔍 **Error Handling & Fallbacks**

### **Graceful Degradation**
1. **Element Detection Fails** → Use global keyboard shortcuts
2. **Application Not Found** → Log error, continue with screenshot save
3. **Platform Tools Missing** → Provide installation instructions
4. **Permission Denied** → Log error with troubleshooting tips

### **Fallback Methods**
- **macOS**: If specific element detection fails, use Command+V on active window
- **Windows**: If window activation fails, use global SendKeys
- **Linux**: If window detection fails, use active window commands

## 🧪 **Testing the Enhanced Auto-Paste**

### **Test Different IDEs**
1. Open VS Code, Cursor, or Zed
2. Set target IDE in Chrome extension
3. Take screenshot
4. Verify auto-paste works correctly

### **Test Different Platforms**
1. Test on macOS, Windows, and Linux
2. Verify platform-specific implementations
3. Check error handling for missing dependencies

### **Test Custom Applications**
1. Select "Custom Application" in settings
2. Enter your IDE's process name
3. Test auto-paste functionality

## 🎉 **Auto-Paste Benefits**

1. **Cross-Platform** - Works on macOS, Windows, Linux
2. **Multi-IDE Support** - Cursor, VS Code, Zed, Claude Desktop, Custom
3. **Advanced Error Handling** - Graceful fallbacks and clear error messages
4. **User Configurable** - Target IDE selection from extension panel
5. **Extensible Architecture** - Easy to add new IDEs and platforms
6. **Robust Implementation** - Multiple detection methods and fallback strategies
7. **Zero Dependencies** - Uses built-in OS components (except Linux tools)
