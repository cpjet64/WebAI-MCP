//! MCP server crate skeleton for WebAI-MCP.
//! rmcp integration is feature-gated and added during migration.

use reqwest::blocking::Client;
use serde_json::{json, Value};
use std::{env, fs, path::PathBuf, time::Duration};
use webai_core::{analyze_error, CoreError, CoreResult, ErrorContext, Identity};

mod server;
mod tools;
pub use server::start_stdio;
pub use tools::{list_tools, Tool, ToolKind};

const DEFAULT_HOST: &str = "127.0.0.1";
const DEFAULT_PORT: u16 = 3025;
const REQUEST_TIMEOUT_SECS: u64 = 2;
const MAX_ERROR_TEXT: usize = 260;

#[derive(Debug, Clone, Copy)]
enum HttpMethod {
    Get,
    Post,
}

#[derive(Debug)]
struct ToolRequest {
    path: &'static str,
    method: HttpMethod,
    payload_required: bool,
}

/// Minimal initialization probe used to confirm the crate links and builds in
/// non-rmcp parity mode.
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

pub fn call_tool(name: &str, payload: Option<Value>) -> CoreResult<Value> {
    let kind = ToolKind::from_name(name)
        .ok_or_else(|| CoreError::new(format!("Method not found: {name}")))?;

    let request = request_for_tool(kind);
    if request.payload_required && payload.is_none() {
        return Err(CoreError::new(format!("{name} requires a request payload")));
    }

    let payload = payload.unwrap_or_else(|| json!({}));
    invoke_tool_request(&kind, &request, Some(payload))
}

/// JSON helper for `initialize` response.
pub fn initialize_json() -> Value {
    json!({
        "protocolVersion": "2024-11-05",
        "capabilities": {
            "tools": {
                "listChanged": false
            }
        },
        "serverInfo": {
            "name": "@cpjet64/webai-mcp",
            "version": env!("CARGO_PKG_VERSION"),
            "signature": "mcp-browser-connector-24x7"
        }
    })
}

/// JSON helper for listing tools as name/description/schema.
pub fn list_tools_json() -> Value {
    let items: Vec<_> = list_tools()
        .into_iter()
        .map(|t| {
            json!({
                "name": t.name,
                "description": t.description,
                "inputSchema": t.input_schema
            })
        })
        .collect();
    json!({ "tools": items })
}

/// Build a minimal JSON-RPC error envelope.
pub fn jsonrpc_error(id: Option<Value>, code: i64, message: &str) -> Value {
    json!({
        "jsonrpc": "2.0",
        "id": id.unwrap_or(Value::Null),
        "error": { "code": code, "message": message }
    })
}

fn jsonrpc_success(id: Value, result: Value) -> Value {
    json!({
        "jsonrpc": "2.0",
        "id": id,
        "result": result
    })
}

/// JSON-RPC initialize helper.
pub fn initialize_jsonrpc(id: Value) -> Value {
    jsonrpc_success(id, initialize_json())
}

/// JSON-RPC call helper for tools.
pub fn call_tool_jsonrpc(name: &str, id: Value, params: Option<Value>) -> Value {
    if ToolKind::from_name(name).is_none() {
        return jsonrpc_error(Some(id), -32601, "Method not found");
    }

    let payload = normalize_tool_payload(params);
    match call_tool(name, payload) {
        Ok(v) => jsonrpc_success(id, v),
        Err(e) => jsonrpc_error(Some(id), -32000, &e.to_string()),
    }
}

fn normalize_tool_payload(params: Option<Value>) -> Option<Value> {
    match params {
        None => None,
        Some(Value::Null) => None,
        Some(Value::Array(values)) => values.into_iter().next(),
        Some(other) => Some(other),
    }
}

fn call_request_url(path: &str) -> (String, u16, String) {
    let host = env::var("BROWSER_TOOLS_HOST")
        .unwrap_or_else(|_| env::var("HOST").unwrap_or_else(|_| DEFAULT_HOST.to_string()));
    let port = discover_port().unwrap_or(DEFAULT_PORT);
    let endpoint = format!("http://{host}:{port}{path}");
    (host, port, endpoint)
}

fn discover_port() -> Option<u16> {
    env::var("BROWSER_TOOLS_PORT")
        .ok()
        .and_then(|value| value.parse::<u16>().ok())
        .or_else(|| {
            env::var("PORT")
                .ok()
                .and_then(|value| value.parse::<u16>().ok())
        })
        .or_else(read_port_from_exe_dir)
}

fn read_port_from_exe_dir() -> Option<u16> {
    let exe = env::current_exe().ok()?;
    let path = exe.parent()?;
    let marker = path.join(".port");
    read_port_from_path(marker)
}

fn read_port_from_path(path: PathBuf) -> Option<u16> {
    let raw = fs::read_to_string(path).ok()?;
    raw.trim().parse::<u16>().ok()
}

fn build_client() -> CoreResult<Client> {
    Client::builder()
        .timeout(Duration::from_secs(REQUEST_TIMEOUT_SECS))
        .build()
        .map_err(|err| {
            let context = ErrorContext {
                operation: "build_http_client".into(),
                host: None,
                port: None,
                endpoint: None,
                http_status: None,
                tool: None,
            };
            let analyzed = analyze_error(&err.to_string(), context);
            CoreError::new(analyzed.user_message)
        })
}

fn request_for_tool(kind: ToolKind) -> ToolRequest {
    match kind {
        ToolKind::GetConsoleLogs => ToolRequest {
            path: "/console-logs",
            method: HttpMethod::Get,
            payload_required: false,
        },
        ToolKind::GetConsoleErrors => ToolRequest {
            path: "/console-errors",
            method: HttpMethod::Get,
            payload_required: false,
        },
        ToolKind::GetNetworkErrors => ToolRequest {
            path: "/network-errors",
            method: HttpMethod::Get,
            payload_required: false,
        },
        ToolKind::GetNetworkSuccess => ToolRequest {
            path: "/network-success",
            method: HttpMethod::Get,
            payload_required: false,
        },
        ToolKind::GetAllXhr => ToolRequest {
            path: "/all-xhr",
            method: HttpMethod::Get,
            payload_required: false,
        },
        ToolKind::GetSelectedElement => ToolRequest {
            path: "/selected-element",
            method: HttpMethod::Get,
            payload_required: false,
        },
        ToolKind::SetSelectedElement => ToolRequest {
            path: "/selected-element",
            method: HttpMethod::Post,
            payload_required: true,
        },
        ToolKind::CaptureScreenshot => ToolRequest {
            path: "/capture-screenshot",
            method: HttpMethod::Post,
            payload_required: false,
        },
        ToolKind::GetCookies => ToolRequest {
            path: "/cookies",
            method: HttpMethod::Get,
            payload_required: false,
        },
        ToolKind::GetLocalStorage => ToolRequest {
            path: "/local-storage",
            method: HttpMethod::Get,
            payload_required: false,
        },
        ToolKind::GetSessionStorage => ToolRequest {
            path: "/session-storage",
            method: HttpMethod::Get,
            payload_required: false,
        },
        ToolKind::AuditAccessibility => ToolRequest {
            path: "/accessibility-audit",
            method: HttpMethod::Post,
            payload_required: false,
        },
        ToolKind::AuditPerformance => ToolRequest {
            path: "/performance-audit",
            method: HttpMethod::Post,
            payload_required: false,
        },
        ToolKind::AuditSeo => ToolRequest {
            path: "/seo-audit",
            method: HttpMethod::Post,
            payload_required: false,
        },
        ToolKind::AuditBestPractices => ToolRequest {
            path: "/best-practices-audit",
            method: HttpMethod::Post,
            payload_required: false,
        },
    }
}

fn invoke_tool_request(
    kind: &ToolKind,
    request: &ToolRequest,
    payload: Option<Value>,
) -> CoreResult<Value> {
    let (host, port, url) = call_request_url(request.path);
    let context = ErrorContext {
        operation: format!("call_tool({})", kind.as_str()),
        host: Some(host.clone()),
        port: Some(port),
        endpoint: Some(request.path.to_string()),
        http_status: None,
        tool: Some(kind.as_str().to_string()),
    };

    let client = build_client()?;
    let response = match request.method {
        HttpMethod::Get => client
            .get(&url)
            .send()
            .map_err(|err| mapped_error(&err.to_string(), context.clone())),
        HttpMethod::Post => {
            let body = payload.unwrap_or_else(|| json!({}));
            client
                .post(&url)
                .json(&body)
                .send()
                .map_err(|err| mapped_error(&err.to_string(), context.clone()))
        }
    }?;

    let status = response.status();
    let body = response
        .text()
        .map_err(|err| mapped_error(&err.to_string(), context.clone()))?;
    let parsed = parse_json_body(&body);

    if status.is_success() {
        return Ok(parsed);
    }

    let error_text = extract_error_message(&parsed).unwrap_or_else(|| body_excerpt(&body));
    let http_context = ErrorContext {
        http_status: Some(status.as_u16()),
        ..context
    };
    let analyzed = analyze_error(
        &format!("Server returned {}", status.as_u16()),
        http_context,
    );
    Err(CoreError::new(format!(
        "{error_text} ({} {}{})",
        status,
        analyzed.user_message,
        endpoint_suffix(status.as_u16())
    )))
}

fn parse_json_body(raw: &str) -> Value {
    if raw.trim().is_empty() {
        return json!({"status":"ok"});
    }
    serde_json::from_str(raw).unwrap_or_else(|_| json!({ "raw": raw }))
}

fn endpoint_suffix(code: u16) -> &'static str {
    if code == 503 {
        " - service unavailable"
    } else if code == 404 {
        " - endpoint missing"
    } else {
        ""
    }
}

fn extract_error_message(body: &Value) -> Option<String> {
    if let Some(err) = body.get("error").and_then(Value::as_str) {
        return Some(err.to_string());
    }
    if let Some(err) = body.get("message").and_then(Value::as_str) {
        return Some(err.to_string());
    }
    if let Some(msg) = body.get("status").and_then(Value::as_str) {
        if msg.to_lowercase().contains("error") {
            return Some(msg.to_string());
        }
    }
    None
}

fn mapped_error(message: &str, context: ErrorContext) -> CoreError {
    let analyzed = analyze_error(message, context);
    CoreError::new(analyzed.user_message)
}

fn body_excerpt(raw: &str) -> String {
    let truncated: String = raw.chars().take(MAX_ERROR_TEXT).collect();
    if raw.chars().count() <= MAX_ERROR_TEXT {
        raw.to_string()
    } else {
        format!("{truncated}…")
    }
}

#[cfg(test)]
mod call_tests {
    use super::*;
    use std::sync::{Mutex, OnceLock};

    static ENV_LOCK: OnceLock<Mutex<()>> = OnceLock::new();

    fn with_env_vars(vars: &[(&str, Option<&str>)], test: impl FnOnce()) {
        let lock = ENV_LOCK.get_or_init(|| Mutex::new(()));
        let _guard = lock.lock().unwrap();

        let keys: [&str; 4] = ["BROWSER_TOOLS_HOST", "BROWSER_TOOLS_PORT", "HOST", "PORT"];
        let mut backup = Vec::new();
        for key in &keys {
            backup.push((
                *key,
                env::var_os(key).map(|value| value.to_string_lossy().into_owned()),
            ));
            env::remove_var(key);
        }
        for (key, value) in vars {
            if let Some(v) = value {
                env::set_var(key, v);
            }
        }

        test();

        for (key, value) in backup {
            if let Some(v) = value {
                env::set_var(key, v);
            } else {
                env::remove_var(key);
            }
        }
    }

    #[test]
    fn call_unknown_tool_errors() {
        let e = call_tool("does-not-exist", None).unwrap_err();
        assert!(e.to_string().contains("Method not found"));
    }

    #[test]
    fn call_set_selected_element_requires_payload() {
        let e = call_tool("setSelectedElement", None).unwrap_err();
        assert!(e.to_string().contains("requires a request payload"));
    }

    #[test]
    fn initialize_json_has_protocol() {
        let v = initialize_json();
        assert_eq!(v["protocolVersion"].as_str().unwrap(), "2024-11-05");
        assert_eq!(v["serverInfo"]["name"], "@cpjet64/webai-mcp");
    }

    #[test]
    fn list_tools_json_contains_schemas() {
        let v = list_tools_json();
        let tools = v["tools"].as_array().unwrap();
        assert!(tools.iter().any(|item| item["name"] == "captureScreenshot"));
        let schema = tools
            .iter()
            .find(|item| item["name"] == "captureScreenshot")
            .and_then(|item| item["inputSchema"]["type"].as_str())
            .unwrap();
        assert_eq!(schema, "object");
    }

    #[test]
    fn initialize_jsonrpc_has_result() {
        let v = initialize_jsonrpc(json!(1));
        assert_eq!(v["jsonrpc"], "2.0");
        assert_eq!(v["result"]["serverInfo"]["name"], "@cpjet64/webai-mcp");
        assert_eq!(v["id"], 1);
    }

    #[test]
    fn call_tool_jsonrpc_unknown_method() {
        let v = call_tool_jsonrpc("does-not-exist", json!("abc"), None);
        assert_eq!(v["error"]["code"], -32601);
        assert_eq!(v["id"], "abc");
    }

    #[test]
    fn normalize_jsonrpc_payload_extracts_first_item() {
        let payload = normalize_tool_payload(Some(
            json!([{"data": {"tagName":"div","id":"","className":"","textContent":"","attributes":[]}}, "unused"]),
        ));
        assert!(payload.is_some());
        assert_eq!(payload.unwrap()["data"]["tagName"], "div");
    }

    #[test]
    fn normalize_jsonrpc_payload_drops_null() {
        assert!(normalize_tool_payload(Some(json!(null))).is_none());
    }

    #[test]
    fn jsonrpc_error_shape() {
        let v = jsonrpc_error(Some(json!(1)), -32000, "x");
        assert_eq!(v["jsonrpc"], "2.0");
        assert_eq!(v["id"], 1);
        assert_eq!(v["error"]["code"], -32000);
    }

    #[test]
    fn discover_port_prefers_browser_tools_port() {
        with_env_vars(
            &[("BROWSER_TOOLS_PORT", Some("5001")), ("PORT", Some("4001"))],
            || {
                assert_eq!(discover_port(), Some(5001));
            },
        );
    }

    #[test]
    fn discover_port_falls_back_to_port() {
        with_env_vars(&[("PORT", Some("4002"))], || {
            assert_eq!(discover_port(), Some(4002));
        });
    }

    #[test]
    fn call_request_url_uses_browser_host_and_port() {
        with_env_vars(
            &[
                ("BROWSER_TOOLS_HOST", Some("127.0.0.22")),
                ("BROWSER_TOOLS_PORT", Some("1234")),
            ],
            || {
                let (host, port, endpoint) = call_request_url("/status");
                assert_eq!(host, "127.0.0.22");
                assert_eq!(port, 1234);
                assert_eq!(endpoint, "http://127.0.0.22:1234/status");
            },
        );
    }

    #[test]
    fn call_request_url_falls_back_host_and_port_to_defaults() {
        with_env_vars(
            &[("HOST", Some("host.local")), ("PORT", Some("5555"))],
            || {
                let (host, port, endpoint) = call_request_url("/status");
                assert_eq!(host, "host.local");
                assert_eq!(port, 5555);
                assert_eq!(endpoint, "http://host.local:5555/status");
            },
        );
    }

    #[test]
    fn read_port_from_path_with_valid_value() {
        let path = std::env::temp_dir().join(format!(
            "webai-mcp-test-port-{}-{}",
            std::process::id(),
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_nanos()
        ));
        let write_result = fs::write(&path, "6789");
        assert!(write_result.is_ok(), "failed to write temporary port file");

        let port = read_port_from_path(path.clone());
        assert_eq!(port, Some(6789));

        let _ = fs::remove_file(path);
    }

    #[test]
    fn parse_json_body_uses_default_when_empty() {
        let parsed = parse_json_body("");
        assert_eq!(parsed["status"], "ok");
    }

    #[test]
    fn parse_json_body_falls_back_to_raw_body() {
        let parsed = parse_json_body("not-json");
        assert_eq!(parsed["raw"], "not-json");
    }

    #[test]
    fn body_excerpt_short_text_is_unchanged() {
        assert_eq!(body_excerpt("hello"), "hello");
    }

    #[test]
    fn body_excerpt_truncates_long_text() {
        let long = "a".repeat(MAX_ERROR_TEXT + 40);
        let excerpt = body_excerpt(&long);
        assert!(excerpt.ends_with("…"));
        assert!(excerpt.len() > MAX_ERROR_TEXT);
        assert!(excerpt.len() <= MAX_ERROR_TEXT + 4);
    }

    #[test]
    fn endpoint_suffix_maps_known_status_codes() {
        assert_eq!(endpoint_suffix(503), " - service unavailable");
        assert_eq!(endpoint_suffix(404), " - endpoint missing");
        assert_eq!(endpoint_suffix(201), "");
    }

    #[test]
    fn extract_error_message_reads_first_matching_field() {
        let from_error = json!({"error": "explicit"});
        assert_eq!(extract_error_message(&from_error), Some("explicit".into()));

        let from_message = json!({"message": "message-body"});
        assert_eq!(
            extract_error_message(&from_message),
            Some("message-body".into())
        );

        let from_status = json!({"status": "error: unavailable"});
        assert_eq!(
            extract_error_message(&from_status),
            Some("error: unavailable".into())
        );

        let no_error = json!({"status": "ok"});
        assert!(extract_error_message(&no_error).is_none());
    }

    #[test]
    fn call_tool_jsonrpc_returns_error_for_non_success_http() {
        use std::io::{Read, Write};
        use std::thread;

        let listener = std::net::TcpListener::bind("127.0.0.1:0").unwrap();
        let port = listener.local_addr().unwrap().port();
        let port_text = port.to_string();

        let handle = thread::spawn(move || {
            let (mut stream, _) = listener.accept().unwrap();
            let mut request = [0u8; 1024];
            let _ = stream.read(&mut request);
            let body = b"{\"error\":\"service unavailable\"}";
            let response = format!(
                "HTTP/1.1 503 Service Unavailable\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{}",
                body.len(),
                std::str::from_utf8(body).unwrap()
            );
            let _ = stream.write_all(response.as_bytes());
            stream.flush().unwrap();
        });

        with_env_vars(
            &[
                ("BROWSER_TOOLS_HOST", Some("127.0.0.1")),
                ("BROWSER_TOOLS_PORT", Some(&port_text)),
            ],
            || {
                let response = call_tool_jsonrpc("getConsoleLogs", json!(1), None);
                assert_eq!(response["error"]["code"], -32000);
                let message = response["error"]["message"].as_str().unwrap_or_default();
                assert!(message.contains("service unavailable"));
            },
        );

        handle.join().unwrap();
    }
}
