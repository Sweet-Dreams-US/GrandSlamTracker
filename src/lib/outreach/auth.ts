// Shared auth helper for /api/outreach/* routes.
// Cowork authenticates with a Bearer token matching OUTREACH_API_KEY.
//
// The UI (Cole's browser) does NOT hit these endpoints — it uses the
// Supabase browser client directly. These routes are the Cowork surface.

import { NextRequest, NextResponse } from 'next/server'

export function requireCoworkAuth(req: NextRequest): NextResponse | null {
  const expected = process.env.OUTREACH_API_KEY
  if (!expected) {
    return NextResponse.json(
      { error: 'OUTREACH_API_KEY not configured on server' },
      { status: 500 }
    )
  }

  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing Authorization: Bearer <OUTREACH_API_KEY> header' },
      { status: 401 }
    )
  }

  const token = authHeader.slice('Bearer '.length).trim()
  if (token !== expected) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  return null
}
