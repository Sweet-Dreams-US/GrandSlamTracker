// GET /api/outreach/templates
//   ?service=<service>   filter by service (aerial|music|video|photo)
//   ?role=<role>         filter by role (owner|architect|gc|marketing|venue|other)
//   ?kind=<kind>         filter by kind (cold|followup_day6|followup_day17|breakup)
//   ?render_for=<id>     also include a rendered preview using slots from query
//
// POST /api/outreach/templates/render
//   Body: { template_id, slots: { ... } }
//   Returns the rendered subject + body + missing slots + dash check.

import { NextRequest, NextResponse } from 'next/server'
import { requireCoworkAuth } from '@/lib/outreach/auth'
import {
  listTemplates,
  type TemplateRole,
  type TemplateService,
  type TemplateKind,
} from '@/lib/outreach/templates'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const unauthorized = requireCoworkAuth(req)
  if (unauthorized) return unauthorized

  const { searchParams } = new URL(req.url)
  const service = searchParams.get('service') as TemplateService | null
  const role = searchParams.get('role') as TemplateRole | null
  const kind = searchParams.get('kind') as TemplateKind | null

  const templates = listTemplates({
    service: service ?? undefined,
    role: role ?? undefined,
    kind: kind ?? undefined,
  })

  return NextResponse.json({ templates })
}
