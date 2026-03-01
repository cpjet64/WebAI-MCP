use axum::body::{self, Body};
use axum::http::{Request, StatusCode};
use tower::util::ServiceExt;

use webai_server::router_with_port;

#[tokio::test]
async fn cookies_local_session_return_503_when_unavailable() {
    let app = router_with_port(0);
    for path in ["/cookies", "/local-storage", "/session-storage"] {
        let res = app
            .clone()
            .oneshot(Request::builder().uri(path).body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE, "{}", path);
        let body = body::to_bytes(res.into_body(), 16 * 1024).await.unwrap();
        let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
        assert_eq!(v["error"], "No clients connected");
    }
}
