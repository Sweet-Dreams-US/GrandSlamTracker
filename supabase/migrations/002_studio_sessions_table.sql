-- Studio Sessions Table
-- Tracks recording and media production sessions for engineer payouts
-- Run this in Supabase SQL Editor: https://ylxtbelxhncgiybkooey.supabase.co

CREATE TABLE IF NOT EXISTS studio_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  engineer TEXT NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('recording', 'media')),
  studio TEXT CHECK (studio IN ('studio_a', 'studio_b')),
  hours NUMERIC,
  is_block BOOLEAN DEFAULT false,
  media_service_type TEXT,
  media_role TEXT CHECK (media_role IN ('produced', 'upsold')),
  client_name TEXT NOT NULL,
  session_date DATE NOT NULL,
  total_charge NUMERIC NOT NULL DEFAULT 0,
  engineer_payout NUMERIC NOT NULL DEFAULT 0,
  studio_payout NUMERIC NOT NULL DEFAULT 0,
  bank_entity TEXT NOT NULL CHECK (bank_entity IN ('sweet_dreams_music', 'sweet_dreams_us')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_studio_sessions_engineer ON studio_sessions(engineer);
CREATE INDEX IF NOT EXISTS idx_studio_sessions_date ON studio_sessions(session_date);
CREATE INDEX IF NOT EXISTS idx_studio_sessions_status ON studio_sessions(status);

-- Auto-update trigger
CREATE OR REPLACE FUNCTION update_studio_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_studio_sessions_updated ON studio_sessions;
CREATE TRIGGER trg_studio_sessions_updated
  BEFORE UPDATE ON studio_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_studio_sessions_updated_at();

-- RLS (open for anon key access from client portals)
ALTER TABLE studio_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to studio_sessions"
  ON studio_sessions FOR ALL
  USING (true)
  WITH CHECK (true);
