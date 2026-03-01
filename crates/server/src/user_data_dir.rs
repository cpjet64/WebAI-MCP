use std::fs;
use std::io;
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

#[derive(Debug)]
pub struct UserDataDir {
    path: PathBuf,
    keep: bool,
}

impl UserDataDir {
    pub fn create(prefix: &str) -> io::Result<Self> {
        let base = std::env::temp_dir();
        let dir = make_unique_dir(&base, &sanitize(prefix))?;
        Ok(Self {
            path: dir,
            keep: false,
        })
    }

    pub fn path(&self) -> &Path {
        &self.path
    }

    pub fn keep(mut self, keep: bool) -> Self {
        self.keep = keep;
        self
    }

    pub fn cleanup(&mut self) -> io::Result<()> {
        remove_dir_all(&self.path)
    }
}

impl Drop for UserDataDir {
    fn drop(&mut self) {
        if self.keep {
            return;
        }
        let _ = remove_dir_all(&self.path);
    }
}

fn sanitize(s: &str) -> String {
    let mut out = String::new();
    for ch in s.chars().take(48) {
        let ok = ch.is_ascii_alphanumeric() || ch == '-' || ch == '_';
        out.push(if ok { ch } else { '-' });
    }
    if out.is_empty() {
        "ud".into()
    } else {
        out
    }
}

fn make_unique_dir(base: &Path, prefix: &str) -> io::Result<PathBuf> {
    let mut i = 0u32;
    let ts = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    loop {
        let name = format!("{}-{}-{}", prefix, ts, i);
        let p = base.join(name);
        match fs::create_dir(&p) {
            Ok(_) => return Ok(p),
            Err(e) if e.kind() == io::ErrorKind::AlreadyExists => {
                i = i.saturating_add(1);
            }
            Err(e) => return Err(e),
        }
    }
}

fn remove_dir_all(p: &Path) -> io::Result<()> {
    if !p.exists() {
        return Ok(());
    }
    fs::remove_dir_all(p)
}
