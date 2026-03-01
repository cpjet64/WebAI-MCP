<!-- file: todo.md -->
Rules for AI coding agent
-------------------------
- Execution order: perform tasks strictly top to bottom.
- Gating: do not start a task until the previous task is
  implemented, tested, and verified.
- Every "Implement" task must include adding unit/integration
  tests and running them successfully before proceeding.
- Use Rust tests (tokio, wiremock) for backend; use a small JS
  harness only for Chrome extension UX where needed.
- After completing a section, run `npm run build:all` and the
  targeted tests for that section before advancing.
- Keep changes minimal and targeted; avoid broad refactors.
- Match existing project style and folder layout.
- Prefer Rust for backend: server + MCP use rmcp.
- Preserve HTTP/MCP JSON shapes and semantics.
- Use feature flags to switch Rust vs legacy paths.
- Do not remove JS Chrome extension; test it via small JS harness.
- Testing: prefer Rust (tokio, wiremock); keep JS tests only
  where browser/DevTools is required.
- No network in unit tests. Mock with wiremock/httpmock.
- In transitional period, a Node test fetch proxy is allowed
  to keep legacy Jest+nock passing. Remove when Rust tests
  cover the cases.
- Respect licenses. Add THIRD_PARTY_NOTICES for embedded
  Node/Lighthouse. Do not ship unvetted binaries.
- Error handling: no panics in non‑test code; use anyhow or
  crate error types. Return early on errors.
- Security: bind HTTP to 127.0.0.1 by default; warn on
  non‑loopback binds.
- Performance: prefer async Rust (tokio); avoid blocking calls.
- Documentation: update convert-rust.md and README when user-
  visible behavior or flags change.

Conversion checklist
--------------------

Bootstrap workspace
-------------------
- [x] Create `crates/` Rust workspace and top‑level Cargo.toml
- [x] Add `crates/core` with shared types and errors
- [x] Add `crates/server` HTTP/WS service crate
- [x] Add `crates/mcp` MCP stdio server crate (rmcp)
- [x] Add `crates/browser` CDP abstraction crate (scaffold)
- [x] Add `crates/lighthouse-shim` (scaffold; optional feature)
- [x] Add `xtask/` or scripts for building prebuilt binaries

Core crate
----------
- [x] Define DTOs mirroring existing JSON: logs, audits, identity
- [x] Implement bounded ring buffer with JSON‑safe truncation
- [x] Implement path conversion helper (WSL/UNC -> native)
- [x] Implement error model and human messages (parity with TS)
- [x] Add serde + schemars derives for future schema docs
- [x] Unit tests for ring buffer, truncation, and errors

Server crate: HTTP/WS skeleton
------------------------------
- [x] Choose framework (axum). Add tokio, serde, thiserror
- [x] Implement health `/.identity` (signature/name/version)
- [x] Implement `/.port`
- [x] In‑memory state: console logs (ring buffer)
- [x] In‑memory state: console errors (ring buffer)
- [x] In‑memory state: network errors (ring buffer)
- [x] In‑memory state: network success (ring buffer)
- [x] In‑memory state: all‑xhr aggregator (sorted merge)
- [x] In‑memory state: selected element store
- [x] In‑memory state: current URL
- [x] Implement `GET /console-logs`
- [x] Test `GET /console-logs` (limits, truncation)
- [x] Implement `GET /console-errors`
- [x] Test `GET /console-errors` (limits, truncation)
- [x] Implement `GET /network-errors`
- [x] Test `GET /network-errors` (limits, truncation)
- [x] Implement `GET /network-success`
- [x] Test `GET /network-success` (limits, truncation)
- [x] Implement `GET /all-xhr` (merge/sort)
- [x] Test `GET /all-xhr` merge order and limits
- [x] Implement `POST /selected-element`
- [x] Implement `GET /selected-element`
- [x] Test selected-element set/get (round‑trip)
- [x] Implement `POST /wipelogs`
- [x] Test `POST /wipelogs` clears all buffers
- [x] Implement `POST /current-url`
- [x] Implement `GET /current-url`
- [x] Test current-url set/get (round‑trip)
- [x] Enforce log limits per route (`logLimit`, `queryLimit`)
- [x] Truncate long strings and JSON fields consistently
- [x] JSON body size limit 50MB (align with Express)
- [x] Per‑route timeouts and error mapping
- [x] CORS config parity with Express defaults
- [x] Graceful shutdown handling and signal traps

Server crate: screenshots and storage
-------------------------------------
- [x] Define screenshot message contract (base64 payload)
- [x] Create folder if missing (Downloads/mcp-screenshots)
- [x] Safe filename generation (timestamp + sanitized title)
- [x] Atomic write to avoid partial files on crash
- [x] Disk quota/size guard; error mapping
- [x] Implement cookies/localStorage/sessionStorage handlers
- [x] Payload size guards and structured logging
- [x] Tests: folder creation, safe filename, atomic write,
      quota error mapping, payload size rejection

Proxy and network config
------------------------
- [x] Env proxy detection: HTTP(S)_PROXY, lowercase variants
- [x] NO_PROXY wildcards, suffixes, and exact matches
- [x] Local/private range bypass (127/localhost/10/172/192.168)
- [x] HTTP/HTTPS vs SOCKS agent selection
 - [x] `test_connectivity` API using reqwest agents
- [x] Unit tests: private ranges, NO_PROXY, bad proxy URL

Notes
-----
- `test_connectivity` implemented with reqwest. Integration test binds to
  localhost and is marked `#[ignore]` by default to support restricted
  sandboxes. Run with `cargo test -p webai-server -- --ignored` in CI/dev.
- Linux auto-paste uses xclip + xdotool and requires X11. On Wayland,
  the fallback may not work; a Wayland-specific helper may be needed.
 - Windows registry App Paths + BLBeacon implemented via injectable
   RegProbe trait. Real registry integration can be added behind a
   `windows-reg` feature for Windows CI; tests use a FakeReg.

OS integrations (auto‑paste)
----------------------------
- [x] macOS: AppleScript via `osascript` fallback
- [ ] macOS: optional native APIs (feature flag)
- [ ] Windows: `windows` crate clipboard + focus
- [x] Windows: PowerShell fallback path
- [x] Linux: xdotool/X11; Wayland caveats noted
 - [x] Endpoint parity and message texts
 - [x] Per‑OS tests and error mapping

Browser detection and lifecycle
------------------------------
- [x] Windows: HKLM/HKCU App Paths + BLBeacon probe
 - [x] Windows: Program Files x64/x86 fallbacks
 - [x] macOS: app bundle paths; `mdfind` fallback
 - [x] Linux: `which` + common paths (apt/snap/flatpak)
 - [x] Opera detection via Chromium location
- [x] Cache detected path and verify exists
- [x] Env overrides: CHROME_PATH, BROWSER_EXECUTABLE
- [x] Per‑browser overrides: CHROME/EDGE/BRAVE/FIREFOX_PATH
 - [x] User‑data‑dir lifecycle and cleanup
- [x] Unit tests: win/mac/linux detection heuristics
- [x] WSL path conversion tests (UNC/drive letters)
- [x] Tests: env override precedence and caching

Browser automation (CDP)
------------------------
 - [x] Evaluate `chromiumoxide` vs `headless_chrome`
 - [x] Implement headless browser lifecycle (user‑data‑dir)
 - [x] Executable path detection (Chrome/Edge/Brave; partial FF)
 - [x] Navigation with options: headers, cookies, viewport,
      UA, locale, timezone (interfaces only)
 - [x] Resource blocking via CDP (options scaffold)
 - [x] Network condition emulation (options scaffold)
 - [ ] Replace Puppeteer calls behind feature flag
 - [x] Fallback path to legacy JS (env var)

WebSocket flows (extension‑ws)
------------------------------
- [x] Implement WebSocket route `/extension-ws`
- [x] Schema: standard request envelope with `requestId`
- [x] Schema: success/error response envelopes
 - [x] Screenshot: request schema and validations
 - [x] Screenshot: success handler, save path, tests
 - [x] Screenshot: error/timeout mapping and tests
- [ ] Get‑HTML‑by‑selector: request schema
 - [x] Get‑HTML‑by‑selector: request schema
 - [x] Get‑HTML‑by‑selector: success/error/timeout tests
 - [x] Refresh‑browser: request/response + tests
- [x] Click‑element: request/response + tests
- [x] Fill‑input: request/response + tests
- [x] Select‑option: request/response + tests
- [x] Submit‑form: request/response + tests
- [x] Backpressure: max inflight; queue/drop policy
 - [x] Backpressure: max inflight; queue/drop policy
- [x] Reconnection: resume behavior and cleanup

Lighthouse
----------
- [x] Feature `audit-lighthouse` (default on)
- [ ] Package embedded Node + Lighthouse assets
- [ ] First‑run extraction to cache dir
- [ ] Spawn management and lifecycle
- [ ] Flags mapping and pure LHR JSON return
- [ ] `--no-audit` disables audits entirely
- [ ] Robust error mapping (Chrome missing, spawn ENOENT)
- [ ] THIRD_PARTY_NOTICES and license texts
- [ ] Tests: spawn success, missing Chrome, missing assets

MCP server (rmcp)
-----------------
- [ ] Add rmcp dependency and initialize stdio server
- [x] Implement identity/version reporting
- [x] Tool list: expose stable tool names
- [ ] Tool: getConsoleLogs (inputs, JSON, errors)
- [ ] Tool: getConsoleErrors (parity + errors)
- [ ] Tool: getNetworkErrors (parity + errors)
- [ ] Tool: getNetworkSuccess (parity + errors)
- [ ] Tool: getAllXhr (merged ordering parity)
- [ ] Tool: selected-element get
- [ ] Tool: selected-element set
- [ ] Tool: capture screenshot
- [ ] Tool: cookies (list)
- [ ] Tool: localStorage (get)
- [ ] Tool: sessionStorage (get)
- [ ] Tool: audits (accessibility/perf/seo/best)
- [ ] Streaming: progress and cancellation
- [ ] Structured error handling parity with TS
- [ ] CLI subcommand `mcp` that runs stdio server
- [ ] Tests: snapshot outputs for every tool; error paths

CLI and single binary
---------------------
- [x] Create top‑level binary `webai`
- [x] Subcommand `server` (HTTP/WS)
- [x] Subcommand `mcp` (stdio MCP)
- [x] Subcommand `all` (run both; shared state)
 - [x] Flags: host, port, data‑dir, log limits
- [x] Flags: feature toggles (browser, legacy)
- [ ] Version banner matches package versioning
- [ ] Logging levels and JSON logs toggle
- [ ] Config precedence: CLI > ENV > config file
- [ ] Config validation and helpful errors

Node package integration (thin launchers)
----------------------------------------
- [ ] `@cpjet64/webai-server`: JS bin that prefers Rust binary
- [ ] Postinstall: download prebuilt or build via cargo
- [ ] Fallback to legacy JS server only if binary missing
- [ ] `@cpjet64/webai-mcp`: JS bin that prefers Rust MCP
- [ ] Keep legacy JS MCP as temporary fallback
- [ ] Ensure `/.identity` reports package version

Testing (Rust‑first)
--------------------
- [ ] Add Rust unit tests for core types and helpers
- [ ] Add Rust integration tests for all HTTP endpoints
- [ ] Add WS integration tests for message flows
- [ ] Use `wiremock` for external service stubs
- [ ] Add JSON snapshots with `insta` for parity
- [ ] Add deterministic ports and fixtures
- [ ] CI: run Rust test matrix on all platforms
 - [ ] Snapshot tests for each MCP tool output
 - [ ] Parity tests for every HTTP route
 - [ ] Flaky‑resistant retries for browser tests

Transitional JS tests
---------------------
- [ ] Keep minimal Jest harness for Chrome extension E2E
- [ ] (Optional) Temporary Node fetch proxy for legacy tests
- [ ] Document deprecation of nock‑based backend tests

Docs and dev UX
---------------
- [ ] Update convert-rust.md with progress links
- [ ] Update README with single‑binary usage
- [ ] Add CLI help and examples
- [ ] Add troubleshooting for audits and browsers
- [ ] Add development guide for building from source

Distribution and licensing
--------------------------
- [ ] Build prebuilt binaries for macOS, Linux, Windows
- [ ] Code‑sign where applicable (optional)
- [ ] Include THIRD_PARTY_NOTICES
- [ ] Bundle Node/Lighthouse assets when feature enabled
- [ ] Verify licenses for all bundled deps

Security and stability
----------------------
- [ ] Bind to 127.0.0.1 by default
- [ ] Add rate limits or backpressure if needed
- [ ] Ensure graceful shutdown and cleanup of temp dirs
- [ ] Fuzz test parsers and JSON inputs (optional)
 - [ ] Warn when binding to non‑loopback host
 - [ ] Temp dir cleanup verification tests
 - [ ] Redaction toggle and tests (PII/tokens)

Cleanup and deprecation
-----------------------
- [ ] Remove temporary Node fetch proxy once Rust tests pass
- [ ] Mark legacy JS server paths as deprecated
- [ ] Keep Chrome extension JS; document its interface

Notes
-----
- Track blockers or decisions here during implementation.
 - macOS native auto-paste: blocked in this sandbox due to
   restricted network (cannot add Cocoa/objc crates). The
   feature gate and stubs exist; native implementation will
   be added once deps can be fetched in CI/dev.

Cross‑browser support
---------------------
- [x] Define `BrowserProvider` trait with common ops
 - [x] Capability matrix type and endpoint `GET /capabilities`
- [ ] Chromium provider via CDP
- [ ] Firefox provider via BiDi; fallback WebDriver
- [ ] Safari provider via safaridriver (macOS only)
- [ ] Opera detection reusing Chromium paths
- [ ] Browser executable detection per OS
- [ ] Env/CLI overrides for executable paths
- [ ] User‑data‑dir lifecycle and cleanup
- [ ] Viewport, UA, locale, timezone settings
- [ ] Network emulation (3G/4G/offline/latency)
- [ ] Resource blocklist (images/fonts/media)
- [ ] Robust retries/backoff for nav/waits
- [ ] Feature flags per browser provider

Selector engine
----------------
- [ ] CSS/XPath/ARIA/Text selectors
- [ ] Shadow DOM piercing
- [ ] Auto‑wait for visible/stable/attached
- [ ] Deterministic selection and error texts

Record and replay
-----------------
- [ ] Action recorder (WS events -> script)
- [ ] Export to Rust/TS test scripts
- [ ] Deterministic waits (network idle,
      element conditions)
- [ ] CLI: `webai record` and `webai replay`

Network capture and replay
-------------------------
- [ ] HAR capture per session
- [ ] HAR redaction rules
- [ ] HAR replay for deterministic tests
- [ ] CLI: `webai har capture|replay`

Artifacts and visual tools
--------------------------
- [ ] Full‑page screenshots
- [ ] Region crop
- [ ] PDF/MHTML export
- [ ] Visual diff (SSIM/threshold)

Observability
-------------
- [ ] Structured logs with per‑session ids
- [ ] OpenTelemetry traces + metrics (feature flag)
- [ ] Sampling controls via config
- [ ] Timeline view data: network waterfall,
      console correlation (JSON API)

Crash diagnostics
-----------------
- [ ] Auto crash bundle (logs, HAR, traces)
- [ ] Privacy redaction policies
- [ ] CLI: `webai diag bundle`

Security and privacy
--------------------
- [ ] Token/PII redaction rules (regex + allowlist)
- [ ] Sandboxed modes: disable downloads, dialogs
- [ ] Allow/deny lists for URLs and downloads
- [ ] Proxy rotation + NO_PROXY handling parity

Developer experience
--------------------
- [ ] Single binary UX: `webai server|mcp|all`
- [ ] Config layering: CLI > ENV > file
- [ ] JSON schema for config; validate on load
- [ ] First‑run diagnostics (browser detection,
      permissions, env checks)
- [ ] Browser downloader helper for CI

Scaling and remote workers
--------------------------
- [ ] Remote worker protocol (gRPC/WS)
- [ ] Per‑tenant namespaces and quotas
- [ ] Secure auth for remote execution

MCP enhancements (rmcp)
----------------------
- [ ] Progress and cancellation streaming
- [ ] Tool schema introspection endpoint
- [ ] Attachment streaming (screenshots,
      HAR, PDF) with chunking
