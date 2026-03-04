-- =====================
-- MC Racing Revenue & Expense Tracking Tables
-- Run this in your Supabase SQL Editor: https://ylxtbelxhncgiybkooey.supabase.co
-- =====================

-- Revenue Entries: Granular per-day, per-category revenue
CREATE TABLE IF NOT EXISTS revenue_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT NOT NULL,
  date DATE NOT NULL,
  category TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_revenue_entries_client ON revenue_entries(client_id);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_date ON revenue_entries(date);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_category ON revenue_entries(category);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_client_date ON revenue_entries(client_id, date);

-- Auto-update updated_at
CREATE TRIGGER update_revenue_entries_updated_at
    BEFORE UPDATE ON revenue_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS: Allow all access (anon key used by client portals)
ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to revenue_entries" ON revenue_entries
  FOR ALL USING (true) WITH CHECK (true);


-- Monthly Expenses: Monthly expense tracking
CREATE TABLE IF NOT EXISTS monthly_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  category TEXT NOT NULL,
  label TEXT NOT NULL,
  amount DECIMAL NOT NULL DEFAULT 0,
  is_recurring BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id, year, month, category)
);

CREATE INDEX IF NOT EXISTS idx_monthly_expenses_client ON monthly_expenses(client_id);
CREATE INDEX IF NOT EXISTS idx_monthly_expenses_date ON monthly_expenses(year, month);

-- Auto-update updated_at
CREATE TRIGGER update_monthly_expenses_updated_at
    BEFORE UPDATE ON monthly_expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS: Allow all access (anon key used by client portals)
ALTER TABLE monthly_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to monthly_expenses" ON monthly_expenses
  FOR ALL USING (true) WITH CHECK (true);
