mod backpressure;
mod flows;

use crate::ws_schema::{process_ws_text, WsRequest, WsResponse};
use backpressure::try_acquire_inflight;
use flows::*;

/// Process a text message. For unknown types, delegate to base handler.
pub fn process_text_message(t: &str) -> String {
    let parsed: Result<WsRequest, _> = serde_json::from_str(t);
    let Ok(req) = parsed else {
        return process_ws_text(t);
    };

    // Test-only timeout injection.
    if let Ok(v) = std::env::var("WEBAI_TEST_WS_FORCE_TIMEOUT") {
        let force = v == "1" || v == req.kind;
        if force {
            return timeout_error(&req);
        }
    }

    if req.kind != "ping" && req.kind != "heartbeat" && try_acquire_inflight().is_none() {
        return too_many_inflight(&req);
    }

    match req.kind.as_str() {
        "refresh-browser" => handle_refresh(&req),
        "get-html-by-selector" => handle_get_html(&req),
        "click-element" => handle_click(&req),
        "fill-input" => handle_fill(&req),
        "select-option" => handle_select(&req),
        "submit-form" => handle_submit(&req),
        "save-screenshot" => handle_save_screenshot(&req),
        _ => process_ws_text(t),
    }
}

fn too_many_inflight(req: &WsRequest) -> String {
    let resp = WsResponse {
        request_id: req.request_id_or_empty(),
        kind: format!("{}-error", req.kind),
        status: "error".into(),
        payload: None,
        error: Some("too-many-inflight".into()),
    };
    serde_json::to_string(&resp).unwrap_or_else(|_| "{}".into())
}

fn timeout_error(req: &WsRequest) -> String {
    let resp = WsResponse {
        request_id: req.request_id_or_empty(),
        kind: format!("{}-error", req.kind),
        status: "error".into(),
        payload: None,
        error: Some("timeout".into()),
    };
    serde_json::to_string(&resp).unwrap_or_else(|_| "{}".into())
}
