# mcp-scheduler

A tiny [Model Context Protocol](https://modelcontextprotocol.io) server that gives Claude Code two scheduling-assistant tools. Fully offline and deterministic: no calendar API, no keys, so it runs the moment you register it.

## Tools

- **`find_open_slots`** - given working hours, busy blocks, a duration and a buffer, returns the open slots that respect every constraint.
- **`draft_followup`** - produces a short, low-pressure follow-up nudge for a guest who has gone quiet.

Both demonstrate the pattern I use in production: the LLM decides *what* to do, deterministic code does the exact scheduling math.

## Run it

```bash
cd mcp-scheduler
npm install
node server.js        # speaks MCP over stdio; nothing prints until a client connects
```

## Register it with Claude Code

```bash
claude mcp add scheduler -- node /absolute/path/to/mcp-scheduler/server.js
```

Then in a Claude Code session:

> Using the scheduler tools, find 30-minute slots between 10:00 and 17:00 with a 15-min buffer, given I'm busy 11:00-11:30 and 14:00-15:00.

Claude will call `find_open_slots` and return the open times.

## Register it manually (`.mcp.json`)

```json
{
  "mcpServers": {
    "scheduler": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-scheduler/server.js"]
    }
  }
}
```

## Why this exists

Built as a compact, honest demonstration of authoring an MCP service (not just consuming one) for the Mindmaven AI Automation Engineer role. It intentionally stays small and readable so the design is the point, not the line count.
