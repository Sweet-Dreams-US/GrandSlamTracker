// GET /api/outreach/dashboard
//   KPI snapshot for Cowork's weekly brief + home dashboard widget.
//
// Returns:
//   - Counts by outreach state (pending_approval / approved / sent / replied / etc.)
//   - Prospects added in the last 7 days
//   - Drafts awaiting approval > 48h (Cole nudge)
//   - Prospects > 30 days with no reply (hygiene candidates)
//   - Per-service breakdown

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/client'
import { requireCoworkAuth } from '@/lib/outreach/auth'
import { parseNotesBlock, type OutreachBlock } from '@/lib/outreach/notesBlock'

export const dynamic = 'force-dynamic'

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(req: NextRequest) {
  const unauthorized = requireCoworkAuth(req)
  if (unauthorized) return unauthorized

  const supabase = createServerClient() as any
  // Use `*` to match the /clients list endpoint exactly. Narrowing the
  // column list via comma-separated shorthand has surfaced inconsistent
  // results against this project's schema/policies; `*` is reliable.
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .limit(2000)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const rawCount = Array.isArray(data) ? data.length : 0

  const now = Date.now()
  const DAY = 24 * 60 * 60 * 1000
  const weekAgo = now - 7 * DAY
  const twoDaysAgo = now - 2 * DAY
  const thirtyDaysAgo = now - 30 * DAY
  const sixtyDaysAgo = now - 60 * DAY

  let totalOutreach = 0
  const byDraftState: Record<string, number> = {}
  const byService: Record<string, number> = {}
  const byStatus: Record<string, number> = {}

  let newProspectsThisWeek = 0
  const draftsPendingOver48h: { id: string; business_name: string; updated_at: string }[] = []
  const prospectsStaleOver30d: { id: string; business_name: string; updated_at: string }[] = []
  const trialsStaleOver60d: { id: string; business_name: string; updated_at: string }[] = []

  for (const c of (data as any[])) {
    byStatus[c.status] = (byStatus[c.status] || 0) + 1

    const block: OutreachBlock | null = parseNotesBlock(c.notes)
    if (!block) continue
    totalOutreach++

    const createdAt = new Date(c.created_at).getTime()
    const updatedAt = new Date(c.updated_at).getTime()

    if (createdAt >= weekAgo) newProspectsThisWeek++

    const draftState = block.draft?.state
    if (draftState) byDraftState[draftState] = (byDraftState[draftState] || 0) + 1

    if (block.service) byService[block.service] = (byService[block.service] || 0) + 1

    if (draftState === 'pending_approval' && updatedAt <= twoDaysAgo) {
      draftsPendingOver48h.push({ id: c.id, business_name: c.business_name, updated_at: c.updated_at })
    }

    if (c.status === 'prospect' && updatedAt <= thirtyDaysAgo) {
      prospectsStaleOver30d.push({ id: c.id, business_name: c.business_name, updated_at: c.updated_at })
    }

    if (c.status === 'trial' && updatedAt <= sixtyDaysAgo) {
      trialsStaleOver60d.push({ id: c.id, business_name: c.business_name, updated_at: c.updated_at })
    }
  }

  return NextResponse.json({
    totals: {
      total_clients: rawCount,
      total_outreach: totalOutreach,
      new_prospects_this_week: newProspectsThisWeek,
      drafts_pending_over_48h: draftsPendingOver48h.length,
      prospects_stale_over_30d: prospectsStaleOver30d.length,
      trials_stale_over_60d: trialsStaleOver60d.length,
    },
    counts: {
      by_status: byStatus,
      by_draft_state: byDraftState,
      by_service: byService,
    },
    queues: {
      drafts_pending_over_48h: draftsPendingOver48h,
      prospects_stale_over_30d: prospectsStaleOver30d,
      trials_stale_over_60d: trialsStaleOver60d,
    },
  })
}
