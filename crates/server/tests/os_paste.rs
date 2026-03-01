use webai_server::{
    make_osascript, make_powershell, make_xdotool, paste_result_message, run_linux_paste,
    run_macos_paste, run_macos_paste_native, run_windows_paste, run_windows_paste_native,
    PasteError,
};

#[test]
fn mac_script_includes_app_and_path() {
    let s = make_osascript("/tmp/file.png", "Code");
    assert!(s.contains("/tmp/file.png"));
    assert!(s.contains("Code"));
}

#[test]
fn mac_dry_run_returns_ok() {
    std::env::set_var("WEBAI_TEST_DRYRUN_OSASCRIPT", "1");
    let out = run_macos_paste("/p.png", "App").unwrap();
    assert_eq!(out, "dry-run");
    std::env::remove_var("WEBAI_TEST_DRYRUN_OSASCRIPT");
}

#[test]
fn mac_native_feature_is_not_enabled() {
    let err = run_macos_paste_native("/p.png", "App").unwrap_err();
    match err {
        PasteError::NotEnabled(_) | PasteError::UnsupportedPlatform => {}
        _ => panic!("unexpected error variant"),
    }
}

#[test]
fn ps_script_includes_app_and_path() {
    let s = make_powershell("C\\tmp\\f.png", "Code");
    assert!(s.contains("C\\tmp\\f.png"));
    assert!(s.contains("Successfully pasted screenshot into Code"));
}

#[test]
fn ps_dry_run_returns_ok() {
    std::env::set_var("WEBAI_TEST_DRYRUN_POWERSHELL", "1");
    let out = run_windows_paste("C\\tmp\\f.png", "App");
    assert!(matches!(out, Ok(s) if s=="dry-run"));
    std::env::remove_var("WEBAI_TEST_DRYRUN_POWERSHELL");
}

#[test]
fn windows_native_feature_not_enabled() {
    let err = run_windows_paste_native("C\\tmp\\f.png", "App").unwrap_err();
    match err {
        PasteError::NotEnabled(_) | PasteError::UnsupportedPlatform => {}
        _ => panic!("unexpected error variant"),
    }
}

#[test]
fn xdotool_script_contains_path_and_app() {
    let s = make_xdotool("/tmp/s.png", "Code");
    assert!(s.contains("/tmp/s.png"));
    assert!(s.contains("Successfully pasted screenshot into Code"));
}

#[test]
fn xdotool_dry_run_ok() {
    std::env::set_var("WEBAI_TEST_DRYRUN_XDOTOOL", "1");
    let out = run_linux_paste("/tmp/s.png", "App");
    assert!(matches!(out, Ok(s) if s=="dry-run"));
    std::env::remove_var("WEBAI_TEST_DRYRUN_XDOTOOL");
}

#[test]
fn error_mapping_user_messages() {
    let m = paste_result_message(Err(PasteError::UnsupportedPlatform));
    assert!(m.contains("Platform"));
    let m = paste_result_message(Err(PasteError::NotEnabled("x")));
    assert!(m.contains("not enabled"));
    let m = paste_result_message(Err(PasteError::ScriptFailed("boom".into())));
    assert!(m.contains("boom"));
}
