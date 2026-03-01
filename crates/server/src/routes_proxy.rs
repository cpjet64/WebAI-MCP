use axum::http::StatusCode;
use axum::Json;
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::proxy::{build_reqwest_client_for, EnvProxySettings};
use crate::state::AppState;

#[derive(Debug, Deserialize)]
pub struct TestConnectivityReq {
    pub url: String,
    #[serde(rename = "timeoutMs")]
    pub timeout_ms: Option<u64>,
}

#[derive(Debug, Serialize)]
pub struct TestConnectivityResp {
    pub ok: bool,
    pub status: Option<u16>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

pub async fn test_connectivity(
    _state: axum::extract::State<Arc<AppState>>,
    Json(req): Json<TestConnectivityReq>,
) -> (StatusCode, Json<TestConnectivityResp>) {
    let timeout = std::time::Duration::from_millis(req.timeout_ms.unwrap_or(5_000));
    let env = EnvProxySettings::from_env();
    let client = match build_reqwest_client_for(&req.url, &env, timeout) {
        Ok(c) => c,
        Err(e) => {
            return (
                StatusCode::BAD_REQUEST,
                Json(TestConnectivityResp {
                    ok: false,
                    status: None,
                    error: Some(e.to_string()),
                }),
            )
        }
    };

    match client.get(&req.url).send().await {
        Ok(resp) => {
            let code = resp.status();
            let ok = code.is_success() || (code.as_u16() >= 200 && code.as_u16() < 400);
            (
                StatusCode::OK,
                Json(TestConnectivityResp {
                    ok,
                    status: Some(code.as_u16()),
                    error: None,
                }),
            )
        }
        Err(e) => (
            StatusCode::OK,
            Json(TestConnectivityResp {
                ok: false,
                status: None,
                error: Some(e.to_string()),
            }),
        ),
    }
}
