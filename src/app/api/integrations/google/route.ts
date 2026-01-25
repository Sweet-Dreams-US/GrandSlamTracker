import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'

// Scopes required for each Google API
const SCOPES = {
  google_analytics: [
    'https://www.googleapis.com/auth/analytics.readonly',
  ],
  search_console: [
    'https://www.googleapis.com/auth/webmasters.readonly',
  ],
  google_business: [
    'https://www.googleapis.com/auth/business.manage',
  ],
}

/**
 * Initiate Google OAuth flow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, platform } = body

    if (!clientId || !platform) {
      return NextResponse.json(
        { error: 'Missing clientId or platform' },
        { status: 400 }
      )
    }

    const scopes = SCOPES[platform as keyof typeof SCOPES]
    if (!scopes) {
      return NextResponse.json(
        { error: 'Invalid platform' },
        { status: 400 }
      )
    }

    // Build OAuth URL
    const state = encodeURIComponent(JSON.stringify({ clientId, platform }))
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
      response_type: 'code',
      scope: scopes.join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    })

    const authUrl = `${GOOGLE_AUTH_URL}?${params}`

    return NextResponse.json({ authUrl })
  } catch (error) {
    console.error('OAuth initiation error:', error)
    return NextResponse.json(
      { error: 'Failed to initiate OAuth' },
      { status: 500 }
    )
  }
}

/**
 * Disconnect a Google integration
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { clientId, platform } = body

    if (!clientId || !platform) {
      return NextResponse.json(
        { error: 'Missing clientId or platform' },
        { status: 400 }
      )
    }

    // TODO: Revoke token and update Supabase
    // const { error } = await supabase
    //   .from('integrations')
    //   .update({
    //     connection_status: 'disconnected',
    //     access_token: null,
    //     refresh_token: null,
    //   })
    //   .eq('client_id', clientId)
    //   .eq('platform', platform)

    console.log('Disconnected', platform, 'for client', clientId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Disconnect error:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect' },
      { status: 500 }
    )
  }
}
