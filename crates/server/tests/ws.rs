use axum::body::Body;
use axum::http::{header, Request, StatusCode};
use tower::util::ServiceExt;
use webai_server::router_with_port;

#[tokio::test]
#[ignore]
async fn ws_upgrade_works_with_headers() {
    let app = router_with_port(0);
    // Minimal WebSocket handshake headers
    let req = Request::builder()
        .method("GET")
        .uri("/extension-ws")
        .header(header::HOST, "localhost")
        .header(header::CONNECTION, "upgrade")
        .header(header::UPGRADE, "websocket")
        .header("Sec-WebSocket-Version", "13")
        .header("Sec-WebSocket-Key", "dGhlIHNhbXBsZSBub25jZQ==")
        .body(Body::empty())
        .unwrap();

    let res = app.clone().oneshot(req).await.unwrap();
    assert_eq!(res.status(), StatusCode::SWITCHING_PROTOCOLS);
}

#[tokio::test]
async fn ws_route_requires_upgrade() {
    let app = router_with_port(0);
    let req = Request::builder()
        .method("GET")
        .uri("/extension-ws")
        .body(Body::empty())
        .unwrap();
    let res = app.oneshot(req).await.unwrap();
    assert!(res.status().is_client_error());
}
