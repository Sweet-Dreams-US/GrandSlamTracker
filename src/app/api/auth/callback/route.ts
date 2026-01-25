import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

/**
 * OAuth callback handler for Google APIs
 * Handles the authorization code exchange for access/refresh tokens
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state') // Contains clientId and platform
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/clients?error=${encodeURIComponent(error)}`, request.url)
    )
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL('/clients?error=missing_params', request.url)
    )
  }

  try {
    // Parse state to get client ID and platform
    const { clientId, platform } = JSON.parse(decodeURIComponent(state))

    // Exchange code for tokens
    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback`,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text()
      console.error('Token exchange failed:', error)
      return NextResponse.redirect(
        new URL(`/clients/${clientId}/integrations?error=token_exchange_failed`, request.url)
      )
    }

    const tokens = await tokenResponse.json()

    // TODO: Store tokens in Supabase integrations table
    // const { data, error } = await supabase
    //   .from('integrations')
    //   .upsert({
    //     client_id: clientId,
    //     platform,
    //     access_token: tokens.access_token,
    //     refresh_token: tokens.refresh_token,
    //     token_expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    //     connection_status: 'connected',
    //   })

    console.log('OAuth tokens received for', platform, 'client', clientId)

    return NextResponse.redirect(
      new URL(`/clients/${clientId}/integrations?success=${platform}`, request.url)
    )
  } catch (err) {
    console.error('OAuth callback error:', err)
    return NextResponse.redirect(
      new URL('/clients?error=oauth_failed', request.url)
    )
  }
}
