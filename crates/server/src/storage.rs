use std::fs;
use std::io::{self, Write};
use std::path::{Path, PathBuf};
use std::time::{SystemTime, UNIX_EPOCH};

use thiserror::Error;

#[derive(Debug, Error)]
pub enum SaveError {
    #[error("invalid base64 payload")]
    InvalidBase64,
    #[error("payload too large: {0} bytes > limit {1}")]
    TooLarge(usize, usize),
    #[error("io error: {0}")]
    Io(#[from] io::Error),
}

/// Save a base64-encoded screenshot PNG to `dir`.
/// Returns the final file path.
pub fn save_screenshot_base64(
    dir: &Path,
    title: Option<&str>,
    base64_png: &str,
    max_bytes: usize,
) -> Result<PathBuf, SaveError> {
    let data = decode_base64(trim_data_uri(base64_png)?)?;
    if data.len() > max_bytes {
        return Err(SaveError::TooLarge(data.len(), max_bytes));
    }
    ensure_dir(dir)?;
    let filename = safe_screenshot_filename(title, SystemTime::now());
    let final_path = dir.join(filename);
    atomic_write(&final_path, &data)?;
    Ok(final_path)
}

/// Ensure directory exists.
pub fn ensure_dir(dir: &Path) -> io::Result<()> {
    if !dir.exists() {
        fs::create_dir_all(dir)?;
    }
    Ok(())
}

/// Sanitize a filename segment.
pub fn sanitize_filename(s: &str) -> String {
    let mut out = String::new();
    for ch in s.chars().take(64) {
        let ok = ch.is_ascii_alphanumeric() || ch == '-' || ch == '_' || ch == '.';
        out.push(if ok { ch } else { '-' });
    }
    if out.is_empty() {
        "screenshot".to_string()
    } else {
        out
    }
}

/// Generate a safe filename with timestamp prefix.
pub fn safe_screenshot_filename(title: Option<&str>, ts: SystemTime) -> String {
    let secs = ts.duration_since(UNIX_EPOCH).unwrap_or_default().as_secs();
    let stamp = format!("{}", secs);
    let base = title
        .map(sanitize_filename)
        .unwrap_or_else(|| "screenshot".into());
    format!("{}-{}.png", stamp, base)
}

/// Atomically write bytes to a path using a temporary file + rename.
pub fn atomic_write(path: &Path, data: &[u8]) -> io::Result<()> {
    let parent = path
        .parent()
        .ok_or_else(|| io::Error::other("no parent directory"))?;
    let tmp = parent.join(format!(
        ".{}.tmp{}",
        path.file_name().unwrap().to_string_lossy(),
        unique_suffix(),
    ));
    {
        let mut f = fs::File::create(&tmp)?;
        f.write_all(data)?;
        f.sync_all()?;
    }
    fs::rename(tmp, path)?;
    Ok(())
}

fn unique_suffix() -> String {
    let ns = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    format!("-{}", ns)
}

/// If the string is a data URI, return the part after the comma.
fn trim_data_uri(s: &str) -> Result<&str, SaveError> {
    if let Some(idx) = s.find(",") {
        // Basic check for data URI with base64 tag; be lenient
        if s[..idx].contains("base64") {
            return Ok(&s[idx + 1..]);
        }
    }
    Ok(s)
}

/// Minimal Base64 decoder supporting standard alphabet and '=' padding.
fn decode_base64(input: &str) -> Result<Vec<u8>, SaveError> {
    let mut buf = Vec::with_capacity(input.len() * 3 / 4);
    let bytes = input.as_bytes();
    if bytes.is_empty() {
        return Ok(buf);
    }
    if !bytes.len().is_multiple_of(4) {
        return Err(SaveError::InvalidBase64);
    }
    let mut i = 0;
    while i < bytes.len() {
        let a = val(bytes[i])? as u32;
        let b = val(bytes[i + 1])? as u32;
        let c = if bytes[i + 2] == b'=' {
            64
        } else {
            val(bytes[i + 2])? as u32
        };
        let d = if bytes[i + 3] == b'=' {
            64
        } else {
            val(bytes[i + 3])? as u32
        };

        let triple = (a << 18) | (b << 12) | ((c & 63) << 6) | (d & 63);
        buf.push(((triple >> 16) & 0xFF) as u8);
        if bytes[i + 2] != b'=' {
            buf.push(((triple >> 8) & 0xFF) as u8);
        }
        if bytes[i + 3] != b'=' {
            buf.push((triple & 0xFF) as u8);
        }
        i += 4;
    }
    Ok(buf)
}

fn val(c: u8) -> Result<u8, SaveError> {
    match c {
        b'A'..=b'Z' => Ok(c - b'A'),
        b'a'..=b'z' => Ok(c - b'a' + 26),
        b'0'..=b'9' => Ok(c - b'0' + 52),
        b'+' => Ok(62),
        b'/' => Ok(63),
        b'=' => Ok(64),
        _ => Err(SaveError::InvalidBase64),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn filename_sanitization_and_format() {
        let name = sanitize_filename("Hello:World/\\*?");
        assert!(name.starts_with("Hello-World-".trim_end_matches('-')));
        assert!(!name.contains(':'));
        let f = safe_screenshot_filename(Some("My Title"), UNIX_EPOCH);
        assert!(f.ends_with("-My-Title.png"));
    }
}

/// Truncate a string to `max` characters.
pub fn clamp_str(s: &str, max: usize) -> String {
    if s.len() > max {
        s[..max].to_string()
    } else {
        s.to_string()
    }
}

/// Process key/value pairs (cookies or storage) with truncation.
pub fn process_kv_pairs(pairs: &[(String, String)], max: usize) -> Vec<(String, String)> {
    pairs
        .iter()
        .map(|(k, v)| (k.clone(), clamp_str(v, max)))
        .collect()
}

#[cfg(test)]
mod kv_tests {
    use super::*;

    #[test]
    fn kv_truncation() {
        let pairs = vec![("k".into(), "x".repeat(10))];
        let out = process_kv_pairs(&pairs, 5);
        assert_eq!(out[0].1.len(), 5);
    }
}
