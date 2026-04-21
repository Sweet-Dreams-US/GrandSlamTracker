// POST /api/outreach/clients/:id/draft
//   Records a Gmail draft pointer in the Notes block.
//   Body: {
//     gmail_draft_id: string (required)
//     role_template?: string
//     created?: string (YYYY-MM-DD, defaults to today)
//     state?: DraftState (defaults to "pending_approval")
//     notes?: string
//   }
//
// Does NOT create the draft in Gmail — Cowork does that via Gmail MCP first,
// then calls this endpoint with the returned draft ID.

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { requireCoworkAuth } from '@/lib/outreach/auth'
import {
  parseNotesBlock,
  applyBlockToNotes,
  setDraft,
  type OutreachBlock,
  type DraftInfo,
  type DraftState,
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

  if (!body.gmail_draft_id) {
    return NextResponse.json({ error: 'gmail_draft_id is required' }, { status: 400 })
  }

  const supabase = createServerClient() as any
  const { data: current, error: readError } = await supabase
    .from('clients')
    .select('notes, status')
    .eq('id', params.id)
    .single()
  if (readError) return NextResponse.json({ error: readError.message }, { status: 404 })

  const existingBlock = parseNotesBlock(current.notes) || emptyBlock()
  const draft: DraftInfo = {
    gmail_draft_id: body.gmail_draft_id,
    created: body.created || new Date().toISOString().slice(0, 10),
    role_template: body.role_template,
    state: (body.state as DraftState) || 'pending_approval',
    notes: body.notes,
  }
  const nextBlock = setDraft(existingBlock, draft)
  nextBlock.next_step = nextBlock.next_step || 'await_approval'

  const nextNotes = applyBlockToNotes(current.notes, nextBlock)

  // If status is still "prospect" or empty, leave it — PDF §4 moves to Trial only when a reply comes in.
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
