use axum::body::{self, Body};
use axum::http::{header, Request, StatusCode};
use tower::util::ServiceExt;

use webai_server::{new_state, router_from_state};

#[tokio::test]
async fn selected_element_set_and_get_roundtrip() {
    let state = new_state(0);
    let app = router_from_state(state);

    // Build payload
    let payload = serde_json::json!({
        "data": {
            "tagName": "DIV",
            "id": "main",
            "className": "container",
            "textContent": "Hello",
            "attributes": [
                { "name": "role", "value": "main" }
            ]
        }
    });
    let body_bytes = serde_json::to_vec(&payload).unwrap();

    // POST /selected-element
    let res = app
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
    assert_eq!(res.status(), StatusCode::OK);

    // GET /selected-element
    let res = app
        .oneshot(
            Request::builder()
                .uri("/selected-element")
                .body(Body::empty())
                .expect("request"),
        )
        .await
        .expect("response");
    assert_eq!(res.status(), StatusCode::OK);
    let body = body::to_bytes(res.into_body(), 64 * 1024).await.unwrap();
    let el: webai_core::SelectedElement = serde_json::from_slice(&body).unwrap();
    assert_eq!(el.id, "main");
    assert_eq!(el.tag_name, "DIV");
}

#[tokio::test]
async fn selected_element_get_when_not_set_returns_message() {
    let state = new_state(0);
    let app = router_from_state(state);

    let res = app
        .oneshot(
            Request::builder()
                .uri("/selected-element")
                .body(Body::empty())
                .expect("request"),
        )
        .await
        .expect("response");
    assert_eq!(res.status(), StatusCode::OK);

    let body = body::to_bytes(res.into_body(), 64 * 1024).await.unwrap();
    let v: serde_json::Value = serde_json::from_slice(&body).unwrap();
    assert_eq!(v["message"], "No element selected");
}
