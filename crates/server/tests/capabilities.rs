use axum::body::Body;
use axum::http::{Request, StatusCode};
use std::sync::LazyLock;
use tokio::sync::Mutex;
use tower::util::ServiceExt;
use webai_server::router_with_port;

#[tokio::test]
async fn capabilities_contains_provider_and_flows() {
    let app = router_with_port(0);
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/capabilities")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let body = axum::body::to_bytes(res.into_body(), 64 * 1024)
        .await
        .unwrap();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert!(v["websocket"].as_bool().unwrap());
    assert!(v["provider"].as_str().is_some());
    assert!(v["flows"]["saveScreenshot"].as_bool().unwrap());
    // Audit flow keys exist and are unavailable
    assert_eq!(v["flows"]["auditAccessibility"]["available"], false);
    assert_eq!(v["flows"]["auditPerformance"]["available"], false);
    assert_eq!(v["flows"]["auditSeo"]["available"], false);
    assert_eq!(v["flows"]["auditBestPractices"]["available"], false);
}

static ENV_LOCK: LazyLock<Mutex<()>> = LazyLock::new(|| Mutex::new(()));

#[tokio::test]
async fn capabilities_reflects_env_provider_mode() {
    let _g = ENV_LOCK.lock().await;
    std::env::set_var("WEBAI_BROWSER_PROVIDER", "rust");
    let app = router_with_port(0);
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/capabilities")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let body = axum::body::to_bytes(res.into_body(), 64 * 1024)
        .await
        .unwrap();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(v["provider"], "rust");
    std::env::remove_var("WEBAI_BROWSER_PROVIDER");
    drop(_g);
}

#[tokio::test]
async fn capabilities_requires_client_legacy_true() {
    let _g = ENV_LOCK.lock().await;
    std::env::set_var("WEBAI_BROWSER_PROVIDER", "legacy");
    let app = router_with_port(0);
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/capabilities")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let body = axum::body::to_bytes(res.into_body(), 64 * 1024)
        .await
        .unwrap();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(v["provider"], "legacy");
    assert!(v["flows"]["getHtmlBySelector"]["requiresClient"]
        .as_bool()
        .unwrap());
    assert!(v["flows"]["clickElement"]["requiresClient"]
        .as_bool()
        .unwrap());
    std::env::remove_var("WEBAI_BROWSER_PROVIDER");
    drop(_g);
}

#[tokio::test]
async fn capabilities_requires_client_rust_false() {
    let _g = ENV_LOCK.lock().await;
    std::env::set_var("WEBAI_BROWSER_PROVIDER", "rust");
    let app = router_with_port(0);
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method("GET")
                .uri("/capabilities")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let body = axum::body::to_bytes(res.into_body(), 64 * 1024)
        .await
        .unwrap();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(v["provider"], "rust");
    assert_eq!(v["flows"]["getHtmlBySelector"]["requiresClient"], false);
    assert_eq!(v["flows"]["clickElement"]["requiresClient"], false);
    std::env::remove_var("WEBAI_BROWSER_PROVIDER");
    drop(_g);
}
