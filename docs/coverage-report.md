# Coverage Report

## Scope

- Execution mode: `s-autonomous-coverage-maximizer`
- Repo: `WebAI-MCP`
- Date: `2026-03-02`
- Primary target: Rust workspace coverage (`cargo nextest` + `cargo llvm-cov`)

## Baseline (before changes)

Baseline was captured from the same branch base (`C:\Dev\repos\active\WebAI-MCP`) prior to coverage-maximizer test additions and hardening in this run.

| Metric | Before | After | Delta |
| ------ | ------ | ----- | ----- |
| Line   | 71.54% | 75.29% | +3.75pp |
| Region | 74.92% | 78.09% | +3.17pp |
| Function | 80.05% | 81.68% | +1.63pp |
| Branch  | N/A* | N/A* | 0.00pp |

*Branch coverage not reported by current rustfmt/llvm-cov output in this workspace due this project's current coverage profile.

## Commands executed

- Baseline: `cargo llvm-cov report --summary-only`
- Baseline coverage collection (main branch): `cargo nextest run --all-features`
- Iteration 1 baseline for this maximizer pass: `cargo nextest run --all-features` and `cargo llvm-cov nextest --all-features --fail-under-regions 73 --lcov --output-path lcov.info` (in isolated coverage worktree)

## Iteration Log

1. **2026-03-02T19:55:00Z** - Initialized coverage-maximizer worktree/branch and baseline audit.
2. **2026-03-02T20:25:22Z** - Archived pre-existing placeholder `docs/coverage-report.md` to `legacy/coverage/coverage-report-2026-03-02-prework.md`.
3. **2026-03-02T20:25:22Z** - Added deterministic connectivity error-path coverage for malformed proxy values and improved route-level tests.
4. **2026-03-02T20:25:22Z** - Added current URL and selected element path coverage tests for missing-state and idempotence semantics.
5. **2026-03-02T20:25:22Z** - Added MCP call tool JSON-RPC failure-path coverage for non-success HTTP response mapping.
6. **2026-03-02T20:25:22Z** - Re-ran full workspace coverage checks; all tests pass and threshold requirement `--fail-under-regions 73` is met.

## Findings by Priority

- `crates/server/src/routes_proxy.rs`
  - Covered both success and BAD_REQUEST builder-error path for malformed proxy configuration via `test_connectivity_bad_proxy_settings_return_bad_request`.
  - Existing local loopback bypass behavior remains covered.

- `crates/server/src/proxy.rs`
  - Covered proxy selection and invalid proxy parse behavior indirectly through route-level path and direct proxy unit coverage retained from prior run.

- `crates/mcp/src/lib.rs`
  - Added coverage for JSON-RPC error mapping of non-2xx/3xx tool-call responses via `call_tool_jsonrpc_returns_error_for_non_success_http`.

- Remaining gaps are in non-critical legacy paths under `crates/webai/src/main.rs` and older shell/native branches, consistent with existing project baseline and accepted debt from previous work.

## Notes

- Duplicate dependency windows-sys entries remain and are tracked as known accepted baseline exceptions from prior advisory review.
- Security tooling baselines (`deny`, `audit`) remain unchanged for this coverage pass.
- Artifacts from this run: `lcov.info` (in the coverage worktree) and legacy report snapshot in `legacy/coverage/coverage-report-2026-03-02-prework.md`.
