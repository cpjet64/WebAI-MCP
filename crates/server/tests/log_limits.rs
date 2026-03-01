use axum::body::Body;
use axum::http::Request;
use tower::util::ServiceExt;
use webai_core::ConsoleEntry;
use webai_server::{new_state_with, router_from_state};

#[tokio::test]
async fn string_limit_truncates_console_messages() {
    let mut state = new_state_with(0, 5, 30_000);
    state.push_console_log(ConsoleEntry {
        kind: "console-log".into(),
        level: "log".into(),
        message: "abcdefghij".into(),
        timestamp: 0,
    });
    let app = router_from_state(state);
    let res = app
        .oneshot(
            Request::builder()
                .uri("/console-logs")
                .body(Body::empty())
                .unwrap(),
        )
        .await
        .unwrap();
    let body = axum::body::to_bytes(res.into_body(), 64 * 1024)
        .await
        .unwrap();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    let msg = v[0]["message"].as_str().unwrap();
    assert_eq!(msg.len(), 5);
}
