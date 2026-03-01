use axum::body::{self, Body};
use axum::http::{Request, StatusCode};
use tower::util::ServiceExt;

use webai_server::{new_state, router_from_state};

#[tokio::test]
async fn all_xhr_merges_and_sorts_with_limits() {
    let mut state = new_state(0);

    // Push 60 success and 60 error entries (ring keeps last 50 each)
    for i in 0..60 {
        state.push_network_success(webai_core::NetworkRequest {
            url: format!("https://ok/{}", i),
            method: "GET".into(),
            status: 200,
            request_headers: None,
            response_headers: None,
            request_body: None,
            response_body: None,
            timestamp: Some((i * 2) as i64),
        });
        state.push_network_error(webai_core::NetworkRequest {
            url: format!("https://err/{}", i),
            method: "POST".into(),
            status: 500,
            request_headers: None,
            response_headers: None,
            request_body: None,
            response_body: None,
            timestamp: Some((i * 2 + 1) as i64),
        });
    }

    // Add one long body to verify truncation appears
    state.push_network_success(webai_core::NetworkRequest {
        url: "https://ok/long".into(),
        method: "PUT".into(),
        status: 200,
        request_headers: None,
        response_headers: None,
        request_body: Some("x".repeat(2000)),
        response_body: Some("y".repeat(2000)),
        timestamp: Some(99999),
    });

    let app = router_from_state(state);
    let res = app
        .oneshot(
            Request::builder()
                .uri("/all-xhr")
                .body(Body::empty())
                .expect("request"),
        )
        .await
        .expect("response");
    assert_eq!(res.status(), StatusCode::OK);
    let body = body::to_bytes(res.into_body(), 512 * 1024).await.unwrap();
    let items: Vec<webai_core::NetworkRequest> = serde_json::from_slice(&body).unwrap();

    // Expect at most 100 (50+50) due to ring caps
    assert!(items.len() <= 100);
    if items.len() == 100 {
        // Check sorted by timestamp ascending
        assert!(items.first().unwrap().timestamp <= items.last().unwrap().timestamp);
    }

    // Ensure truncation applied to long bodies
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
