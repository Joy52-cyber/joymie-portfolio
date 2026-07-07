---
name: inbox-triage
description: Triage a batch of raw emails into a prioritized action table with draft replies and suggested calendar actions. Use when the user pastes or points to a set of emails and wants them classified, prioritized by relationship (not keywords), and turned into ready-to-send drafts. Triggers on "triage my inbox", "sort these emails", "what needs a reply", "schedule these requests".
---

# Inbox Triage

Turn a messy inbox into a founder-ready action plan. The goal is to remove the founder's reading load while never sending anything in their voice without approval.

## Operating principles

1. **Prioritize by relationship, not keywords.** An investor, a warm intro, or a candidate the founder is courting outranks a vendor or a cold pitch, even if the vendor email says "urgent". If a CRM/context file is available, use it. If not, infer tier from the sender and thread history and state your assumption.
2. **Draft, do not send.** Every reply is produced as a draft for human approval. Never claim an email was sent.
3. **Protect the founder's time.** Default meetings to 30 minutes, propose 2-3 options, respect stated working hours and protected blocks, and use the guest's timezone. If a preferences file exists, follow it exactly.
4. **Escalate, do not dump.** Anything sensitive or ambiguous goes to the founder with a one-line recommendation, not an open question.
5. **Be invisible.** No system chatter. The founder sees a clean plan, not the reasoning machinery.

## Input

Any of: pasted email text, a folder/file of `.eml` or `.txt` messages, or a JSON array of `{from, subject, body, received_at}`. Optionally a `preferences.md` (working hours, no-meeting blocks, tone) and a `contacts.md` / CRM export (relationship tiers).

## Procedure

1. Read all messages. If a preferences or contacts file is present, load it first.
2. For each message, classify into one intent:
   `meeting_request` | `reschedule` | `needs_founder` | `fyi` | `pitch` | `noise`.
3. Assign a priority tier `P1..P4` from relationship + intent (relationship dominates).
4. For `meeting_request` / `reschedule`: propose concrete times consistent with the preferences file (or state the assumption if none), and draft a reply in a warm, concise founder voice.
5. For `needs_founder`: write a one-line recommendation the founder can approve or override.
6. For `pitch` / `noise`: recommend label + archive, no reply.

## Output format

First, a triage table sorted by priority:

| # | From | Intent | Priority | Recommended action |
|---|------|--------|----------|--------------------|

Then, under a `## Drafts` heading, the full draft reply for each item that needs one, each clearly labeled `DRAFT - review before sending`.

Then a `## For the founder` section listing only the items that need a human decision, one line each.

End with a single line: how many emails were handled automatically vs. how many need the founder, so the time saved is visible.

## Guardrails

- Never fabricate a calendar slot as if it were confirmed available; propose, and flag that the calendar should be confirmed.
- If relationship tier is a guess, say so in one word rather than pretending certainty.
- If an email looks like phishing or an unusual payment/wire request, force it to `needs_founder` at P1 regardless of other signals.
