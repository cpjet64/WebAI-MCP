use std::fs;
use std::path::PathBuf;

use webai_server::{atomic_write, ensure_dir, save_screenshot_base64, SaveError};

fn temp_dir() -> PathBuf {
    let mut p = std::env::temp_dir();
    p.push(format!("webai-mcp-test-{}", std::process::id()));
    let _ = fs::create_dir_all(&p);
    p
}

#[tokio::test]
async fn creates_folder_and_saves_file_atomically() {
    let dir = temp_dir().join("screenshots");
    if dir.exists() {
        let _ = fs::remove_dir_all(&dir);
    }
    // 'hello' base64
    let b64 = "aGVsbG8=";
    let path = save_screenshot_base64(&dir, Some("Test:/Name"), b64, 1024).expect("save");
    assert!(path.exists());
    let bytes = fs::read(&path).unwrap();
    assert_eq!(bytes, b"hello");
}

#[tokio::test]
async fn rejects_oversized_payload() {
    // 3 bytes per 'AAAA'
    let repeats = 4000; // 12_000 bytes
    let b64 = "AAAA".repeat(repeats);
    let dir = temp_dir().join("oversize");
    let res = save_screenshot_base64(&dir, None, &b64, 8000);
    assert!(res.is_err());
}

#[tokio::test]
async fn atomic_write_does_not_leave_temp() {
    let dir = temp_dir().join("atomic");
    ensure_dir(&dir).unwrap();
    let path = dir.join("file.bin");
    atomic_write(&path, b"data").unwrap();
    assert!(path.exists());
    // Ensure no .tmp files
    for entry in fs::read_dir(&dir).unwrap() {
        let e = entry.unwrap();
        let name = e.file_name().to_string_lossy().into_owned();
        assert!(!name.contains(".tmp"), "found temp file: {}", name);
    }
}

#[tokio::test]
async fn rejects_invalid_base64() {
    let dir = temp_dir().join("invalidb64");
    let err = save_screenshot_base64(&dir, None, "not-base64*", 1024).unwrap_err();
    match err {
        SaveError::InvalidBase64 => {}
        _ => panic!("expected InvalidBase64, got {err:?}"),
    }
}

#[tokio::test]
async fn directory_conflict_errors() {
    // Create a file where a directory is expected
    let dir = temp_dir().join("conflict");
    std::fs::write(&dir, b"file blocking dir").unwrap();
    let b64 = "aGVsbG8="; // 'hello'
    let res = save_screenshot_base64(&dir, None, b64, 1024);
    assert!(res.is_err());
}
