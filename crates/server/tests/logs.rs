use axum::body::{self, Body};
use axum::http::{Request, StatusCode};
use tower::util::ServiceExt;

use webai_server::{new_state, router_from_state};

#[tokio::test]
async fn console_logs_respects_ring_limit_and_truncation() {
    let mut state = new_state(0);

    // 60 entries → ring keeps last 50
    for i in 0..60 {
        state.push_console_log(webai_core::ConsoleEntry {
            kind: "console-log".into(),
            level: "log".into(),
            message: format!("m{}", i),
            timestamp: i,
        });
    }
    // Add one long message to verify truncation (len 1000)
    state.push_console_log(webai_core::ConsoleEntry {
        kind: "console-log".into(),
        level: "log".into(),
        message: "x".repeat(1000),
        timestamp: 9999,
    });

    let app = router_from_state(state);
    let res = app
        .oneshot(
            Request::builder()
                .uri("/console-logs")
                .body(Body::empty())
                .expect("request"),
        )
        .await
        .expect("response");
    assert_eq!(res.status(), StatusCode::OK);
    let body = body::to_bytes(res.into_body(), 256 * 1024).await.unwrap();
    let items: Vec<webai_core::ConsoleEntry> = serde_json::from_slice(&body).unwrap();

    // Ring capacity: returns 50 most recent
    assert_eq!(items.len(), 50);

    // Ensure at least one message is truncated to 500 chars
    assert!(items.iter().any(|e| e.message.len() <= 500));
}
