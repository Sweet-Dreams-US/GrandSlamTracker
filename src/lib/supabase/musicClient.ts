import { createClient } from '@supabase/supabase-js'

const musicUrl = process.env.SWEETDREAMS_MUSIC_SUPABASE_URL
const musicKey = process.env.SWEETDREAMS_MUSIC_SUPABASE_SERVICE_KEY

export function createMusicClient() {
  if (!musicUrl || !musicKey) {
    throw new Error(
      'Missing SWEETDREAMS_MUSIC_SUPABASE_URL or SWEETDREAMS_MUSIC_SUPABASE_SERVICE_KEY'
    )
  }
  return createClient(musicUrl, musicKey)
}
