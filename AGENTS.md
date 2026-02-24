Agent guide for this repo

- Scope: Entire repository.
- Keep changes minimal and focused; match existing style.
- Prefer surgical fixes over broad refactors.
- Use test-only shims for Node ESM/CJS interop issues.
- Validate via workspace scripts: `npm run build:all` and targeted tests.

Notes
- Tests may rely on HTTP(S) requests being interceptable by `nock`. Use an HTTP-based fetch shim in tests.

## Environment

### Cache Locations
All caches are centralized under `C:\Dev\cache\`. These environment variables are set system-wide — do not override them in project config or scripts.

| Cache | Path | Env Variable |
|---|---|---|
| Cargo registry/git/bin | `C:\Dev\cache\cargo` | `CARGO_HOME` |
| Rustup toolchains | `C:\Dev\cache\rustup` | `RUSTUP_HOME` |
| sccache | `C:\Dev\cache\sccache` | `SCCACHE_DIR` |
| npm | `C:\Dev\cache\npm` | `npm_config_cache` |
| pnpm store | `C:\Dev\cache\pnpm-store` | pnpm config |
| Yarn | `C:\Dev\cache\yarn` | `YARN_CACHE_FOLDER` |


#### Cargo Cache Rules
- **sccache is enabled globally** via `$CARGO_HOME/config.toml` (`[build] rustc-wrapper = "sccache"`). All projects inherit this through Cargo's hierarchical config — do not duplicate it.
- **Do NOT** add `rustc-wrapper = "sccache"` to per-project `.cargo/config.toml` — it is inherited from the global config.
- **Do NOT** set `SCCACHE_DIR`, `RUSTC_WRAPPER`, or `CARGO_INCREMENTAL` in `.cargo/config.toml` `[env]` — these are set via system environment variables.
- **Do NOT** set `target-dir` to a shared path (e.g. `C:\Dev\cache\target`) — this causes cross-project build artifact collisions. Use the default per-project `./target/`.
- **Do NOT** create a local `.cargo-home/` directory — the global `CARGO_HOME` provides the registry, git checkouts, and installed binaries.
- Per-project `.cargo/config.toml` **is appropriate** for: linker flags, cargo aliases, build targets, source replacement, rustflags, and profile overrides.

#### Node Cache Rules
- **Do NOT** override `npm_config_cache` in `.npmrc` or scripts — the global env var handles this.
- **Do NOT** create local `.npm-cache/`, `.pnpm-store/`, or `.yarn-cache/` directories.
- `node_modules/` is per-project as expected — only the download cache is centralized.

### Agent Temp Directory
If you need a temporary working directory, use `C:\Dev\agent-temp`. Do NOT use system temp or create temp dirs inside the project.

### Project Location
This project lives at `C:\Dev\repos\active\WebAI-MCP`.

## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One tack per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `//reporoot/.AGENTS/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake to AGENTS.md
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Initialize**: Check for the existence of and read the contents of the Justfile if present.
2. **Plan First**: Write plan to `//reporoot/.AGENTS/todo.md` with checkable items
3. **Save Plan**: Once a plan has been generated, save it to `//reporoot/.AGENTS/plans/shortnamethatdescribeswhattheplanis.md`
4. **Verify Plan**: Check in before starting implementation
5. **Track Progress**: Mark items complete as you go
6. **Explain Changes**: High-level summary at each step
7. **Document Results**: Add review section to `//reporoot/.AGENTS/todo.md`
8. **Capture Lessons**: Update `//reporoot/.AGENTS/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
