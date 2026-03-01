/// Error categorization and user-facing messages.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorType {
    Connection,
    Server,
    Client,
    Configuration,
    Platform,
    Unknown,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Priority {
    High,
    Medium,
    Low,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ErrorSolution {
    pub title: &'static str,
    pub description: &'static str,
    pub commands: &'static [&'static str],
    pub links: &'static [&'static str],
    pub priority: Priority,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ErrorContext {
    pub operation: String,
    pub host: Option<String>,
    pub port: Option<u16>,
    pub endpoint: Option<String>,
    pub http_status: Option<u16>,
    pub tool: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct EnhancedError {
    pub kind: ErrorType,
    pub message: String,
    pub user_message: String,
    pub solutions: Vec<ErrorSolution>,
    pub is_retryable: bool,
    pub context: ErrorContext,
}

fn contains(hay: &str, needle: &str) -> bool {
    hay.to_lowercase().contains(&needle.to_lowercase())
}

pub fn categorize(msg: &str) -> ErrorType {
    let m = msg;
    if contains(m, "econnrefused")
        || contains(m, "enotfound")
        || contains(m, "timeout")
        || contains(m, "fetch failed")
        || contains(m, "network error")
    {
        return ErrorType::Connection;
    }
    if contains(m, "failed to discover")
        || contains(m, "server not found")
        || contains(m, "wrong signature")
        || contains(m, "server returned 4")
        || contains(m, "server returned 5")
    {
        return ErrorType::Server;
    }
    if contains(m, "spawn enoent")
        || contains(m, "permission denied")
        || contains(m, "eacces")
        || contains(m, "not found")
    {
        return ErrorType::Platform;
    }
    if contains(m, "chrome could not be found")
        || contains(m, "no chrome installations")
        || contains(m, "extension")
        || contains(m, "debugger")
    {
        return ErrorType::Client;
    }
    if contains(m, "build failed")
        || contains(m, "compilation error")
        || contains(m, "cannot find module")
        || contains(m, "module_not_found")
    {
        return ErrorType::Configuration;
    }
    ErrorType::Unknown
}

fn user_message(kind: ErrorType, msg: &str, ctx: &ErrorContext) -> String {
    match kind {
        ErrorType::Connection => {
            if contains(msg, "econnrefused") {
                return format!(
                    "Cannot connect to server at {}:{}.",
                    ctx.host.as_deref().unwrap_or("localhost"),
                    ctx.port.unwrap_or(0)
                );
            }
            if contains(msg, "timeout") {
                return "Connection timed out to the server.".into();
            }
            "Network connection failed to the server.".into()
        }
        ErrorType::Server => {
            if contains(msg, "server not found") {
                return "Server not found. Start it before using tools.".into();
            }
            if contains(msg, "wrong signature") {
                return "Found a server, but not WebAI server.".into();
            }
            "Server returned an error.".into()
        }
        ErrorType::Platform => {
            if contains(msg, "spawn enoent") {
                return "Missing executable (Node/NPM not in PATH?).".into();
            }
            if contains(msg, "permission denied") || contains(msg, "eacces") {
                return "Permission denied; check file permissions.".into();
            }
            "Platform error detected.".into()
        }
        ErrorType::Client => {
            if contains(msg, "chrome could not be found")
                || contains(msg, "no chrome installations")
            {
                return "Chrome not found; install Chrome/Chromium.".into();
            }
            "Browser-related error; check Chrome and extension.".into()
        }
        ErrorType::Configuration => {
            if contains(msg, "build failed") {
                return "Build failed; packages may be unbuilt.".into();
            }
            if contains(msg, "cannot find module") {
                return "Missing dependencies; reinstall packages.".into();
            }
            "Configuration error in setup.".into()
        }
        ErrorType::Unknown => format!("Unexpected error: {}", msg),
    }
}

fn solutions(kind: ErrorType, msg: &str, ctx: &ErrorContext) -> Vec<ErrorSolution> {
    let mut sol = Vec::new();
    match kind {
        ErrorType::Connection => {
            sol.push(ErrorSolution {
                title: "Start WebAI Server",
                description: "Server may not be running.",
                commands: &["npx @cpjet64/webai-server"],
                links: &[],
                priority: Priority::High,
            });
            if let Some(p) = ctx.port {
                if p != 3025 {
                    sol.push(ErrorSolution {
                        title: "Check port",
                        description: "Verify server port is correct.",
                        commands: &[],
                        links: &[],
                        priority: Priority::Medium,
                    });
                }
            }
        }
        ErrorType::Server => {
            sol.push(ErrorSolution {
                title: "Restart server",
                description: "Stop and start fresh.",
                commands: &["pkill -f webai-server", "npx @cpjet64/webai-server"],
                links: &[],
                priority: Priority::High,
            });
        }
        ErrorType::Platform => {
            if contains(msg, "spawn enoent") {
                sol.push(ErrorSolution {
                    title: "Verify Node.js",
                    description: "Check Node/NPM in PATH.",
                    commands: &["node --version", "npm --version", "which node"],
                    links: &["https://nodejs.org/"],
                    priority: Priority::High,
                });
            }
        }
        ErrorType::Client => {
            sol.push(ErrorSolution {
                title: "Install Chrome",
                description: "Chrome/Chromium is required.",
                commands: &[],
                links: &["https://www.google.com/chrome/"],
                priority: Priority::High,
            });
        }
        ErrorType::Configuration | ErrorType::Unknown => {}
    }
    // General help
    sol.push(ErrorSolution {
        title: "Get help",
        description: "See docs or open an issue.",
        commands: &[],
        links: &[
            "https://github.com/cpjet64/webai-mcp/issues",
            "https://github.com/cpjet64/webai-mcp/blob/main/README.md",
        ],
        priority: Priority::Low,
    });
    sol
}

fn retryable(kind: ErrorType, msg: &str) -> bool {
    matches!(kind, ErrorType::Connection)
        || (matches!(kind, ErrorType::Server) && !contains(msg, "wrong signature"))
}

pub fn analyze_error(message: &str, context: ErrorContext) -> EnhancedError {
    let kind = categorize(message);
    let user = user_message(kind, message, &context);
    let sols = solutions(kind, message, &context);
    let retry = retryable(kind, message);
    EnhancedError {
        kind,
        message: message.to_string(),
        user_message: user,
        solutions: sols,
        is_retryable: retry,
        context,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn ctx() -> ErrorContext {
        ErrorContext {
            operation: "op".into(),
            host: Some("127.0.0.1".into()),
            port: Some(3025),
            endpoint: None,
            http_status: None,
            tool: None,
        }
    }

    #[test]
    fn categorizes_connection() {
        let e = analyze_error("connect ECONNREFUSED", ctx());
        assert!(matches!(e.kind, ErrorType::Connection));
        assert!(e.user_message.contains("127.0.0.1"));
    }

    #[test]
    fn categorizes_platform() {
        let e = analyze_error("spawn ENOENT", ctx());
        assert!(matches!(e.kind, ErrorType::Platform));
        assert!(e.solutions.iter().any(|s| s.title.contains("Node")));
    }
}
