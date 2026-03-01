//! MCP server crate skeleton for WebAI-MCP.
//! rmcp integration is feature-gated and added later.

use serde_json::{json, Value};
use webai_core::{CoreError, CoreResult, Identity};

mod server;
mod tools;
pub use server::start_stdio;
pub use tools::{list_tools, Tool};

/// Placeholder to prove the crate links and builds.
pub fn initialized() -> CoreResult<bool> {
    Ok(true)
}

/// Return MCP identity/version info (non-rmcp helper).
pub fn mcp_identity() -> Identity {
    Identity {
        port: 0,
        name: "@cpjet64/webai-mcp".into(),
        version: env!("CARGO_PKG_VERSION").into(),
        signature: "mcp-browser-connector-24x7".into(),
        uptime: 0.0,
        node_version: "rust".into(),
        platform: std::env::consts::OS.into(),
        arch: std::env::consts::ARCH.into(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn initialized_ok() {
        assert!(initialized().unwrap());
    }

    #[test]
    fn stdio_not_enabled() {
        let e = start_stdio().unwrap_err();
        let message = e.to_string();
        assert!(
            message.contains("rmcp not enabled") || message.contains("rmcp integration pending")
        );
    }

    #[test]
    fn identity_contains_name_and_version() {
        let id = mcp_identity();
        assert!(id.name.contains("webai-mcp"));
        assert!(!id.version.is_empty());
        assert_eq!(id.signature, "mcp-browser-connector-24x7");
    }
}

/// Stub call surface until rmcp is integrated.
pub fn call_tool(
    _name: &str,
    _payload: Option<serde_json::Value>,
) -> CoreResult<serde_json::Value> {
    Err(CoreError::new(
        "rmcp not enabled (build with feature 'with-rmcp')",
    ))
}

/// JSON helper for `initialize` response when rmcp is unavailable.
pub fn initialize_json() -> serde_json::Value {
    json!({"error":"rmcp not enabled (build with feature 'with-rmcp')"})
}

/// JSON helper for listing tools as name/description pairs.
pub fn list_tools_json() -> serde_json::Value {
    let items: Vec<_> = list_tools()
        .into_iter()
        .map(|t| json!({"name": t.name, "description": t.description}))
        .collect();
    json!({"tools": items})
}

/// Build a minimal JSON-RPC error envelope.
pub fn jsonrpc_error(id: Option<Value>, code: i64, message: &str) -> Value {
    json!({
        "jsonrpc": "2.0",
        "id": id.unwrap_or(Value::Null),
        "error": { "code": code, "message": message }
    })
}

/// JSON-RPC initialize stub (rmcp unavailable).
pub fn initialize_jsonrpc(id: Value) -> Value {
    jsonrpc_error(
        Some(id),
        -32000,
        "rmcp not enabled (build with feature 'with-rmcp')",
    )
}

/// JSON-RPC call stub for tools (rmcp unavailable).
pub fn call_tool_jsonrpc(name: &str, id: Value) -> Value {
    let _ = name; // keep API for future
    jsonrpc_error(
        Some(id),
        -32601, // Method not found / unavailable
        "rmcp not enabled (build with feature 'with-rmcp')",
    )
}

#[cfg(test)]
mod call_tests {
    use super::*;
    #[test]
    fn call_returns_clear_error() {
        let e = call_tool("getConsoleLogs", None).unwrap_err();
        assert!(e.to_string().contains("rmcp not enabled"));
    }

    #[test]
    fn initialize_json_has_error() {
        let v = initialize_json();
        assert_eq!(
            v["error"].as_str().unwrap(),
            "rmcp not enabled (build with feature 'with-rmcp')"
        );
    }

    #[test]
    fn list_tools_json_contains_names() {
        let v = list_tools_json();
        assert!(v["tools"][0]["name"].is_string());
    }

    #[test]
    fn jsonrpc_error_shape() {
        let v = jsonrpc_error(Some(json!(1)), -32000, "x");
        assert_eq!(v["jsonrpc"], "2.0");
        assert_eq!(v["id"], 1);
        assert_eq!(v["error"]["code"], -32000);
    }

    #[test]
    fn initialize_jsonrpc_has_error() {
        let v = initialize_jsonrpc(json!(null));
        assert_eq!(v["jsonrpc"], "2.0");
        assert!(v["error"]["message"]
            .as_str()
            .unwrap()
            .contains("rmcp not enabled"));
    }

    #[test]
    fn call_tool_jsonrpc_method_unavailable() {
        let v = call_tool_jsonrpc("getConsoleLogs", json!("abc"));
        assert_eq!(v["id"], "abc");
        assert_eq!(v["error"]["code"], -32601);
    }
}
