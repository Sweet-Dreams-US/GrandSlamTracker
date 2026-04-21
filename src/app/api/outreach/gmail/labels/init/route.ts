// POST /api/outreach/gmail/labels/init
//   Idempotently ensures all 10 Outreach/* labels exist on cole@sweetdreams.us.
//   Returns the full map of label name → Gmail label ID.

import { NextRequest, NextResponse } from 'next/server'
import { requireCoworkAuth } from '@/lib/outreach/auth'
import { ensureAllRequiredLabels } from '@/lib/outreach/gmail'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const unauthorized = requireCoworkAuth(req)
  if (unauthorized) return unauthorized

  try {
    const labels = await ensureAllRequiredLabels()
    return NextResponse.json({ ok: true, labels })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
