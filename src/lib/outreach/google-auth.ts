// Google auth loader for the outreach service account.
//
// Uses a service account (nightmares-outreach@...) with domain-wide
// delegation on sweetdreams.us to impersonate cole@sweetdreams.us. The
// service account JSON is stored base64-encoded in
// GOOGLE_SERVICE_ACCOUNT_JSON_B64 on Vercel.
//
// Required env:
//   GOOGLE_SERVICE_ACCOUNT_JSON_B64  base64 of the full SA JSON
//   GOOGLE_IMPERSONATE_USER          "cole@sweetdreams.us"

import { google } from 'googleapis'

export type GmailScope =
  | 'https://www.googleapis.com/auth/gmail.labels'
  | 'https://www.googleapis.com/auth/gmail.modify'
  | 'https://www.googleapis.com/auth/gmail.compose'
  | 'https://www.googleapis.com/auth/gmail.send'
  | 'https://www.googleapis.com/auth/gmail.readonly'

export const ALL_GMAIL_SCOPES: GmailScope[] = [
  'https://www.googleapis.com/auth/gmail.labels',
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/gmail.compose',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
]

let cachedSa: Record<string, string> | null = null

function loadServiceAccountJson(): Record<string, string> {
  if (cachedSa) return cachedSa
  const b64 = process.env.GOOGLE_SERVICE_ACCOUNT_JSON_B64
  if (!b64) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_JSON_B64 env var is not set. See docs/outreach/GmailSetup.md.'
    )
  }
  const decoded = Buffer.from(b64, 'base64').toString('utf8')
  try {
    cachedSa = JSON.parse(decoded)
  } catch (e) {
    throw new Error(
      'GOOGLE_SERVICE_ACCOUNT_JSON_B64 is not valid base64-encoded JSON. Re-encode and set again.'
    )
  }
  return cachedSa!
}

export function getImpersonateUser(): string {
  const user = process.env.GOOGLE_IMPERSONATE_USER
  if (!user) {
    throw new Error(
      'GOOGLE_IMPERSONATE_USER env var is not set. Expected "cole@sweetdreams.us".'
    )
  }
  return user
}

/**
 * Returns an authenticated Google client configured to impersonate the
 * domain-wide-delegation target user (cole@sweetdreams.us). Pass only the
 * scopes the calling route needs.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
export async function getGoogleAuthClient(scopes: GmailScope[]): Promise<any> {
  const sa = loadServiceAccountJson()
  const impersonate = getImpersonateUser()

  const auth = new google.auth.GoogleAuth({
    credentials: sa as unknown as Record<string, string>,
    scopes,
    clientOptions: { subject: impersonate },
  })

  return auth.getClient()
}

/** Short-hand: get a Gmail API client bound to cole@sweetdreams.us. */
export async function getGmailApi(scopes: GmailScope[]) {
  const auth = await getGoogleAuthClient(scopes)
  return google.gmail({ version: 'v1', auth })
}
