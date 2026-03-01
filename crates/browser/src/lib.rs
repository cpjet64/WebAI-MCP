//! Browser abstraction crate.
//! Feature-gated providers will be added later.

use std::path::PathBuf;
use webai_core::{convert_path_for_current_platform, CoreError, CoreResult};
pub mod options;
pub use options::*;

/// Basic launch options for headless/driver-based providers.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct LaunchOptions {
    pub headless: bool,
    pub user_data_dir: Option<PathBuf>,
    pub executable_path: Option<PathBuf>,
}

/// Simple navigation options. Providers may ignore unsupported fields.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct NavOptions {
    pub user_agent: Option<String>,
    pub viewport: Option<(u32, u32)>,
    pub locale: Option<String>,
}

/// Trait for browser providers. Implementations should be thin adapters.
pub trait BrowserProvider {
    fn launch(&mut self, opts: &LaunchOptions) -> CoreResult<()>;
    fn navigate(&mut self, url: &str, opts: &NavOptions) -> CoreResult<()>;
    fn close(&mut self) -> CoreResult<()>;
}

/// No-op provider used when no real provider is compiled in.
pub struct NoopProvider {
    reason: &'static str,
}
impl NoopProvider {
    pub fn new(reason: &'static str) -> Self {
        Self { reason }
    }
}

impl BrowserProvider for NoopProvider {
    fn launch(&mut self, _opts: &LaunchOptions) -> CoreResult<()> {
        Err(CoreError::new(self.reason))
    }
    fn navigate(&mut self, _url: &str, _opts: &NavOptions) -> CoreResult<()> {
        Err(CoreError::new(self.reason))
    }
    fn close(&mut self) -> CoreResult<()> {
        Ok(())
    }
}

/// Helper to normalize paths in options for the current platform.
pub fn normalize_launch_options(mut opts: LaunchOptions) -> LaunchOptions {
    if let Some(p) = opts.user_data_dir.take() {
        let s = p.to_string_lossy().to_string();
        opts.user_data_dir = Some(PathBuf::from(convert_path_for_current_platform(&s)));
    }
    if let Some(p) = opts.executable_path.take() {
        let s = p.to_string_lossy().to_string();
        opts.executable_path = Some(PathBuf::from(convert_path_for_current_platform(&s)));
    }
    opts
}

/// Construct the default provider based on compiled features.
pub fn default_provider() -> Box<dyn BrowserProvider> {
    // No providers are compiled in yet; return a Noop provider.
    Box::new(NoopProvider::new("provider disabled (no feature enabled)"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn noop_provider_errors() {
        let mut p = NoopProvider::new("provider disabled");
        let e = p.launch(&LaunchOptions::default()).unwrap_err();
        assert!(e.to_string().contains("disabled"));
        let e = p
            .navigate("http://example.com", &NavOptions::default())
            .unwrap_err();
        assert!(e.to_string().contains("disabled"));
    }

    #[test]
    fn normalize_paths_roundtrip() {
        let opts = LaunchOptions {
            headless: true,
            user_data_dir: Some(PathBuf::from("C\\\\Users\\\\me\\\\tmp")),
            executable_path: Some(PathBuf::from("/usr/bin/google-chrome")),
        };
        let n = normalize_launch_options(opts);
        assert!(n.user_data_dir.is_some());
        assert!(n.executable_path.is_some());
    }

    #[test]
    fn default_provider_is_noop() {
        let mut p = default_provider();
        let err = p.launch(&LaunchOptions::default()).unwrap_err();
        assert!(err.to_string().contains("provider"));
    }
}
