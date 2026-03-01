use axum::body::{self, Body};
use axum::http::{header, Request, StatusCode};
use tower::util::ServiceExt;

use webai_server::{new_state, router_from_state};

#[tokio::test]
async fn wipelogs_clears_all_and_resets_selected() {
    let mut state = new_state(0);

    // Seed some data
    for i in 0..10 {
        state.push_console_log(webai_core::ConsoleEntry {
            kind: "console-log".into(),
            level: "log".into(),
            message: format!("m{}", i),
            timestamp: i,
        });
        state.push_console_error(webai_core::ConsoleEntry {
            kind: "console-error".into(),
            level: "error".into(),
            message: format!("e{}", i),
            timestamp: i,
        });
        state.push_network_error(webai_core::NetworkRequest {
            url: "https://err".into(),
            method: "GET".into(),
            status: 500,
            request_headers: None,
            response_headers: None,
            request_body: None,
            response_body: None,
            timestamp: Some(i),
        });
        state.push_network_success(webai_core::NetworkRequest {
            url: "https://ok".into(),
            method: "GET".into(),
            status: 200,
            request_headers: None,
            response_headers: None,
            request_body: None,
            response_body: None,
            timestamp: Some(i),
        });
    }

    let app = router_from_state(state);

    // Set selected element
    let payload = serde_json::json!({
        "data": {
            "tagName": "SPAN", "id": "sel", "className": "x",
            "textContent": null, "attributes": []
        }
    });
    let body_bytes = serde_json::to_vec(&payload).unwrap();
    let _ = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/selected-element")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body_bytes))
                .expect("request"),
        )
        .await
        .expect("response");

    // Call /wipelogs
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/wipelogs")
                .body(Body::empty())
                .expect("request"),
        )
        .await
        .expect("response");
    assert_eq!(res.status(), StatusCode::OK);

    // Verify logs endpoints are empty
    for path in [
        "/console-logs",
        "/console-errors",
        "/network-errors",
        "/network-success",
    ] {
        let res = app
            .clone()
            .oneshot(Request::builder().uri(path).body(Body::empty()).unwrap())
            .await
            .unwrap();
        assert_eq!(res.status(), StatusCode::OK);
        let body = body::to_bytes(res.into_body(), 64 * 1024).await.unwrap();
        let v: Vec<serde_json::Value> = serde_json::from_slice(&body).unwrap();
        assert!(v.is_empty(), "{} not empty", path);
    }

    // Verify selected-element reset message
    let res = app
        .oneshot(
            Request::builder()
                .uri("/selected-element")
                .body(Body::empty())
                .expect("request"),
        )
        .await
        .expect("response");
    let body = body::to_bytes(res.into_body(), 64 * 1024).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(v["message"], "No element selected");
}
