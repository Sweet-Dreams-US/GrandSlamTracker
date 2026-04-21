// GET  /api/outreach/clients
//   ?status=<csv>            e.g. "prospect,trial"
//   ?service=<service>       e.g. "aerial_cinema"
//   ?draft_state=<state>     e.g. "pending_approval"
//   ?has_block=true|false    include/exclude clients that have a Notes block
//   ?limit=<n>               default 100, max 500
//
// POST /api/outreach/clients
//   Creates a client with the outreach Notes block populated.
//   Body is a ClientInsert + `outreach_block: Partial<OutreachBlock>`.

import { NextRequest, NextResponse } from 'next/server'
import { createOutreachSupabase } from '@/lib/outreach/supabase'
import { requireCoworkAuth } from '@/lib/outreach/auth'
import {
  parseNotesBlock,
  applyBlockToNotes,
  type OutreachBlock,
} from '@/lib/outreach/notesBlock'

export const dynamic = 'force-dynamic'

/* eslint-disable @typescript-eslint/no-explicit-any */

type ClientRow = {
  id: string
  business_name: string
  display_name: string | null
  status: string
  industry: string
  website_url: string | null
  primary_contact_name: string | null
  primary_contact_email: string | null
  primary_contact_phone: string | null
  notes: string | null
  created_at: string
  updated_at: string
  [key: string]: any
}

type ClientWithOutreach = ClientRow & {
  outreach_block: OutreachBlock | null
}

function attachOutreachBlock(c: ClientRow): ClientWithOutreach {
  return { ...c, outreach_block: parseNotesBlock(c.notes) }
}

export async function GET(req: NextRequest) {
  const unauthorized = requireCoworkAuth(req)
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const service = searchParams.get('service')
  const draftState = searchParams.get('draft_state')
  const hasBlockParam = searchParams.get('has_block')
  const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500)

  const supabase = createOutreachSupabase() as any
  let query = supabase.from('clients').select('*').order('updated_at', { ascending: false })

  if (status) {
    const list = status.split(',').map((s) => s.trim()).filter(Boolean)
    query = list.length > 1 ? query.in('status', list) : query.eq('status', list[0])
  }
  query = query.limit(limit)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let clients = (data || []).map((c: ClientRow) => attachOutreachBlock(c)) as ClientWithOutreach[]

  if (hasBlockParam === 'true') clients = clients.filter((c) => c.outreach_block)
  if (hasBlockParam === 'false') clients = clients.filter((c) => !c.outreach_block)
  if (service) clients = clients.filter((c) => c.outreach_block?.service === service)
  if (draftState) clients = clients.filter((c) => c.outreach_block?.draft?.state === draftState)

  return NextResponse.json({ clients })
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

  const { outreach_block, ...clientPayload } = body

  if (!clientPayload.business_name) {
    return NextResponse.json({ error: 'business_name is required' }, { status: 400 })
  }
  if (!clientPayload.industry) {
    // `clients.industry` is NOT NULL in the schema — default to "outreach_prospect"
    clientPayload.industry = 'outreach_prospect'
  }
  if (!clientPayload.status) {
    clientPayload.status = 'prospect'
  }

  // Build the Notes content: preserve any caller-provided notes and merge an outreach block on top
  let notesContent = clientPayload.notes ?? ''
  if (outreach_block) {
    const block: OutreachBlock = {
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
    notesContent = applyBlockToNotes(notesContent, block)
  }

  const insertPayload = { ...clientPayload, notes: notesContent }

  const supabase = createOutreachSupabase() as any
  const { data, error } = await supabase.from('clients').insert(insertPayload).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ client: attachOutreachBlock(data) }, { status: 201 })
}
