use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::State;
use axum::response::IntoResponse;
use std::sync::Arc;

use crate::ws_handlers::process_text_message;
use crate::AppState;

pub async fn extension_ws(
    State(state): State<Arc<AppState>>,
    ws: WebSocketUpgrade,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(mut socket: WebSocket, state: Arc<AppState>) {
    state.inc_ws();
    // Minimal schema loop; parse text and respond with envelope.
    while let Some(Ok(msg)) = socket.recv().await {
        match msg {
            Message::Text(t) => {
                let out = process_text_message(&t);
                let _ = socket.send(Message::Text(out)).await;
            }
            Message::Binary(b) => {
                let _ = socket.send(Message::Binary(b)).await;
            }
            Message::Close(_) => break,
            _ => {}
        }
    }
    state.dec_ws();
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn save_screenshot_happy_path() {
        let dir = std::env::temp_dir().join("webai-ws-test");
        let _ = std::fs::create_dir_all(&dir);
        let req = serde_json::json!({
            "requestId": "r1",
            "type": "save-screenshot",
            "payload": {
                "dir": dir.to_string_lossy(),
                "title": "foo",
                "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/ayG3+UAAAAASUVORK5CYII="
            }
        });
        let out = process_text_message(&req.to_string());
        let v: serde_json::Value = serde_json::from_str(&out).unwrap();
        assert_eq!(v["type"], "save-screenshot-response");
        let p = v["payload"]["path"].as_str().unwrap();
        assert!(std::path::Path::new(p).exists());
        let _ = std::fs::remove_file(p);
        let _ = std::fs::remove_dir_all(&dir);
    }

    #[test]
    fn save_screenshot_uses_env_dir() {
        // Set a custom dir via env and omit dir from payload
        let base = std::env::temp_dir().join("webai-ws-env");
        let _ = std::fs::create_dir_all(&base);
        std::env::set_var("WEBAI_SCREENSHOT_DIR", &base);
        let req = serde_json::json!({
            "requestId": "r-env",
            "type": "save-screenshot",
            "payload": {
                "title": "foo",
                "data": "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/ayG3+UAAAAASUVORK5CYII="
            }
        });
        let out = process_text_message(&req.to_string());
        let v: serde_json::Value = serde_json::from_str(&out).unwrap();
        assert_eq!(v["type"], "save-screenshot-response");
        let p = v["payload"]["path"].as_str().unwrap();
        assert!(p.starts_with(base.to_string_lossy().as_ref()));
        let _ = std::fs::remove_file(p);
        let _ = std::fs::remove_dir_all(&base);
        std::env::remove_var("WEBAI_SCREENSHOT_DIR");
    }

    #[test]
    fn get_html_missing_selector_error() {
        let req = serde_json::json!({
            "requestId": "r2",
            "type": "get-html-by-selector",
            "payload": {}
        });
        let out = process_text_message(&req.to_string());
        let v: serde_json::Value = serde_json::from_str(&out).unwrap();
        assert_eq!(v["type"], "get-html-by-selector-error");
        assert_eq!(v["status"], "error");
        assert!(v["error"].as_str().unwrap().contains("missing"));
    }

    #[test]
    fn refresh_browser_ok() {
        let req = serde_json::json!({
            "requestId": "r3",
            "type": "refresh-browser",
            "payload": {}
        });
        let out = process_text_message(&req.to_string());
        let v: serde_json::Value = serde_json::from_str(&out).unwrap();
        assert_eq!(v["type"], "refresh-browser-response");
        assert_eq!(v["status"], "ok");
    }
}
