//! Server crate skeleton for WebAI-MCP.
//! Axum-based server implementing HTTP API parity.

use axum::error_handling::HandleErrorLayer;
use axum::extract::DefaultBodyLimit;
use axum::http::StatusCode;
use axum::middleware;
use axum::{
    routing::{get, post},
    Router,
};
use serde_json::json;
use std::future::Future;
use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Duration;
use tower::BoxError;
use tower::ServiceBuilder;

mod browser_detect;
mod os_paste;
mod proxy;
mod routes;
mod routes_proxy;
mod routes_ws;
mod state;
mod storage;
mod user_data_dir;
mod ws_handlers;
pub mod ws_schema;
pub use ws_handlers::process_text_message;
mod routes_caps;
pub use routes_caps::build_capabilities;
mod audit;
mod browser_provider;
mod flow_adapter;

pub use browser_detect::*;
pub use browser_detect::{NullReg, RegProbe};
pub use browser_provider::*;
pub use os_paste::*;
pub use proxy::*;
use routes as r;
use routes_proxy as rp;
pub use state::new_state;
pub use state::new_state_with;
pub use state::AppState;
pub use storage::*;
pub use user_data_dir::*;

/// Build a minimal router for smoke tests.
pub fn router() -> Router {
    router_with_port(0)
}

/// Build a router bound to a specific port (for identity).
pub fn router_with_port(port: u16) -> Router {
    let state = new_state(port);
    Router::new()
        .route("/__ping", get(|| async { "ok" }))
        .route("/.port", get(r::port_num))
        .route("/.identity", get(r::identity))
        .route("/console-logs", get(r::console_logs))
        .route("/console-errors", get(r::console_errors))
        .route("/network-errors", get(r::network_errors))
        .route("/network-success", get(r::network_success))
        .route("/all-xhr", get(r::all_xhr))
        .route("/cookies", get(r::cookies_unavailable))
        .route("/local-storage", get(r::local_storage_unavailable))
        .route("/session-storage", get(r::session_storage_unavailable))
        .route("/selected-element", post(r::set_selected_element))
        .route("/selected-element", get(r::get_selected_element))
        .route("/wipelogs", post(r::wipe_logs))
        .route("/current-url", post(r::set_current_url))
        .route("/current-url", get(r::get_current_url))
        .route("/test-connectivity", post(rp::test_connectivity))
        .route("/capabilities", get(routes_caps::capabilities))
        .route("/extension-ws", get(routes_ws::extension_ws))
        // Audit endpoints (stubbed under feature gate)
        .route("/accessibility-audit", post(audit::accessibility))
        .route("/performance-audit", post(audit::performance))
        .route("/seo-audit", post(audit::seo))
        .route("/best-practices-audit", post(audit::best_practices))
        .route("/*rest", axum::routing::options(r::cors_preflight))
        .layer(
            ServiceBuilder::new()
                .layer(middleware::from_fn(r::cors_middleware))
                .layer(HandleErrorLayer::new(|err: BoxError| async move {
                    if err.is::<tower::timeout::error::Elapsed>() {
                        (
                            StatusCode::REQUEST_TIMEOUT,
                            axum::Json(json!({ "error": "timeout" })),
                        )
                    } else {
                        (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            axum::Json(json!({ "error": "internal" })),
                        )
                    }
                }))
                .layer(tower::timeout::TimeoutLayer::new(Duration::from_secs(30)))
                .layer(DefaultBodyLimit::max(50 * 1024 * 1024)),
        )
        .with_state(Arc::new(state))
}

/// Build a router from a preconfigured state (testing/helper use).
pub fn router_from_state(state: AppState) -> Router {
    Router::new()
        .route("/__ping", get(|| async { "ok" }))
        .route("/.port", get(r::port_num))
        .route("/.identity", get(r::identity))
        .route("/console-logs", get(r::console_logs))
        .route("/console-errors", get(r::console_errors))
        .route("/network-errors", get(r::network_errors))
        .route("/network-success", get(r::network_success))
        .route("/all-xhr", get(r::all_xhr))
        .route("/cookies", get(r::cookies_unavailable))
        .route("/local-storage", get(r::local_storage_unavailable))
        .route("/session-storage", get(r::session_storage_unavailable))
        .route("/selected-element", post(r::set_selected_element))
        .route("/selected-element", get(r::get_selected_element))
        .route("/wipelogs", post(r::wipe_logs))
        .route("/current-url", post(r::set_current_url))
        .route("/current-url", get(r::get_current_url))
        .route("/test-connectivity", post(rp::test_connectivity))
        .route("/capabilities", get(routes_caps::capabilities))
        .route("/extension-ws", get(routes_ws::extension_ws))
        // Audit endpoints (stubbed under feature gate)
        .route("/accessibility-audit", post(audit::accessibility))
        .route("/performance-audit", post(audit::performance))
        .route("/seo-audit", post(audit::seo))
        .route("/best-practices-audit", post(audit::best_practices))
        .route("/*rest", axum::routing::options(r::cors_preflight))
        .layer(
            ServiceBuilder::new()
                .layer(middleware::from_fn(r::cors_middleware))
                .layer(HandleErrorLayer::new(|err: BoxError| async move {
                    if err.is::<tower::timeout::error::Elapsed>() {
                        (
                            StatusCode::REQUEST_TIMEOUT,
                            axum::Json(json!({ "error": "timeout" })),
                        )
                    } else {
                        (
                            StatusCode::INTERNAL_SERVER_ERROR,
                            axum::Json(json!({ "error": "internal" })),
                        )
                    }
                }))
                .layer(tower::timeout::TimeoutLayer::new(Duration::from_secs(30)))
                .layer(DefaultBodyLimit::max(50 * 1024 * 1024)),
        )
        .with_state(Arc::new(state))
}

/// Serve the router on `addr` with graceful shutdown.
/// Warns if binding to non-loopback addresses.
pub async fn serve_with_shutdown<F>(
    router: Router,
    addr: SocketAddr,
    shutdown: F,
) -> std::io::Result<()>
where
    F: Future<Output = ()> + Send + 'static,
{
    let listener = tokio::net::TcpListener::bind(addr).await?;
    let bound = listener.local_addr()?;
    if !bound.ip().is_loopback() {
        eprintln!(
            "Warning: binding to non-loopback address {}; prefer 127.0.0.1",
            bound
        );
    }
    axum::serve(listener, router)
        .with_graceful_shutdown(shutdown)
        .await
        .map_err(std::io::Error::other)
}
