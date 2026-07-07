#!/usr/bin/env node
/**
 * mcp-scheduler
 * A minimal Model Context Protocol server that gives Claude Code two
 * scheduling-assistant tools. Everything is deterministic and offline:
 * no calendar API, no keys, so it runs the moment you register it.
 *
 *   find_open_slots   - given working hours + busy blocks, return free slots
 *   draft_followup    - produce a short, on-brand follow-up nudge
 *
 * This is a deliberately small, readable example of "AI makes the judgment,
 * code does the deterministic work" - the pattern I use in production.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({ name: "mcp-scheduler", version: "1.0.0" });

/** Parse "HH:MM" into minutes since midnight. */
function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** Format minutes since midnight back into "HH:MM". */
function toHHMM(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

server.registerTool(
  "find_open_slots",
  {
    title: "Find open meeting slots",
    description:
      "Given working hours, existing busy blocks, a meeting duration and a " +
      "buffer, return the open slots that respect all constraints. Times are " +
      "'HH:MM' 24h within a single day. Deterministic, no calendar API needed.",
    inputSchema: {
      workday_start: z.string().describe("Start of working hours, e.g. '10:00'"),
      workday_end: z.string().describe("End of working hours, e.g. '17:00'"),
      duration_min: z.number().int().positive().describe("Meeting length in minutes"),
      buffer_min: z
        .number()
        .int()
        .min(0)
        .default(10)
        .describe("Minimum gap to leave around existing meetings"),
      busy: z
        .array(z.object({ start: z.string(), end: z.string() }))
        .default([])
        .describe("Existing busy blocks as {start,end} in 'HH:MM'"),
      max_results: z.number().int().positive().default(3),
    },
  },
  async ({ workday_start, workday_end, duration_min, buffer_min, busy, max_results }) => {
    const dayStart = toMinutes(workday_start);
    const dayEnd = toMinutes(workday_end);

    // Expand each busy block by the buffer on both sides, then merge overlaps.
    const blocks = busy
      .map((b) => ({
        start: toMinutes(b.start) - buffer_min,
        end: toMinutes(b.end) + buffer_min,
      }))
      .sort((a, b) => a.start - b.start);

    const merged = [];
    for (const b of blocks) {
      const last = merged[merged.length - 1];
      if (last && b.start <= last.end) last.end = Math.max(last.end, b.end);
      else merged.push({ ...b });
    }

    // Walk the gaps between busy blocks and slice out slots of the right size.
    const slots = [];
    let cursor = dayStart;
    for (const b of [...merged, { start: dayEnd, end: dayEnd }]) {
      let gapStart = Math.max(cursor, dayStart);
      const gapEnd = Math.min(b.start, dayEnd);
      while (gapEnd - gapStart >= duration_min && slots.length < max_results) {
        slots.push({ start: toHHMM(gapStart), end: toHHMM(gapStart + duration_min) });
        gapStart += duration_min;
      }
      cursor = Math.max(cursor, b.end);
      if (slots.length >= max_results) break;
    }

    const text = slots.length
      ? `Open ${duration_min}-min slots: ` +
        slots.map((s) => `${s.start}-${s.end}`).join(", ")
      : "No open slots that satisfy the constraints.";

    return {
      content: [{ type: "text", text }],
      structuredContent: { slots },
    };
  }
);

server.registerTool(
  "draft_followup",
  {
    title: "Draft a follow-up nudge",
    description:
      "Produce a short, friendly one-message follow-up for a guest who has " +
      "gone quiet. Deliberately brief and low-pressure.",
    inputSchema: {
      guest_name: z.string(),
      topic: z.string().describe("What the meeting is about"),
      days_since: z.number().int().positive().describe("Days since last contact"),
      proposed_times: z
        .array(z.string())
        .default([])
        .describe("Times previously offered, if any"),
    },
  },
  async ({ guest_name, topic, days_since, proposed_times }) => {
    const timeLine = proposed_times.length
      ? ` Are any of these still workable: ${proposed_times.join(", ")}?`
      : " Would a short call this week or next work?";
    const draft =
      `Hi ${guest_name.split(" ")[0]},\n\n` +
      `Circling back on ${topic}.${timeLine}\n\n` +
      `Happy to work around your schedule. No rush if the timing is off.\n\n` +
      `Best`;
    return {
      content: [
        {
          type: "text",
          text: `DRAFT (review before sending) - follow-up after ${days_since} days:\n\n${draft}`,
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
