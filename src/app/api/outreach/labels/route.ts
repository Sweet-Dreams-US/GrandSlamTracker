// GET /api/outreach/labels
//   Returns the canonical list of Gmail labels Cowork should ensure exist,
//   plus the state transitions the platform expects.

import { NextRequest, NextResponse } from 'next/server'
import { requireCoworkAuth } from '@/lib/outreach/auth'
import {
  GMAIL_LABELS,
  REQUIRED_LABELS,
  LABEL_TRANSITIONS,
} from '@/lib/outreach/gmailLabels'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const unauthorized = requireCoworkAuth(req)
  if (unauthorized) return unauthorized

  return NextResponse.json({
    labels: GMAIL_LABELS,
    required: REQUIRED_LABELS,
    transitions: LABEL_TRANSITIONS,
  })
}
