use std::collections::HashMap;
use std::net::{IpAddr, Ipv4Addr};
use std::time::Duration;

/// Proxy settings from environment variables.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EnvProxySettings {
    pub http_proxy: Option<String>,
    pub https_proxy: Option<String>,
    pub no_proxy: Option<String>,
}

impl EnvProxySettings {
    /// Build settings from a map. Lowercase overrides uppercase.
    pub fn from_map(env: &HashMap<String, String>) -> Self {
        let get = |k: &str| env.get(k).cloned();
        let pick = |lower: Option<String>, upper: Option<String>| lower.or(upper);
        Self {
            http_proxy: pick(get("http_proxy"), get("HTTP_PROXY")),
            https_proxy: pick(get("https_proxy"), get("HTTPS_PROXY")),
            no_proxy: pick(get("no_proxy"), get("NO_PROXY")),
        }
    }

    /// Build settings from real process env.
    pub fn from_env() -> Self {
        let mut m = HashMap::new();
        for (k, v) in std::env::vars() {
            m.insert(k, v);
        }
        // normalize keys to both cases for re-use
        let mut norm = HashMap::new();
        for (k, v) in m {
            norm.insert(k.to_lowercase(), v.clone());
            norm.insert(k, v);
        }
        Self::from_map(&norm)
    }
}

/// A chosen proxy for a URL.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ChosenProxy {
    pub url: String,
}

/// Determine proxy for a URL, honoring NO_PROXY and private ranges.
pub fn choose_proxy_for_url(url: &str, env: &EnvProxySettings) -> Option<ChosenProxy> {
    // Extract host part
    let host = host_from_url(url)?;
    if should_bypass_proxy(&host, env.no_proxy.as_deref()) {
        return None;
    }
    // Private/loopback bypass
    if is_private_or_loopback(&host) {
        return None;
    }

    // Choose per scheme
    let scheme = scheme_from_url(url).unwrap_or("http");
    let p = if scheme == "https" {
        env.https_proxy.as_ref().or(env.http_proxy.as_ref())
    } else {
        env.http_proxy.as_ref()
    }?;
    Some(ChosenProxy { url: p.clone() })
}

/// NO_PROXY matching rules and localhost/private bypass.
pub fn should_bypass_proxy(host: &str, no_proxy: Option<&str>) -> bool {
    let h = host.split(':').next().unwrap_or(host);
    if h.eq_ignore_ascii_case("localhost") {
        return true;
    }
    if is_private_or_loopback(h) {
        return true;
    }
    let Some(list) = no_proxy else { return false };
    for raw in list.split(',') {
        let token = raw.trim();
        if token.is_empty() {
            continue;
        }
        if token == "*" {
            return true;
        }
        if token_match(h, token) {
            return true;
        }
    }
    false
}

fn token_match(host: &str, token: &str) -> bool {
    // strip port from host if any
    let h = host.split(':').next().unwrap_or(host).to_lowercase();
    let t = token.to_lowercase();
    if t.starts_with('.') {
        return h.ends_with(&t);
    }
    h == t || h.ends_with(&format!(".{}", t))
}

/// Detect loopback or RFC1918 private ranges.
pub fn is_private_or_loopback(host_or_ip: &str) -> bool {
    let h = host_or_ip.split(':').next().unwrap_or(host_or_ip);
    if let Ok(ip) = h.parse::<IpAddr>() {
        match ip {
            IpAddr::V4(v4) => is_private_v4(v4) || v4.is_loopback(),
            IpAddr::V6(v6) => v6.is_loopback(),
        }
    } else {
        h.eq_ignore_ascii_case("localhost")
    }
}

fn is_private_v4(ip: Ipv4Addr) -> bool {
    let o = ip.octets();
    (o[0] == 10) || (o[0] == 172 && (16..=31).contains(&o[1])) || (o[0] == 192 && o[1] == 168)
}

fn host_from_url(url: &str) -> Option<String> {
    // simple parse: scheme://host[:port]/...
    let rest = url.split("//").nth(1)?;
    let host_port = rest.split('/').next().unwrap_or(rest);
    Some(host_port.to_string())
}

fn scheme_from_url(url: &str) -> Option<&str> {
    url.split(":").next()
}

/// Build a reqwest client for a target URL using provided env proxy rules.
pub fn build_reqwest_client_for(
    target_url: &str,
    env: &EnvProxySettings,
    timeout: Duration,
) -> Result<reqwest::Client, reqwest::Error> {
    let mut builder = reqwest::Client::builder().timeout(timeout).no_proxy();
    if let Some(chosen) = choose_proxy_for_url(target_url, env) {
        let scheme = scheme_from_url(target_url).unwrap_or("http");
        let is_socks = chosen.url.to_ascii_lowercase().starts_with("socks");
        builder = if is_socks {
            builder.proxy(reqwest::Proxy::all(chosen.url)?)
        } else if scheme == "https" {
            builder.proxy(reqwest::Proxy::https(chosen.url)?)
        } else {
            builder.proxy(reqwest::Proxy::http(chosen.url)?)
        };
    }
    builder.build()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lower_overrides_upper() {
        let mut m = HashMap::new();
        m.insert("HTTP_PROXY".to_string(), "UP".to_string());
        m.insert("http_proxy".to_string(), "low".to_string());
        let s = EnvProxySettings::from_map(&m);
        assert_eq!(s.http_proxy.as_deref(), Some("low"));
    }

    #[test]
    fn no_proxy_suffix_and_exact() {
        let s = EnvProxySettings {
            http_proxy: Some("http://p".into()),
            https_proxy: None,
            no_proxy: Some(".example.com,localhost".into()),
        };
        assert!(should_bypass_proxy(
            "api.example.com",
            s.no_proxy.as_deref()
        ));
        assert!(should_bypass_proxy("localhost", s.no_proxy.as_deref()));
        assert!(!should_bypass_proxy("other.com", s.no_proxy.as_deref()));
    }

    #[test]
    fn private_ranges_bypass() {
        assert!(is_private_or_loopback("10.1.2.3"));
        assert!(is_private_or_loopback("172.16.0.1"));
        assert!(is_private_or_loopback("172.31.255.255"));
        assert!(!is_private_or_loopback("172.32.0.1"));
        assert!(is_private_or_loopback("192.168.1.10"));
        assert!(is_private_or_loopback("127.0.0.1"));
    }

    #[test]
    fn choose_proxy_respects_no_proxy_and_scheme() {
        let s = EnvProxySettings {
            http_proxy: Some("http://hp".into()),
            https_proxy: Some("http://sp".into()),
            no_proxy: Some(".x.com".into()),
        };
        let p = choose_proxy_for_url("http://a.b", &s).unwrap();
        assert_eq!(p.url, "http://hp");
        let p = choose_proxy_for_url("https://a.b", &s).unwrap();
        assert_eq!(p.url, "http://sp");
        assert!(choose_proxy_for_url("https://api.x.com", &s).is_none());
        assert!(choose_proxy_for_url("http://127.0.0.1", &s).is_none());
    }
    #[test]
    fn socks_and_http_proxy_selection() {
        let s = EnvProxySettings {
            http_proxy: Some("socks5h://127.0.0.1:9050".into()),
            https_proxy: Some("http://proxy:3128".into()),
            no_proxy: None,
        };
        let t = Duration::from_millis(10);
        assert!(build_reqwest_client_for("http://a", &s, t).is_ok());
        assert!(build_reqwest_client_for("https://a", &s, t).is_ok());
    }
}
