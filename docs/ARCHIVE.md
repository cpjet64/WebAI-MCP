Archived files
--------------

Purpose
-------
- Reduce confusion by moving legacy or noisy artifacts out of
  the root docs.
- Each archived file lists here with a short reason and the
  modern replacement where applicable.

Items
-----
- 3tierconversion.md
  - Reason: superseded by the Rust conversion plan.
  - See: convert-rust.md.
- docs/mcp.md (renamed: mcp-ts-sdk.md)
  - Reason: TS SDK tutorial; project is moving MCP to Rust with
    rmcp. Keep for historical reference only.
  - See: convert-rust.md and todo.md for rmcp.
- linuxoutput.txt
  - Reason: transient build/test terminal logs.
  - Action: archived to avoid noise.
- windowsoutput.txt
  - Reason: transient build/test terminal logs.
  - Action: archived to avoid noise.
- security2.txt, security3.txt
  - Reason: pasted Dependabot pages. We already pin
    form-data to 4.0.4 in overrides.
  - See: package.json overrides and commands.txt for audits.

Notes
-----
- If a future doc replaces an archived item, add a pointer here.
- Do not edit archived content unless adding a clear banner.
