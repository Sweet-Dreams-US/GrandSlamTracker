// POST /api/outreach/clients/:id/send
//   Records a sent email into the Notes block's Send_History.
//   Body: {
//     thread_id: string (required)           Gmail thread ID
//     gmail_message_id?: string              Gmail message ID of the outbound
//     sent?: string (YYYY-MM-DD)             Defaults to today
//     type?: string                          "cold_open", "followup_day6", etc.
//     clear_draft?: boolean                  If true, clears the Draft pointer (defaults to true)
//     next_step?: NextStep                   Defaults to "schedule_followup_day6"
//   }

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { requireCoworkAuth } from '@/lib/outreach/auth'
import {
  parseNotesBlock,
  applyBlockToNotes,
  appendSendHistory,
  clearDraft,
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

  const supabase = createServerClient() as any
  const { data: current, error: readError } = await supabase
    .from('clients')
    .select('notes, status')
    .eq('id', params.id)
    .single()
  if (readError) return NextResponse.json({ error: readError.message }, { status: 404 })

  const existingBlock = parseNotesBlock(current.notes) || emptyBlock()

  const sendEntry: SendHistoryEntry = {
    thread_id: body.thread_id,
    gmail_message_id: body.gmail_message_id,
    sent: body.sent || new Date().toISOString().slice(0, 10),
    type: body.type || 'cold_open',
  }
  let nextBlock = appendSendHistory(existingBlock, sendEntry)
  if (body.clear_draft !== false) nextBlock = clearDraft(nextBlock)
  nextBlock.next_step = body.next_step || 'schedule_followup_day6'

  const nextNotes = applyBlockToNotes(current.notes, nextBlock)

  const { data, error: updateError } = await supabase
    .from('clients')
    .update({ notes: nextNotes })
    .eq('id', params.id)
    .select()
    .single()
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({
    client: { ...data, outreach_block: parseNotesBlock(data.notes) },
  })
}
