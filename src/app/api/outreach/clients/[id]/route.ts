// GET    /api/outreach/clients/:id
// PATCH  /api/outreach/clients/:id
//   Body:
//     {
//       ...standard client fields to update (business_name, status, etc.)
//       outreach_block?: Partial<OutreachBlock>   // merge-patched into existing block
//       replace_block?: boolean                    // if true, replace block entirely instead of merging
//     }
// DELETE /api/outreach/clients/:id

import { NextRequest, NextResponse } from 'next/server'
import { createOutreachSupabase } from '@/lib/outreach/supabase'
import { requireCoworkAuth } from '@/lib/outreach/auth'
import {
  parseNotesBlock,
  applyBlockToNotes,
  removeBlockFromNotes,
  type OutreachBlock,
} from '@/lib/outreach/notesBlock'

export const dynamic = 'force-dynamic'

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const unauthorized = requireCoworkAuth(req)
  if (unauthorized) return unauthorized

  const supabase = createOutreachSupabase() as any
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  return NextResponse.json({
    client: { ...data, outreach_block: parseNotesBlock(data.notes) },
  })
}

export async function PATCH(
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

  const { outreach_block, replace_block, ...updates } = body

  const supabase = createOutreachSupabase() as any
  // Read current notes + block
  const { data: current, error: readError } = await supabase
    .from('clients')
    .select('notes')
    .eq('id', params.id)
    .single()
  if (readError) return NextResponse.json({ error: readError.message }, { status: 404 })

  let finalNotes = current.notes as string | null
  // Caller explicitly set notes? honor it, but still allow outreach_block below to overwrite the embedded block.
  if (Object.prototype.hasOwnProperty.call(updates, 'notes')) {
    finalNotes = updates.notes
    delete updates.notes
  }

  if (outreach_block) {
    let merged: OutreachBlock
    if (replace_block) {
      merged = {
        contacts: outreach_block.contacts ?? [],
        cross_refs: outreach_block.cross_refs ?? [],
        send_history: outreach_block.send_history ?? [],
        unknown_keys: {},
        service: outreach_block.service,
        project: outreach_block.project,
        project_role: outreach_block.project_role,
        project_eta: outreach_block.project_eta,
        project_city: outreach_block.project_city,
        project_state: outreach_block.project_state,
        project_drive_bucket: outreach_block.project_drive_bucket,
        hook: outreach_block.hook,
        draft: outreach_block.draft,
        next_step: outreach_block.next_step,
      }
    } else {
      const existing = parseNotesBlock(finalNotes)
      merged = {
        contacts: outreach_block.contacts ?? existing?.contacts ?? [],
        cross_refs: outreach_block.cross_refs ?? existing?.cross_refs ?? [],
        send_history: outreach_block.send_history ?? existing?.send_history ?? [],
        unknown_keys: existing?.unknown_keys ?? {},
        service: outreach_block.service ?? existing?.service,
        project: outreach_block.project ?? existing?.project,
        project_role: outreach_block.project_role ?? existing?.project_role,
        project_eta: outreach_block.project_eta ?? existing?.project_eta,
        project_city: outreach_block.project_city ?? existing?.project_city,
        project_state: outreach_block.project_state ?? existing?.project_state,
        project_drive_bucket: outreach_block.project_drive_bucket ?? existing?.project_drive_bucket,
        hook: outreach_block.hook ?? existing?.hook,
        draft: outreach_block.draft ?? existing?.draft,
        next_step: outreach_block.next_step ?? existing?.next_step,
      }
    }
    finalNotes = applyBlockToNotes(finalNotes, merged)
  }

  const { data, error } = await supabase
    .from('clients')
    .update({ ...updates, notes: finalNotes })
    .eq('id', params.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    client: { ...data, outreach_block: parseNotesBlock(data.notes) },
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const unauthorized = requireCoworkAuth(req)
  if (unauthorized) return unauthorized

  // Soft delete: just strip the outreach block. Client record stays intact.
  // Destructive client deletion still uses the existing /clients UI path.
  const supabase = createOutreachSupabase() as any
  const { data: current, error: readError } = await supabase
    .from('clients')
    .select('notes')
    .eq('id', params.id)
    .single()
  if (readError) return NextResponse.json({ error: readError.message }, { status: 404 })

  const stripped = removeBlockFromNotes(current.notes)
  const { data, error } = await supabase
    .from('clients')
    .update({ notes: stripped })
    .eq('id', params.id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    client: { ...data, outreach_block: null },
    message: 'Outreach block removed. Client record retained.',
  })
}
