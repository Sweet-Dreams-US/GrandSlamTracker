// Outreach-specific Supabase server client.
//
// Next.js 14 App Router auto-caches `fetch()` calls with identical URLs,
// even on routes marked `dynamic = 'force-dynamic'`. Since Supabase-js uses
// fetch internally, dashboard-style queries that hit the same URL every
// request get the cached response from the first call forever.
//
// Fix: override the fetch implementation to always pass `cache: 'no-store'`.
// Applies only to outreach routes — the rest of the platform is unaffected.

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/types'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export function createOutreachSupabase() {
  return createClient<Database>(url, anonKey, {
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
