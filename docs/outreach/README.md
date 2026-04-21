# Outreach backend

Backend that powers the Sweet Dreams cold outreach workflow per the CRM Outreach System Design v0.1 (PDF at `SweetDreamsBusiness/ops/crm/Sweet_Dreams_CRM_Outreach_System_Design_v0.1.pdf`).

No new database schema. Outreach metadata lives inside a structured block appended to the existing `clients.notes` field. Gmail labels drive the approval state machine. This backend provides:

- **Notes block parser + serializer** — `src/lib/outreach/notesBlock.ts`
- **Brand-voice validators** (no-dashes rule) — `src/lib/outreach/validators.ts`
- **Template registry** (role × service) — `src/lib/outreach/templates.ts`
- **Gmail label constants** — `src/lib/outreach/gmailLabels.ts`
- **API routes for Cowork** — `src/app/api/outreach/*`

## Documentation

- [CoworkIntegration.md](./CoworkIntegration.md) — full API contract + pseudocode for Cowork
- [NotesBlockFormat.md](./NotesBlockFormat.md) — Notes block schema + parser behavior
- [Templates.md](./Templates.md) — writing templates + slot reference
- [BrandRules.md](./BrandRules.md) — brand-voice rules enforced at the API boundary

## Authentication

All `/api/outreach/*` endpoints require `Authorization: Bearer <OUTREACH_API_KEY>`. The key lives in Vercel env. Give the same value to Cowork at agent configuration time.

## Environment variables

```
OUTREACH_API_KEY=<long-random-string>
```

## Deployment

No migrations to run. Just set `OUTREACH_API_KEY` in Vercel env and deploy.
