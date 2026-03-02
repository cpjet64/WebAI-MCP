use axum::body::{self, Body};
use axum::http::{Request, StatusCode};
use tower::util::ServiceExt;

use webai_server::router_with_port;

#[tokio::test]
async fn ping_responds_ok() {
    let app = router_with_port(3025);
    let res = app
        .oneshot(
            Request::builder()
                .uri("/__ping")
                .body(Body::empty())
                .expect("request"),
        )
        .await
        .expect("response");
    assert_eq!(res.status(), StatusCode::OK);
}

#[tokio::test]
async fn identity_returns_expected_shape() {
    let app = router_with_port(3025);
    let res = app
        .oneshot(
            Request::builder()
                .uri("/.identity")
                .body(Body::empty())
                .expect("request"),
        )
        .await
        .expect("response");
    assert_eq!(res.status(), StatusCode::OK);
    let body = body::to_bytes(res.into_body(), 64 * 1024).await.unwrap();
    let id: webai_core::Identity = serde_json::from_slice(&body).unwrap();
    assert_eq!(id.port, 3025);
    assert!(id.signature.contains("connector"));
}

#[tokio::test]
async fn identity_alias_returns_expected_shape() {
    let app = router_with_port(3025);
    let res = app
        .oneshot(
            Request::builder()
                .uri("/identity")
                .body(Body::empty())
                .expect("request"),
        )
        .await
        .expect("response");
    assert_eq!(res.status(), StatusCode::OK);
    let body = body::to_bytes(res.into_body(), 64 * 1024).await.unwrap();
    let id: webai_core::Identity = serde_json::from_slice(&body).unwrap();
    assert_eq!(id.port, 3025);
    assert!(id.signature.contains("connector"));
}

#[tokio::test]
async fn port_returns_number() {
    let app = router_with_port(3025);
    let res = app
        .oneshot(
            Request::builder()
                .uri("/.port")
                .body(Body::empty())
                .expect("request"),
        )
        .await
        .expect("response");
    assert_eq!(res.status(), StatusCode::OK);
    let body = body::to_bytes(res.into_body(), 1024).await.unwrap();
    assert_eq!(std::str::from_utf8(&body).unwrap(), "3025");
}
