use axum::http::StatusCode;
use axum::Json;

fn audit_unavailable_json(path: &str) -> serde_json::Value {
    let reason = if cfg!(feature = "audit-lighthouse") {
        "lighthouse feature is enabled but no browser audit provider is currently configured"
    } else {
        "build does not include the 'audit-lighthouse' feature"
    };
    serde_json::json!({
        "status": "error",
        "status_code": 503,
        "code": "WEBAI_AUDIT_UNAVAILABLE",
        "error": "audit endpoint unavailable",
        "reason": reason,
        "requires_client": false,
        "path": path,
        "feature": "audit-lighthouse",
        "feature_enabled": cfg!(feature = "audit-lighthouse")
    })
}

pub async fn accessibility() -> (StatusCode, Json<serde_json::Value>) {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(audit_unavailable_json("/accessibility-audit")),
    )
}

pub async fn performance() -> (StatusCode, Json<serde_json::Value>) {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(audit_unavailable_json("/performance-audit")),
    )
}

pub async fn seo() -> (StatusCode, Json<serde_json::Value>) {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(audit_unavailable_json("/seo-audit")),
    )
}

pub async fn best_practices() -> (StatusCode, Json<serde_json::Value>) {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(audit_unavailable_json("/best-practices-audit")),
    )
}
