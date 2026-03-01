use std::collections::HashMap;

use webai_server::{
    choose_proxy_for_url, is_private_or_loopback, should_bypass_proxy, EnvProxySettings,
};

#[test]
fn env_detection_and_no_proxy_matching() {
    let mut m = HashMap::new();
    m.insert("HTTP_PROXY".into(), "http://UP".into());
    m.insert("http_proxy".into(), "http://low".into());
    m.insert("NO_PROXY".into(), ".svc.local,localhost".into());
    let s = EnvProxySettings::from_map(&m);
    assert_eq!(s.http_proxy.as_deref(), Some("http://low"));
    assert!(should_bypass_proxy("api.svc.local", s.no_proxy.as_deref()));
}

#[test]
fn private_range_bypass_and_choice() {
    let s = EnvProxySettings {
        http_proxy: Some("http://proxy".into()),
        https_proxy: None,
        no_proxy: None,
    };
    assert!(is_private_or_loopback("192.168.0.2"));
    assert!(choose_proxy_for_url("http://192.168.0.2", &s).is_none());
    let p = choose_proxy_for_url("http://example.com", &s).unwrap();
    assert_eq!(p.url, "http://proxy");
}
