use crate::{provider_mode, AppState, ProviderMode};
use axum::Json;
use serde_json::{json, Value};
use std::sync::Arc;

pub async fn capabilities(_state: axum::extract::State<Arc<AppState>>) -> Json<serde_json::Value> {
    Json(build_capabilities())
}

/// Build capabilities JSON reflecting current provider mode.
pub fn build_capabilities() -> Value {
    let mode = provider_mode();
    let provider = match mode {
        ProviderMode::Legacy => "legacy",
        ProviderMode::Rust => "rust",
    };
    let requires_client = match mode {
        ProviderMode::Legacy => true,
        ProviderMode::Rust => false,
    };
    json!({
        "websocket": true,
        "provider": provider,
        "flows": {
            "ping": true,
            "saveScreenshot": true,
            "refreshBrowser": true,
            "getHtmlBySelector": {"available": true, "requiresClient": requires_client},
            "clickElement": {"available": true, "requiresClient": requires_client},
            "fillInput": {"available": true, "requiresClient": requires_client},
            "selectOption": {"available": true, "requiresClient": requires_client},
            "submitForm": {"available": true, "requiresClient": requires_client},
            "auditAccessibility": {"available": false, "requiresClient": false},
            "auditPerformance": {"available": false, "requiresClient": false},
            "auditSeo": {"available": false, "requiresClient": false},
            "auditBestPractices": {"available": false, "requiresClient": false}
        }
    })
}
