// High-level Gmail operations for the outreach workflow.
//
// All operations impersonate cole@sweetdreams.us via the nightmares-outreach
// service account + domain-wide delegation. Label state machine is the
// approval UI:
//
//   Outreach/Pending   -> awaiting Cole's review
//   Outreach/Approved  -> about to send (or already sent by Cowork)
//   Outreach/Sent      -> out the door
//   Outreach/Replied   -> prospect replied, needs human
//   Outreach/DoNotSend -> killed
//   Outreach/Aerial /Music/Video/Photo -> service tags

import { getGmailApi, ALL_GMAIL_SCOPES, type GmailScope } from './google-auth'
import { GMAIL_LABELS, REQUIRED_LABELS } from './gmailLabels'

/* eslint-disable @typescript-eslint/no-explicit-any */

// ───────────────────────────────────────────────────────────────
// Labels
// ───────────────────────────────────────────────────────────────

export interface GmailLabelRow {
  id: string
  name: string
  type?: string | null
}

export async function listLabels(): Promise<GmailLabelRow[]> {
  const gmail = await getGmailApi(['https://www.googleapis.com/auth/gmail.labels'] as GmailScope[])
  const res = await gmail.users.labels.list({ userId: 'me' })
  return (res.data.labels || []).map((l) => ({
    id: l.id!,
    name: l.name!,
    type: l.type,
  }))
}

export async function getLabelIdByName(name: string): Promise<string | null> {
  const labels = await listLabels()
  return labels.find((l) => l.name === name)?.id || null
}

export async function ensureLabel(name: string): Promise<string> {
  const existing = await getLabelIdByName(name)
  if (existing) return existing
  const gmail = await getGmailApi(['https://www.googleapis.com/auth/gmail.labels'] as GmailScope[])
  const res = await gmail.users.labels.create({
    userId: 'me',
    requestBody: {
      name,
      labelListVisibility: 'labelShow',
      messageListVisibility: 'show',
    },
  })
  return res.data.id!
}

/** Create all 10 required labels. Idempotent. */
export async function ensureAllRequiredLabels(): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  for (const name of REQUIRED_LABELS) {
    out[name] = await ensureLabel(name)
  }
  return out
}

// ───────────────────────────────────────────────────────────────
// Drafts
// ───────────────────────────────────────────────────────────────

export interface CreateDraftInput {
  to: string
  subject: string
  body: string              // plain text body
  from?: string             // defaults to the impersonated user
  replyToThreadId?: string  // for follow-ups
  serviceLabel?: string     // e.g. GMAIL_LABELS.AERIAL; applied on create
}

export interface DraftRow {
  id: string
  message_id?: string | null
  thread_id?: string | null
  subject?: string | null
  to?: string | null
  snippet?: string | null
  body?: string | null
  label_ids?: string[]
  internal_date?: string | null
}

function buildMime({ to, subject, body, from, replyToThreadId }: CreateDraftInput): string {
  const headers = [
    from ? `From: ${from}` : null,
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/plain; charset=UTF-8',
    'MIME-Version: 1.0',
  ].filter(Boolean) as string[]
  void replyToThreadId // threadId is set via API field, not header
  return headers.join('\r\n') + '\r\n\r\n' + body
}

export async function createDraft(input: CreateDraftInput): Promise<DraftRow> {
  const gmail = await getGmailApi([
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.labels',
  ] as GmailScope[])

  // Ensure required labels exist up-front (idempotent + cheap)
  const pendingId = await ensureLabel(GMAIL_LABELS.PENDING)
  let serviceId: string | null = null
  if (input.serviceLabel) {
    serviceId = await ensureLabel(input.serviceLabel)
  }

  const raw = Buffer.from(buildMime(input)).toString('base64url')

  const draftRes = await gmail.users.drafts.create({
    userId: 'me',
    requestBody: {
      message: {
        raw,
        ...(input.replyToThreadId ? { threadId: input.replyToThreadId } : {}),
      },
    },
  })

  const draftId = draftRes.data.id!
  const messageId = draftRes.data.message?.id
  const threadId = draftRes.data.message?.threadId

  // Apply labels to the draft's underlying message
  if (messageId) {
    const addLabelIds = [pendingId]
    if (serviceId) addLabelIds.push(serviceId)
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: { addLabelIds },
    })
  }

  return {
    id: draftId,
    message_id: messageId,
    thread_id: threadId,
    subject: input.subject,
    to: input.to,
  }
}

export async function listDraftsByLabel(labelName: string, limit = 100): Promise<DraftRow[]> {
  const gmail = await getGmailApi(['https://www.googleapis.com/auth/gmail.readonly'] as GmailScope[])

  const labelId = await getLabelIdByName(labelName)
  if (!labelId) return []

  // Gmail drafts endpoint doesn't support label filter directly.
  // Workaround: list messages with the label, then cross-reference.
  const messagesRes = await gmail.users.messages.list({
    userId: 'me',
    labelIds: [labelId],
    maxResults: Math.min(limit, 500),
    q: 'in:drafts',
  })

  const msgs = messagesRes.data.messages || []

  const draftsList = await gmail.users.drafts.list({ userId: 'me', maxResults: 500 })
  const messageIdToDraftId = new Map<string, string>()
  for (const d of draftsList.data.drafts || []) {
    if (d.message?.id && d.id) messageIdToDraftId.set(d.message.id, d.id)
  }

  const rows: DraftRow[] = []
  for (const m of msgs) {
    const draftId = messageIdToDraftId.get(m.id!)
    if (!draftId) continue
    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: m.id!,
      format: 'full',
    })
    rows.push(messageToDraftRow(draftId, detail.data))
  }
  return rows
}

export async function getDraft(draftId: string): Promise<DraftRow | null> {
  const gmail = await getGmailApi(['https://www.googleapis.com/auth/gmail.readonly'] as GmailScope[])
  try {
    const res = await gmail.users.drafts.get({
      userId: 'me',
      id: draftId,
      format: 'full',
    })
    if (!res.data.message?.id) return null
    return messageToDraftRow(draftId, res.data.message)
  } catch {
    return null
  }
}

export async function updateDraft(
  draftId: string,
  input: Pick<CreateDraftInput, 'to' | 'subject' | 'body' | 'from'>
): Promise<DraftRow> {
  const gmail = await getGmailApi([
    'https://www.googleapis.com/auth/gmail.compose',
  ] as GmailScope[])
  const raw = Buffer.from(buildMime(input)).toString('base64url')
  const res = await gmail.users.drafts.update({
    userId: 'me',
    id: draftId,
    requestBody: { message: { raw } },
  })
  return {
    id: res.data.id!,
    message_id: res.data.message?.id,
    thread_id: res.data.message?.threadId,
    subject: input.subject,
    to: input.to,
  }
}

export async function deleteDraft(draftId: string): Promise<void> {
  const gmail = await getGmailApi([
    'https://www.googleapis.com/auth/gmail.compose',
  ] as GmailScope[])
  await gmail.users.drafts.delete({ userId: 'me', id: draftId })
}

/**
 * Send a draft. Moves label from Pending → Sent on the resulting message.
 * Returns the sent message metadata (thread_id is what we log to Send_History).
 */
export async function sendDraft(draftId: string): Promise<{ message_id: string; thread_id: string }> {
  const gmail = await getGmailApi([
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.labels',
  ] as GmailScope[])

  const pendingId = await getLabelIdByName(GMAIL_LABELS.PENDING)
  const approvedId = await getLabelIdByName(GMAIL_LABELS.APPROVED)
  const sentId = await ensureLabel(GMAIL_LABELS.SENT)

  const res = await gmail.users.drafts.send({
    userId: 'me',
    requestBody: { id: draftId },
  })

  const messageId = res.data.id!
  const threadId = res.data.threadId!

  // Flip labels on the sent message
  const removeLabelIds: string[] = []
  if (pendingId) removeLabelIds.push(pendingId)
  if (approvedId) removeLabelIds.push(approvedId)

  try {
    await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: [sentId],
        removeLabelIds: removeLabelIds.length > 0 ? removeLabelIds : undefined,
      },
    })
  } catch {
    // Labeling failure shouldn't fail the send.
  }

  return { message_id: messageId, thread_id: threadId }
}

/**
 * Move a draft to "do not send": applies DoNotSend label + deletes the draft.
 * Returns void; caller should also update the prospect's outreach block.
 */
export async function rejectDraft(draftId: string, reason?: string): Promise<void> {
  void reason // reserved for future audit log
  const gmail = await getGmailApi([
    'https://www.googleapis.com/auth/gmail.compose',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.labels',
  ] as GmailScope[])

  // Just delete the draft — no need to label a deleted draft.
  try {
    await gmail.users.drafts.delete({ userId: 'me', id: draftId })
  } catch {
    // Idempotent
  }
}

// ───────────────────────────────────────────────────────────────
// Threads (for reply detection)
// ───────────────────────────────────────────────────────────────

export async function getThread(threadId: string) {
  const gmail = await getGmailApi(['https://www.googleapis.com/auth/gmail.readonly'] as GmailScope[])
  const res = await gmail.users.threads.get({
    userId: 'me',
    id: threadId,
    format: 'full',
  })
  return res.data
}

export async function searchThreads(query: string, limit = 50) {
  const gmail = await getGmailApi(['https://www.googleapis.com/auth/gmail.readonly'] as GmailScope[])
  const res = await gmail.users.threads.list({
    userId: 'me',
    q: query,
    maxResults: Math.min(limit, 500),
  })
  return res.data.threads || []
}

/** Mark a thread as replied: add Replied label, remove Sent. */
export async function markThreadReplied(threadId: string): Promise<void> {
  const gmail = await getGmailApi([
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.labels',
  ] as GmailScope[])
  const sentId = await getLabelIdByName(GMAIL_LABELS.SENT)
  const repliedId = await ensureLabel(GMAIL_LABELS.REPLIED)
  await gmail.users.threads.modify({
    userId: 'me',
    id: threadId,
    requestBody: {
      addLabelIds: [repliedId],
      removeLabelIds: sentId ? [sentId] : undefined,
    },
  })
}

// ───────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────

function messageToDraftRow(draftId: string, msg: any): DraftRow {
  const headers = msg.payload?.headers || []
  const getHeader = (name: string) =>
    headers.find((h: any) => h.name?.toLowerCase() === name.toLowerCase())?.value || null
  const subject = getHeader('Subject')
  const to = getHeader('To')
  const from = getHeader('From')
  void from
  const body = extractPlainTextBody(msg.payload)
  return {
    id: draftId,
    message_id: msg.id,
    thread_id: msg.threadId,
    subject,
    to,
    snippet: msg.snippet,
    body,
    label_ids: msg.labelIds || [],
    internal_date: msg.internalDate,
  }
}

function extractPlainTextBody(payload: any): string | null {
  if (!payload) return null
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64url').toString('utf8')
  }
  if (payload.parts) {
    for (const part of payload.parts) {
      const b = extractPlainTextBody(part)
      if (b) return b
    }
  }
  return null
}

export { GMAIL_LABELS, REQUIRED_LABELS, ALL_GMAIL_SCOPES }
