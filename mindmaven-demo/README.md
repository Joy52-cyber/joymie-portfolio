# Mindmaven Skills-Test Demo Kit

Three artifacts for the AI Automation Engineer (Operations & Workflow Systems) application, showing the same thesis end to end: **understand the operational work first, then automate the safe part and keep a human in the loop where judgment matters.**

| File | What it is | Maps to JD requirement |
|------|-----------|------------------------|
| [`TEARDOWN.md`](./TEARDOWN.md) | A worked answer to the skills test: manual founder-inbox workflow -> where it breaks -> the n8n + Claude automation I'd build -> how I'd measure adoption | "Translate operational pain points into automation"; "audit workflows"; operational immersion |
| [`.claude/skills/inbox-triage/`](./.claude/skills/inbox-triage/SKILL.md) | A Claude Code **skill** that triages a batch of emails into a prioritized action table + draft replies | "Expert in Claude Code: creating skills" |
| [`mcp-scheduler/`](./mcp-scheduler/README.md) | A minimal **MCP service** exposing offline scheduling tools to Claude Code | "Expert in Claude Code: building MCP services" |

## How to use in the interview

1. Lead with `TEARDOWN.md` when they hand you the EA-style task. It reuses my live SlashCal experience as proof.
2. Point to the skill and MCP server as evidence I author Claude Code extensions, not just use the CLI.
3. Offer to run `mcp-scheduler` live: `npm install && claude mcp add scheduler -- node $(pwd)/mcp-scheduler/server.js`.

## Try the skill

Copy `.claude/skills/inbox-triage/` into your project's `.claude/skills/` (or `~/.claude/skills/` for all projects), then in Claude Code:

> /inbox-triage  (paste a few emails)
