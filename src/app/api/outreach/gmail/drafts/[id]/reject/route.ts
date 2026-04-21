// POST /api/outreach/gmail/drafts/:id/reject
//   Deletes the draft from Gmail + updates the prospect's block if linked.
// Body: { prospect_id?, reason?: string }

import { NextRequest, NextResponse } from 'next/server'
import { requireCoworkAuth } from '@/lib/outreach/auth'
import { rejectDraft } from '@/lib/outreach/gmail'
import { createOutreachSupabase } from '@/lib/outreach/supabase'
import {
  parseNotesBlock,
  applyBlockToNotes,
  clearDraft,
} from '@/lib/outreach/notesBlock'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireCoworkAuth(req)
  if (unauthorized) return unauthorized

  let body: any = {}
  try { body = await req.json() } catch { /* empty ok */ }
  const { prospect_id, reason } = body

  try {
    await rejectDraft(params.id, reason)

    if (prospect_id) {
      const supabase = createOutreachSupabase() as any
      const { data: current } = await supabase
        .from('clients')
        .select('notes')
        .eq('id', prospect_id)
        .single()
      if (current) {
        const block = parseNotesBlock(current.notes)
        if (block) {
          const next = clearDraft(block)
          next.next_step = 'manual_review'
          const nextNotes = applyBlockToNotes(current.notes, next)
          await supabase.from('clients').update({ notes: nextNotes }).eq('id', prospect_id)
        }
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: m }, { status: 500 })
  }
}
