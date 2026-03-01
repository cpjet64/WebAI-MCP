use crate::flow_adapter::{provider_for_current_mode, FlowResult};
use crate::storage::save_screenshot_base64;
use crate::ws_schema::{WsRequest, WsResponse};
use crate::{provider_mode, ProviderMode};
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};

pub fn handle_refresh(req: &WsRequest) -> String {
    let payload = if provider_mode() == ProviderMode::Rust {
        let now = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_millis() as u64;
        Some(serde_json::json!({"refreshedAt": now}))
    } else {
        None
    };
    to_json(&WsResponse {
        request_id: req.request_id.clone(),
        kind: "refresh-browser-response".into(),
        status: "ok".into(),
        payload,
        error: None,
    })
}

pub fn handle_get_html(req: &WsRequest) -> String {
    let selector = req.payload.get("selector").and_then(|v| v.as_str());
    if selector.is_none() || selector.unwrap().trim().is_empty() {
        return to_error(req, "get-html-by-selector", "missing selector");
    }
    match provider_for_current_mode().get_html(selector.unwrap()) {
        FlowResult::Ok(payload) => to_json(&WsResponse {
            request_id: req.request_id.clone(),
            kind: "get-html-by-selector-response".into(),
            status: "ok".into(),
            payload: Some(payload),
            error: None,
        }),
        FlowResult::Err(e) => to_error(req, "get-html-by-selector", &e),
    }
}

pub fn handle_click(req: &WsRequest) -> String {
    let sel = req.payload.get("selector").and_then(|v| v.as_str());
    if sel.is_none() || sel.unwrap().trim().is_empty() {
        return to_error(req, "click-element", "missing selector");
    }
    match provider_for_current_mode().click(sel.unwrap()) {
        FlowResult::Ok(payload) => to_json(&WsResponse {
            request_id: req.request_id.clone(),
            kind: "click-element-response".into(),
            status: "ok".into(),
            payload: Some(payload),
            error: None,
        }),
        FlowResult::Err(e) => to_error(req, "click-element", &e),
    }
}

pub fn handle_fill(req: &WsRequest) -> String {
    let sel = req.payload.get("selector").and_then(|v| v.as_str());
    let text = req.payload.get("text").and_then(|v| v.as_str());
    if sel.is_none() || sel.unwrap().trim().is_empty() {
        return to_error(req, "fill-input", "missing selector");
    }
    if text.is_none() {
        return to_error(req, "fill-input", "missing text");
    }
    match provider_for_current_mode().fill(sel.unwrap(), text.unwrap()) {
        FlowResult::Ok(payload) => to_json(&WsResponse {
            request_id: req.request_id.clone(),
            kind: "fill-input-response".into(),
            status: "ok".into(),
            payload: Some(payload),
            error: None,
        }),
        FlowResult::Err(e) => to_error(req, "fill-input", &e),
    }
}

pub fn handle_select(req: &WsRequest) -> String {
    let sel = req.payload.get("selector").and_then(|v| v.as_str());
    let val = req.payload.get("value").and_then(|v| v.as_str());
    if sel.is_none() || sel.unwrap().trim().is_empty() {
        return to_error(req, "select-option", "missing selector");
    }
    if val.is_none() {
        return to_error(req, "select-option", "missing value");
    }
    match provider_for_current_mode().select(sel.unwrap(), val.unwrap()) {
        FlowResult::Ok(payload) => to_json(&WsResponse {
            request_id: req.request_id.clone(),
            kind: "select-option-response".into(),
            status: "ok".into(),
            payload: Some(payload),
            error: None,
        }),
        FlowResult::Err(e) => to_error(req, "select-option", &e),
    }
}

pub fn handle_submit(req: &WsRequest) -> String {
    let sel = req.payload.get("selector").and_then(|v| v.as_str());
    if sel.is_none() || sel.unwrap().trim().is_empty() {
        return to_error(req, "submit-form", "missing selector");
    }
    match provider_for_current_mode().submit(sel.unwrap()) {
        FlowResult::Ok(payload) => to_json(&WsResponse {
            request_id: req.request_id.clone(),
            kind: "submit-form-response".into(),
            status: "ok".into(),
            payload: Some(payload),
            error: None,
        }),
        FlowResult::Err(e) => to_error(req, "submit-form", &e),
    }
}

pub fn handle_save_screenshot(req: &WsRequest) -> String {
    let dir = req.payload.get("dir").and_then(|v| v.as_str());
    let title = req.payload.get("title").and_then(|v| v.as_str());
    let data = req.payload.get("data").and_then(|v| v.as_str());
    let max = 50 * 1024 * 1024usize;
    let dir_path = dir.map(PathBuf::from).unwrap_or_else(|| {
        if let Ok(p) = std::env::var("WEBAI_SCREENSHOT_DIR") {
            return PathBuf::from(p);
        }
        if let Ok(p) = std::env::var("WEBAI_DATA_DIR") {
            return PathBuf::from(p);
        }
        let ts = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();
        std::env::temp_dir().join(format!("mcp-screenshots-{}", ts))
    });
    if data.is_none() {
        return to_error(req, "save-screenshot", "missing data");
    }
    match save_screenshot_base64(&dir_path, title, data.unwrap(), max) {
        Ok(path) => {
            let payload = serde_json::json!({"path": path.to_string_lossy()});
            to_json(&WsResponse {
                request_id: req.request_id.clone(),
                kind: "save-screenshot-response".into(),
                status: "ok".into(),
                payload: Some(payload),
                error: None,
            })
        }
        Err(e) => to_error(req, "save-screenshot", &e.to_string()),
    }
}

fn to_error(req: &WsRequest, base: &str, msg: &str) -> String {
    to_json(&WsResponse {
        request_id: req.request_id.clone(),
        kind: format!("{}-error", base),
        status: "error".into(),
        payload: None,
        error: Some(msg.into()),
    })
}

fn to_json(resp: &WsResponse) -> String {
    serde_json::to_string(resp).unwrap_or_else(|_| "{}".into())
}
