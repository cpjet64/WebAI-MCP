use std::io;
use std::process::Command;

#[derive(Debug, thiserror::Error)]
pub enum PasteError {
    #[error("unsupported platform for macOS paste")]
    UnsupportedPlatform,
    #[error("feature not enabled: {0}")]
    NotEnabled(&'static str),
    #[error("osascript failed: {0}")]
    ScriptFailed(String),
    #[error(transparent)]
    Io(#[from] io::Error),
}

/// Map a paste result into a user-facing message string.
pub fn paste_result_message(r: Result<String, PasteError>) -> String {
    match r {
        Ok(s) => s,
        Err(PasteError::UnsupportedPlatform) => {
            format!(
                "Platform {} not supported for auto-paste",
                std::env::consts::OS
            )
        }
        Err(PasteError::NotEnabled(_)) => "Auto-paste native path not enabled".into(),
        Err(PasteError::ScriptFailed(e)) => format!("Auto-paste failed: {}", e),
        Err(PasteError::Io(e)) => format!("Auto-paste IO error: {}", e),
    }
}

/// Build a minimal AppleScript that copies a PNG to the clipboard,
/// activates the target app, and sends Command+V.
pub fn make_osascript(image_path: &str, app_name: &str) -> String {
    // Escape single quotes for -e '...'
    let esc = |s: &str| s.replace('\\', "\\\\").replace('\'', "\\'");
    let path = esc(image_path);
    let app = esc(app_name);
    format!(
        "      set imagePath to '{path}'\n\
               try\n\
                 set the clipboard to (read (POSIX file imagePath) as «class PNGf»)\n\
               on error errMsg\n\
                 return 'Failed to copy image to clipboard: ' & errMsg\n\
               end try\n\
               try\n\
                 tell application '{app}' to activate\n\
               on error errMsg\n\
                 return 'Failed to activate {app}: ' & errMsg\n\
               end try\n\
               delay 1\n\
               tell application 'System Events'\n\
                 keystroke 'v' using command down\n\
               end tell\n\
               return 'Used fallback method: Command+V on active window in {app}'"
    )
}

/// Build minimal PowerShell to copy PNG to clipboard and paste (Ctrl+V).
pub fn make_powershell(image_path: &str, app_name: &str) -> String {
    // Escape for PS string literal; backslashes are fine in "..."
    let p = image_path.replace("`", "``").replace("\"", "`\"");
    let app = app_name.replace("`", "``").replace("\"", "`\"");
    format!(
        "Set-ExecutionPolicy Bypass -Scope Process -Force;\n\
         Add-Type -AssemblyName System.Windows.Forms;\n\
         Add-Type -AssemblyName System.Drawing;\n\
         $img=[System.Drawing.Image]::FromFile(\"{p}\");\n\
         [System.Windows.Forms.Clipboard]::SetImage($img); $img.Dispose();\n\
         Start-Sleep -Milliseconds 300;\n\
         [System.Windows.Forms.SendKeys]::SendWait('^v');\n\
         Write-Output 'Successfully pasted screenshot into {app}'"
    )
}

/// Run PowerShell fallback; on non-Windows returns UnsupportedPlatform.
pub fn run_windows_paste(image_path: &str, app_name: &str) -> Result<String, PasteError> {
    if std::env::var("WEBAI_TEST_DRYRUN_POWERSHELL").is_ok() {
        return Ok("dry-run".to_string());
    }
    if std::env::consts::OS != "windows" && std::env::consts::OS != "win32" {
        return Err(PasteError::UnsupportedPlatform);
    }
    let script = make_powershell(image_path, app_name);
    let output = Command::new("powershell")
        .arg("-NoProfile")
        .arg("-NonInteractive")
        .arg("-ExecutionPolicy")
        .arg("Bypass")
        .arg("-Command")
        .arg(script)
        .output()?;
    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Ok(if stdout.is_empty() {
            "ok".into()
        } else {
            stdout
        })
    } else {
        let msg = String::from_utf8_lossy(&output.stderr).to_string();
        Err(PasteError::ScriptFailed(msg))
    }
}

#[cfg(all(feature = "windows-native", target_os = "windows"))]
pub fn run_windows_paste_native(_image_path: &str, _app_name: &str) -> Result<String, PasteError> {
    Err(PasteError::NotEnabled("windows-native impl pending"))
}

#[cfg(not(all(feature = "windows-native", target_os = "windows")))]
pub fn run_windows_paste_native(_image_path: &str, _app_name: &str) -> Result<String, PasteError> {
    Err(PasteError::NotEnabled("windows-native"))
}
/// Run the AppleScript via `osascript`. On non-macOS returns UnsupportedPlatform.
pub fn run_macos_paste(image_path: &str, app_name: &str) -> Result<String, PasteError> {
    if std::env::var("WEBAI_TEST_DRYRUN_OSASCRIPT").is_ok() {
        return Ok("dry-run".to_string());
    }
    if std::env::consts::OS != "macos" && std::env::consts::OS != "darwin" {
        return Err(PasteError::UnsupportedPlatform);
    }
    let script = make_osascript(image_path, app_name);
    let output = Command::new("osascript").arg("-e").arg(script).output()?;
    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Ok(if stdout.is_empty() {
            "ok".into()
        } else {
            stdout
        })
    } else {
        let msg = String::from_utf8_lossy(&output.stderr).to_string();
        Err(PasteError::ScriptFailed(msg))
    }
}

/// Build minimal shell snippet using xclip + xdotool on Linux.
pub fn make_xdotool(image_path: &str, app_name: &str) -> String {
    let path = image_path.replace("'", "'\\''");
    let app = app_name.replace("'", "'\\''");
    format!(
        "xclip -selection clipboard -t image/png -i '{path}' && \
         xdotool key ctrl+v && \
         echo 'Successfully pasted screenshot into {app}'"
    )
}

/// Run Linux paste via xclip/xdotool. On non-Linux, returns
/// UnsupportedPlatform. Honors WEBAI_TEST_DRYRUN_XDOTOOL.
pub fn run_linux_paste(image_path: &str, app_name: &str) -> Result<String, PasteError> {
    if std::env::var("WEBAI_TEST_DRYRUN_XDOTOOL").is_ok() {
        return Ok("dry-run".to_string());
    }
    if std::env::consts::OS != "linux" {
        return Err(PasteError::UnsupportedPlatform);
    }
    let script = make_xdotool(image_path, app_name);
    let output = Command::new("sh").arg("-c").arg(script).output()?;
    if output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Ok(if stdout.is_empty() {
            "ok".into()
        } else {
            stdout
        })
    } else {
        let msg = String::from_utf8_lossy(&output.stderr).to_string();
        Err(PasteError::ScriptFailed(msg))
    }
}

/// Native macOS paste path (feature-gated). When the `macos-native` feature
/// is not enabled or not on macOS, returns a NotEnabled/Unsupported error.
#[cfg(all(feature = "macos-native", target_os = "macos"))]
pub fn run_macos_paste_native(_image_path: &str, _app_name: &str) -> Result<String, PasteError> {
    Err(PasteError::NotEnabled("macos-native impl pending"))
}

#[cfg(not(all(feature = "macos-native", target_os = "macos")))]
pub fn run_macos_paste_native(_image_path: &str, _app_name: &str) -> Result<String, PasteError> {
    Err(PasteError::NotEnabled("macos-native"))
}
