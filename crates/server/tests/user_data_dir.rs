use std::fs;
use webai_server::UserDataDir;

#[test]
fn create_and_cleanup_dir() {
    let mut ud = UserDataDir::create("webai-test").expect("create");
    let p = ud.path().to_path_buf();
    assert!(p.exists());
    fs::write(p.join("tmp.txt"), b"x").expect("write");
    ud.cleanup().expect("cleanup");
    assert!(!p.exists());
}

#[test]
fn drop_removes_when_not_kept() {
    let path: std::path::PathBuf;
    {
        let ud = UserDataDir::create("webai-drop").expect("create");
        path = ud.path().to_path_buf();
        assert!(path.exists());
    }
    assert!(!path.exists());
}

#[test]
fn keep_flag_preserves() {
    let path: std::path::PathBuf;
    {
        let ud = UserDataDir::create("webai-keep")
            .expect("create")
            .keep(true);
        path = ud.path().to_path_buf();
        assert!(path.exists());
    }
    assert!(path.exists());
    // cleanup for hygiene
    if path.exists() {
        let _ = std::fs::remove_dir_all(&path);
    }
}
