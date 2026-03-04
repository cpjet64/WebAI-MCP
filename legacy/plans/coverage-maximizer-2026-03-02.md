# Coverage Maximizer Plan (2026-03-02)

## Objective
Maximize achievable test coverage for WebAI-MCP with iterative `cargo nextest` + `cargo llvm-cov` passes and evidence tracking in `docs/coverage-report.md`.

## Scope
- Rust workspace (all crates under `crates/`, `webai-mcp/`, `webai-server/`, `xtask/`).
- Node/JS coverage is not in scope unless uncovered runtime is traced through integration scripts in `scripts/` that are reachable from Rust paths.

## Steps
1. Record baseline rollback SHA in `.agent-state/last-head.txt` **(done)**.
2. Create/refresh `docs/coverage-report.md` with baseline line/branch/function coverage **(done)**.
3. Run baseline and post-change `cargo nextest run --all-features` and `cargo llvm-cov nextest --all-features --fail-under-regions 73 --lcov --output-path lcov.info` once for a full uncovered list **(done)**.
4. Group uncovered symbols and verify each with static/code-path review:
   - dead and removable
   - coverable with tests
   - uncoverable (add documented comments)
5. Implement only safe, minimal edits in the same branch:
   - remove confirmed dead code
   - add unit/integration tests
   - add detailed comments for unavoidable uncovered paths
6. Archive prior `docs/coverage-report.md` into `legacy/coverage/coverage-report-2026-03-02-prework.md` **(done)**.
7. Re-run full coverage after each iteration until no meaningful coverage gain is possible **(done)**.
8. Update `docs/coverage-report.md` with final before/after table and evidence **(done)**.
9. Commit per atomic change with `fix(coverage): ... [s-autonomous-coverage-maximizer]`.
10. Return to user with exact file-level changes and next action options.
