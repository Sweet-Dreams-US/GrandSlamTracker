// POST /api/outreach/gmail/drafts/:id/send
//   Sends the draft via Gmail API. Flips Pending → Sent labels, logs to
//   the prospect's Notes block if prospect_id is provided.
// Body: { prospect_id?, type?: string }

import { NextRequest, NextResponse } from 'next/server'
import { requireCoworkAuth } from '@/lib/outreach/auth'
import { sendDraft } from '@/lib/outreach/gmail'
import { createOutreachSupabase } from '@/lib/outreach/supabase'
import {
  parseNotesBlock,
  applyBlockToNotes,
  appendSendHistory,
  clearDraft,
  type SendHistoryEntry,
} from '@/lib/outreach/notesBlock'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireCoworkAuth(req)
  if (unauthorized) return unauthorized

  let body: any = {}
  try { body = await req.json() } catch { /* empty body ok */ }
  const { prospect_id, type = 'cold_open', next_step = 'schedule_followup_day6' } = body

  try {
    const sent = await sendDraft(params.id)

    if (prospect_id) {
      const supabase = createOutreachSupabase() as any
      const { data: current } = await supabase
        .from('clients')
        .select('notes, status')
        .eq('id', prospect_id)
        .single()
      if (current) {
        const block = parseNotesBlock(current.notes) || {
          contacts: [],
          cross_refs: [],
          send_history: [],
          unknown_keys: {},
        }
        const entry: SendHistoryEntry = {
          gmail_message_id: sent.message_id,
          thread_id: sent.thread_id,
          sent: new Date().toISOString().slice(0, 10),
          type,
        }
        let next = appendSendHistory(block, entry)
        next = clearDraft(next)
        next.next_step = next_step
        const nextNotes = applyBlockToNotes(current.notes, next)
        await supabase
          .from('clients')
          .update({ notes: nextNotes })
          .eq('id', prospect_id)
      }
    }

    return NextResponse.json({ ok: true, message_id: sent.message_id, thread_id: sent.thread_id })
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: m }, { status: 500 })
  }
}
