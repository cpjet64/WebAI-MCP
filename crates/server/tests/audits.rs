use axum::body;
use axum::body::Body;
use axum::http::{Request, StatusCode};
use tower::util::ServiceExt;
use webai_server::router_with_port;

async fn assert_audit_unavailable(path: &str) {
    let app = router_with_port(0);
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri(path)
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);

    let body = body::to_bytes(res.into_body(), 64 * 1024).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(v["status"], "error");
    assert_eq!(v["status_code"], 503);
    assert_eq!(v["code"], "WEBAI_AUDIT_UNAVAILABLE");
    assert_eq!(v["error"], "audit endpoint unavailable");
    assert_eq!(v["path"], path);
    assert_eq!(v["requires_client"], false);
    assert_eq!(v["feature"], "audit-lighthouse");
    assert!(v["reason"].as_str().is_some());
    assert!(v["feature_enabled"].is_boolean());
}

#[tokio::test]
async fn accessibility_audit_returns_unavailable() {
    assert_audit_unavailable("/accessibility-audit").await;
}

#[tokio::test]
async fn performance_audit_returns_unavailable() {
    assert_audit_unavailable("/performance-audit").await;
}

#[tokio::test]
async fn seo_audit_returns_unavailable() {
    assert_audit_unavailable("/seo-audit").await;
}

#[tokio::test]
async fn best_practices_audit_returns_unavailable() {
    assert_audit_unavailable("/best-practices-audit").await;
}
