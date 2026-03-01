use webai_server::{provider_mode_from_env_vars, ProviderMode};

#[test]
fn default_legacy() {
    let m = provider_mode_from_env_vars(|_| None);
    assert_eq!(m, ProviderMode::Legacy);
}

#[test]
fn supports_rust_env() {
    let m = provider_mode_from_env_vars(|k| {
        if k == "WEBAI_BROWSER_PROVIDER" {
            Some("rust".into())
        } else {
            None
        }
    });
    assert_eq!(m, ProviderMode::Rust);
}

#[test]
fn supports_legacy_boolean() {
    let m = provider_mode_from_env_vars(|k| {
        if k == "WEBAI_BROWSER_LEGACY" {
            Some("1".into())
        } else {
            None
        }
    });
    assert_eq!(m, ProviderMode::Legacy);
}
