use std::net::{SocketAddr, TcpStream, ToSocketAddrs};
use std::time::Duration;

use serde_json::{json, Value};

#[tokio::main(flavor = "multi_thread")]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let args = std::env::args().skip(1).collect::<Vec<_>>();
    let cmd = args.first().map(|s| s.as_str()).unwrap_or("server");
    if cmd == "--version" || cmd == "-V" {
        println!("{}", env!("CARGO_PKG_VERSION"));
        return Ok(());
    }
    match cmd {
        "server" => {
            let opts = parse_opts(&args[1..]);
            run_server(opts).await?
        }
        "mcp" => {
            if args.get(1).map(|s| s.as_str()) == Some("identity") {
                print_mcp_identity();
                return Ok(());
            }
            if args.get(1).map(|s| s.as_str()) == Some("rpc") {
                match args.get(2).map(String::as_str) {
                    Some("initialize") => {
                        if let Some(id) = args.get(3) {
                            let v = webai_mcp::initialize_jsonrpc(parse_jsonrpc_id(id));
                            println!("{}", v);
                            return Ok(());
                        }
                        eprintln!("Usage: webai mcp rpc initialize <id>");
                        std::process::exit(2);
                    }
                    Some("call") => {
                        let tool = args.get(3);
                        let id = args.get(4);
                        let payload =
                            match parse_optional_json_payload(args.get(5).map(String::as_str)) {
                                Ok(payload) => payload,
                                Err(err) => {
                                    eprintln!("Invalid payload: {err}");
                                    eprintln!(
                                        "Usage: webai mcp rpc call <tool> <id> [payload-json]"
                                    );
                                    std::process::exit(2);
                                }
                            };
                        if let (Some(tool), Some(id)) = (tool, id) {
                            let v =
                                webai_mcp::call_tool_jsonrpc(tool, parse_jsonrpc_id(id), payload);
                            println!("{}", v);
                            return Ok(());
                        }
                        eprintln!("Usage: webai mcp rpc call <tool> <id> [payload-json]");
                        std::process::exit(2);
                    }
                    _ => {
                        eprintln!("Usage: webai mcp rpc initialize <id> | call <tool> <id> [payload-json]");
                        std::process::exit(2);
                    }
                }
            }
            if args[1..]
                .iter()
                .any(|a| a == "--list-tools" || a == "-l" || a == "list")
            {
                print_tool_list();
                return Ok(());
            }
            if args.get(1).map(|s| s.as_str()) == Some("list-json") {
                let v = webai_mcp::list_tools_json();
                println!("{}", v);
                return Ok(());
            }
            if args.get(1).map(|s| s.as_str()) == Some("init") {
                let v = webai_mcp::initialize_json();
                println!("{}", v);
                return Ok(());
            }
            if args.get(1).map(|s| s.as_str()) == Some("call") {
                if let Some(tool) = args.get(2) {
                    print_mcp_call_result(tool);
                    return Ok(());
                } else {
                    eprintln!("Usage: webai mcp call <tool-name>");
                    std::process::exit(2);
                }
            }
            run_mcp().await?
        }
        "tools" => {
            print_tool_list();
        }
        "capabilities" => {
            print_capabilities();
        }
        "identity" => {
            print_mcp_identity();
        }
        "health" => {
            let opts = parse_opts(&args[1..]);
            print_health(&opts);
        }
        "all" => {
            let opts = parse_opts(&args[1..]);
            run_all(opts).await?
        }
        "help" | "-h" | "--help" => print_help(),
        _ => print_help(),
    }
    Ok(())
}

fn print_help() {
    eprintln!(
        "webai <cmd>\n\
         \n\
        Commands:\n\
          server        Run HTTP/WS server (default)\n\
          mcp           Run MCP stdio server\n\
          all           Run server and MCP together\n\
          identity      Print MCP identity JSON\n\
          health        Check server reachability (host/port)\n\
          tools         Print available MCP tools\n\
          capabilities  Print server capability payload\n\
          help          Show this help\n\
          --version     Print version\n\
         \n\
         MCP subcommands:\n\
          webai mcp rpc initialize <id>\n\
          webai mcp rpc call <tool> <id> [payload-json]\n\
          webai mcp --list-tools | webai mcp list\n\
          webai mcp list-json\n\
          webai mcp init\n\
          webai mcp call <tool>\n\
         \n\
         Env:\n\
          HOST          Bind host (default 127.0.0.1)\n\
          PORT          Bind port (default 3025)\n\
          WEBAI_BROWSER_PROVIDER = legacy|rust\n\
          WEBAI_WS_MAX_INFLIGHT  = number\n\
         \n\
         Flags (CLI > ENV):\n\
           --host <host>\n\
           --port <port>\n\
           --provider <legacy|rust> | --legacy\n\
           --ws-max-inflight <number>\n\
           --string-limit <number>\n\
           --query-limit <number>\n\
           --screenshot-dir <path>\n\
           --data-dir <path>\n\
           --log-json\n\
           --log-level <trace|debug|info|warn|error>\n\
        "
    );
}

#[derive(Default, Debug, Clone)]
struct Opts {
    host: Option<String>,
    port: Option<u16>,
    provider: Option<String>,
    ws_max_inflight: Option<usize>,
    string_limit: Option<usize>,
    query_limit: Option<usize>,
    screenshot_dir: Option<String>,
    data_dir: Option<String>,
    log_json: bool,
    log_level: Option<String>,
}

fn parse_opts(args: &[String]) -> Opts {
    let mut o = Opts::default();
    let mut i = 0usize;
    while i < args.len() {
        match args[i].as_str() {
            "--host" if i + 1 < args.len() => {
                o.host = Some(args[i + 1].clone());
                i += 1;
            }
            "--port" | "-p" if i + 1 < args.len() => {
                if let Ok(p) = args[i + 1].parse::<u16>() {
                    o.port = Some(p);
                }
                i += 1;
            }
            "--provider" if i + 1 < args.len() => {
                o.provider = Some(args[i + 1].clone());
                i += 1;
            }
            "--legacy" => {
                o.provider = Some("legacy".into());
            }
            "--ws-max-inflight" if i + 1 < args.len() => {
                if let Ok(n) = args[i + 1].parse::<usize>() {
                    o.ws_max_inflight = Some(n);
                }
                i += 1;
            }
            "--string-limit" if i + 1 < args.len() => {
                if let Ok(n) = args[i + 1].parse::<usize>() {
                    o.string_limit = Some(n);
                }
                i += 1;
            }
            "--query-limit" if i + 1 < args.len() => {
                if let Ok(n) = args[i + 1].parse::<usize>() {
                    o.query_limit = Some(n);
                }
                i += 1;
            }
            "--screenshot-dir" if i + 1 < args.len() => {
                o.screenshot_dir = Some(args[i + 1].clone());
                i += 1;
            }
            "--data-dir" if i + 1 < args.len() => {
                o.data_dir = Some(args[i + 1].clone());
                i += 1;
            }
            "--log-json" => {
                o.log_json = true;
            }
            "--log-level" if i + 1 < args.len() => {
                o.log_level = Some(args[i + 1].clone());
                i += 1;
            }
            _ => {}
        }
        i += 1;
    }
    o
}

fn resolve_host_port(opts: &Opts) -> (String, u16) {
    let host = opts
        .host
        .clone()
        .or_else(|| std::env::var("HOST").ok())
        .unwrap_or_else(|| "127.0.0.1".to_string());
    let port = opts
        .port
        .or_else(|| std::env::var("PORT").ok().and_then(|v| v.parse().ok()))
        .unwrap_or(3025);
    (host, port)
}

async fn run_server(opts: Opts) -> Result<(), Box<dyn std::error::Error>> {
    use webai_server::{router_with_port, serve_with_shutdown};
    let (host, port) = resolve_host_port(&opts);
    let router = if let (Some(sl), Some(ql)) = (opts.string_limit, opts.query_limit) {
        let state = webai_server::new_state_with(port, sl, ql);
        webai_server::router_from_state(state)
    } else {
        router_with_port(port)
    };
    let addr: SocketAddr = format!("{}:{}", host, port).parse()?;
    // Set env flags from CLI (provider + inflight) before serving
    apply_browser_mode_env(opts.provider.as_deref());
    if let Some(n) = opts.ws_max_inflight {
        std::env::set_var("WEBAI_WS_MAX_INFLIGHT", n.to_string());
    }
    if let Some(sdir) = opts.string_limit {
        let _ = sdir;
    }
    if let Some(q) = opts.query_limit {
        let _ = q;
    }
    if let Some(dir) = opts.screenshot_dir.as_deref() {
        std::env::set_var("WEBAI_SCREENSHOT_DIR", dir);
    }
    if let Some(dir) = opts.data_dir.as_deref() {
        std::env::set_var("WEBAI_DATA_DIR", dir);
    }
    if let Some(level) = opts.log_level.as_deref() {
        std::env::set_var("WEBAI_LOG_LEVEL", level);
    }
    let mode = webai_server::provider_mode();
    let mode_s = match mode {
        webai_server::ProviderMode::Legacy => "legacy",
        webai_server::ProviderMode::Rust => "rust",
    };
    let ver = env!("CARGO_PKG_VERSION");
    if opts.log_json {
        println!(
            "{{\"event\":\"server.start\",\"version\":\"{}\",\"addr\":\"{}\",\"provider\":\"{}\"}}",
            ver, addr, mode_s
        );
    } else {
        eprintln!(
            "webai v{} server listening on http://{} (provider: {})",
            ver, addr, mode_s
        );
    }
    let shutdown = async move {
        let _ = tokio::signal::ctrl_c().await;
        eprintln!("Shutting down...");
    };
    serve_with_shutdown(router, addr, shutdown).await?;
    Ok(())
}

fn apply_browser_mode_env(provider: Option<&str>) {
    std::env::remove_var("WEBAI_BROWSER_LEGACY");
    if let Some(p) = provider {
        std::env::set_var("WEBAI_BROWSER_PROVIDER", p);
    }
}

async fn run_mcp() -> Result<(), Box<dyn std::error::Error>> {
    match webai_mcp::start_stdio() {
        Ok(()) => Ok(()),
        Err(e) => {
            eprintln!("webai mcp: {}", e);
            // Non-zero exit to indicate failure to start.
            std::process::exit(1)
        }
    }
}

async fn run_all(opts: Opts) -> Result<(), Box<dyn std::error::Error>> {
    let srv = tokio::spawn(async move {
        let _ = run_server(opts).await;
    });
    if let Err(e) = webai_mcp::start_stdio() {
        eprintln!("webai all (mcp): {}", e);
    }
    // Wait for server task (Ctrl+C will stop it)
    let _ = srv.await;
    Ok(())
}

fn print_tool_list() {
    let tools = webai_mcp::list_tools();
    for t in tools {
        println!("{} - {}", t.name, t.description);
    }
}

fn print_mcp_identity() {
    let id = webai_mcp::mcp_identity();
    // Print as JSON without adding new deps
    println!(
        "{{\"name\":\"{}\",\"version\":\"{}\",\"signature\":\"{}\",\"platform\":\"{}\",\"arch\":\"{}\"}}",
        id.name, id.version, id.signature, id.platform, id.arch
    );
}

fn parse_health_output(host: &str, port: u16, health_ok: bool) -> Value {
    let mode = match webai_server::provider_mode() {
        webai_server::ProviderMode::Legacy => "legacy",
        webai_server::ProviderMode::Rust => "rust",
    };
    json!({
        "status": if health_ok { "ok" } else { "unhealthy" },
        "provider": mode,
        "version": env!("CARGO_PKG_VERSION"),
        "host": host,
        "port": port,
    })
}

fn print_health(opts: &Opts) {
    let (host, port) = resolve_host_port(opts);
    let mut addresses = format!("{host}:{port}").to_socket_addrs().ok();
    let mut health_ok = false;
    if let Some(addrs) = addresses.as_mut() {
        health_ok = addrs
            .find_map(|addr| {
                TcpStream::connect_timeout(&addr, Duration::from_millis(500))
                    .ok()
                    .map(|_| ())
            })
            .is_some();
    }
    if opts.log_json {
        println!("{}", parse_health_output(&host, port, health_ok));
    } else if health_ok {
        println!("webai service healthy on {host}:{port}");
    } else {
        println!("webai service unhealthy on {host}:{port}");
    }
    if !health_ok {
        std::process::exit(1);
    }
}

fn print_capabilities() {
    let caps = webai_server::build_capabilities();
    println!("{}", caps);
}

fn print_mcp_call_result(tool: &str) {
    match webai_mcp::call_tool(tool, None) {
        Ok(v) => println!("{}", v),
        Err(e) => eprintln!("webai mcp call {}: {}", tool, e),
    }
}

fn parse_jsonrpc_id(raw: &str) -> Value {
    serde_json::from_str(raw).unwrap_or_else(|_| Value::String(raw.to_string()))
}

fn parse_optional_json_payload(raw: Option<&str>) -> Result<Option<Value>, String> {
    match raw {
        None => Ok(None),
        Some(raw) => serde_json::from_str(raw)
            .map(Some)
            .map_err(|e| e.to_string()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_flags_host_port() {
        let args = vec![
            "--host".into(),
            "0.0.0.0".into(),
            "--port".into(),
            "8080".into(),
        ];
        let o = parse_opts(&args);
        assert_eq!(o.host.as_deref(), Some("0.0.0.0"));
        assert_eq!(o.port, Some(8080));
    }

    #[test]
    fn parse_provider_and_inflight() {
        let args = vec![
            "--provider".into(),
            "rust".into(),
            "--ws-max-inflight".into(),
            "32".into(),
            "--string-limit".into(),
            "111".into(),
            "--query-limit".into(),
            "222".into(),
            "--log-json".into(),
            "--log-level".into(),
            "debug".into(),
        ];
        let o = parse_opts(&args);
        assert_eq!(o.provider.as_deref(), Some("rust"));
        assert_eq!(o.ws_max_inflight, Some(32));
        assert_eq!(o.string_limit, Some(111));
        assert_eq!(o.query_limit, Some(222));
        assert!(o.log_json);
        assert_eq!(o.log_level.as_deref(), Some("debug"));
    }

    #[test]
    fn parse_jsonrpc_id_from_json_and_plain() {
        assert_eq!(parse_jsonrpc_id("42"), json!(42));
        assert_eq!(parse_jsonrpc_id("abc"), json!("abc"));
    }

    #[test]
    fn apply_browser_mode_env_sets_provider_and_clears_legacy() {
        std::env::set_var("WEBAI_BROWSER_LEGACY", "1");
        std::env::remove_var("WEBAI_BROWSER_PROVIDER");

        apply_browser_mode_env(Some("legacy"));

        assert_eq!(
            std::env::var("WEBAI_BROWSER_PROVIDER").ok(),
            Some("legacy".into())
        );
        assert!(std::env::var("WEBAI_BROWSER_LEGACY").is_err());
    }

    #[test]
    fn parse_optional_json_payload_accepts_valid_json_and_missing() {
        assert!(parse_optional_json_payload(None).is_ok());
        assert_eq!(
            parse_optional_json_payload(Some(r#"{"foo": "bar"}"#)).unwrap(),
            Some(json!({"foo": "bar"}))
        );
    }

    #[test]
    fn parse_optional_json_payload_rejects_invalid_json() {
        assert!(parse_optional_json_payload(Some("not json")).is_err());
    }
}
