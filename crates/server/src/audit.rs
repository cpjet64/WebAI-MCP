use axum::http::StatusCode;
use axum::Json;

#[cfg(feature = "audit-lighthouse")]
fn audit_unavailable_json() -> serde_json::Value {
    serde_json::json!({
        "error": "Audit endpoint unavailable",
        "reason": "lighthouse feature is enabled but no browser audit provider is currently configured",
        "requires_client": false
    })
}

#[cfg(not(feature = "audit-lighthouse"))]
fn audit_unavailable_json() -> serde_json::Value {
    serde_json::json!({
        "error": "Audit endpoint unavailable",
        "reason": "build does not include the 'audit-lighthouse' feature",
        "requires_client": false
    })
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
