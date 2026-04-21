// Shared auth helper for /api/outreach/* routes.
// Cowork authenticates with a Bearer token matching OUTREACH_API_KEY.
//
// The UI (Cole's browser) does NOT hit these endpoints — it uses the
// Supabase browser client directly. These routes are the Cowork surface.

import { NextRequest, NextResponse } from 'next/server'

export function requireCoworkAuth(req: NextRequest): NextResponse | null {
  // Trim env value defensively. Vercel/CLI/REST have historically allowed
  // trailing newlines or whitespace to sneak into env variables, and a secret
  // comparison failure is indistinguishable from a wrong key from the caller's
  // point of view. Strip whitespace on both sides and also surrounding quotes
  // that some env parsers preserve.
  const expectedRaw = process.env.OUTREACH_API_KEY
  const expected = expectedRaw ? stripEnvWhitespace(expectedRaw) : undefined
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

  const token = stripEnvWhitespace(authHeader.slice('Bearer '.length))
  if (token !== expected) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  return null
}

function stripEnvWhitespace(value: string): string {
  let v = value.trim()
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1).trim()
  }
  return v
}
