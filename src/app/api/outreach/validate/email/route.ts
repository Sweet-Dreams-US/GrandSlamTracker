// POST /api/outreach/validate/email
//   Body: { subject: string, body: string }
//   Returns pass/fail on dash check + any warnings.
//
// Cowork MUST call this before create_draft to guarantee no dashes leak
// into outreach copy (brand rule). The Gmail MCP itself has no such check.

import { NextRequest, NextResponse } from 'next/server'
import { requireCoworkAuth } from '@/lib/outreach/auth'
import { validateEmailDraft } from '@/lib/outreach/validators'

export const dynamic = 'force-dynamic'

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function POST(req: NextRequest) {
  const unauthorized = requireCoworkAuth(req)
  if (unauthorized) return unauthorized

  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const subject = body.subject ?? ''
  const emailBody = body.body ?? ''

  if (typeof subject !== 'string' || typeof emailBody !== 'string') {
    return NextResponse.json(
      { error: 'subject and body must be strings' },
      { status: 400 }
    )
  }

  const result = validateEmailDraft(subject, emailBody)
  return NextResponse.json(result)
}
