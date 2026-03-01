use axum::body::{self, Body};
use axum::http::{header, Request, StatusCode};
use tower::util::ServiceExt;

use webai_server::{new_state, router_from_state};

#[tokio::test]
async fn current_url_set_and_get_roundtrip() {
    let state = new_state(0);
    let app = router_from_state(state);

    // POST without url should 400
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/current-url")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from("{}"))
                .expect("request"),
        )
        .await
        .expect("response");
    assert_eq!(res.status(), StatusCode::BAD_REQUEST);

    // POST with url
    let payload = serde_json::json!({ "url": "https://example.com", "tabId": 1 });
    let body_bytes = serde_json::to_vec(&payload).unwrap();
    let res = app
        .clone()
        .oneshot(
            Request::builder()
                .method("POST")
                .uri("/current-url")
                .header(header::CONTENT_TYPE, "application/json")
                .body(Body::from(body_bytes))
                .expect("request"),
        )
        .await
        .expect("response");
    assert_eq!(res.status(), StatusCode::OK);
    let body = body::to_bytes(res.into_body(), 64 * 1024).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(v["status"], "ok");
    assert_eq!(v["url"], "https://example.com");
    assert!(v["updated"].as_bool().unwrap());

    // GET current-url
    let res = app
        .oneshot(
            Request::builder()
                .uri("/current-url")
                .body(Body::empty())
                .expect("request"),
        )
        .await
        .expect("response");
    assert_eq!(res.status(), StatusCode::OK);
    let body = body::to_bytes(res.into_body(), 64 * 1024).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(v["url"], "https://example.com");
}
