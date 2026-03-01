use crate::state::AppState;
use axum::body::Body;
use axum::http::{header, StatusCode};
use axum::middleware::Next;
use axum::response::Response;
use axum::Json;
use serde_json::json;
use std::sync::Arc;
use webai_core::{ConsoleEntry, Identity, NetworkRequest, SelectedElement, Truncatable};

pub async fn identity(state: axum::extract::State<Arc<AppState>>) -> Json<Identity> {
    let uptime = state.start.elapsed().as_secs_f64();
    let ident = Identity {
        port: state.port,
        name: state.name.to_string(),
        version: state.version.to_string(),
        signature: "mcp-browser-connector-24x7".into(),
        uptime,
        node_version: "rust".into(),
        platform: std::env::consts::OS.into(),
        arch: std::env::consts::ARCH.into(),
    };
    Json(ident)
}

pub async fn port_num(state: axum::extract::State<Arc<AppState>>) -> String {
    state.port.to_string()
}

pub async fn console_logs(state: axum::extract::State<Arc<AppState>>) -> Json<Vec<ConsoleEntry>> {
    let logs = state
        .console_logs
        .lock()
        .await
        .to_truncated_vec(state.string_limit, state.query_limit);
    Json(logs)
}

pub async fn console_errors(state: axum::extract::State<Arc<AppState>>) -> Json<Vec<ConsoleEntry>> {
    let logs = state
        .console_errors
        .lock()
        .await
        .to_truncated_vec(state.string_limit, state.query_limit);
    Json(logs)
}

pub async fn network_errors(
    state: axum::extract::State<Arc<AppState>>,
) -> Json<Vec<NetworkRequest>> {
    let logs = state
        .network_errors
        .lock()
        .await
        .to_truncated_vec(state.string_limit, state.query_limit);
    Json(logs)
}

pub async fn network_success(
    state: axum::extract::State<Arc<AppState>>,
) -> Json<Vec<NetworkRequest>> {
    let logs = state
        .network_success
        .lock()
        .await
        .to_truncated_vec(state.string_limit, state.query_limit);
    Json(logs)
}

pub async fn all_xhr(state: axum::extract::State<Arc<AppState>>) -> Json<Vec<NetworkRequest>> {
    let mut merged = state.network_success.lock().await.to_vec();
    merged.extend(state.network_errors.lock().await.to_vec());
    merged.sort_by_key(|r| r.timestamp.unwrap_or(0));
    let mut out = Vec::new();
    let mut size = 0usize;
    for item in merged.into_iter() {
        let t = item.truncate_strings(state.string_limit);
        let est = t.estimated_size();
        if size + est > state.query_limit {
            break;
        }
        size += est;
        out.push(t);
    }
    Json(out)
}

#[derive(serde::Deserialize)]
pub struct SelectedElementPayload {
    pub data: SelectedElement,
}

#[derive(serde::Serialize)]
pub struct StatusOk {
    pub status: &'static str,
}

pub async fn set_selected_element(
    state: axum::extract::State<Arc<AppState>>,
    Json(payload): Json<SelectedElementPayload>,
) -> Json<StatusOk> {
    let mut guard = state.selected_element.lock().await;
    *guard = Some(payload.data);
    Json(StatusOk { status: "ok" })
}

#[derive(serde::Serialize)]
#[serde(untagged)]
pub enum SelectedElementResponse {
    Element(SelectedElement),
    Message { message: &'static str },
}

pub async fn get_selected_element(
    state: axum::extract::State<Arc<AppState>>,
) -> Json<SelectedElementResponse> {
    let guard = state.selected_element.lock().await;
    if let Some(el) = guard.clone() {
        Json(SelectedElementResponse::Element(el))
    } else {
        Json(SelectedElementResponse::Message {
            message: "No element selected",
        })
    }
}

#[derive(serde::Serialize)]
pub struct WipeResponse {
    pub status: &'static str,
    pub message: &'static str,
}

pub async fn wipe_logs(state: axum::extract::State<Arc<AppState>>) -> Json<WipeResponse> {
    if let Ok(mut g) = state.console_logs.try_lock() {
        g.clear();
    }
    if let Ok(mut g) = state.console_errors.try_lock() {
        g.clear();
    }
    if let Ok(mut g) = state.network_errors.try_lock() {
        g.clear();
    }
    if let Ok(mut g) = state.network_success.try_lock() {
        g.clear();
    }
    let mut sel = state.selected_element.lock().await;
    *sel = None;
    Json(WipeResponse {
        status: "ok",
        message: "All logs cleared successfully",
    })
}

#[derive(serde::Deserialize)]
pub struct CurrentUrlPayload {
    pub url: Option<String>,
    #[serde(default)]
    #[serde(rename = "tabId")]
    pub tab_id: Option<serde_json::Value>,
}

pub async fn set_current_url(
    state: axum::extract::State<Arc<AppState>>,
    Json(payload): Json<CurrentUrlPayload>,
) -> (StatusCode, Json<serde_json::Value>) {
    if let Some(new_url) = payload.url {
        let mut guard = state.current_url.lock().await;
        let prev = std::mem::take(&mut *guard);
        let updated = prev != new_url;
        *guard = new_url.clone();
        let resp = json!({ "status": "ok", "url": new_url, "tabId": payload.tab_id, "previousUrl": prev, "updated": updated });
        (StatusCode::OK, Json(resp))
    } else {
        let resp = json!({ "status": "error", "message": "No URL provided" });
        (StatusCode::BAD_REQUEST, Json(resp))
    }
}

#[derive(serde::Serialize)]
pub struct CurrentUrlGetResponse {
    pub url: String,
}

pub async fn get_current_url(
    state: axum::extract::State<Arc<AppState>>,
) -> Json<CurrentUrlGetResponse> {
    let url = state.current_url.lock().await.clone();
    Json(CurrentUrlGetResponse { url })
}

pub async fn cors_middleware(req: axum::http::Request<Body>, next: Next) -> Response {
    let mut res = next.run(req).await;
    let headers = res.headers_mut();
    headers.insert(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*".parse().unwrap());
    headers.insert(header::ACCESS_CONTROL_ALLOW_HEADERS, "*".parse().unwrap());
    headers.insert(
        header::ACCESS_CONTROL_ALLOW_METHODS,
        "GET,POST,OPTIONS".parse().unwrap(),
    );
    headers.insert(header::ACCESS_CONTROL_MAX_AGE, "86400".parse().unwrap());
    res
}

pub async fn cors_preflight() -> Response {
    Response::builder()
        .status(StatusCode::NO_CONTENT)
        .header(header::ACCESS_CONTROL_ALLOW_ORIGIN, "*")
        .header(header::ACCESS_CONTROL_ALLOW_HEADERS, "*")
        .header(header::ACCESS_CONTROL_ALLOW_METHODS, "GET,POST,OPTIONS")
        .header(header::ACCESS_CONTROL_MAX_AGE, "86400")
        .body(Body::empty())
        .unwrap()
}

// Cookies and storage handlers (WS not yet wired) — return 503 like legacy when no clients.
pub async fn cookies_unavailable() -> (StatusCode, Json<serde_json::Value>) {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({"error": "No clients connected"})),
    )
}

pub async fn local_storage_unavailable() -> (StatusCode, Json<serde_json::Value>) {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({"error": "No clients connected"})),
    )
}

pub async fn session_storage_unavailable() -> (StatusCode, Json<serde_json::Value>) {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({"error": "No clients connected"})),
    )
}
