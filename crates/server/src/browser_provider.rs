#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProviderMode {
    Legacy,
    Rust,
}

/// Determine provider mode from environment variables.
/// Precedence: explicit provider var > legacy boolean > default Legacy.
pub fn provider_mode_from_env_vars<F>(getenv: F) -> ProviderMode
where
    F: Fn(&str) -> Option<String>,
{
    if let Some(v) = getenv("WEBAI_BROWSER_PROVIDER") {
        let low = v.to_ascii_lowercase();
        if low == "rust" {
            return ProviderMode::Rust;
        }
        if low == "legacy" {
            return ProviderMode::Legacy;
        }
    }
    if let Some(v) = getenv("WEBAI_BROWSER_LEGACY") {
        let low = v.to_ascii_lowercase();
        if low == "1" || low == "true" || low == "yes" {
            return ProviderMode::Legacy;
        }
    }
    ProviderMode::Legacy
}

/// Read from process environment.
pub fn provider_mode() -> ProviderMode {
    provider_mode_from_env_vars(|k| std::env::var(k).ok())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_is_legacy() {
        let m = provider_mode_from_env_vars(|_| None);
        assert_eq!(m, ProviderMode::Legacy);
    }

    #[test]
    fn explicit_provider_takes_precedence() {
        let m = provider_mode_from_env_vars(|k| match k {
            "WEBAI_BROWSER_PROVIDER" => Some("rust".into()),
            _ => None,
        });
        assert_eq!(m, ProviderMode::Rust);
        let m = provider_mode_from_env_vars(|k| match k {
            "WEBAI_BROWSER_PROVIDER" => Some("legacy".into()),
            "WEBAI_BROWSER_LEGACY" => Some("0".into()),
            _ => None,
        });
        assert_eq!(m, ProviderMode::Legacy);
    }

    #[test]
    fn legacy_boolean_supported() {
        for v in ["1", "true", "yes", "TRUE"] {
            let m = provider_mode_from_env_vars(|k| {
                if k == "WEBAI_BROWSER_LEGACY" {
                    Some(v.to_string())
                } else {
                    None
                }
            });
            assert_eq!(m, ProviderMode::Legacy);
        }
    }
}
