use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct WsRequest {
    #[serde(rename = "requestId")]
    #[serde(default)]
    pub request_id: Option<String>,
    #[serde(rename = "type")]
    pub kind: String,
    #[serde(default)]
    pub payload: serde_json::Value,
}

impl WsRequest {
    pub fn request_id_or_empty(&self) -> String {
        self.request_id.clone().unwrap_or_default()
    }
}

#[derive(Debug, Serialize, Default)]
pub struct WsResponse {
    #[serde(rename = "requestId")]
    pub request_id: String,
    #[serde(rename = "type")]
    pub kind: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub payload: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

/// Process an incoming WS text message and build a response envelope.
/// Supports simple `ping`, `heartbeat`, and compatibility error responses.
pub fn process_ws_text(msg: &str) -> String {
    let parsed: Result<WsRequest, _> = serde_json::from_str(msg);
    match parsed {
        Ok(req) => {
            if req.kind == "ping" {
                let resp = WsResponse {
                    request_id: req.request_id_or_empty(),
                    kind: "ping-response".into(),
                    status: "ok".into(),
                    payload: Some(req.payload),
                    error: None,
                };
                serde_json::to_string(&resp).unwrap_or_else(|_| "{\"error\":\"encode\"}".into())
            } else if req.kind == "heartbeat" {
                let resp = WsResponse {
                    request_id: req.request_id_or_empty(),
                    kind: "heartbeat-response".into(),
                    status: "ok".into(),
                    payload: Some(serde_json::json!({})),
                    error: None,
                };
                serde_json::to_string(&resp).unwrap_or_else(|_| "{\"error\":\"encode\"}".into())
            } else {
                let resp = WsResponse {
                    request_id: req.request_id_or_empty(),
                    kind: format!("{}-error", req.kind),
                    status: "error".into(),
                    payload: None,
                    error: Some("not-implemented".into()),
                };
                serde_json::to_string(&resp).unwrap_or_else(|_| "{\"error\":\"encode\"}".into())
            }
        }
        Err(e) => {
            let resp = WsResponse {
                request_id: "".into(),
                kind: "parse-error".into(),
                status: "error".into(),
                payload: None,
                error: Some(e.to_string()),
            };
            serde_json::to_string(&resp).unwrap_or_else(|_| "{\"error\":\"encode\"}".into())
        }
    }
}
