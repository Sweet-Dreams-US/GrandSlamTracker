# Outreach Notes Block Format

Structured metadata for outreach lives inside the existing `clients.notes` TEXT column, wrapped in markers:

```
==SWEETDREAMS_OUTREACH_V1==
<fields>
==END==
```

Anything in `clients.notes` outside those markers is preserved untouched on every write. Cole can hand-type meeting notes in the same field and they never get clobbered.

## Full example

```
==SWEETDREAMS_OUTREACH_V1==
Service: aerial_cinema
Project: Parkview Health Fort Wayne Phase 2
Project_Role: Owner
Project_ETA: 2026_Q4
Project_City: Fort Wayne, IN
Project_State: IN
Project_Drive_Bucket: A
Hook: local flagship hospital expansion, Inspire 2 finished building flyover
Contacts:
  - name: Jane Smith, role: Marketing Director, email: jsmith@parkview.com, phone: 260 555 0100, source: website_team_page
  - name: Comms Team, role: Inbox, email: marketing@parkview.com, source: website_contact
Cross_Refs:
  - Architect: HKS Inc, child_account_id: 42
  - GC: Turner Construction, child_account_id: 88
Draft: {gmail_draft_id: r-1234567, created: 2026-04-20, role_template: aerial_owner_cold_v1, state: pending_approval}
Send_History:
  - {thread_id: 18a5b7c0, sent: 2026-04-21, type: cold_open}
Next_Step: schedule_followup_day6
==END==
```

## Field reference

### Scalar fields (one-line `Key: value`)

| Field | Type | Description |
|---|---|---|
| `Service` | string | Service line. Valid: `aerial_cinema`, `music`, `video`, `photo`, `other` |
| `Project` | string | Project name (e.g. "Parkview Health Fort Wayne Phase 2") |
| `Project_Role` | string | Our role relative to this contact: `Owner`, `Architect`, `GC`, `Marketing`, `Venue`, etc. |
| `Project_ETA` | string | Anticipated completion/milestone (e.g. `2026_Q4`) |
| `Project_City` | string | City |
| `Project_State` | string | State (2-letter) |
| `Project_Drive_Bucket` | string | Google Drive bucket identifier (`A`, `B`, etc.) |
| `Hook` | string | One-line reason this is a fit. Used in templates. |
| `Next_Step` | string | `wait_for_reply`, `schedule_followup_day6`, `schedule_followup_day17`, `booked_call`, `stop_paused`, `stop_terminated`, `manual_review`, or custom |

### List fields (key on its own line, `  - ` prefixed items)

#### `Contacts:`

Each item: `- name: X, role: Y, email: Z, phone: P, source: S`

Recognized keys per contact: `name` (required), `role`, `email`, `phone`, `source`. Any additional keys (`linkedin`, etc.) are preserved as `extra`.

**Every contact MUST have a `source` field.** This is a brand rule (PDF §4.3). Cowork cannot add contacts without citing how it found them.

#### `Cross_Refs:`

Each item: `- Architect: HKS Inc, child_account_id: 42`

First key is the relationship kind (Architect, GC, Owner, Partner, etc.), remaining keys are attributes.

#### `Send_History:`

Each item: `- {thread_id: 18a..., sent: 2026-04-21, type: cold_open}`

Recognized keys: `thread_id`, `gmail_message_id`, `sent` (ISO date), `type` (`cold_open`, `followup_day6`, `reply_inbound`, etc.). Extra keys preserved under `extra`.

### Inline-brace field

#### `Draft: {...}`

One-line JSON-ish dict. Keys:

- `gmail_draft_id` — from Gmail MCP `create_draft`
- `created` — ISO date
- `role_template` — template used to generate (e.g. `aerial_owner_cold_v1`)
- `state` — `pending_approval`, `approved`, `sent`, `abandoned`, `failed`, `rejected`, `none`
- `notes` — optional free text

Only one `Draft` is tracked at a time. When a draft is sent, it moves to `Send_History` and the `Draft` field clears.

## Parser behavior

- Case-insensitive for keys at parse time (`service:`, `Service:`, and `SERVICE:` all work). Serialization always uses canonical casing.
- Whitespace around `:` is flexible.
- Unknown scalar keys are preserved under `unknown_keys` on the parsed object and round-tripped on write.
- Quoted values (`"Jane Smith, MD"` or `'value, with, commas'`) are respected in inline KV parsing.
- The parser tolerates missing sections (e.g. no `Contacts:` list is fine; returns `[]`).

## Round-trip guarantees

1. Parsing then re-serializing the block produces equivalent data (order may change; values preserved).
2. Fields the parser doesn't recognize are kept under `unknown_keys` and emitted at the bottom of the block.
3. Content outside the `==...==` markers is never modified by any backend operation.
4. Contacts with the same email (case insensitive) merge on POST instead of duplicating.

## Known limitations

- Multi-line values inside a scalar field are not supported. If you need a multi-paragraph hook, put it in `hook:` as a single line with `\n` literals or keep it short.
- Nested lists are not supported. `Cross_Refs` items can't themselves contain sub-lists.
- The format is optimized for human editing + Cowork writes. It is not YAML — do NOT pipe it through a YAML parser.

## Where this is used

- Read: `parseNotesBlock(notes)` in `src/lib/outreach/notesBlock.ts`
- Write / merge: `applyBlockToNotes(notes, block)`
- Strip: `removeBlockFromNotes(notes)`
- Helpers: `setDraft`, `clearDraft`, `appendSendHistory`, `upsertContact`, `removeContactByEmail`

All `/api/outreach/*` endpoints that read or write `clients.notes` go through these helpers.
