# CLAUDE.md - WebAI-MCP

## Environment

### Cache Locations
All package manager caches are consolidated under `C:\Dev\cache\`:

| Cache | Path | Env Variable |
|---|---|---|
| Cargo registry/git/bin | `C:\Dev\cache\cargo` | `CARGO_HOME` |
| Rustup toolchains | `C:\Dev\cache\rustup` | `RUSTUP_HOME` |
| sccache | `C:\Dev\cache\sccache` | `SCCACHE_DIR` |
| npm | `C:\Dev\cache\npm` | `npm_config_cache` |
| pnpm store | `C:\Dev\cache\pnpm-store` | pnpm config |
| pip | `C:\Dev\cache\pip` | `PIP_CACHE_DIR` |
| uv | `C:\Dev\cache\uv` | `UV_CACHE_DIR` |
| NuGet | `C:\Dev\cache\nuget` | `NUGET_PACKAGES` |
| Yarn | `C:\Dev\cache\yarn` | `YARN_CACHE_FOLDER` |

### Agent Temp Directory
If you need a temporary working directory, use `C:\Dev\agent-temp`. Do NOT use system temp or create temp dirs inside the project.

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
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
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

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

