import { createClient } from '@supabase/supabase-js'

// Server-side only — connects to Sweet Dreams Music Supabase
// Uses service role key for read access to studio booking/sales data
export function createStudioClient() {
  const url = process.env.STUDIO_SUPABASE_URL
  const key = process.env.STUDIO_SUPABASE_SERVICE_KEY
  if (!url || !key) {
    throw new Error('STUDIO_SUPABASE_URL and STUDIO_SUPABASE_SERVICE_KEY must be set')
  }
  return createClient(url, key)
}
