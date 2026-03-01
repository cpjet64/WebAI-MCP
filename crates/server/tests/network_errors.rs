use axum::body::{self, Body};
use axum::http::{Request, StatusCode};
use tower::util::ServiceExt;

use webai_server::{new_state, router_from_state};

#[tokio::test]
async fn network_errors_respects_ring_limit_and_truncation() {
    let mut state = new_state(0);

    // 60 entries → ring keeps last 50
    for i in 0..60 {
        state.push_network_error(webai_core::NetworkRequest {
            url: format!("https://err/{}", i),
            method: "GET".into(),
            status: 500,
            request_headers: None,
            response_headers: None,
            request_body: None,
            response_body: None,
            timestamp: Some(i as i64),
        });
    }

    // Add one long body to verify truncation (len 1000)
    state.push_network_error(webai_core::NetworkRequest {
        url: "https://err/long".into(),
        method: "POST".into(),
        status: 500,
        request_headers: None,
        response_headers: None,
        request_body: Some("x".repeat(1000)),
        response_body: Some("y".repeat(1000)),
        timestamp: Some(9999),
    });

    let app = router_from_state(state);
    let res = app
        .oneshot(
            Request::builder()
                .uri("/network-errors")
                .body(Body::empty())
                .expect("request"),
        )
        .await
        .expect("response");
    assert_eq!(res.status(), StatusCode::OK);
    let body = body::to_bytes(res.into_body(), 256 * 1024).await.unwrap();
    let items: Vec<webai_core::NetworkRequest> = serde_json::from_slice(&body).unwrap();

    // Ring capacity: returns 50 most recent
    assert_eq!(items.len(), 50);

    // Ensure at least one body field is truncated to <= 500 chars
    assert!(items.iter().any(|e| {
        e.request_body
            .as_ref()
            .map(|s| s.len() <= 500)
            .unwrap_or(false)
            || e.response_body
                .as_ref()
                .map(|s| s.len() <= 500)
                .unwrap_or(false)
    }));
}
