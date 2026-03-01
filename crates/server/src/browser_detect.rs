use std::collections::HashMap;
use std::path::Path;
use std::sync::{Mutex, OnceLock};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash)]
pub enum Browser {
    Chrome,
    Edge,
    Brave,
    Firefox,
    Opera,
}

#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct EnvBrowserOverrides {
    pub exec: Option<String>,
    pub chrome: Option<String>,
    pub edge: Option<String>,
    pub brave: Option<String>,
    pub firefox: Option<String>,
    pub opera: Option<String>,
}

impl EnvBrowserOverrides {
    pub fn from_map(env: &HashMap<String, String>) -> Self {
        let g = |k: &str| env.get(k).cloned();
        Self {
            exec: g("BROWSER_EXECUTABLE").or(g("BROWSER_PATH")),
            chrome: g("CHROME_PATH").or(g("GOOGLE_CHROME_PATH")),
            edge: g("EDGE_PATH").or(g("MICROSOFT_EDGE_PATH")),
            brave: g("BRAVE_PATH").or(g("BRAVE_BROWSER_PATH")),
            firefox: g("FIREFOX_PATH"),
            opera: g("OPERA_PATH"),
        }
    }
}

pub trait FileProbe {
    fn exists(&self, p: &str) -> bool;
}
pub struct SystemFS;
impl FileProbe for SystemFS {
    fn exists(&self, p: &str) -> bool {
        Path::new(p).exists()
    }
}

pub trait RegProbe {
    fn app_path(&self, _exe: &str) -> Option<String> {
        None
    }
    fn blbeacon_version(&self, _browser: Browser) -> Option<String> {
        None
    }
}
pub struct NullReg;
impl RegProbe for NullReg {}

fn which(fs: &dyn FileProbe, path_env: Option<&str>, name: &str) -> Option<String> {
    use std::borrow::Cow;
    let path: Cow<str> = match path_env {
        Some(s) => Cow::Borrowed(s),
        None => Cow::Owned(std::env::var("PATH").unwrap_or_default()),
    };
    for dir in path.as_ref().split(':') {
        if dir.is_empty() {
            continue;
        }
        let cand = format!("{}/{}", dir.trim_end_matches('/'), name);
        if fs.exists(&cand) {
            return Some(cand);
        }
    }
    None
}

fn candidates_for(browser: Browser, os: &str) -> Vec<&'static str> {
    match (browser, os) {
        (Browser::Chrome, "windows") => vec![
            r"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
            r"C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
            r"%LOCALAPPDATA%\\Google\\Chrome\\Application\\chrome.exe",
        ],
        (Browser::Chrome, "macos") => {
            vec!["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
        }
        (Browser::Chrome, "linux") => vec![
            "/usr/bin/google-chrome",
            "/usr/bin/google-chrome-stable",
            "/snap/bin/chromium",
        ],

        (Browser::Edge, "windows") => vec![
            r"C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
            r"C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
            r"%LOCALAPPDATA%\\Microsoft\\Edge\\Application\\msedge.exe",
        ],
        (Browser::Edge, "macos") => {
            vec!["/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"]
        }
        (Browser::Edge, "linux") => {
            vec!["/usr/bin/microsoft-edge", "/usr/bin/microsoft-edge-stable"]
        }

        (Browser::Brave, "windows") => vec![
            r"C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
            r"%LOCALAPPDATA%\\BraveSoftware\\Brave-Browser\\Application\\brave.exe",
        ],
        (Browser::Brave, "macos") => {
            vec!["/Applications/Brave Browser.app/Contents/MacOS/Brave Browser"]
        }
        (Browser::Brave, "linux") => vec!["/usr/bin/brave-browser", "/usr/bin/brave"],

        (Browser::Firefox, "windows") => vec![
            r"C:\\Program Files\\Mozilla Firefox\\firefox.exe",
            r"C:\\Program Files (x86)\\Mozilla Firefox\\firefox.exe",
        ],
        (Browser::Firefox, "macos") => vec!["/Applications/Firefox.app/Contents/MacOS/firefox"],
        (Browser::Firefox, "linux") => vec!["/usr/bin/firefox"],

        (Browser::Opera, "windows") => vec![
            r"C:\\Program Files\\Opera\\opera.exe",
            r"%LOCALAPPDATA%\\Programs\\Opera\\opera.exe",
        ],
        (Browser::Opera, "macos") => vec!["/Applications/Opera.app/Contents/MacOS/Opera"],
        (Browser::Opera, "linux") => vec!["/usr/bin/opera"],
        _ => vec![],
    }
}

fn which_names(browser: Browser, os: &str) -> Vec<&'static str> {
    match (browser, os) {
        (Browser::Chrome, "linux") => vec![
            "google-chrome",
            "google-chrome-stable",
            "chromium-browser",
            "chromium",
        ],
        (Browser::Edge, "linux") => vec!["microsoft-edge", "microsoft-edge-stable"],
        (Browser::Brave, "linux") => vec!["brave-browser", "brave"],
        (Browser::Firefox, "linux") => vec!["firefox"],
        (Browser::Opera, "linux") => vec!["opera"],
        (Browser::Chrome, "macos") => vec!["google-chrome"],
        (Browser::Edge, "macos") => vec!["microsoft-edge"],
        (Browser::Brave, "macos") => vec!["brave"],
        (Browser::Firefox, "macos") => vec!["firefox"],
        (Browser::Opera, "macos") => vec!["opera"],
        _ => vec![],
    }
}

fn resolve_env(over: &EnvBrowserOverrides, b: Browser) -> Option<&str> {
    match b {
        Browser::Chrome => over.chrome.as_deref().or(over.exec.as_deref()),
        Browser::Edge => over.edge.as_deref().or(over.exec.as_deref()),
        Browser::Brave => over.brave.as_deref().or(over.exec.as_deref()),
        Browser::Firefox => over.firefox.as_deref().or(over.exec.as_deref()),
        Browser::Opera => over.opera.as_deref().or(over.exec.as_deref()),
    }
}

fn expand_win_vars(p: &str) -> String {
    if !p.contains('%') {
        return p.to_string();
    }
    let mut out = p.to_string();
    if let Ok(local) = std::env::var("LOCALAPPDATA") {
        out = out.replace("%LOCALAPPDATA%", &local);
    }
    out
}

static CACHE: OnceLock<Mutex<HashMap<String, String>>> = OnceLock::new();
fn cache_key(os: &str, b: Browser) -> String {
    format!("{}:{:?}", os, b)
}

pub fn detect_browser_path_for_os(
    b: Browser,
    os: &str,
    env: &EnvBrowserOverrides,
    fs: &dyn FileProbe,
) -> Option<String> {
    // Cache first
    if let Some(m) = CACHE.get() {
        if let Some(v) = m.lock().ok()?.get(&cache_key(os, b)).cloned() {
            return Some(v);
        }
    }

    // 1) Env overrides
    if let Some(e) = resolve_env(env, b) {
        let p = if os == "windows" {
            expand_win_vars(e)
        } else {
            e.to_string()
        };
        if fs.exists(&p) {
            CACHE
                .get_or_init(|| Mutex::new(HashMap::new()))
                .lock()
                .ok()?
                .insert(cache_key(os, b), p.clone());
            return Some(p);
        }
    }

    // 2) Known locations
    for c in candidates_for(b, os) {
        let c2 = if os == "windows" {
            expand_win_vars(c)
        } else {
            c.to_string()
        };
        if fs.exists(&c2) {
            CACHE
                .get_or_init(|| Mutex::new(HashMap::new()))
                .lock()
                .ok()?
                .insert(cache_key(os, b), c2.clone());
            return Some(c2);
        }
    }

    // 3) which PATH search
    let names = which_names(b, os);
    if !names.is_empty() {
        let path_env = std::env::var("PATH").ok();
        for n in names {
            if let Some(p) = which(fs, path_env.as_deref(), n) {
                return Some(p);
            }
        }
    }
    None
}

fn exe_for(b: Browser) -> &'static str {
    match b {
        Browser::Chrome => "chrome.exe",
        Browser::Edge => "msedge.exe",
        Browser::Brave => "brave.exe",
        Browser::Firefox => "firefox.exe",
        Browser::Opera => "opera.exe",
    }
}

pub fn detect_browser_path_for_os_with(
    b: Browser,
    os: &str,
    env: &EnvBrowserOverrides,
    fs: &dyn FileProbe,
    reg: Option<&dyn RegProbe>,
) -> Option<String> {
    if os == "windows" {
        if let Some(r) = reg {
            if let Some(p) = r.app_path(exe_for(b)) {
                let p2 = expand_win_vars(&p);
                if fs.exists(&p2) {
                    return Some(p2);
                }
            }
        }
    }
    detect_browser_path_for_os(b, os, env, fs)
}

pub fn probe_blbeacon_version(reg: &dyn RegProbe, b: Browser) -> Option<String> {
    reg.blbeacon_version(b)
}

pub fn detect_browser_path(
    b: Browser,
    env: &EnvBrowserOverrides,
    fs: &dyn FileProbe,
) -> Option<String> {
    let os = match std::env::consts::OS {
        "macos" | "darwin" => "macos",
        "windows" | "win32" => "windows",
        _ => "linux",
    };
    detect_browser_path_for_os(b, os, env, fs)
}

// tests are in crates/server/tests/browser_detect.rs
