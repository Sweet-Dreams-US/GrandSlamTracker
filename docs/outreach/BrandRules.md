# Outreach Brand Rules

Rules Cowork must follow, enforced at the API boundary wherever possible.

## 1. No dashes in generated copy

Any character in the "dash family" is forbidden in rendered email subjects and bodies:

- U+002D HYPHEN-MINUS
- U+2010 HYPHEN
- U+2011 NON-BREAKING HYPHEN
- U+2012 FIGURE DASH
- U+2013 EN DASH
- U+2014 EM DASH
- U+2015 HORIZONTAL BAR
- U+00AD SOFT HYPHEN
- U+FE58 SMALL EM DASH
- U+FE63 SMALL HYPHEN-MINUS
- U+FF0D FULLWIDTH HYPHEN-MINUS

**Exceptions:** URLs (`https://...`), email addresses (`foo@bar-baz.com`), `@handles`, and `#hashtags` are permitted to contain dashes since they are literal references, not stylistic choices.

**Enforcement:**
- `src/lib/outreach/validators.ts#checkForDashes` — standalone utility
- `POST /api/outreach/validate/email` — API endpoint Cowork must call before `create_draft`
- `POST /api/outreach/templates/render` — validation runs automatically on every render

**Workaround for prose:** commas, semicolons, or a new sentence usually replace a dash cleanly. Example:
- Before: `Flat, three-dimensional, real-world depth`
- After: `Flat, three dimensional, real depth`

## 2. No sourceless contacts

Every contact added to a client's outreach roster MUST have a `source` field. If Cowork cannot cite where it found the contact, the contact is not added.

**Enforcement:** `POST /api/outreach/clients/:id/contacts` rejects requests with no `source` (400).

Acceptable source values (examples, not exhaustive):
- `website_team_page`
- `website_contact`
- `website_press`
- `linkedin_profile`
- `press_release`
- `project_filing`
- `dodge_data`
- `enr_listing`
- `vol4_backlog`
- `referral:<person_name>`
- `inbox_guess` — only if defaulting to `marketing@`/`info@`; counts as second-touch, not first

## 3. No autosend until explicitly enabled

Default posture: Cowork creates Gmail drafts and stops. Cole approves by relabeling or sending manually.

Autosend is gated on:
1. Gmail MCP exposing a `send` capability
2. Cole flipping a config flag explicitly

Until both are true, Cowork NEVER calls `gmail.send()`.

## 4. Daily send cap: 40 first touches

For domain warmup and deliverability. Cowork enforces at its own scheduler level. If the daily queue exceeds 40, the excess goes to tomorrow.

## 5. No auto-reply to inbound

When Cowork detects an inbound reply, it drafts a response for Cole to review. It never sends a reply unattended.

## 6. No mass data sharing across clients

Each client has its own contact roster and own thread history. Cowork does not copy contacts from one client's Notes block to another. Even if Jane Smith works at both Client A and Client B, she is added separately to each with a distinct `source`.

## Implementation surface

| Rule | Where it's enforced |
|---|---|
| No dashes | `validators.ts` + `/api/outreach/validate/email` + template render endpoint |
| Sourced contacts | `/api/outreach/clients/:id/contacts` POST 400 check |
| No autosend | Gmail MCP capability gating (external to this backend) |
| Daily send cap | Cowork scheduler (external) |
| No auto-reply | Cowork behavior (external) |
| No cross-client sharing | Schema: each client's outreach block is scoped to that row |

The backend's job is to make the enforceable rules impossible to bypass via the API. The non-enforceable ones (daily cap, autosend gating) live in Cowork's own logic.
