# Skills-Test Teardown: Founder Inbox Triage + Scheduling

*Prepared by Joymie Lacaba for the Mindmaven AI Automation Engineer role. This is how I approach an EA task: do it by hand first, find where it actually breaks, then automate the part that is safe to automate and leave a human in the loop where judgment matters.*

---

## 1. The task, as it really runs (manual)

A founder forwards or CCs their EA on inbound email. For each message the EA silently runs this loop:

1. **Read and classify.** Is this a meeting request, a scheduling reschedule, an FYI, a sales pitch, something the founder must personally answer, or noise?
2. **Decide priority.** Not by sender, by *relationship*. An investor and a candidate the founder is courting jump the queue; a vendor does not. The EA knows this from context that is never written down.
3. **Schedule (if a meeting).** Check the founder's calendar, respect their real preferences (no meetings before 10am, protect deep-work blocks, 30-min default, buffer between calls, timezone of the guest), propose 2-3 times, and send in the founder's voice.
4. **Follow up.** If the guest goes quiet for ~2 days, nudge once. If the founder needs to prep, send a brief the morning of.
5. **Escalate.** Anything sensitive, ambiguous, or high-stakes goes back to the founder with a one-line recommendation, not a question.

On paper this is five steps. In practice it is a hundred micro-decisions an hour.

---

## 2. Where it breaks (why naive automation fails here)

I have built exactly this system before (SlashCal, a live AI scheduling assistant), so I know the failure modes firsthand:

- **Priority is relationship, not keyword.** A rules engine that sorts by "contains the word invest" mislabels a cold pitch as urgent and buries a warm intro. The signal is *who this person is to the founder*, which lives in the CRM and the founder's head, not the email body.
- **Scheduling has unspoken constraints.** "Any time Tuesday" is never true. There are protected blocks, energy patterns (no back-to-back calls after 3pm), and hard nos that no one documented. Propose a bad slot once and the founder stops trusting the tool.
- **Context-switching loses state.** A thread that was "waiting on the guest" looks identical to a new request three days later. Without memory of where each thread sits, the automation either double-sends or drops the follow-up.
- **Over-automation destroys trust faster than under-automation.** The moment the system auto-sends something wrong in the founder's name, adoption is dead. Trust is the whole product. (This is the single biggest lesson from running SlashCal: a coordination tool is a trust product, and a slot proposal is an implicit promise.)
- **Silent failure.** If the calendar API rate-limits or an OAuth token expires, a naive flow just stops, and the founder finds out when a guest complains.

---

## 3. The automation I would build

**Principle: AI makes the judgment calls, deterministic code does the work, and a human confirms anything irreversible until the system has earned trust.**

### Flow (n8n as the orchestrator, Claude as the reasoning node)

```
Gmail Trigger (new/labeled message)
      |
      v
[Claude node] Classify + extract
   -> intent: meeting_request | reschedule | fyi | needs_founder | pitch | noise
   -> priority: derived from HubSpot/Notion CRM lookup (relationship tier), not keywords
   -> extracted: guest name, email, timezone, proposed windows, topic
      |
      +-- pitch / noise --> label + archive, no reply
      |
      +-- needs_founder / sensitive --> Slack DM to founder with a 1-line
      |                                 recommendation + "Approve / Edit / Handle myself"
      |
      +-- meeting_request / reschedule
                |
                v
        [Google Calendar] read busy blocks + apply preference rules
        (working hours, protected blocks, buffers, 30-min default, guest timezone)
                |
                v
        [Claude node] draft reply in the founder's voice, propose 2-3 slots
                |
                v
        Draft mode (default): save as Gmail draft + Slack "ready to send?"
        Auto mode (earned): send directly once confidence is high AND the
        thread has cleared N successful human-approved sends
                |
                v
        [Notion/Airtable] write thread state: proposing | awaiting_guest | booked
```

### The pieces that make it actually adopted

- **Thread state machine** in Notion or Airtable so the system knows where every conversation sits (observe -> propose -> nudge -> booked -> abandoned). This is what prevents double-sends and dropped follow-ups.
- **Follow-up worker** (n8n schedule trigger, every few hours): find threads in `awaiting_guest` older than ~2 days, send one nudge, then stop.
- **Prep brief** (schedule trigger, mornings): for meetings in the next 24h, Claude drafts a 3-line brief from the CRM + last thread, DM'd to the founder.
- **Trust ramp.** Everything starts in **draft/approve mode**. A thread only graduates to auto-send after it has cleared a set number of human-approved sends. The founder controls the throttle. (This is exactly the confidence-gated auto-booking I shipped in SlashCal.)
- **Guardrails + monitoring.** OAuth token refresh handled explicitly; on any calendar/API rate-limit or failure, the flow does not fail silently, it posts to Slack and falls back to draft mode. Never auto-send on degraded state.

### Integrations
Gmail (trigger + send/draft), Google Calendar (availability), HubSpot or Notion (relationship tier + thread state), Slack (approvals + alerts), Claude (classification + drafting). All named in the JD; all things I have wired before.

---

## 4. How I would measure whether it is actually adopted

Adoption, not accuracy, is the real metric. I would track:

| Metric | What it tells us | Target signal |
|---|---|---|
| **% of drafts sent unedited** | Is the founder trusting the output? | Rising toward >70% |
| **Founder-time saved / day** | The actual point of the role | Baseline the manual time first, then measure |
| **Threads that reach `booked` without escalation** | End-to-end automation working | Rising |
| **Override rate** (founder edits or takes over) | Where the model still misreads context | Falling; each override is a rule to add |
| **Silent-failure incidents** | Trust killers | Zero tolerance; every one gets an alert + fix |

Every override is not a failure, it is training data: it tells me which unspoken rule to encode next. That feedback loop is how the system goes from "helpful" to "invisible," which is the goal.

---

## 5. Why me

I have already built and operated the hard version of this: SlashCal is a live AI scheduling assistant with an inbound-email state machine, LLM intent classification, confidence-gated auto-booking, follow-up nudges, and Slack-based monitoring, plus a companion outreach engine running an 11-job scheduler with reply classification and rate-limit guardrails. And before I built any of it, I spent two years doing the operational work by hand: coordination, standups, follow-ups, inbox and ticket triage for a remote team on US hours. I understand the work before I automate it, which is the whole thesis of this role.
