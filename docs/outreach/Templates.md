# Outreach Templates

Templates are pure strings with `{slot_name}` merge fields, stored in `src/lib/outreach/templates.ts`.

## Template ID convention

`<service>_<role>_<kind>_v<n>`

Examples:
- `aerial_owner_cold_v1`
- `aerial_architect_cold_v1`
- `aerial_gc_cold_v1`
- `aerial_owner_followup_day6_v1`
- `aerial_owner_breakup_v1`

Versioning lets us A/B compare performance without breaking prior references in `Send_History`.

## Services × Roles × Kinds

| Services | Roles | Kinds |
|---|---|---|
| `aerial`, `music`, `video`, `photo` | `owner`, `architect`, `gc`, `marketing`, `venue`, `other` | `cold`, `followup_day6`, `followup_day17`, `breakup` |

Not every combination needs a template — add as needs arise.

## Slots

Every template can reference any subset of these slots:

| Slot | Source | Default |
|---|---|---|
| `{first_name}` | Contact first name from roster | `team` |
| `{company}` | `clients.business_name` | — |
| `{project}` | Notes block `Project` | — |
| `{city_state}` | Notes block `Project_City, Project_State` | — |
| `{role_hook}` | Notes block `Hook`, matched to contact role | — |
| `{service_line}` | `aerial cinema`, `music`, etc. | — |
| `{reel_link}` | Service-specific portfolio URL | `https://sweetdreams.us/work` (aerial) |
| `{signoff_name}` | Sender name | `Cole Marcuccilli` |
| `{signoff_company}` | Sender company | `Sweet Dreams Media` |
| `{signoff_location}` | Sender location | `Fort Wayne, IN` |
| `{signoff_url}` | Sender URL | `sweetdreams.us` |

Cowork can pass arbitrary extra slots; they render as-is. Unknown slots in a template render as empty strings and are surfaced in `missing_slots`.

## Brand rules enforced

1. **No dashes anywhere.** Templates are written without dashes; the validator rejects any rendered output that contains dashes outside URLs/emails/handles. If you write a new template with a dash, the render endpoint will flag it.
2. **Keep bodies 70–120 words for first touches.** Warnings fire at <30 or >220 words.
3. **Body must reference Cole or Sweet Dreams for signoff.** Warning fires if neither appears.

## Writing a new template

Add to the `TEMPLATES` array in `src/lib/outreach/templates.ts`:

```ts
{
  id: 'aerial_marketing_cold_v1',
  service: 'aerial',
  role: 'marketing',
  kind: 'cold',
  version: 1,
  description: 'First touch to marketing director. Leans on asset value.',
  subject: 'Aerials your marketing team can push on {project}',
  body: `Hi {first_name},

... copy ...

Best,
{signoff_name}
{signoff_company}
{signoff_location}`,
},
```

Then:

1. Ship the code change (no DB migration — templates are a TypeScript registry).
2. Cowork can reference it immediately via `GET /api/outreach/templates?service=aerial&role=marketing`.
3. Include the template ID in `Draft.role_template` when logging drafts so `Send_History` carries provenance.

## Rendering

Via API:

```
POST /api/outreach/templates/render
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

Response:

```json
{
  "template_id": "aerial_owner_cold_v1",
  "subject": "...",
  "body": "...",
  "missing_slots": [],
  "applied_defaults": ["first_name", "signoff_name", ...],
  "validation": { "ok": true, "subject_dashes": {...}, "body_dashes": {...}, "warnings": [] }
}
```

Always check `validation.ok === true` before calling Gmail MCP `create_draft`.

## Starter template library (shipped)

- `aerial_owner_cold_v1` — first touch to project owner
- `aerial_architect_cold_v1` — first touch to architecture firm
- `aerial_gc_cold_v1` — first touch to general contractor
- `aerial_owner_followup_day6_v1` — day 6 follow up
- `aerial_owner_breakup_v1` — final touch before pausing

All dash-free, all use `https://sweetdreams.us/work` as the reel link.
