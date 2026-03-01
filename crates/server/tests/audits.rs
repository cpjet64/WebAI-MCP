use axum::body::Body;
use axum::http::{Request, StatusCode};
use tower::util::ServiceExt;
use webai_server::router_with_port;

#[tokio::test]
async fn accessibility_audit_returns_unavailable() {
    let app = router_with_port(0);
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/accessibility-audit")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
}

#[tokio::test]
async fn performance_audit_returns_unavailable() {
    let app = router_with_port(0);
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/performance-audit")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
}

#[tokio::test]
async fn seo_audit_returns_unavailable() {
    let app = router_with_port(0);
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/seo-audit")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
}

#[tokio::test]
async fn best_practices_audit_returns_unavailable() {
    let app = router_with_port(0);
    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/best-practices-audit")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
}
