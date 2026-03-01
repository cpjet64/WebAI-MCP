# Convert to Rust Plan

This document outlines a pragmatic, phased plan to convert as much of this project to Rust as possible while preserving public behavior, test coverage, and developer ergonomics. The approach favors incremental replacement behind stable HTTP/MCP interfaces so existing users and tests continue to work throughout the migration.

## Goals

- Full Rust backend: server and MCP implemented in Rust by default
- Maintain current CLI, HTTP API, and MCP tool behavior and JSON shapes
- Keep tests green; validate via `npm run build:all` and targeted tests
- Avoid large refactors; minimize churn and preserve existing folder structure where possible
- Use Rust for reliability, performance, and portability in long‑running server components
- Preserve `nock`-based HTTP interception in tests via an HTTP test proxy or WASM/JS fetch shims

## Non‑Goals (Initial Phases)

- Porting the Chrome Extension UI to Rust (keep JS extension)
- Replacing Lighthouse internals (call out to Node/CLI until a credible Rust path exists)
- Forcing a single-step rewrite; prioritize parallel, swappable components

---

## Repo Inventory → Rust Candidates

- `webai-server` (Express + WS, Puppeteer, Lighthouse)
  - HTTP API: `/console-logs`, `/console-errors`, `/network-errors`, `/network-success`, `/all-xhr`, `/selected-element` (GET/POST), `/.port`, `/.identity`, `/current-url` (GET/POST), `/wipelogs`
  - WebSocket endpoint: `/extension-ws`
  - Feature endpoints: `/capture-screenshot`, `/inspect-elements-by-selector`
  - Audit endpoints: `/accessibility-audit`, `/performance-audit`, `/seo-audit`, `/best-practices-audit`
  - Browser automation: `puppeteer-service.ts`
  - Proxy/network config: `proxy-config.ts`
  - OS integrations: `auto-paste-manager.ts`
  - Rust suitability: HIGH for HTTP/WS server, proxy config, log storage, state; MEDIUM for browser automation (Chromium via CDP in Rust); HIGH for OS clipboard/window control; LOW for Lighthouse (initially keep Node path)

- `webai-mcp` (MCP server via `@modelcontextprotocol/sdk`)
  - Tools call the HTTP API above
  - Error handling: `error-handler.ts`
  - Version checks: `version-checker.ts`
  - Rust suitability: HIGH for error/diagnostics/stdio JSON‑RPC; move MCP to Rust in early phases

- `chrome-extension/` (DevTools panel + content scripts)
  - Talks to server via WS/HTTP
  - Rust suitability: N/A (keep as JS)

---

## Target Architecture (Incremental)

- Introduce a Rust workspace providing:
  - `crates/core`: shared types, config, ring buffer logs, path utils, error handling
  - `crates/server`: Axum/Actix HTTP + WS server implementing current API and `/extension-ws`
  - `crates/browser`: CDP browser control (eventually replace Puppeteer) using `chromiumoxide` or `headless_chrome`
  - `crates/lighthouse-shim`: thin adapter that shells out to Node’s Lighthouse CLI/JS until native alternative is viable
  - `crates/mcp`: JSON‑RPC over stdio (MCP server) with the same tool set and outputs as JS
  - `crates/node-bindings` (optional): N-API wrapper via `napi-rs` for areas where Node must call into Rust directly

- Packaging/Interop:
  - Node `@cpjet64/webai-server` bin becomes a small JS launcher that prefers the Rust server binary (downloaded prebuild or built locally), falling back to the legacy JS server only if missing
  - Node `@cpjet64/webai-mcp` becomes a small JS launcher that prefers the Rust MCP binary; legacy JS MCP remains as a fallback path temporarily
  - In tests, preserve `nock` interception by keeping external network calls behind a test‑only HTTP fetch proxy or WASM+JS fetch; avoid making Rust direct network calls in unit/integration tests that rely on `nock`

---

## Phased Migration Plan

### Phase 0 — Baseline and Contracts
- Freeze external JSON shapes for all endpoints and MCP tools
- Document request/response schemas where missing
- Add golden samples for a few critical endpoints to guard behavior

### Phase 1 — Rust Workspace + Core Utilities
- Scaffold `Cargo.toml` workspace under `rust/` or `crates/` with `core` and `server`
- Implement in `core`:
  - Types for logs, network config, audit metadata
  - Ring buffer for logs with size limits and JSON-safe truncation
  - Path conversion helper (port from `convertPathForCurrentPlatform`)
  - Error modeling similar to `error-handler.ts` with patterns and user‑facing suggestions
- CI/Build:
  - Add npm scripts to build Rust as part of `npm run build:all` (e.g., `cargo build --release`)
  - Stage platform binaries under `webai-server/bin/<platform>` for the launcher

### Phase 2 — HTTP/WS Server in Rust
- Implement Axum/Actix server mirroring Express routes and JSON outputs
- Implement `/extension-ws` using `tokio-tungstenite` or Axum WS, matching message types:
  - `screenshot-data|error`, `get-html-by-selector(-response|-error)`, `refresh-browser(-response|-error)`, `click-element(-response|-error)`, `fill-input(-response|-error)`, `select-option(-response|-error)`, `submit-form(-response|-error)`
- In‑memory state: log buffers, selected element, URL, connection tracking
- Implement `/.identity` response parity (`signature`, `name`, `version`, etc.)
- Keep Lighthouse and Puppeteer endpoints temporarily proxied to existing Node handlers (see Phase 4/5)
  - Node launcher: `@cpjet64/webai-server` bin starts the Rust binary if present; otherwise falls back to current JS server

### Phase 3 — MCP Server in Rust (Backend now fully Rust)
- Implement stdio JSON‑RPC MCP server in Rust matching tool names, inputs, and outputs from `webai-mcp/mcp-server.ts`
- Tools call the Rust HTTP server internally (or share logic via crates to avoid HTTP where appropriate)
- Update `@cpjet64/webai-mcp` package to launch Rust MCP by default; keep JS MCP as temporary fallback

### Phase 4 — Proxy/Network and OS Integrations in Rust
- Port `proxy-config.ts` behavior:
  - Detect env proxies, `NO_PROXY`, and private ranges
  - Provide `get_fetch_options` equivalent; expose to JS via HTTP shim when needed
  - Add `testConnectivity` endpoint (calling Rust `reqwest` with proxy agents)
- Port `auto-paste-manager.ts`:
  - macOS: use AppleScript via `osascript` subprocess or native APIs
  - Windows: use the `windows` crate for foreground window + clipboard; fallback to PowerShell script
  - Linux: use `xdotool` or X11/Wayland bindings; fallback to shelling out
  - Keep identical responses/messages

### Phase 5 — Browser Automation (Replace Puppeteer)
- Evaluate Rust CDP libraries:
  - `chromiumoxide` (async CDP client), `headless_chrome` (simpler API)
  - Features to match:
    - headless browser lifecycle, dynamic debug port, user‑data‑dir
    - custom executable path detection (Chrome/Edge/Brave/Firefox where possible)
    - resource blocking, headers, cookies, viewport, UA, locale/timezone
    - network conditions emulation (latency/bandwidth/offline) via CDP
  - Firefox parity likely partial; maintain JS fallback where needed
- Implement `connectToHeadlessBrowser` equivalent in Rust and swap endpoint handlers to the Rust implementation behind the same HTTP routes
- Keep a feature flag/env var to toggle between Rust and Node implementations per endpoint

 ### Phase 6 — Lighthouse Strategy (Minimal Node shim only)
- Short term: Rust server shells out to Node Lighthouse CLI/JS using the same flags; capture output and return the same `lhr` JSON shape
- Mid term: Explore direct CDP traces + report generation in Rust, or embed Node for Lighthouse only
- Maintain identical endpoint responses to avoid test churn

---

---

## Testing Strategy (Rust‑first)

- Validate via `npm run build:all` and new Rust tests (tokio).
- Prefer Rust integration tests using `wiremock`/`httpmock` for external
  service simulation and `insta` for JSON snapshot parity.
- Keep a minimal JS test harness only for the Chrome extension flows or
  where the browser/DevTools environment is required.
- Transitional: a Node‑based test fetch proxy can exist briefly so JS
  tests that currently depend on `nock` keep passing while we port to
  Rust tests. This shim is test‑only and will be removed once parity
  is achieved.
- Add golden JSON snapshots for key endpoints and MCP tool outputs.
- Provide helpers to start/stop the Rust server and MCP binary in test
  setup, on ephemeral ports, with feature flags for deterministic runs.

---

## Licensing and Embedded Audit Runtime

- If embedding a Node runtime and Lighthouse assets for audits:
  - Include Node.js MIT and Lighthouse Apache‑2.0 license texts.
  - Add THIRD_PARTY_NOTICES listing all bundled packages and licenses.
  - Extract embedded assets to a cache dir at runtime on first use.
  - Provide `--no-audit` to disable audit features for a smaller build.

---

## Cross‑Browser Support (Optional Enhancements)

- Drivers and protocols
  - Chromium (Chrome/Edge/Brave/Opera): CDP
  - Firefox: WebDriver BiDi (preferred) or geckodriver
  - Safari (macOS): safaridriver (WebDriver)
- BrowserProvider trait
  - Common ops: launch, navigate, query, click, type, select,
    submit, cookies, storage, screenshot, PDF, network control
  - Capability matrix per provider with graceful fallbacks
- Executable detection
  - Per‑OS heuristics and env overrides; `--browser` flag
- Resource controls
  - Viewport, UA, locale, timezone, network (throttle/offline)
  - Block list for resource types (images/fonts/media)
- Stability
  - Ephemeral user‑data dirs; strict cleanup
  - Backoff/retry for flaky steps

---

## Additional Enhancements (Optional)

- Selector engine
  - CSS/XPath/ARIA/Text with shadow DOM piercing; auto‑waits
- Record/replay
  - Capture interactions; export Rust/TS scripts; deterministic
- HAR capture and replay
  - Deterministic network; regression triage
- Artifacts
  - Full‑page screenshots, PDF/MHTML, region crop, visual diff
- Observability
  - Structured logs; OpenTelemetry traces/metrics; sampling
  - Timeline network waterfall; console correlation
- Crash diagnostics
  - Auto bundles: logs, HAR, traces, env; privacy redaction
- Security
  - Redaction policies; sandboxed modes; allow/deny lists
  - Proxy rotation; robust NO_PROXY handling
- Developer experience
  - Single binary CLI; config layering; schema validation
  - First‑run diagnostics; browser downloader helper
- Scaling
  - Remote workers via gRPC/WebSocket; quotas and namespaces
- MCP (rmcp)
  - Progress/cancel streaming; tool schema introspection
  - Attachment streaming for large artifacts

---

## Distribution and Installation

- Prebuild binaries per platform (darwin‑x64/arm64, linux‑x64/aarch64, win32‑x64)
- `@cpjet64/webai-server` and `@cpjet64/webai-mcp` postinstall scripts download correct binaries; fall back to local `cargo build` if no prebuild
- JS bin launchers resolve and execute the binaries; if unavailable, start the legacy JS paths as a last resort
- Maintain semantic versioning in Node packages; reflect version in `/.identity` and MCP version banner

---

## Risks and Mitigations

- Lighthouse parity: keep Node fallback; test both paths behind a flag
- Firefox support in Rust CDP: document partial coverage; keep Puppeteer fallback
- WS protocol drift: snapshot message formats; add integration tests against extension
- OS automation variability: provide multiple backends per OS with clear fallbacks and logs

---

## Rough Milestones

1) Workspace + Core + Launcher (1–2 weeks)
- `core` crate, server skeleton, identity/status/console endpoints
- Node launcher + fallback path, CI wiring

2) Full HTTP/WS Parity (2–3 weeks)
- Mirror all non‑audit endpoints; message formats; in‑memory state; screenshots flow via WS

3) MCP in Rust (1–2 weeks)
- Rust MCP tools with parity; JS launcher fallback

4) Proxy/OS Integrations (1–2 weeks)
- Proxy manager + connectivity tests; auto‑paste flows

5) Browser Automation Swap (2–4 weeks)
- Rust CDP integration; feature flag; performance validation

6) Lighthouse Shim (1 week)
- Rust spawns Node Lighthouse; parity outputs; tighten error handling

---

## Acceptance Criteria

- `npm run build:all` succeeds; Jest tests pass unchanged
- `/.identity` and all documented routes return identical JSON structures
- Chrome extension interoperates with the Rust server via `/extension-ws`
- MCP tools run via the Rust binary by default and produce the same outputs
- Feature flags allow toggling Rust vs Node implementations without user‑visible changes; Node kept only for Lighthouse shim

---

## Implementation Checklist

- [ ] Scaffold Cargo workspace (`crates/core`, `crates/server`, `crates/mcp`)
- [ ] JS launchers for `@cpjet64/webai-server` and `@cpjet64/webai-mcp` that prefer Rust binaries
- [ ] Implement identity, logs, selected element, URL endpoints in Rust
- [ ] WebSocket `/extension-ws` parity and message handling
- [ ] Test‑only HTTP fetch proxy to preserve `nock` interception
- [ ] Proxy manager port with env detection and connectivity test
- [ ] Auto‑paste implementations per OS with fallbacks
- [ ] Feature‑flagged Rust browser automation; Puppeteer fallback
- [ ] Lighthouse CLI shim in Rust that shells out to Node; parity JSON responses
- [ ] Migrate MCP to Rust with parity toolset; JS wrapper fallback

---

## Notes for Contributors

- Keep changes minimal and focused; prefer drop‑in replacements behind existing routes
- Match JSON shapes and naming exactly; add integration snapshots where helpful
- When interop issues arise (ESM/CJS), use test‑only shims instead of broad refactors
- If introducing WASM for Node, ensure network calls route through JS `fetch` in tests so `nock` can intercept
