use axum::body::{self, Body};
use axum::http::{header, Request, StatusCode};
use tower::util::ServiceExt;

use webai_server::router_with_port;

#[tokio::test]
#[ignore]
async fn test_connectivity_success_and_timeout_and_bypass_proxy() {
    // Start a local mock server
    let server = httpmock::MockServer::start();
    let ok = server.mock(|when, then| {
        when.method(httpmock::Method::GET).path("/ping");
        then.status(200).body("OK");
    });
    server.mock(|when, then| {
        when.method(httpmock::Method::GET).path("/slow");
        then.status(200)
            .delay(std::time::Duration::from_millis(150));
    });

    // Build app
    let app = router_with_port(0);

    // Success case
    let payload = serde_json::json!({
        "url": format!("{}/ping", server.base_url()),
        "timeoutMs": 5000
    });
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/test-connectivity")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(serde_json::to_vec(&payload).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let body = body::to_bytes(res.into_body(), 64 * 1024).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert!(v["ok"].as_bool().unwrap());
    assert_eq!(v["status"].as_u64().unwrap(), 200);
    ok.assert();

    // Timeout case
    let payload = serde_json::json!({
        "url": format!("{}/slow", server.base_url()),
        "timeoutMs": 50
    });
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/test-connectivity")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(serde_json::to_vec(&payload).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let body = body::to_bytes(res.into_body(), 64 * 1024).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert!(!v["ok"].as_bool().unwrap());

    // Proxy bypass case: set bogus proxy but target is localhost
    std::env::set_var("HTTP_PROXY", "http://127.0.0.1:9");
    let payload = serde_json::json!({
        "url": format!("{}/ping", server.base_url()),
        "timeoutMs": 5000
    });
    let res = app
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/test-connectivity")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(serde_json::to_vec(&payload).unwrap()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(res.status(), StatusCode::OK);
    let body = body::to_bytes(res.into_body(), 64 * 1024).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert!(v["ok"].as_bool().unwrap());
}
