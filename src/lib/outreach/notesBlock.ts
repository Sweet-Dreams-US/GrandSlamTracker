// Notes block parser + serializer for the Sweet Dreams outreach workflow.
//
// Every outreach-active client has a structured block embedded inside
// `clients.notes`, bounded by the markers below. Everything outside the
// markers is preserved on write (freeform notes Cole may have added).
//
// Format (per CRM Outreach System Design v0.1, §3.2):
//
//   ==SWEETDREAMS_OUTREACH_V1==
//   Service: aerial_cinema
//   Project: Parkview Health Fort Wayne Phase 2
//   Project_Role: Owner
//   Project_ETA: 2026_Q4
//   Project_City: Fort Wayne, IN
//   Project_State: IN
//   Project_Drive_Bucket: A
//   Hook: local flagship hospital expansion, Inspire 2 finished building flyover
//   Contacts:
//     - name: Jane Smith, role: Marketing Director, email: jsmith@parkview.com, phone: 260 555 0100, source: website_team_page
//     - name: Comms Team, role: Inbox, email: marketing@parkview.com, source: website_contact
//   Cross_Refs:
//     - Architect: HKS Inc, child_account_id: 42
//     - GC: Turner Construction, child_account_id: 88
//   Draft: {gmail_draft_id: r-1234567, created: 2026-04-20, role_template: owner_cold_v1, state: pending_approval}
//   Send_History:
//     - {thread_id: 18a..., sent: 2026-04-21, type: cold_open}
//   Next_Step: wait_for_reply | schedule_followup_day6
//   ==END==

export const BLOCK_START = '==SWEETDREAMS_OUTREACH_V1=='
export const BLOCK_END = '==END=='

export type ServiceLine = 'aerial_cinema' | 'music' | 'video' | 'photo' | 'other'

export type DraftState =
  | 'pending_approval'   // draft written by Cowork, awaiting Cole
  | 'approved'           // Cole relabeled or sent
  | 'sent'               // Cowork confirmed send
  | 'abandoned'          // draft deleted by Cole without sending
  | 'failed'             // send errored
  | 'rejected'           // Cole moved to DoNotSend
  | 'none'               // no current draft

export type NextStep =
  | 'wait_for_reply'
  | 'schedule_followup_day6'
  | 'schedule_followup_day17'
  | 'booked_call'
  | 'stop_paused'
  | 'stop_terminated'
  | 'manual_review'
  | string // allow free string for custom steps

export interface OutreachContact {
  name: string
  role?: string
  email?: string
  phone?: string
  source?: string
  // Additional free kv pairs (e.g. linkedin) retained on read-modify-write
  extra?: Record<string, string>
}

export interface CrossRef {
  kind: string              // "Architect", "GC", "Owner", "Partner", etc.
  name: string
  child_account_id?: string | number | null
  extra?: Record<string, string>
}

export interface DraftInfo {
  gmail_draft_id?: string
  created?: string          // ISO date (YYYY-MM-DD)
  role_template?: string    // e.g. "owner_cold_v1"
  state: DraftState
  notes?: string
}

export interface SendHistoryEntry {
  thread_id?: string
  gmail_message_id?: string
  sent?: string             // ISO date
  type?: string             // cold_open, followup_day6, reply, etc.
  extra?: Record<string, string>
}

export interface OutreachBlock {
  service?: ServiceLine | string
  project?: string
  project_role?: string     // "Owner" | "Architect" | "GC" | ...
  project_eta?: string
  project_city?: string
  project_state?: string
  project_drive_bucket?: string
  hook?: string
  contacts: OutreachContact[]
  cross_refs: CrossRef[]
  draft?: DraftInfo
  send_history: SendHistoryEntry[]
  next_step?: NextStep
  // Anything else we didn't recognize gets captured verbatim so a round-trip
  // doesn't strip data Cowork or a human may have added.
  unknown_keys: Record<string, string>
}

// ─────────────────────────────────────────────────────────────────
// Parse
// ─────────────────────────────────────────────────────────────────

/** Locate block boundaries. Returns null if the block is not present. */
export function findBlock(notes: string | null | undefined): { start: number; end: number; raw: string } | null {
  if (!notes) return null
  const startIdx = notes.indexOf(BLOCK_START)
  if (startIdx < 0) return null
  const afterStart = startIdx + BLOCK_START.length
  const endIdx = notes.indexOf(BLOCK_END, afterStart)
  if (endIdx < 0) return null
  const blockEndInclusive = endIdx + BLOCK_END.length
  return { start: startIdx, end: blockEndInclusive, raw: notes.slice(startIdx, blockEndInclusive) }
}

/** Parse a Notes field (or just the block text itself) into an OutreachBlock. */
export function parseNotesBlock(notes: string | null | undefined): OutreachBlock | null {
  const located = findBlock(notes)
  if (!located) return null

  // Strip the start/end markers
  const inner = located.raw.slice(BLOCK_START.length, -BLOCK_END.length).trim()

  const block: OutreachBlock = {
    contacts: [],
    cross_refs: [],
    send_history: [],
    unknown_keys: {},
  }

  // Line-by-line parse. Top-level lines are `Key: value` or `Key:` (for lists).
  // Continuation list items are indented with two spaces and start with `- `.
  const lines = inner.split(/\r?\n/)

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }

    // Top-level key line
    const kvMatch = line.match(/^([A-Za-z][A-Za-z0-9_]*)\s*:\s*(.*)$/)
    if (!kvMatch) { i++; continue }

    const rawKey = kvMatch[1]
    const valueInline = kvMatch[2].trim()
    const key = rawKey.toLowerCase()

    if (valueInline === '') {
      // Expect indented list items on subsequent lines
      const items: string[] = []
      i++
      while (i < lines.length && /^\s+-\s+/.test(lines[i])) {
        items.push(lines[i].replace(/^\s+-\s+/, '').trim())
        i++
      }

      switch (key) {
        case 'contacts':
          block.contacts.push(...items.map(parseInlineKV).map(kvToContact))
          break
        case 'cross_refs':
          block.cross_refs.push(...items.map(parseInlineKV).map(kvToCrossRef))
          break
        case 'send_history':
          block.send_history.push(...items.map(parseInlineOrBrace).map(kvToSend))
          break
        default:
          // Preserve unknown list keys as joined string (rare)
          block.unknown_keys[rawKey] = items.join('\n')
      }
      continue
    }

    // Scalar or inline-brace value
    switch (key) {
      case 'service':            block.service = valueInline; break
      case 'project':            block.project = valueInline; break
      case 'project_role':       block.project_role = valueInline; break
      case 'project_eta':        block.project_eta = valueInline; break
      case 'project_city':       block.project_city = valueInline; break
      case 'project_state':      block.project_state = valueInline; break
      case 'project_drive_bucket': block.project_drive_bucket = valueInline; break
      case 'hook':               block.hook = valueInline; break
      case 'next_step':          block.next_step = valueInline; break
      case 'draft': {
        const kv = parseInlineOrBrace(valueInline)
        block.draft = kvToDraft(kv)
        break
      }
      default:
        block.unknown_keys[rawKey] = valueInline
    }
    i++
  }

  return block
}

// ─────────────────────────────────────────────────────────────────
// Serialize
// ─────────────────────────────────────────────────────────────────

export function serializeNotesBlock(block: OutreachBlock): string {
  const lines: string[] = []
  lines.push(BLOCK_START)

  if (block.service) lines.push(`Service: ${block.service}`)
  if (block.project) lines.push(`Project: ${block.project}`)
  if (block.project_role) lines.push(`Project_Role: ${block.project_role}`)
  if (block.project_eta) lines.push(`Project_ETA: ${block.project_eta}`)
  if (block.project_city) lines.push(`Project_City: ${block.project_city}`)
  if (block.project_state) lines.push(`Project_State: ${block.project_state}`)
  if (block.project_drive_bucket) lines.push(`Project_Drive_Bucket: ${block.project_drive_bucket}`)
  if (block.hook) lines.push(`Hook: ${block.hook}`)

  if (block.contacts.length > 0) {
    lines.push('Contacts:')
    for (const c of block.contacts) {
      lines.push(`  - ${contactToInline(c)}`)
    }
  }

  if (block.cross_refs.length > 0) {
    lines.push('Cross_Refs:')
    for (const r of block.cross_refs) {
      lines.push(`  - ${crossRefToInline(r)}`)
    }
  }

  if (block.draft) {
    lines.push(`Draft: ${draftToBrace(block.draft)}`)
  }

  if (block.send_history.length > 0) {
    lines.push('Send_History:')
    for (const s of block.send_history) {
      lines.push(`  - ${sendToBrace(s)}`)
    }
  }

  if (block.next_step) lines.push(`Next_Step: ${block.next_step}`)

  // Preserve unknown keys
  for (const [k, v] of Object.entries(block.unknown_keys)) {
    lines.push(`${k}: ${v}`)
  }

  lines.push(BLOCK_END)
  return lines.join('\n')
}

// ─────────────────────────────────────────────────────────────────
// Merge — apply a block to a Notes string, preserving surrounding text
// ─────────────────────────────────────────────────────────────────

export function applyBlockToNotes(currentNotes: string | null | undefined, block: OutreachBlock): string {
  const serialized = serializeNotesBlock(block)
  const existing = findBlock(currentNotes)

  if (!existing) {
    const base = (currentNotes || '').trimEnd()
    return base ? `${base}\n\n${serialized}\n` : `${serialized}\n`
  }

  const before = (currentNotes || '').slice(0, existing.start).replace(/\s+$/, '')
  const after = (currentNotes || '').slice(existing.end).replace(/^\s+/, '')

  const parts: string[] = []
  if (before) parts.push(before)
  parts.push(serialized)
  if (after) parts.push(after)
  return parts.join('\n\n') + '\n'
}

/** Remove the outreach block from a Notes string, preserving freeform content. */
export function removeBlockFromNotes(currentNotes: string | null | undefined): string {
  const existing = findBlock(currentNotes)
  if (!existing) return currentNotes || ''
  const before = (currentNotes || '').slice(0, existing.start).trimEnd()
  const after = (currentNotes || '').slice(existing.end).trimStart()
  return [before, after].filter(Boolean).join('\n\n')
}

// ─────────────────────────────────────────────────────────────────
// Immutable updates (pure helpers for Cowork API calls)
// ─────────────────────────────────────────────────────────────────

export function setDraft(block: OutreachBlock, draft: DraftInfo): OutreachBlock {
  return { ...block, draft: { ...draft } }
}

export function clearDraft(block: OutreachBlock): OutreachBlock {
  return { ...block, draft: undefined }
}

export function appendSendHistory(block: OutreachBlock, entry: SendHistoryEntry): OutreachBlock {
  return { ...block, send_history: [...block.send_history, { ...entry }] }
}

export function upsertContact(block: OutreachBlock, contact: OutreachContact): OutreachBlock {
  const next = [...block.contacts]
  const match = contact.email
    ? next.findIndex((c) => c.email && c.email.toLowerCase() === contact.email!.toLowerCase())
    : -1
  if (match >= 0) {
    next[match] = { ...next[match], ...contact }
  } else {
    next.push(contact)
  }
  return { ...block, contacts: next }
}

export function removeContactByEmail(block: OutreachBlock, email: string): OutreachBlock {
  return { ...block, contacts: block.contacts.filter((c) => c.email?.toLowerCase() !== email.toLowerCase()) }
}

// ─────────────────────────────────────────────────────────────────
// Internal: KV line helpers
// ─────────────────────────────────────────────────────────────────

/** Parse `key: value, key: value` inline KV into a Record. Respects `{...}` braces if present. */
function parseInlineOrBrace(input: string): Record<string, string> {
  const trimmed = input.trim()
  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return parseInlineKV(trimmed.slice(1, -1))
  }
  return parseInlineKV(trimmed)
}

/** Parse comma-separated `key: value` pairs. Values can contain colons and commas if quoted with "..." or '...'. */
function parseInlineKV(input: string): Record<string, string> {
  const out: Record<string, string> = {}
  const parts = splitTopLevelCommas(input)
  for (const part of parts) {
    const trimmed = part.trim()
    if (!trimmed) continue
    const colonIdx = trimmed.indexOf(':')
    if (colonIdx < 0) {
      // Bare value — treat as a flag
      out[trimmed] = 'true'
      continue
    }
    const key = trimmed.slice(0, colonIdx).trim().toLowerCase()
    let value = trimmed.slice(colonIdx + 1).trim()
    // Strip matching surrounding quotes
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    out[key] = value
  }
  return out
}

/** Split on top-level commas, ignoring commas inside quotes or braces. */
function splitTopLevelCommas(input: string): string[] {
  const out: string[] = []
  let depth = 0
  let quote: '"' | "'" | null = null
  let buf = ''
  for (let i = 0; i < input.length; i++) {
    const ch = input[i]
    if (quote) {
      buf += ch
      if (ch === quote) quote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      buf += ch
      continue
    }
    if (ch === '{' || ch === '[') { depth++; buf += ch; continue }
    if (ch === '}' || ch === ']') { depth--; buf += ch; continue }
    if (ch === ',' && depth === 0) {
      out.push(buf)
      buf = ''
      continue
    }
    buf += ch
  }
  if (buf) out.push(buf)
  return out
}

function kvToContact(kv: Record<string, string>): OutreachContact {
  const known = new Set(['name', 'role', 'email', 'phone', 'source'])
  const extra: Record<string, string> = {}
  for (const [k, v] of Object.entries(kv)) {
    if (!known.has(k)) extra[k] = v
  }
  return {
    name: kv.name || '',
    role: kv.role,
    email: kv.email,
    phone: kv.phone,
    source: kv.source,
    ...(Object.keys(extra).length > 0 ? { extra } : {}),
  }
}

function contactToInline(c: OutreachContact): string {
  const parts: string[] = []
  if (c.name) parts.push(`name: ${c.name}`)
  if (c.role) parts.push(`role: ${c.role}`)
  if (c.email) parts.push(`email: ${c.email}`)
  if (c.phone) parts.push(`phone: ${c.phone}`)
  if (c.source) parts.push(`source: ${c.source}`)
  if (c.extra) {
    for (const [k, v] of Object.entries(c.extra)) parts.push(`${k}: ${v}`)
  }
  return parts.join(', ')
}

function kvToCrossRef(kv: Record<string, string>): CrossRef {
  // First key is the kind (e.g. "architect"), remaining are attributes.
  const entries = Object.entries(kv)
  if (entries.length === 0) return { kind: '', name: '' }
  const [firstKey, firstValue] = entries[0]
  const extra: Record<string, string> = {}
  let name = firstValue
  let childAccountId: string | number | null | undefined
  for (let i = 1; i < entries.length; i++) {
    const [k, v] = entries[i]
    if (k === 'child_account_id' || k === 'child account id') {
      const n = Number(v)
      childAccountId = Number.isNaN(n) ? v : n
    } else if (k === 'name') {
      name = v
    } else {
      extra[k] = v
    }
  }
  return {
    kind: capitalize(firstKey),
    name,
    child_account_id: childAccountId ?? null,
    ...(Object.keys(extra).length > 0 ? { extra } : {}),
  }
}

function crossRefToInline(r: CrossRef): string {
  const parts: string[] = [`${r.kind}: ${r.name}`]
  if (r.child_account_id !== undefined && r.child_account_id !== null) {
    parts.push(`child_account_id: ${r.child_account_id}`)
  }
  if (r.extra) {
    for (const [k, v] of Object.entries(r.extra)) parts.push(`${k}: ${v}`)
  }
  return parts.join(', ')
}

function kvToDraft(kv: Record<string, string>): DraftInfo {
  return {
    gmail_draft_id: kv.gmail_draft_id,
    created: kv.created,
    role_template: kv.role_template,
    state: (kv.state as DraftState) || 'pending_approval',
    notes: kv.notes,
  }
}

function draftToBrace(d: DraftInfo): string {
  const parts: string[] = []
  if (d.gmail_draft_id) parts.push(`gmail_draft_id: ${d.gmail_draft_id}`)
  if (d.created) parts.push(`created: ${d.created}`)
  if (d.role_template) parts.push(`role_template: ${d.role_template}`)
  parts.push(`state: ${d.state}`)
  if (d.notes) parts.push(`notes: ${d.notes}`)
  return `{${parts.join(', ')}}`
}

function kvToSend(kv: Record<string, string>): SendHistoryEntry {
  const known = new Set(['thread_id', 'gmail_message_id', 'sent', 'type'])
  const extra: Record<string, string> = {}
  for (const [k, v] of Object.entries(kv)) {
    if (!known.has(k)) extra[k] = v
  }
  return {
    thread_id: kv.thread_id,
    gmail_message_id: kv.gmail_message_id,
    sent: kv.sent,
    type: kv.type,
    ...(Object.keys(extra).length > 0 ? { extra } : {}),
  }
}

function sendToBrace(s: SendHistoryEntry): string {
  const parts: string[] = []
  if (s.thread_id) parts.push(`thread_id: ${s.thread_id}`)
  if (s.gmail_message_id) parts.push(`gmail_message_id: ${s.gmail_message_id}`)
  if (s.sent) parts.push(`sent: ${s.sent}`)
  if (s.type) parts.push(`type: ${s.type}`)
  if (s.extra) {
    for (const [k, v] of Object.entries(s.extra)) parts.push(`${k}: ${v}`)
  }
  return `{${parts.join(', ')}}`
}

function capitalize(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}
