// GET    /api/outreach/clients/:id/contacts
// POST   /api/outreach/clients/:id/contacts    { name, role?, email?, phone?, source?, extra? }
// DELETE /api/outreach/clients/:id/contacts?email=<email>
//
// Manages the contacts roster inside the outreach Notes block. Upserts are
// by email (case insensitive).

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { requireCoworkAuth } from '@/lib/outreach/auth'
import {
  parseNotesBlock,
  applyBlockToNotes,
  upsertContact,
  removeContactByEmail,
  type OutreachBlock,
  type OutreachContact,
} from '@/lib/outreach/notesBlock'

export const dynamic = 'force-dynamic'

/* eslint-disable @typescript-eslint/no-explicit-any */

async function loadBlock(id: string) {
  const supabase = createServerClient() as any
  const { data, error } = await supabase
    .from('clients')
    .select('notes')
    .eq('id', id)
    .single()
  if (error) return { error, block: null, notes: null, supabase }
  const block = parseNotesBlock(data.notes)
  return { error: null, block, notes: data.notes as string | null, supabase }
}

function emptyBlock(): OutreachBlock {
  return { contacts: [], cross_refs: [], send_history: [], unknown_keys: {} }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const unauthorized = requireCoworkAuth(req)
  if (unauthorized) return unauthorized

  const { block, error } = await loadBlock(params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  return NextResponse.json({ contacts: block?.contacts ?? [] })
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const unauthorized = requireCoworkAuth(req)
  if (unauthorized) return unauthorized

  let body: OutreachContact
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  if (!body.source) {
    // Per §4.3: every contact must have a source. Cowork cannot add sourceless contacts.
    return NextResponse.json(
      { error: 'source is required per brand rule (no sourceless contacts)' },
      { status: 400 }
    )
  }

  const { block, notes, supabase, error } = await loadBlock(params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  const nextBlock = upsertContact(block || emptyBlock(), body)
  const nextNotes = applyBlockToNotes(notes, nextBlock)

  const { data, error: updateError } = await supabase
    .from('clients')
    .update({ notes: nextNotes })
    .eq('id', params.id)
    .select('notes')
    .single()
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({
    contacts: parseNotesBlock(data.notes)?.contacts ?? [],
  })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const unauthorized = requireCoworkAuth(req)
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(req.url)
  const email = searchParams.get('email')
  if (!email) return NextResponse.json({ error: 'email query param is required' }, { status: 400 })

  const { block, notes, supabase, error } = await loadBlock(params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  if (!block) return NextResponse.json({ contacts: [] })

  const nextBlock = removeContactByEmail(block, email)
  const nextNotes = applyBlockToNotes(notes, nextBlock)

  const { data, error: updateError } = await supabase
    .from('clients')
    .update({ notes: nextNotes })
    .eq('id', params.id)
    .select('notes')
    .single()
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  return NextResponse.json({
    contacts: parseNotesBlock(data.notes)?.contacts ?? [],
  })
}
