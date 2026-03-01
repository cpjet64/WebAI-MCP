use std::collections::HashMap;
use webai_server::{
    detect_browser_path_for_os, detect_browser_path_for_os_with, probe_blbeacon_version, Browser,
    EnvBrowserOverrides, FileProbe, RegProbe,
};

struct FakeFS {
    files: Vec<String>,
}
impl FileProbe for FakeFS {
    fn exists(&self, p: &str) -> bool {
        self.files.iter().any(|x| x == p)
    }
}

fn env_from(map: &[(&str, &str)]) -> EnvBrowserOverrides {
    let mut m = HashMap::new();
    for (k, v) in map {
        m.insert((*k).to_string(), (*v).to_string());
    }
    EnvBrowserOverrides::from_map(&m)
}

#[test]
fn env_override_and_generic() {
    let fs = FakeFS {
        files: vec!["/opt/chrome".into(), "/bin/generic".into()],
    };
    let env = env_from(&[
        ("BROWSER_EXECUTABLE", "/bin/generic"),
        ("CHROME_PATH", "/opt/chrome"),
    ]);
    let p = detect_browser_path_for_os(Browser::Chrome, "linux", &env, &fs).unwrap();
    assert_eq!(p, "/opt/chrome");
}

#[test]
fn linux_known_location() {
    let fs = FakeFS {
        files: vec!["/usr/bin/firefox".into()],
    };
    let env = EnvBrowserOverrides::default();
    let p = detect_browser_path_for_os(Browser::Firefox, "linux", &env, &fs).unwrap();
    assert_eq!(p, "/usr/bin/firefox");
}

#[test]
fn mac_known_location() {
    let fs = FakeFS {
        files: vec!["/Applications/Brave Browser.app/Contents/MacOS/Brave Browser".into()],
    };
    let env = EnvBrowserOverrides::default();
    let p = detect_browser_path_for_os(Browser::Brave, "macos", &env, &fs).unwrap();
    assert!(p.contains("Brave Browser"));
}

#[test]
fn windows_env_expand_localappdata() {
    // Note: expand %LOCALAPPDATA% when present
    let mut m: HashMap<String, String> = HashMap::new();
    m.insert(
        "LOCALAPPDATA".to_string(),
        r"C:\\Users\\me\\AppData\\Local".to_string(),
    );
    for (k, v) in m {
        std::env::set_var(k, v);
    }
    let _path = r"%LOCALAPPDATA%\\Google\\Chrome\\Application\\chrome.exe";
    let fs = FakeFS {
        files: vec![
            r"C:\\Users\\me\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe".into(),
        ],
    };
    let env = EnvBrowserOverrides::default();
    let p = detect_browser_path_for_os(Browser::Chrome, "windows", &env, &fs).unwrap();
    assert!(p.ends_with(r"Chrome\\Application\\chrome.exe"));
}

struct FakeReg {
    map: std::collections::HashMap<String, String>,
    bl: std::collections::HashMap<Browser, String>,
}
impl RegProbe for FakeReg {
    fn app_path(&self, exe: &str) -> Option<String> {
        self.map.get(exe).cloned()
    }
    fn blbeacon_version(&self, b: Browser) -> Option<String> {
        self.bl.get(&b).cloned()
    }
}

#[test]
fn registry_app_paths_precedence() {
    let mut m = std::collections::HashMap::new();
    m.insert(
        "chrome.exe".into(),
        r"%LOCALAPPDATA%\\Google\\Chrome\\Application\\chrome.exe".into(),
    );
    let mut bl = std::collections::HashMap::new();
    bl.insert(Browser::Chrome, "124.0".into());
    let reg = FakeReg { map: m, bl };

    // Expand env and ensure fs has the expanded path
    std::env::set_var("LOCALAPPDATA", r"C:\\Users\\me\\AppData\\Local");
    let fs = FakeFS {
        files: vec![
            r"C:\\Users\\me\\AppData\\Local\\Google\\Chrome\\Application\\chrome.exe".into(),
        ],
    };
    let env = EnvBrowserOverrides::default();
    let p =
        detect_browser_path_for_os_with(Browser::Chrome, "windows", &env, &fs, Some(&reg)).unwrap();
    assert!(p.ends_with(r"chrome.exe"));
    let v = probe_blbeacon_version(&reg, Browser::Chrome).unwrap();
    assert_eq!(v, "124.0");
}
