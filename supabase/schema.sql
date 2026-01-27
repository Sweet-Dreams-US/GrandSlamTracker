-- Grand Slam System Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================
-- CORE TABLES
-- =====================

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  business_name TEXT NOT NULL,
  display_name TEXT,
  status TEXT DEFAULT 'prospect' CHECK (status IN ('prospect', 'negotiation', 'trial', 'active', 'paused', 'terminated', 'management')),
  -- management = fixed fee/retainer clients (not Grand Slam performance-based)
  industry TEXT NOT NULL,
  business_age_years INTEGER,
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  website_url TEXT,
  notes TEXT,
  -- Metricool integration
  metricool_brand_id INTEGER,
  metricool_brand_name TEXT
);

-- Fee structures table
CREATE TABLE IF NOT EXISTS fee_structures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  baseline_method TEXT DEFAULT 'trailing12' CHECK (baseline_method IN ('trailing12', 'trailing6', 'custom')),
  custom_baseline DECIMAL,
  industry_growth_factor DECIMAL DEFAULT 0.10,
  maturity_buffer DECIMAL DEFAULT 0.05,
  monthly_cap DECIMAL,
  annual_cap DECIMAL,
  trial_end_date DATE,
  effective_date DATE DEFAULT CURRENT_DATE
);

-- Fee tiers table
CREATE TABLE IF NOT EXISTS fee_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fee_structure_id UUID REFERENCES fee_structures(id) ON DELETE CASCADE,
  tier_order INTEGER NOT NULL,
  min_amount DECIMAL NOT NULL DEFAULT 0,
  max_amount DECIMAL,
  percentage DECIMAL NOT NULL
);

-- Trailing revenue (historical data for baseline calculation)
CREATE TABLE IF NOT EXISTS trailing_revenue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  revenue DECIMAL NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, year, month)
);

-- Monthly revenue tracking
CREATE TABLE IF NOT EXISTS monthly_revenue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  gross_revenue DECIMAL NOT NULL,
  job_count INTEGER,
  attributed_revenue DECIMAL DEFAULT 0,
  organic_revenue DECIMAL DEFAULT 0,
  referral_revenue DECIMAL DEFAULT 0,
  unknown_revenue DECIMAL DEFAULT 0,
  calculated_baseline DECIMAL DEFAULT 0,
  calculated_uplift DECIMAL DEFAULT 0,
  calculated_fee DECIMAL DEFAULT 0,
  fee_breakdown JSONB,
  verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMPTZ,
  verified_by TEXT,
  notes TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'invoiced', 'paid', 'overdue')),
  payment_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, year, month)
);

-- Internal payouts
CREATE TABLE IF NOT EXISTS internal_payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monthly_revenue_id UUID REFERENCES monthly_revenue(id) ON DELETE CASCADE,
  total_fee DECIMAL NOT NULL,
  business_amount DECIMAL NOT NULL,
  sales_amount DECIMAL NOT NULL,
  worker_amount DECIMAL NOT NULL,
  sales_person TEXT,
  worker_person TEXT,
  payout_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- LEAD MANAGEMENT
-- =====================

-- Lead sources (templates)
CREATE TABLE IF NOT EXISTS lead_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_type TEXT DEFAULT 'unknown' CHECK (source_type IN ('sweetDreams', 'organic', 'referral', 'unknown')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  lead_source_id UUID REFERENCES lead_sources(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  source_type TEXT DEFAULT 'unknown' CHECK (source_type IN ('sweetDreams', 'organic', 'referral', 'unknown')),
  confidence_level TEXT DEFAULT 'unknown' CHECK (confidence_level IN ('confirmed', 'likely', 'assumed', 'unknown')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'quoted', 'won', 'lost')),
  estimated_value DECIMAL,
  final_value DECIMAL,
  won_date DATE,
  lost_reason TEXT,
  notes TEXT
);

-- =====================
-- ANALYTICS & METRICS
-- =====================

-- Daily metrics from integrations
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  platform TEXT NOT NULL,
  metric_type TEXT NOT NULL,
  value DECIMAL NOT NULL,
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, date, platform, metric_type)
);

-- Monthly analytics aggregates
CREATE TABLE IF NOT EXISTS monthly_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  platform TEXT NOT NULL,
  followers INTEGER,
  follower_change INTEGER,
  posts_published INTEGER,
  reach INTEGER,
  impressions INTEGER,
  engagements INTEGER,
  engagement_rate DECIMAL,
  website_sessions INTEGER,
  website_users INTEGER,
  page_views INTEGER,
  avg_session_duration DECIMAL,
  bounce_rate DECIMAL,
  search_impressions INTEGER,
  search_clicks INTEGER,
  search_ctr DECIMAL,
  avg_position DECIMAL,
  gbp_views INTEGER,
  gbp_searches INTEGER,
  gbp_calls INTEGER,
  gbp_directions INTEGER,
  top_content JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, year, month, platform)
);

-- =====================
-- ACTIVITY TRACKING
-- =====================

-- Activity log (our work)
CREATE TABLE IF NOT EXISTS activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  activity_type TEXT NOT NULL,
  description TEXT,
  quantity INTEGER,
  hours DECIMAL,
  created_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly activity summary
CREATE TABLE IF NOT EXISTS monthly_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  total_hours DECIMAL DEFAULT 0,
  content_pieces INTEGER DEFAULT 0,
  social_posts INTEGER DEFAULT 0,
  emails_sent INTEGER DEFAULT 0,
  meetings_held INTEGER DEFAULT 0,
  other_activities JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, year, month)
);

-- =====================
-- INTEGRATIONS
-- =====================

-- Integration connections
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  external_id TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  connection_status TEXT DEFAULT 'disconnected' CHECK (connection_status IN ('connected', 'disconnected', 'error')),
  last_sync_at TIMESTAMPTZ,
  last_error TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, platform)
);

-- =====================
-- ALERTS
-- =====================

-- System alerts
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- FILES & SCENARIOS
-- =====================

-- Google Drive links
CREATE TABLE IF NOT EXISTS drive_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved scenarios for prospect modeling
CREATE TABLE IF NOT EXISTS saved_scenarios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  industry TEXT NOT NULL,
  monthly_revenue DECIMAL NOT NULL,
  growth_rate DECIMAL NOT NULL,
  baseline DECIMAL NOT NULL,
  tiers JSONB NOT NULL,
  projections JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- INDEXES
-- =====================

CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_industry ON clients(industry);
CREATE INDEX IF NOT EXISTS idx_monthly_revenue_client ON monthly_revenue(client_id);
CREATE INDEX IF NOT EXISTS idx_monthly_revenue_date ON monthly_revenue(year, month);
CREATE INDEX IF NOT EXISTS idx_leads_client ON leads(client_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_daily_metrics_client_date ON daily_metrics(client_id, date);
CREATE INDEX IF NOT EXISTS idx_alerts_client ON alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_alerts_acknowledged ON alerts(acknowledged);
CREATE INDEX IF NOT EXISTS idx_activity_log_client_date ON activity_log(client_id, date);

-- =====================
-- FUNCTIONS
-- =====================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to relevant tables
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fee_structures_updated_at
    BEFORE UPDATE ON fee_structures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_revenue_updated_at
    BEFORE UPDATE ON monthly_revenue
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_analytics_updated_at
    BEFORE UPDATE ON monthly_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_monthly_activity_updated_at
    BEFORE UPDATE ON monthly_activity
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_integrations_updated_at
    BEFORE UPDATE ON integrations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_scenarios_updated_at
    BEFORE UPDATE ON saved_scenarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- ADMIN USERS
-- =====================

-- Admin users table (controls who can access the platform)
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'viewer')),
  invited_by UUID REFERENCES admins(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the super admin (Cole)
INSERT INTO admins (email, role)
VALUES ('cole@sweetdreamsmusic.com', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- =====================
-- SEED DATA: CLIENTS
-- =====================

-- MC Racing (Sim Racing - Fort Wayne, IN)
INSERT INTO clients (
  business_name,
  display_name,
  status,
  industry,
  business_age_years,
  primary_contact_name,
  primary_contact_email,
  primary_contact_phone,
  website_url,
  notes
) VALUES (
  'MC Racing',
  'MC Racing',
  'prospect',
  'sim_racing',
  2,
  NULL,
  NULL,
  NULL,
  NULL,
  'Only sim racing facility in Fort Wayne, IN. Open Noon-2am Tue-Sun, closed Mondays (84 hrs/week). Current revenue $3,500-$5,000/mo. Revenue mix: 87% sessions, 13% parties, 0% recurring. Grand Slam candidate targeting 300%+ growth.'
) ON CONFLICT DO NOTHING;

-- Index for quick email lookups
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- =====================
-- ROW LEVEL SECURITY
-- =====================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE fee_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE trailing_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE drive_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Policy: Only authenticated admins can access data
CREATE POLICY "Admins can view all data" ON clients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.email = auth.jwt() ->> 'email'
      AND admins.is_active = TRUE
    )
  );

-- Apply same policy to all tables (simplified - you can make these more granular)
CREATE POLICY "Admins access" ON fee_structures FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email' AND is_active = TRUE)
);
CREATE POLICY "Admins access" ON fee_tiers FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email' AND is_active = TRUE)
);
CREATE POLICY "Admins access" ON trailing_revenue FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email' AND is_active = TRUE)
);
CREATE POLICY "Admins access" ON monthly_revenue FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email' AND is_active = TRUE)
);
CREATE POLICY "Admins access" ON internal_payouts FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email' AND is_active = TRUE)
);
CREATE POLICY "Admins access" ON lead_sources FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email' AND is_active = TRUE)
);
CREATE POLICY "Admins access" ON leads FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email' AND is_active = TRUE)
);
CREATE POLICY "Admins access" ON daily_metrics FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email' AND is_active = TRUE)
);
CREATE POLICY "Admins access" ON monthly_analytics FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email' AND is_active = TRUE)
);
CREATE POLICY "Admins access" ON activity_log FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email' AND is_active = TRUE)
);
CREATE POLICY "Admins access" ON monthly_activity FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email' AND is_active = TRUE)
);
CREATE POLICY "Admins access" ON integrations FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email' AND is_active = TRUE)
);
CREATE POLICY "Admins access" ON alerts FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email' AND is_active = TRUE)
);
CREATE POLICY "Admins access" ON drive_links FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email' AND is_active = TRUE)
);
CREATE POLICY "Admins access" ON saved_scenarios FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE email = auth.jwt() ->> 'email' AND is_active = TRUE)
);

-- Admins table: users can only see themselves, super_admin can see all
CREATE POLICY "View own admin record" ON admins
  FOR SELECT USING (
    email = auth.jwt() ->> 'email'
    OR EXISTS (
      SELECT 1 FROM admins
      WHERE email = auth.jwt() ->> 'email'
      AND role = 'super_admin'
    )
  );

-- Only super_admin can insert/update/delete admins
CREATE POLICY "Super admin manages admins" ON admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE email = auth.jwt() ->> 'email'
      AND role = 'super_admin'
    )
  );
