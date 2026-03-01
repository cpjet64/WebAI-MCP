/// Convert a path to the current platform's expected format.
/// - Windows: replace '/' with '\\'.
/// - Unix: normalize Windows-style paths and WSL UNC forms.
pub fn convert_path_for_current_platform(input: &str) -> String {
    if input.is_empty() {
        return String::from(input);
    }

    #[cfg(target_os = "windows")]
    {
        input.replace('/', "\\")
    }

    #[cfg(not(target_os = "windows"))]
    {
        let s = input;

        // If this looks like a Windows UNC path, handle WSL forms.
        let has_backslash = s.contains('\\');
        if s.starts_with("\\\\") || has_backslash {
            let lower = s.to_lowercase();
            let mut parts: Vec<&str> = s.split('\\').filter(|p| !p.is_empty()).collect();

            // WSL forms: \\wsl.localhost\\<distro>\\path or \\wsl$\\<distro>\\path
            if lower.contains("wsl.localhost") || lower.contains("wsl$") {
                // Try to find distro name and slice after it.
                let distros = ["Ubuntu", "Debian", "kali", "openSUSE", "SLES", "Fedora"];
                let mut dist_idx: Option<usize> = None;
                for (i, part) in parts.iter().enumerate() {
                    if distros
                        .iter()
                        .any(|d| part.eq(d) || part.eq_ignore_ascii_case(d))
                    {
                        dist_idx = Some(i);
                        break;
                    }
                }

                if let Some(i) = dist_idx {
                    if i + 1 < parts.len() {
                        return format!("/{}", parts[i + 1..].join("/"));
                    }
                }

                // Fallback: skip the WSL marker and distro
                // parts: ["wsl.localhost", "Ubuntu", ...]
                if parts.len() >= 3 {
                    return format!("/{}", parts[2..].join("/"));
                }
            }

            // Non-WSL UNC: just normalize slashes to '/'
            return s.replace("\\\\", "/").replace('\\', "/");
        }

        // Windows drive path like C:\\dir -> /dir
        if s.len() >= 3 {
            let bytes = s.as_bytes();
            let is_drive = bytes[1] == b':' && bytes[2] == b'\\';
            if (bytes[0] as char).is_ascii_alphabetic() && is_drive {
                let rest = &s[3..].replace('\\', "/");
                return format!("/{}", rest);
            }
        }

        // No conversion needed
        s.to_string()
    }
}

#[cfg(test)]
mod tests {
    #[cfg(not(target_os = "windows"))]
    #[test]
    fn converts_wsl_unc() {
        let p = "\\\\wsl.localhost\\Ubuntu\\home\\user\\file.txt";
        assert_eq!(convert_path_for_current_platform(p), "/home/user/file.txt");
        let p2 = "\\\\wsl$\\Ubuntu\\home\\user\\file.txt";
        assert_eq!(convert_path_for_current_platform(p2), "/home/user/file.txt");
    }

    #[cfg(not(target_os = "windows"))]
    #[test]
    fn normalizes_unc_and_drive() {
        let p = "\\\\SERVER\\Share\\dir\\file";
        assert_eq!(
            convert_path_for_current_platform(p),
            "/SERVER/Share/dir/file"
        );
        let d = "C:\\Users\\Name\\file.txt";
        assert_eq!(
            convert_path_for_current_platform(d),
            "C:/Users/Name/file.txt"
        );
    }
}
