// POST /api/outreach/clients/:id/reply
//   Records an inbound reply. Per PDF §3.3, moves client status to Trial.
//   Body: {
//     thread_id: string (required)
//     gmail_message_id?: string
//     sent?: string (YYYY-MM-DD)
//     from_email?: string
//     subject?: string
//     snippet?: string
//   }

import { NextRequest, NextResponse } from 'next/server'
import { createOutreachSupabase } from '@/lib/outreach/supabase'
import { requireCoworkAuth } from '@/lib/outreach/auth'
import {
  parseNotesBlock,
  applyBlockToNotes,
  appendSendHistory,
  type OutreachBlock,
  type SendHistoryEntry,
} from '@/lib/outreach/notesBlock'

export const dynamic = 'force-dynamic'

/* eslint-disable @typescript-eslint/no-explicit-any */

function emptyBlock(): OutreachBlock {
  return { contacts: [], cross_refs: [], send_history: [], unknown_keys: {} }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const unauthorized = requireCoworkAuth(req)
  if (unauthorized) return unauthorized

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.thread_id) {
    return NextResponse.json({ error: 'thread_id is required' }, { status: 400 })
  }

  const supabase = createOutreachSupabase() as any
  const { data: current, error: readError } = await supabase
    .from('clients')
    .select('notes, status')
    .eq('id', params.id)
    .single()
  if (readError) return NextResponse.json({ error: readError.message }, { status: 404 })

  const existingBlock = parseNotesBlock(current.notes) || emptyBlock()

  const replyEntry: SendHistoryEntry = {
    thread_id: body.thread_id,
    gmail_message_id: body.gmail_message_id,
    sent: body.sent || new Date().toISOString().slice(0, 10),
    type: 'reply_inbound',
    ...(body.from_email || body.subject || body.snippet
      ? {
          extra: {
            ...(body.from_email ? { from: body.from_email } : {}),
            ...(body.subject ? { subject: body.subject } : {}),
            ...(body.snippet ? { snippet: body.snippet } : {}),
          },
        }
      : {}),
  }
  const nextBlock = appendSendHistory(existingBlock, replyEntry)
  nextBlock.next_step = 'reply_received_review'

  const nextNotes = applyBlockToNotes(current.notes, nextBlock)

  // Per PDF §3.3: on reply, Prospect becomes Trial.
  const nextStatus = current.status === 'prospect' ? 'trial' : current.status

  const { data, error: updateError } = await supabase
    .from('clients')
    .update({ notes: nextNotes, status: nextStatus })
    .eq('id', params.id)
    .select()
    .single()
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({
    client: { ...data, outreach_block: parseNotesBlock(data.notes) },
  })
}
