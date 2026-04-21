# Outreach ↔ Cowork Integration Guide

**For Claude Cowork (or any external automation).** How to drive cold outreach through the Nightmares Turned to Dreams platform per the CRM Outreach System Design v0.1.

---

## The loop (one approval cycle)

```
1. Research            Cowork finds a project; checks if already in CRM.
2. Create client       POST /api/outreach/clients (status=prospect, outreach_block populated).
3. Draft email         Cowork renders template + validates (no dashes) + calls Gmail create_draft.
4. Log draft pointer   POST /api/outreach/clients/:id/draft with gmail_draft_id.
5. (User reviews)      Cole opens Outreach/Pending in Gmail, edits, approves by:
                         a) relabeling to Outreach/Approved, or
                         b) sending manually.
6. Send                (Phase 1 manual / Phase 2 Cowork sends on Approved.)
7. Log send            POST /api/outreach/clients/:id/send with thread_id.
8. Watch replies       Cowork polls Gmail for inbound in the thread.
9. Log reply           POST /api/outreach/clients/:id/reply — platform moves client to Trial.
10. Follow up          If no reply in 6 days, loop back to step 3 with followup_day6 template.
```

The platform is the source of truth for **who we're chasing and where they are in the pipeline.** Gmail is the source of truth for **the actual email content and send/reply events.**

---

## Authentication

All endpoints require:

```
Authorization: Bearer <OUTREACH_API_KEY>
```

Key is set in Vercel env vars. Cowork stores the same value.

---

## Base URL

Production: `https://nightmaresturntodreams.com`

---

## Endpoints

### 1. List outreach clients

```
GET /api/outreach/clients?status=<csv>&service=<service>&draft_state=<state>&has_block=true|false&limit=<n>
```

Query:
- `status` — `prospect`, `trial`, `active`, `paused`, `terminated` (CSV for multi)
- `service` — `aerial_cinema`, `music`, `video`, `photo`
- `draft_state` — `pending_approval`, `approved`, `sent`, `abandoned`, `failed`, `rejected`, `none`
- `has_block` — filter to clients with (or without) an outreach Notes block
- `limit` — default 100, max 500

Returns `{ clients: [...] }` where each client includes `outreach_block` (parsed) alongside the raw client fields.

Cowork usage:
- `?status=prospect&has_block=true&draft_state=none` — prospects awaiting initial draft
- `?draft_state=approved` — drafts Cole approved; send these
- `?status=prospect&older_than_days=6` — candidates for follow-up (combine with /hygiene)

### 2. Get one client (with parsed block)

```
GET /api/outreach/clients/:id
```

Returns `{ client: { ...row, outreach_block } }`.

### 3. Create a new outreach client

```
POST /api/outreach/clients
Content-Type: application/json

{
  "business_name": "Lutheran Health Network",        // REQUIRED
  "display_name": "Lutheran Health",
  "status": "prospect",                              // default "prospect"
  "industry": "healthcare",                          // defaults to "outreach_prospect" if omitted
  "website_url": "https://lutheranhealth.com",
  "primary_contact_name": "Jane Smith",
  "primary_contact_email": "jsmith@parkview.com",
  "primary_contact_phone": "260 555 0100",
  "outreach_block": {
    "service": "aerial_cinema",
    "project": "Parkview Health Fort Wayne Phase 2",
    "project_role": "Owner",
    "project_eta": "2026_Q4",
    "project_city": "Fort Wayne",
    "project_state": "IN",
    "project_drive_bucket": "A",
    "hook": "local flagship hospital expansion, Inspire 2 finished building flyover",
    "contacts": [
      { "name": "Jane Smith", "role": "Marketing Director", "email": "jsmith@parkview.com", "phone": "260 555 0100", "source": "website_team_page" },
      { "name": "Comms Team", "role": "Inbox", "email": "marketing@parkview.com", "source": "website_contact" }
    ],
    "cross_refs": [
      { "kind": "Architect", "name": "HKS Inc" },
      { "kind": "GC", "name": "Turner Construction" }
    ],
    "next_step": "ready_to_draft"
  }
}
```

Returns the created client with the serialized block written into `notes`.

### 4. Update a client (merge-safe block patch)

```
PATCH /api/outreach/clients/:id
Content-Type: application/json

{
  "status": "paused",                // optional row fields
  "outreach_block": { "hook": "updated hook line" },   // patched into existing block
  "replace_block": false             // default false; set true to overwrite entirely
}
```

Partial `outreach_block` updates merge: provided fields replace, omitted fields keep existing values. Use `replace_block: true` to wipe the block and start over.

**Important:** The platform preserves any freeform text in `notes` that lives outside the `==SWEETDREAMS_OUTREACH_V1==...==END==` markers. Cole's meeting notes are safe.

### 5. Delete outreach data (keeps client record)

```
DELETE /api/outreach/clients/:id
```

Strips the outreach block from `notes`. The `clients` row is retained. To fully delete a client, use the existing `/clients` UI / admin path.

---

### 6. Contacts — manage the roster

```
GET    /api/outreach/clients/:id/contacts
POST   /api/outreach/clients/:id/contacts
DELETE /api/outreach/clients/:id/contacts?email=<email>
```

POST body:

```json
{
  "name": "Jane Smith",              // REQUIRED
  "role": "Marketing Director",
  "email": "jsmith@parkview.com",
  "phone": "260 555 0100",
  "source": "website_team_page"      // REQUIRED per brand rule (no sourceless contacts)
}
```

Upserts by email (case insensitive). Returns the updated contacts array.

---

### 7. Log a draft pointer

Called AFTER Cowork successfully creates the draft via Gmail MCP `create_draft`.

```
POST /api/outreach/clients/:id/draft
Content-Type: application/json

{
  "gmail_draft_id": "r-1234567890",        // REQUIRED, from Gmail MCP
  "role_template": "aerial_owner_cold_v1", // which template used
  "created": "2026-04-20",                 // default today
  "state": "pending_approval",             // default "pending_approval"
  "notes": "optional free text"
}
```

Writes `Draft: {...}` into the Notes block and sets `Next_Step: await_approval`.

---

### 8. Log a send

Called AFTER Cowork (or Cole) sends and Cowork has the Gmail thread ID.

```
POST /api/outreach/clients/:id/send
Content-Type: application/json

{
  "thread_id": "18a5b7c0...",              // REQUIRED, Gmail thread ID
  "gmail_message_id": "18a5b7c0a...",      // optional
  "sent": "2026-04-21",                    // default today
  "type": "cold_open",                     // "cold_open" | "followup_day6" | etc.
  "clear_draft": true,                     // clear the Draft pointer (default true)
  "next_step": "schedule_followup_day6"    // default
}
```

Appends to `Send_History`, clears the `Draft` pointer.

---

### 9. Log an inbound reply

Called when Cowork detects a new inbound message on a tracked outreach thread. Platform bumps client status from `prospect` → `trial` per PDF §3.3.

```
POST /api/outreach/clients/:id/reply
Content-Type: application/json

{
  "thread_id": "18a5b7c0...",              // REQUIRED
  "gmail_message_id": "18bc4d9e...",       // optional
  "from_email": "jsmith@parkview.com",
  "subject": "Re: Cinema flyover of Parkview Health...",
  "snippet": "Thanks for reaching out, Cole...",
  "sent": "2026-04-25"
}
```

---

### 10. Dashboard KPIs

```
GET /api/outreach/dashboard
```

Returns:

```json
{
  "totals": {
    "total_outreach": 42,
    "new_prospects_this_week": 7,
    "drafts_pending_over_48h": 3,
    "prospects_stale_over_30d": 5,
    "trials_stale_over_60d": 1
  },
  "counts": {
    "by_status":      { "prospect": 30, "trial": 8, "active": 4 },
    "by_draft_state": { "pending_approval": 5, "sent": 28, "approved": 1 },
    "by_service":     { "aerial_cinema": 40, "music": 2 }
  },
  "queues": {
    "drafts_pending_over_48h":  [ { id, business_name, updated_at }, ... ],
    "prospects_stale_over_30d": [ ... ],
    "trials_stale_over_60d":    [ ... ]
  }
}
```

Used by the weekly hygiene brief.

---

### 11. Hygiene query

```
GET /api/outreach/hygiene?older_than_days=30&status=prospect&action=paused
```

Returns clients matching the stale criteria, with parsed outreach blocks. Cowork decides what to do (usually: move to `paused` via PATCH, or flag for review).

---

### 12. Templates

```
GET /api/outreach/templates?service=aerial&role=owner&kind=cold
```

Returns matching templates from the registry.

```
POST /api/outreach/templates/render
Content-Type: application/json

{
  "template_id": "aerial_owner_cold_v1",
  "slots": {
    "first_name": "Jane",
    "company": "Parkview Health",
    "project": "Parkview Health Fort Wayne Phase 2",
    "city_state": "Fort Wayne, IN"
  }
}
```

Returns:

```json
{
  "template_id": "aerial_owner_cold_v1",
  "subject": "Cinema flyover of Parkview Health Fort Wayne Phase 2",
  "body": "...",
  "missing_slots": [],
  "applied_defaults": ["signoff_name", "signoff_company", ...],
  "validation": {
    "ok": true,
    "subject_dashes": { "ok": true, "count": 0, "hits": [], "normalized": "..." },
    "body_dashes":    { "ok": true, "count": 0, "hits": [], "normalized": "..." },
    "warnings": []
  }
}
```

### 13. Validate an email draft

```
POST /api/outreach/validate/email
Content-Type: application/json

{ "subject": "...", "body": "..." }
```

Must be called BEFORE Cowork invokes Gmail MCP `create_draft`. If `validation.ok` is `false`, Cowork should NOT create the draft. Regenerate or sanitize.

### 14. Label reference

```
GET /api/outreach/labels
```

Returns the canonical Gmail label names Cowork should ensure exist on first run, plus the transition rules.

---

## Recommended Cowork behavior

### Before creating any Gmail draft

1. Render template via `POST /api/outreach/templates/render` with prospect slots.
2. If `missing_slots` is non-empty, fill them from the client record + outreach block (or mark the prospect `researching` and stop).
3. Verify `validation.ok === true`. If `validation.body_dashes.hits` has entries, ask yourself to rewrite without dashes and re-validate.
4. Then call Gmail MCP `create_draft` with the validated subject + body.
5. Immediately POST to `/api/outreach/clients/:id/draft` with the returned Gmail draft ID. This is the link between the platform record and the Gmail draft.

### Safety rails (PDF §4.3)

- **No dashes in generated copy.** API validates; Cowork also self-checks.
- **Never invent contacts.** Every contact has a `source` field. If Cowork cannot cite the source, do not add the contact.
- **No mass send bursts.** Phase 1 cap: 40 first touches per day. Cowork enforces in its own scheduler.
- **No auto-reply to inbound.** Inbound replies are drafted for Cole to review, never sent.
- **No autosend until explicitly enabled.** Default state is "draft only, pending approval."

### Polling cadence

Per PDF §6:

- **Daily research pass** — once a day, 6am ET. Cap: 20 new prospects. Surplus goes to a backlog file.
- **Daily send/sync pass** — twice a day, 9am + 2pm ET. Cap: 40 sends.
- **Weekly hygiene pass** — Monday 7am ET. Uses `/api/outreach/dashboard` + `/api/outreach/hygiene`.
- **Monthly expansion pass** — first Monday of the month.

---

## Example Cowork workflow (pseudocode)

```
// 1. Daily send/sync pass (9am + 2pm)

// 1a. Find approved drafts in Gmail (by label) and send
labels_approved = gmail.list_threads_by_label("Outreach/Approved")
for thread in labels_approved:
    draft = gmail.get_draft_from_thread(thread.id)
    // Phase 2 only: gmail.send(draft) — currently, Cole sends manually

    // After send (either by Cowork in phase 2 or by Cole manually):
    POST /api/outreach/clients/{client_id}/send {
        thread_id: thread.id,
        gmail_message_id: draft.message_id,
        sent: today,
        type: "cold_open"
    }
    gmail.relabel(thread.id, remove="Outreach/Approved", add="Outreach/Sent")

// 1b. Scan inbound replies on tracked threads
tracked_threads = get_outbound_threads_from_notes()  // via GET /api/outreach/clients?draft_state=sent
for thread in tracked_threads:
    new_inbound = gmail.get_thread(thread.id).new_messages_since_last_check()
    for msg in new_inbound:
        POST /api/outreach/clients/{client_id}/reply {
            thread_id: thread.id,
            gmail_message_id: msg.id,
            from_email: msg.from,
            subject: msg.subject,
            snippet: msg.snippet,
            sent: msg.date
        }
        gmail.relabel(thread.id, remove="Outreach/Sent", add="Outreach/Replied")
```

```
// 2. Daily research pass (6am)

new_projects = research_sources()  // Dodge, ENR, Vol 4 backlog, etc.
for project in new_projects[:20]:  // cap at 20/day
    if already_in_crm(project):
        continue

    client_payload = extract_client_fields(project)
    block_payload = extract_outreach_block(project)

    client = POST /api/outreach/clients {...client_payload, outreach_block: block_payload}

    // Render template + validate + draft
    rendered = POST /api/outreach/templates/render {
        template_id: "aerial_owner_cold_v1",
        slots: {...}
    }
    if !rendered.validation.ok:
        continue  // or sanitize + re-validate

    gmail_draft = gmail.create_draft(
        to=client.primary_contact_email,
        subject=rendered.subject,
        body=rendered.body,
        labels=["Outreach/Pending", "Outreach/Aerial"]
    )

    POST /api/outreach/clients/{client.id}/draft {
        gmail_draft_id: gmail_draft.id,
        role_template: "aerial_owner_cold_v1",
        created: today,
        state: "pending_approval"
    }

write_daily_digest(new_count, backlog_count)
```

```
// 3. Weekly hygiene pass (Monday 7am)

kpis = GET /api/outreach/dashboard
stale_prospects = GET /api/outreach/hygiene?older_than_days=30&status=prospect
for p in stale_prospects:
    PATCH /api/outreach/clients/{p.id} { status: "paused" }

stale_trials = GET /api/outreach/hygiene?older_than_days=60&status=trial
flag_for_cole(stale_trials)

build_weekly_brief(kpis, stale_prospects, stale_trials)
```

---

## Notes block round-trip

The platform parses `clients.notes` to extract the `==SWEETDREAMS_OUTREACH_V1==...==END==` block and returns it as `outreach_block`. Any text outside the block is preserved on every update.

See [NotesBlockFormat.md](./NotesBlockFormat.md) for the full schema.

---

## Testing with curl

```sh
# List prospects with a pending draft
curl -H "Authorization: Bearer $OUTREACH_API_KEY" \
     "https://nightmaresturntodreams.com/api/outreach/clients?draft_state=pending_approval"

# Render a template
curl -X POST -H "Authorization: Bearer $OUTREACH_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{"template_id":"aerial_owner_cold_v1","slots":{"first_name":"Jane","company":"Parkview Health","project":"Parkview Health Fort Wayne Phase 2","city_state":"Fort Wayne, IN"}}' \
     "https://nightmaresturntodreams.com/api/outreach/templates/render"
```

---

## Related

- `src/lib/outreach/notesBlock.ts` — parser
- `src/lib/outreach/validators.ts` — dash detection
- `src/lib/outreach/templates.ts` — template registry
- `src/lib/outreach/gmailLabels.ts` — label constants
- PDF: `SweetDreamsBusiness/ops/crm/Sweet_Dreams_CRM_Outreach_System_Design_v0.1.pdf`
