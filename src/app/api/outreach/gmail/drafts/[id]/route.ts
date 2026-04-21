// GET    /api/outreach/gmail/drafts/:id   full draft detail
// PATCH  /api/outreach/gmail/drafts/:id   update subject/body/to
// DELETE /api/outreach/gmail/drafts/:id   delete draft from Gmail

import { NextRequest, NextResponse } from 'next/server'
import { requireCoworkAuth } from '@/lib/outreach/auth'
import { getDraft, updateDraft, deleteDraft } from '@/lib/outreach/gmail'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireCoworkAuth(req)
  if (unauthorized) return unauthorized

  try {
    const draft = await getDraft(params.id)
    if (!draft) return NextResponse.json({ error: 'not found' }, { status: 404 })
    return NextResponse.json({ draft })
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: m }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireCoworkAuth(req)
  if (unauthorized) return unauthorized
  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }) }
  const { to, subject, body: emailBody } = body
  if (!to || !subject || !emailBody) {
    return NextResponse.json({ error: 'to, subject, body all required for update' }, { status: 400 })
  }
  try {
    const draft = await updateDraft(params.id, { to, subject, body: emailBody })
    return NextResponse.json({ draft })
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: m }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const unauthorized = requireCoworkAuth(req)
  if (unauthorized) return unauthorized
  try {
    await deleteDraft(params.id)
    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const m = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: m }, { status: 500 })
  }
}
