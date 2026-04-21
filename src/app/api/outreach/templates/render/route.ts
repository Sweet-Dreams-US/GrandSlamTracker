// POST /api/outreach/templates/render
//   Body: { template_id: string, slots: TemplateSlots }
//   Returns the rendered subject + body + dash check + warnings.

import { NextRequest, NextResponse } from 'next/server'
import { requireCoworkAuth } from '@/lib/outreach/auth'
import { renderTemplate } from '@/lib/outreach/templates'
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

  if (!body.template_id) {
    return NextResponse.json({ error: 'template_id is required' }, { status: 400 })
  }

  const rendered = renderTemplate(body.template_id, body.slots || {})
  if (!rendered) {
    return NextResponse.json(
      { error: `Template not found: ${body.template_id}` },
      { status: 404 }
    )
  }

  const validation = validateEmailDraft(rendered.subject, rendered.body)

  return NextResponse.json({
    ...rendered,
    validation,
  })
}
