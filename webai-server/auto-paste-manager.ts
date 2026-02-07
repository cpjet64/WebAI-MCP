/**
 * Auto-Paste Manager for WebAI MCP
 *
 * Handles automatic pasting of screenshots to various IDEs across different platforms.
 * Supports macOS (AppleScript), Windows (PowerShell), and Linux (xdotool).
 */

import { exec } from "child_process";
import * as os from "os";
import * as path from "path";

export interface AutoPasteConfig {
  enabled: boolean;
  targetIDE: string;
  customAppName?: string;
  imagePath: string;
}

export interface IDEConfig {
  name: string;
  processName: string;
  windowTitle?: string;
  textInputSelector?: string;
  fallbackMethod: boolean;
}

export class AutoPasteManager {
  private static readonly IDE_CONFIGS: Record<string, IDEConfig> = {
    cursor: {
      name: "Cursor",
      processName: "Cursor", // Windows: Cursor.exe, macOS: Cursor, Linux: cursor
      windowTitle: "Cursor",
      textInputSelector: "Text Area",
      fallbackMethod: true,
    },
    vscode: {
      name: "Visual Studio Code",
      processName: "Code", // Windows: Code.exe, macOS: Code, Linux: code
      windowTitle: "Visual Studio Code",
      textInputSelector: "Text Area",
      fallbackMethod: true,
    },
    zed: {
      name: "Zed",
      processName: "Zed", // Windows: Zed.exe, macOS: Zed, Linux: zed
      windowTitle: "Zed",
      textInputSelector: "Text Area",
      fallbackMethod: true,
    },
    "claude-desktop": {
      name: "Claude Desktop",
      processName: "Claude", // Windows: Claude.exe, macOS: Claude, Linux: claude
      windowTitle: "Claude",
      textInputSelector: "Text Area",
      fallbackMethod: true,
    },
  };

  static async executePaste(config: AutoPasteConfig): Promise<string> {
    if (!config.enabled) {
      return "Auto-paste is disabled";
    }

    const platform = os.platform();
    const ideConfig = this.getIDEConfig(config.targetIDE, config.customAppName);

    console.log(`Auto-paste: Platform=${platform}, IDE=${ideConfig.name}`);

    switch (platform) {
      case "darwin":
        return this.executeMacOSPaste(config, ideConfig);
      case "win32":
        return this.executeWindowsPaste(config, ideConfig);
      case "linux":
        return this.executeLinuxPaste(config, ideConfig);
      default:
        return `Platform ${platform} not supported for auto-paste`;
    }
  }

  private static getIDEConfig(targetIDE: string, customAppName?: string): IDEConfig {
    if (targetIDE === "custom" && customAppName) {
      return {
        name: customAppName,
        processName: customAppName,
        windowTitle: customAppName,
        textInputSelector: "Text Area",
        fallbackMethod: true,
      };
    }

    return this.IDE_CONFIGS[targetIDE] || this.IDE_CONFIGS.cursor;
  }

  private static async executeMacOSPaste(
    config: AutoPasteConfig,
    ideConfig: IDEConfig
  ): Promise<string> {
    const appleScript = `
      -- Set path to the screenshot
      set imagePath to "${config.imagePath}"

      -- Copy the image to clipboard
      try
        set the clipboard to (read (POSIX file imagePath) as «class PNGf»)
      on error errMsg
        log "Error copying image to clipboard: " & errMsg
        return "Failed to copy image to clipboard: " & errMsg
      end try

      -- Activate target application
      try
        tell application "${ideConfig.processName}"
          activate
        end tell
      on error errMsg
        log "Error activating ${ideConfig.name}: " & errMsg
        return "Failed to activate ${ideConfig.name}: " & errMsg
      end try

      -- Wait for the application to fully activate
      delay 2

      -- Try to interact with the application
      try
        tell application "System Events"
          tell process "${ideConfig.processName}"
            -- Get the frontmost window
            if (count of windows) is 0 then
              return "No windows found in ${ideConfig.name}"
            end if

            set targetWindow to window 1

            -- Try to find text input areas
            set foundElements to {}

            try
              set textAreas to UI elements of targetWindow whose class is "${ideConfig.textInputSelector}"
              if (count of textAreas) > 0 then
                set foundElements to textAreas
              end if
            end try

            -- If specific elements found, try to focus and paste
            if (count of foundElements) > 0 then
              set inputElement to item 1 of foundElements
              try
                set focused of inputElement to true
                delay 0.5
                keystroke "v" using command down
                delay 1
                keystroke "here is the screenshot"
                delay 1
                key code 36 -- Enter key
                return "Successfully pasted screenshot into ${ideConfig.name} text element"
              on error errMsg
                log "Error interacting with found element: " & errMsg
              end try
            end if

            -- Fallback method: just send key commands to active window
            keystroke "v" using command down
            delay 1
            keystroke "here is the screenshot"
            delay 1
            key code 36 -- Enter key
            return "Used fallback method: Command+V on active window in ${ideConfig.name}"

          end tell
        end tell
      on error errMsg
        log "Error in System Events block: " & errMsg
        return "Failed in System Events: " & errMsg
      end try
    `;

    return new Promise((resolve) => {
      exec(`osascript -e '${appleScript}'`, (error, stdout, stderr) => {
        if (error) {
          console.error(`AppleScript error: ${error.message}`);
          console.error(`stderr: ${stderr}`);
          resolve(`AppleScript execution failed: ${error.message}`);
        } else {
          console.log(`AppleScript executed successfully: ${stdout}`);
          resolve(stdout.trim() || "AppleScript executed successfully");
        }
      });
    });
  }

  private static async executeWindowsPaste(
    config: AutoPasteConfig,
    ideConfig: IDEConfig
  ): Promise<string> {
    // Enhanced PowerShell script for Windows with better error handling
    const powerShellScript = `
      # Set execution policy for this session
      Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force

      # Load required assemblies
      Add-Type -AssemblyName System.Windows.Forms
      Add-Type -AssemblyName System.Drawing

      # Define Win32 API functions for window management
      Add-Type -TypeDefinition @"
        using System;
        using System.Runtime.InteropServices;
        using System.Text;
        public class Win32 {
          [DllImport("user32.dll")]
          public static extern bool SetForegroundWindow(IntPtr hWnd);
          [DllImport("user32.dll")]
          public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
          [DllImport("user32.dll")]
          public static extern bool IsWindow(IntPtr hWnd);
          [DllImport("user32.dll")]
          public static extern bool IsWindowVisible(IntPtr hWnd);
          [DllImport("user32.dll")]
          public static extern int GetWindowText(IntPtr hWnd, StringBuilder sb, int nMaxCount);
          [DllImport("user32.dll")]
          public static extern bool BringWindowToTop(IntPtr hWnd);
        }
"@

      # Load image and copy to clipboard
      try {
        Write-Host "Loading image: ${config.imagePath.replace(/\\/g, "\\\\")}"
        $imagePath = "${config.imagePath.replace(/\\/g, "\\\\")}"

        if (-not (Test-Path $imagePath)) {
          Write-Error "Image file not found: $imagePath"
          exit 1
        }

        $image = [System.Drawing.Image]::FromFile($imagePath)
        [System.Windows.Forms.Clipboard]::Clear()
        [System.Windows.Forms.Clipboard]::SetImage($image)
        $image.Dispose()
        Write-Host "Image copied to clipboard successfully"
      } catch {
        Write-Error "Failed to copy image to clipboard: $($_.Exception.Message)"
        exit 1
      }

      # Find target application processes
      $targetProcesses = @()
      $processNames = @("${ideConfig.processName}")

      # Add common variations for different IDEs
      switch ("${ideConfig.processName}") {
        "Code" { $processNames += @("Code - Insiders", "VSCode") }
        "Cursor" { $processNames += @("Cursor") }
        "Zed" { $processNames += @("zed") }
        "Claude" { $processNames += @("Claude Desktop") }
      }

      foreach ($processName in $processNames) {
        $processes = Get-Process -Name $processName -ErrorAction SilentlyContinue
        if ($processes.Count -gt 0) {
          $targetProcesses += $processes
          break
        }
      }

      if ($targetProcesses.Count -eq 0) {
        Write-Error "${ideConfig.name} is not running. Tried process names: $($processNames -join ', ')"
        exit 1
      }

      # Find the best window to activate (prefer visible windows)
      $targetProcess = $null
      foreach ($process in $targetProcesses) {
        if ([Win32]::IsWindow($process.MainWindowHandle) -and [Win32]::IsWindowVisible($process.MainWindowHandle)) {
          $targetProcess = $process
          break
        }
      }

      if ($null -eq $targetProcess) {
        $targetProcess = $targetProcesses[0]
      }

      Write-Host "Found ${ideConfig.name} process: $($targetProcess.ProcessName) (PID: $($targetProcess.Id))"

      # Activate the application window
      try {
        $hwnd = $targetProcess.MainWindowHandle
        if ($hwnd -eq [IntPtr]::Zero) {
          Write-Warning "No main window handle found, using fallback method"
        } else {
          # Restore window if minimized
          [Win32]::ShowWindow($hwnd, 9) # SW_RESTORE
          Start-Sleep -Milliseconds 200

          # Bring to top and set foreground
          [Win32]::BringWindowToTop($hwnd)
          [Win32]::SetForegroundWindow($hwnd)
          Start-Sleep -Milliseconds 800

          Write-Host "Successfully activated ${ideConfig.name} window"
        }
      } catch {
        Write-Warning "Error activating window: $($_.Exception.Message)"
      }

      # Send paste commands with retry logic
      try {
        Write-Host "Sending paste commands..."

        # Clear any existing selection first
        [System.Windows.Forms.SendKeys]::SendWait("^a")
        Start-Sleep -Milliseconds 100

        # Paste the image
        [System.Windows.Forms.SendKeys]::SendWait("^v")
        Start-Sleep -Milliseconds 800

        # Add descriptive text
        [System.Windows.Forms.SendKeys]::SendWait(" here is the screenshot")
        Start-Sleep -Milliseconds 300

        # Press Enter
        [System.Windows.Forms.SendKeys]::SendWait("{ENTER}")
        Start-Sleep -Milliseconds 200

        Write-Host "Successfully pasted screenshot into ${ideConfig.name}"
      } catch {
        Write-Error "Failed to send paste commands: $($_.Exception.Message)"
        exit 1
      }
    `;

    return new Promise((resolve) => {
      exec(`powershell -Command "${powerShellScript}"`, (error, stdout, stderr) => {
        if (error) {
          console.error(`PowerShell error: ${error.message}`);
          console.error(`stderr: ${stderr}`);
          resolve(`PowerShell execution failed: ${error.message}`);
        } else {
          console.log(`PowerShell executed successfully: ${stdout}`);
          resolve(stdout.trim() || "PowerShell executed successfully");
        }
      });
    });
  }

  private static async executeLinuxPaste(
    config: AutoPasteConfig,
    ideConfig: IDEConfig
  ): Promise<string> {
    // Linux script using xdotool and xclip
    const bashScript = `
      # Check if required tools are installed
      if ! command -v xclip &> /dev/null; then
        echo "xclip is required but not installed. Install with: sudo apt-get install xclip"
        exit 1
      fi

      if ! command -v xdotool &> /dev/null; then
        echo "xdotool is required but not installed. Install with: sudo apt-get install xdotool"
        exit 1
      fi

      # Copy image to clipboard
      xclip -selection clipboard -t image/png -i "${config.imagePath}"
      if [ $? -ne 0 ]; then
        echo "Failed to copy image to clipboard"
        exit 1
      fi

      # Find and activate target application
      WINDOW_ID=$(xdotool search --name "${ideConfig.windowTitle}" | head -1)
      if [ -z "$WINDOW_ID" ]; then
        echo "${ideConfig.name} window not found"
        exit 1
      fi

      # Activate the window
      xdotool windowactivate $WINDOW_ID
      sleep 1

      # Send Ctrl+V to paste
      xdotool key ctrl+v
      sleep 0.5
      xdotool type "here is the screenshot"
      sleep 0.5
      xdotool key Return

      echo "Successfully pasted screenshot into ${ideConfig.name}"
    `;

    return new Promise((resolve) => {
      exec(bashScript, (error, stdout, stderr) => {
        if (error) {
          console.error(`Bash script error: ${error.message}`);
          console.error(`stderr: ${stderr}`);
          resolve(`Bash script execution failed: ${error.message}`);
        } else {
          console.log(`Bash script executed successfully: ${stdout}`);
          resolve(stdout.trim() || "Bash script executed successfully");
        }
      });
    });
  }
}
