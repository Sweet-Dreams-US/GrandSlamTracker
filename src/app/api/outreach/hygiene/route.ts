// GET /api/outreach/hygiene
//   Find records Cowork's weekly hygiene pass should act on.
//
//   ?older_than_days=<n>          Default 30
//   ?status=<status>              Default "prospect"
//   ?action=paused|flag_review    What Cowork intends; included in response for reference
//
// Returns clients whose status + updated_at make them hygiene candidates,
// with their parsed outreach block so Cowork can decide what to do.

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { requireCoworkAuth } from '@/lib/outreach/auth'
import { parseNotesBlock } from '@/lib/outreach/notesBlock'

export const dynamic = 'force-dynamic'

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(req: NextRequest) {
  const unauthorized = requireCoworkAuth(req)
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(req.url)
  const olderThanDays = parseInt(searchParams.get('older_than_days') || '30', 10)
  const status = searchParams.get('status') || 'prospect'
  const action = searchParams.get('action') || null

  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString()

  const supabase = createServerClient() as any
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('status', status)
    .lte('updated_at', cutoff)
    .order('updated_at', { ascending: true })
    .limit(500)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const clients = (data as any[]).map((c) => ({
    ...c,
    outreach_block: parseNotesBlock(c.notes),
  }))

  return NextResponse.json({
    cutoff,
    status,
    older_than_days: olderThanDays,
    intended_action: action,
    clients,
  })
}
