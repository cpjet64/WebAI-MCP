use axum::http::StatusCode;
use axum::Json;

#[cfg(feature = "audit-lighthouse")]
fn audit_unavailable_json() -> serde_json::Value {
    serde_json::json!({"error": "Audit not available"})
}

#[cfg(not(feature = "audit-lighthouse"))]
fn audit_unavailable_json() -> serde_json::Value {
    serde_json::json!({"error": "Audit feature disabled"})
}

pub async fn accessibility() -> (StatusCode, Json<serde_json::Value>) {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(audit_unavailable_json()),
    )
}

pub async fn performance() -> (StatusCode, Json<serde_json::Value>) {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(audit_unavailable_json()),
    )
}

pub async fn seo() -> (StatusCode, Json<serde_json::Value>) {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(audit_unavailable_json()),
    )
}

pub async fn best_practices() -> (StatusCode, Json<serde_json::Value>) {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(audit_unavailable_json()),
    )
}
