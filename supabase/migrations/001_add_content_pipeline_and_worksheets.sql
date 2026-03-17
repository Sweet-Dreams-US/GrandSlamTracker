-- Grand Slam Worksheets (Hormozi framework analysis per client)
CREATE TABLE grand_slam_worksheets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  dream_outcome TEXT,
  likelihood_score INTEGER CHECK (likelihood_score BETWEEN 1 AND 10),
  time_to_result TEXT,
  time_delay_score INTEGER CHECK (time_delay_score BETWEEN 1 AND 10),
  effort_required TEXT,
  effort_score INTEGER CHECK (effort_score BETWEEN 1 AND 10),
  value_stack JSONB DEFAULT '[]',
  proposed_price NUMERIC,
  engines_active JSONB DEFAULT '[]',
  notes TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'presented', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Content items flowing through the pipeline
CREATE TABLE content_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'reel', 'post', 'story', 'blog', 'photo', 'carousel')),
  status TEXT DEFAULT 'idea' CHECK (status IN ('idea', 'filming', 'editing', 'review', 'scheduled', 'posted', 'analyzed')),
  scheduled_date TIMESTAMPTZ,
  posted_date TIMESTAMPTZ,
  platforms JSONB DEFAULT '[]',
  raw_file_url TEXT,
  final_file_url TEXT,
  thumbnail_url TEXT,
  assigned_to TEXT,
  analytics JSONB DEFAULT '{}',
  ai_generated BOOLEAN DEFAULT false,
  ai_prompt TEXT,
  tags TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Content ideas backlog
CREATE TABLE content_ideas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  concept TEXT,
  inspiration_source TEXT,
  based_on_content_id UUID REFERENCES content_items(id),
  score NUMERIC(3,1),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'approved', 'rejected', 'converted')),
  converted_to UUID REFERENCES content_items(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Notifications
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('booking', 'payment', 'milestone', 'content', 'system')),
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Client engines tracking (which of the 6 engines are active)
CREATE TABLE client_engines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  engine TEXT NOT NULL CHECK (engine IN ('content', 'brand_assets', 'social_management', 'web_dev', 'offer_refinement', 'fluid_communication')),
  status TEXT DEFAULT 'inactive' CHECK (status IN ('inactive', 'setup', 'active', 'paused')),
  notes TEXT,
  activated_at TIMESTAMPTZ,
  UNIQUE(client_id, engine)
);

-- Indexes
CREATE INDEX idx_content_status ON content_items(status);
CREATE INDEX idx_content_client ON content_items(client_id);
CREATE INDEX idx_content_scheduled ON content_items(scheduled_date) WHERE scheduled_date IS NOT NULL;
CREATE INDEX idx_ideas_status ON content_ideas(status);
CREATE INDEX idx_notifications_user ON notifications(user_email, read);
CREATE INDEX idx_worksheets_client ON grand_slam_worksheets(client_id);
CREATE INDEX idx_client_engines ON client_engines(client_id);

-- Enable RLS
ALTER TABLE grand_slam_worksheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_engines ENABLE ROW LEVEL SECURITY;

-- RLS: allow all for authenticated users (admin-only app)
CREATE POLICY "authenticated_full_access" ON grand_slam_worksheets FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_full_access" ON content_items FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_full_access" ON content_ideas FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_full_access" ON notifications FOR ALL USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_full_access" ON client_engines FOR ALL USING (auth.uid() IS NOT NULL);
