// GET  /api/outreach/gmail/drafts?label=Outreach/Pending&limit=50
//   List drafts with a given label (default Outreach/Pending).
//   Returns a lightweight draft row shape with subject, to, body preview, label ids.
//
// POST /api/outreach/gmail/drafts
//   Body: { to, subject, body, service_label?, prospect_id? }
//   Creates a Gmail draft under cole@sweetdreams.us with Outreach/Pending (+ optional
//   service tag) labels. If prospect_id is provided, writes the Draft pointer into
//   that prospect's outreach Notes block.

import { NextRequest, NextResponse } from 'next/server'
import { requireCoworkAuth } from '@/lib/outreach/auth'
import { createDraft, listDraftsByLabel } from '@/lib/outreach/gmail'
import { GMAIL_LABELS } from '@/lib/outreach/gmailLabels'
import { createOutreachSupabase } from '@/lib/outreach/supabase'
import {
  parseNotesBlock,
  applyBlockToNotes,
  setDraft,
  type OutreachBlock,
} from '@/lib/outreach/notesBlock'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(req: NextRequest) {
  const unauthorized = requireCoworkAuth(req)
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(req.url)
  const label = searchParams.get('label') || GMAIL_LABELS.PENDING
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)

  try {
    const drafts = await listDraftsByLabel(label, limit)
    return NextResponse.json({ drafts, label })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const unauthorized = requireCoworkAuth(req)
  if (unauthorized) return unauthorized

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { to, subject, body: emailBody, service_label, prospect_id, role_template } = body
  if (!to || !subject || !emailBody) {
    return NextResponse.json(
      { error: 'to, subject, and body are required' },
      { status: 400 }
    )
  }

  try {
    const draft = await createDraft({
      to,
      subject,
      body: emailBody,
      serviceLabel: service_label,
    })

    // Optionally write a Draft pointer into the prospect's outreach block
    if (prospect_id) {
      const supabase = createOutreachSupabase() as any
      const { data: current } = await supabase
        .from('clients')
        .select('notes')
        .eq('id', prospect_id)
        .single()
      if (current) {
        const block = parseNotesBlock(current.notes) || {
          contacts: [],
          cross_refs: [],
          send_history: [],
          unknown_keys: {},
        }
        const nextBlock = setDraft(block, {
          gmail_draft_id: draft.id,
          created: new Date().toISOString().slice(0, 10),
          role_template: role_template,
          state: 'pending_approval',
        })
        ;(nextBlock as OutreachBlock).next_step = 'await_approval'
        const nextNotes = applyBlockToNotes(current.notes, nextBlock)
        await supabase
          .from('clients')
          .update({ notes: nextNotes, status: 'prospect' })
          .eq('id', prospect_id)
      }
    }

    return NextResponse.json({ draft }, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
