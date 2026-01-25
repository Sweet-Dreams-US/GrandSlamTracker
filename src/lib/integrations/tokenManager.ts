/**
 * OAuth Token Management
 * Handles token refresh for Google APIs
 */

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

export interface TokenData {
  accessToken: string
  refreshToken: string
  expiresAt: Date
}

export interface RefreshResult {
  accessToken: string
  expiresIn: number
  tokenType: string
}

/**
 * Refresh a Google OAuth access token
 */
export async function refreshGoogleToken(
  refreshToken: string,
  clientId: string,
  clientSecret: string
): Promise<RefreshResult> {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token refresh failed: ${response.status} - ${error}`)
  }

  const data = await response.json()

  return {
    accessToken: data.access_token,
    expiresIn: data.expires_in,
    tokenType: data.token_type,
  }
}

/**
 * Check if a token needs refreshing (with 5 minute buffer)
 */
export function tokenNeedsRefresh(expiresAt: Date | string): boolean {
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
  const bufferMs = 5 * 60 * 1000 // 5 minutes
  return expiry.getTime() - bufferMs < Date.now()
}

/**
 * Calculate token expiration date from expires_in seconds
 */
export function calculateExpiration(expiresIn: number): Date {
  return new Date(Date.now() + expiresIn * 1000)
}

/**
 * Get valid access token, refreshing if necessary
 */
export async function getValidToken(
  tokenData: TokenData,
  clientId: string,
  clientSecret: string
): Promise<{ accessToken: string; refreshed: boolean; newExpiration?: Date }> {
  if (!tokenNeedsRefresh(tokenData.expiresAt)) {
    return { accessToken: tokenData.accessToken, refreshed: false }
  }

  const refreshed = await refreshGoogleToken(
    tokenData.refreshToken,
    clientId,
    clientSecret
  )

  return {
    accessToken: refreshed.accessToken,
    refreshed: true,
    newExpiration: calculateExpiration(refreshed.expiresIn),
  }
}
