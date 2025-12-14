-- profiles
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  is_admin BOOLEAN GENERATED ALWAYS AS (email = 'douglastalley1977@gmail.com') STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id);

-- connector_accounts
CREATE TYPE connector_type AS ENUM ('google_drive', 'gmail', 'slack', 'notion');
CREATE TYPE connector_status AS ENUM ('connected', 'expired', 'revoked', 'error');

CREATE TABLE connector_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connector_type connector_type NOT NULL,
  status connector_status DEFAULT 'connected',
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_iv TEXT NOT NULL,
  scopes TEXT[] NOT NULL,
  expires_at TIMESTAMPTZ,
  external_account_id TEXT,
  external_account_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, connector_type)
);

ALTER TABLE connector_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own connectors" ON connector_accounts
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- apps
CREATE TYPE app_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,
  tags TEXT[],
  status app_status DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published apps" ON apps
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admin can manage all apps" ON apps
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND is_admin = true)
  );

-- app_versions
CREATE TABLE app_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  manifest_json JSONB NOT NULL,
  config_schema_json JSONB,
  run_template TEXT NOT NULL,
  output_schema_json JSONB NOT NULL,
  is_active BOOLEAN DEFAULT FALSE,
  release_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id),
  UNIQUE(app_id, version)
);

CREATE UNIQUE INDEX idx_single_active_version ON app_versions(app_id) WHERE is_active = TRUE;

ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active versions of published apps" ON app_versions
  FOR SELECT USING (
    is_active = true AND 
    EXISTS (SELECT 1 FROM apps WHERE apps.id = app_id AND apps.status = 'published')
  );

CREATE POLICY "Admin can manage all versions" ON app_versions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND is_admin = true)
  );

-- installed_apps
CREATE TABLE installed_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES app_versions(id),
  config_json JSONB DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT TRUE,
  installed_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, app_id)
);

ALTER TABLE installed_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own installed apps" ON installed_apps
  FOR ALL USING ((SELECT auth.uid()) = user_id);

-- installed_app_grants
CREATE TYPE grant_status AS ENUM ('allowed', 'denied', 'pending');

CREATE TABLE installed_app_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installed_app_id UUID NOT NULL REFERENCES installed_apps(id) ON DELETE CASCADE,
  connector_type connector_type NOT NULL,
  status grant_status DEFAULT 'pending',
  grant_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(installed_app_id, connector_type)
);

ALTER TABLE installed_app_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own app grants" ON installed_app_grants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM installed_apps 
      WHERE installed_apps.id = installed_app_id 
      AND installed_apps.user_id = (SELECT auth.uid())
    )
  );

-- runs
CREATE TYPE run_status AS ENUM ('pending', 'fetching', 'processing', 'validating', 'completed', 'failed', 'error');

CREATE TABLE runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installed_app_id UUID NOT NULL REFERENCES installed_apps(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id),
  version_id UUID NOT NULL REFERENCES app_versions(id),
  status run_status DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  error_message TEXT,
  error_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own runs" ON runs
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own runs" ON runs
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own runs" ON runs
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Admin can view all runs" ON runs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND is_admin = true)
  );

CREATE POLICY "Admin can update all runs" ON runs
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND is_admin = true)
  );

-- run_artifacts
CREATE TABLE run_artifacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  inputs_summary_json JSONB,
  output_json JSONB,
  raw_response TEXT,
  logs JSONB,
  model_used TEXT,
  tokens_input INTEGER,
  tokens_output INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE run_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view artifacts for own runs" ON run_artifacts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM runs WHERE runs.id = run_id AND runs.user_id = (SELECT auth.uid()))
  );

CREATE POLICY "Admin can view all artifacts" ON run_artifacts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = (SELECT auth.uid()) AND is_admin = true)
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connector_accounts_updated_at
  BEFORE UPDATE ON connector_accounts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_apps_updated_at
  BEFORE UPDATE ON apps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_installed_apps_updated_at
  BEFORE UPDATE ON installed_apps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_installed_app_grants_updated_at
  BEFORE UPDATE ON installed_app_grants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_runs_updated_at
  BEFORE UPDATE ON runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Performance indexes
CREATE INDEX idx_connector_accounts_user_id ON connector_accounts(user_id);
CREATE INDEX idx_connector_accounts_type ON connector_accounts(connector_type);
CREATE INDEX idx_apps_status ON apps(status);
CREATE INDEX idx_apps_slug ON apps(slug);
CREATE INDEX idx_app_versions_app_id ON app_versions(app_id);
CREATE INDEX idx_app_versions_is_active ON app_versions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_installed_apps_user_id ON installed_apps(user_id);
CREATE INDEX idx_installed_apps_app_id ON installed_apps(app_id);
CREATE INDEX idx_installed_app_grants_installed_app_id ON installed_app_grants(installed_app_id);
CREATE INDEX idx_installed_app_grants_connector_type ON installed_app_grants(connector_type);
CREATE INDEX idx_runs_user_id ON runs(user_id);
CREATE INDEX idx_runs_installed_app_id ON runs(installed_app_id);
CREATE INDEX idx_runs_status ON runs(status);
CREATE INDEX idx_runs_created_at ON runs(created_at DESC);
CREATE INDEX idx_run_artifacts_run_id ON run_artifacts(run_id);
