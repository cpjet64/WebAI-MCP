<!-- file: rules.md -->
Formatting and size
-------------------
- Max 200 lines per file. Hard limit.
- Max 75 characters per line. Hard wrap text and code.
- Functions must be small. If over ~25 lines, split logically.
- Prefer single responsibility per function and per module.
- Avoid deep nesting. Target ≤2 levels where practical.

Code style
----------
- No unwrap, expect, or panic in non‑test code.
- Use anyhow or a project error type for fallible paths.
- Return early on errors. Keep control flow simple.
- Document public items with brief rustdoc comments (≤2 lines).
- Prefer pure functions; isolate IO at edges.
- Keep names short yet clear; avoid stutter.

Architecture
------------
- Define neutral DTOs in codex‑mcp‑types (serde + schemars).
- Define traits McpClient and McpServer in a small iface module.
- Implement two adapters only:
  - codex‑mcp‑legacy (existing behavior)
  - codex‑mcp‑sdk (official SDK)
- No rmcp::* outside the SDK adapter crate.
- No legacy JSON types outside the legacy adapter crate.

Transports
----------
- SDK client supports:
  - stdio child process
  - Streamable HTTP (preferred)
  - SSE (compatibility only)
- SDK server supports:
  - stdio
  - Streamable HTTP
  - SSE optional; expose only if needed

Precedence
----------
- Resolve once in CLI: CLI > ENV > config > default.
- Do not re‑read env in libs or adapters.

Sanitization
------------
- Single sanitize_tool_name() in codex‑common.
- Clamp to allowed charset and 64 chars with hash suffix.
- SDK macro tool names should not require extra sanitizing.

Capabilities and lifecycle
--------------------------
- Set ServerCapabilities exactly to what is supported.
- Implement progress, cancellation, and logging notifications.
- For HTTP, rely on SDK service for session headers.

Cargo features and versions
---------------------------
- Use minimal features per crate.
- Loosen rmcp to caret version unless pin is justified.
- Separate client/server features by crate.

Testing
-------
- Add transport matrix: legacy‑stdio, sdk‑stdio, sdk‑http.
- Include parity tests for initialize, list, and call.
- Add session header checks for HTTP.
- Add progress and cancel smoke tests.
- Keep tests under file size limits; split when needed.

Security
--------
- Bind HTTP to 127.0.0.1 by default.
- Warn loudly on non‑loopback binds.
- Do not commit secrets. Redact tokens in examples.

MCP tool usage rules
--------------------
- Use github‑official create_or_update_file and push_files only.
- Do not call create_pull_request or create_issue.
- Keep commits small and descriptive.
- Use list_branches to confirm branch exists.
- Use get_file_contents to fetch and diff before edits.

Docs
----
- Update README and CLI help for new flags.
- Add short examples for SDK HTTP client and server.
- Keep examples within size limits.

Failure handling
----------------
- If a task fails, stop. Add a short note in todo.md "Notes".
- Propose a minimal rollback if needed.
