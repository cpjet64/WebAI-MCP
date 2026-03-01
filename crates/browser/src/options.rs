use std::collections::BTreeMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ResourceType {
    Image,
    Font,
    Media,
    Stylesheet,
    Script,
    Other,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum NetworkProfile {
    Slow3G,
    Fast3G,
    FourG,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct NetworkEmulation {
    pub profile: Option<NetworkProfile>,
    pub offline: bool,
    pub latency_ms: Option<u32>,
    pub download_kbps: Option<u32>,
    pub upload_kbps: Option<u32>,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct RequestFilters {
    pub block_types: Vec<ResourceType>,
}

#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct ExtendedNavOptions {
    pub headers: BTreeMap<String, String>,
    pub cookies: BTreeMap<String, String>,
    pub timezone: Option<String>,
    pub emulate: Option<NetworkEmulation>,
    pub filters: Option<RequestFilters>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_are_empty() {
        let o = ExtendedNavOptions::default();
        assert!(o.headers.is_empty());
        assert!(o.cookies.is_empty());
        assert!(o.timezone.is_none());
    }
}
