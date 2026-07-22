```
Name: Legacy AI Platform
Type: Micro-app marketplace and runtime platform
Stack: Next.js 16 + React 19 + Tailwind v4 + Supabase
Auth: Google Sign-In (OIDC) - Single method, no passwords
Admin: Trusted auth application role or server-managed administrator grant

WHAT YOU'RE BUILDING
A unified platform that:

Hosts a marketplace of AI-powered micro-apps
Manages connector integrations (Google Drive, Gmail) at the platform level
Executes micro-apps via a Gemini-powered runtime engine
Enforces per-app permissions over connected services

The Key Insight
Users connect services ONCE at the platform level. Each installed app requests GRANTS to use those connections. The platform acts as a permission gateway between apps and external services.
┌─────────────────────────────────────────────────────────────────┐
│                      LEGACY AI PLATFORM                         │
├─────────────────────────────────────────────────────────────────┤
│  USER CONNECTS ONCE:     Google Drive ✓   Gmail ✓   Slack ○    │
├─────────────────────────────────────────────────────────────────┤
│  APP: SubSentry          [Grants: None needed]         → RUN   │
│  APP: ReturnPal          [Grants: Gmail ✓]             → RUN   │
│  APP: DriveAnalyzer      [Grants: Drive ✓, Gmail ✗]    → RUN   │
└─────────────────────────────────────────────────────────────────┘

DATABASE SCHEMA (Supabase)
Generate these tables with proper RLS policies:
profiles (extends Supabase auth.users)
sqlCREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users can read/update own profile
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
connector_accounts
sqlCREATE TYPE connector_type AS ENUM ('google_drive', 'gmail', 'slack', 'notion');
CREATE TYPE connector_status AS ENUM ('connected', 'expired', 'revoked', 'error');

CREATE TABLE connector_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  connector_type connector_type NOT NULL,
  status connector_status DEFAULT 'connected',
  
  -- Token storage (encrypted at rest by Supabase, but we add app-level encryption)
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

-- RLS: Users can only access own connectors
ALTER TABLE connector_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own connectors" ON connector_accounts
  FOR ALL USING (auth.uid() = user_id);
apps
sqlCREATE TYPE app_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$'),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- emoji or URL
  category TEXT,
  tags TEXT[],
  status app_status DEFAULT 'draft',
  
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id)
);

-- RLS: Anyone can read published apps, only admin can write
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published apps" ON apps
  FOR SELECT USING (status = 'published');

CREATE POLICY "Admin can manage all apps" ON apps
  FOR ALL USING (
    (SELECT public.is_platform_admin())
  );
app_versions
sqlCREATE TABLE app_versions (
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

-- Only one active version per app
CREATE UNIQUE INDEX idx_single_active_version ON app_versions(app_id) WHERE is_active = TRUE;

-- RLS: Read published, admin writes
ALTER TABLE app_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active versions of published apps" ON app_versions
  FOR SELECT USING (
    is_active = true AND 
    EXISTS (SELECT 1 FROM apps WHERE apps.id = app_id AND apps.status = 'published')
  );

CREATE POLICY "Admin can manage all versions" ON app_versions
  FOR ALL USING (
    (SELECT public.is_platform_admin())
  );
installed_apps
sqlCREATE TABLE installed_apps (
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

-- RLS: Users manage own installations
ALTER TABLE installed_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own installed apps" ON installed_apps
  FOR ALL USING (auth.uid() = user_id);
installed_app_grants
sqlCREATE TYPE grant_status AS ENUM ('allowed', 'denied', 'pending');

CREATE TABLE installed_app_grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  installed_app_id UUID NOT NULL REFERENCES installed_apps(id) ON DELETE CASCADE,
  connector_type connector_type NOT NULL,
  status grant_status DEFAULT 'pending',
  
  -- Scope restrictions (e.g., specific folders, labels)
  grant_json JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(installed_app_id, connector_type)
);

-- RLS: Users manage grants for own installed apps
ALTER TABLE installed_app_grants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own app grants" ON installed_app_grants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM installed_apps 
      WHERE installed_apps.id = installed_app_id 
      AND installed_apps.user_id = auth.uid()
    )
  );
runs
sqlCREATE TYPE run_status AS ENUM ('pending', 'fetching', 'processing', 'validating', 'completed', 'failed', 'error');

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
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Users see own runs, admin sees all
ALTER TABLE runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own runs" ON runs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own runs" ON runs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all runs" ON runs
  FOR SELECT USING (
    (SELECT public.is_platform_admin())
  );
run_artifacts
sqlCREATE TABLE run_artifacts (
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

-- RLS: Inherit from runs
ALTER TABLE run_artifacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view artifacts for own runs" ON run_artifacts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM runs WHERE runs.id = run_id AND runs.user_id = auth.uid())
  );

CREATE POLICY "Admin can view all artifacts" ON run_artifacts
  FOR SELECT USING (
    (SELECT public.is_platform_admin())
  );

FILE STRUCTURE
app/
├── (auth)/
│   ├── login/page.tsx              ← Google Sign-In page
│   └── auth/callback/route.ts      ← Supabase auth callback
├── (platform)/
│   ├── layout.tsx                  ← Platform shell (sidebar, header)
│   ├── page.tsx                    ← Dashboard / home
│   ├── connections/
│   │   └── page.tsx                ← Manage connected services
│   ├── marketplace/
│   │   ├── page.tsx                ← Browse published apps
│   │   └── [slug]/page.tsx         ← App detail / install
│   ├── apps/
│   │   ├── page.tsx                ← My installed apps
│   │   └── [id]/
│   │       ├── page.tsx            ← Configure & run app
│   │       └── runs/[runId]/page.tsx ← View run output
│   └── runs/
│       └── page.tsx                ← Run history
├── (admin)/
│   ├── layout.tsx                  ← Admin layout with guard
│   ├── apps/
│   │   ├── page.tsx                ← Manage all apps
│   │   ├── new/page.tsx            ← Create new app
│   │   └── [id]/
│   │       └── edit/page.tsx       ← Edit app manifest
│   └── runs/
│       └── page.tsx                ← All runs (all users)
├── api/
│   ├── connectors/
│   │   ├── google/
│   │   │   ├── connect/route.ts    ← Initiate Google OAuth
│   │   │   └── callback/route.ts   ← Handle OAuth callback
│   │   └── [type]/
│   │       └── disconnect/route.ts ← Revoke connector
│   └── runs/
│       └── [id]/
│           └── execute/route.ts    ← Execute app run (long-running)
├── actions/
│   ├── apps.ts                     ← App CRUD actions
│   ├── connectors.ts               ← Connector management
│   ├── installs.ts                 ← Install/uninstall apps
│   ├── grants.ts                   ← Manage app grants
│   └── runs.ts                     ← Create and manage runs
├── layout.tsx
├── page.tsx                        ← Landing / redirect
└── globals.css

components/
├── ui/                             ← Primitives (Button, Card, etc.)
├── auth/
│   ├── google-sign-in-button.tsx
│   └── user-menu.tsx
├── connectors/
│   ├── connector-card.tsx
│   ├── connector-list.tsx
│   └── scope-selector.tsx
├── marketplace/
│   ├── app-card.tsx
│   ├── app-grid.tsx
│   └── app-filters.tsx
├── apps/
│   ├── installed-app-card.tsx
│   ├── grant-manager.tsx
│   ├── config-form.tsx
│   └── run-button.tsx
├── runs/
│   ├── run-progress.tsx
│   ├── run-output.tsx
│   └── run-history.tsx
└── admin/
    ├── app-editor.tsx
    ├── manifest-editor.tsx
    └── runs-table.tsx

lib/
├── supabase/
│   ├── client.ts
│   ├── server.ts
│   └── middleware.ts
├── connectors/
│   ├── google-oauth.ts             ← Google OAuth helpers
│   ├── google-drive.ts             ← Drive API wrapper
│   └── gmail.ts                    ← Gmail API wrapper
├── runtime/
│   ├── engine.ts                   ← Main run orchestrator
│   ├── context-builder.ts          ← Template + data assembly
│   ├── gemini-client.ts            ← Gemini API wrapper
│   └── output-validator.ts         ← JSON Schema validation
├── encryption.ts                   ← Token encryption (AES-256-GCM)
├── admin.ts                        ← Admin check helpers
└── utils.ts

types/
├── database.ts                     ← Supabase generated types
├── manifest.ts                     ← App manifest types
├── connectors.ts                   ← Connector types
└── external.ts                     ← Quarantine zone

AUTHENTICATION FLOW
Google Sign-In (Supabase Auth)
tsx// app/(auth)/login/page.tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (user) redirect('/marketplace')
  
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm space-y-6 p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Legacy AI Platform</h1>
          <p className="text-muted-foreground mt-2">
            Sign in to access the marketplace
          </p>
        </div>
        <GoogleSignInButton />
      </div>
    </div>
  )
}
tsx// components/auth/google-sign-in-button.tsx
"use client"

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function GoogleSignInButton() {
  const handleSignIn = async () => {
    const supabase = createClient()
    
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    })
  }
  
  return (
    <Button onClick={handleSignIn} className="w-full" size="lg">
      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
        {/* Google icon SVG */}
      </svg>
      Continue with Google
    </Button>
  )
}
ts// app/(auth)/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/marketplace'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Ensure profile exists
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata.full_name,
          avatar_url: user.user_metadata.avatar_url,
        })
      }
      
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}

ADMIN ENFORCEMENT
Server-Side Check (Use in Server Components & Actions)
ts// lib/admin.ts
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.app_metadata?.platform_role !== 'admin') {
    redirect('/marketplace')
  }
  
  return user
}

export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  return user?.app_metadata?.platform_role === 'admin'
}
Admin Layout Guard
tsx// app/(admin)/layout.tsx
import { requireAdmin } from '@/lib/admin'
import { AdminSidebar } from '@/components/admin/sidebar'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAdmin() // Redirects if not admin
  
  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 p-8">{children}</main>
    </div>
  )
}
Server Action Protection
ts// app/actions/apps.ts
"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createApp(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // ENFORCE ADMIN
  if (!user || user.app_metadata?.platform_role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }
  
  const { error } = await supabase.from('apps').insert({
    slug: formData.get('slug') as string,
    name: formData.get('name') as string,
    description: formData.get('description') as string,
    created_by: user.id,
  })
  
  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/apps')
}

export async function publishApp(appId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.app_metadata?.platform_role !== 'admin') {
    throw new Error('Unauthorized: Admin access required')
  }
  
  const { error } = await supabase
    .from('apps')
    .update({ 
      status: 'published', 
      published_at: new Date().toISOString(),
      published_by: user.id 
    })
    .eq('id', appId)
  
  if (error) throw new Error(error.message)
  
  revalidatePath('/admin/apps')
  revalidatePath('/marketplace')
}

CONNECTOR OAUTH FLOW
Google OAuth for Drive/Gmail (Separate from Auth)
ts// lib/connectors/google-oauth.ts
import { google } from 'googleapis'

const SCOPES = {
  google_drive: [
    'https://www.googleapis.com/auth/drive.readonly',
    'https://www.googleapis.com/auth/drive.metadata.readonly',
  ],
  gmail: [
    'https://www.googleapis.com/auth/gmail.readonly',
  ],
}

export function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/connectors/google/callback`
  )
}

export function getConnectUrl(connectorType: 'google_drive' | 'gmail', userId: string) {
  const oauth2Client = getOAuth2Client()
  
  const state = Buffer.from(JSON.stringify({ 
    connectorType, 
    userId 
  })).toString('base64')
  
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES[connectorType],
    state,
    prompt: 'consent',
  })
}
ts// app/api/connectors/google/connect/route.ts
import { createClient } from '@/lib/supabase/server'
import { getConnectUrl } from '@/lib/connectors/google-oauth'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.redirect('/login')
  }
  
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') as 'google_drive' | 'gmail'
  
  if (!type || !['google_drive', 'gmail'].includes(type)) {
    return NextResponse.json({ error: 'Invalid connector type' }, { status: 400 })
  }
  
  const url = getConnectUrl(type, user.id)
  return NextResponse.redirect(url)
}
ts// app/api/connectors/google/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { getOAuth2Client } from '@/lib/connectors/google-oauth'
import { encryptTokens } from '@/lib/encryption'
import { google } from 'googleapis'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  
  if (!code || !state) {
    return NextResponse.redirect(`${origin}/connections?error=missing_params`)
  }
  
  const { connectorType, userId } = JSON.parse(
    Buffer.from(state, 'base64').toString()
  )
  
  const oauth2Client = getOAuth2Client()
  const { tokens } = await oauth2Client.getToken(code)
  
  // Get account info
  oauth2Client.setCredentials(tokens)
  const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client })
  const { data: userInfo } = await oauth2.userinfo.get()
  
  // Encrypt tokens
  const { encryptedAccess, encryptedRefresh, iv } = await encryptTokens({
    accessToken: tokens.access_token!,
    refreshToken: tokens.refresh_token,
  })
  
  // Store in database
  const supabase = await createClient()
  const { error } = await supabase.from('connector_accounts').upsert({
    user_id: userId,
    connector_type: connectorType,
    status: 'connected',
    access_token_encrypted: encryptedAccess,
    refresh_token_encrypted: encryptedRefresh,
    token_iv: iv,
    scopes: tokens.scope?.split(' ') || [],
    expires_at: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : null,
    external_account_id: userInfo.email,
    external_account_name: userInfo.name,
  })
  
  if (error) {
    return NextResponse.redirect(`${origin}/connections?error=save_failed`)
  }
  
  return NextResponse.redirect(`${origin}/connections?success=${connectorType}`)
}

TOKEN ENCRYPTION
ts// lib/encryption.ts
import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const AUTH_TAG_LENGTH = 16

function getKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY
  if (!key) throw new Error('TOKEN_ENCRYPTION_KEY not set')
  return Buffer.from(key, 'base64')
}

export async function encryptTokens(tokens: {
  accessToken: string
  refreshToken?: string | null
}): Promise<{
  encryptedAccess: string
  encryptedRefresh: string | null
  iv: string
}> {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  
  const encryptedAccess = encrypt(tokens.accessToken, key, iv)
  const encryptedRefresh = tokens.refreshToken 
    ? encrypt(tokens.refreshToken, key, iv)
    : null
  
  return {
    encryptedAccess,
    encryptedRefresh,
    iv: iv.toString('base64'),
  }
}

export async function decryptTokens(encrypted: {
  encryptedAccess: string
  encryptedRefresh: string | null
  iv: string
}): Promise<{
  accessToken: string
  refreshToken: string | null
}> {
  const key = getKey()
  const iv = Buffer.from(encrypted.iv, 'base64')
  
  const accessToken = decrypt(encrypted.encryptedAccess, key, iv)
  const refreshToken = encrypted.encryptedRefresh
    ? decrypt(encrypted.encryptedRefresh, key, iv)
    : null
  
  return { accessToken, refreshToken }
}

function encrypt(plaintext: string, key: Buffer, iv: Buffer): string {
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return Buffer.concat([encrypted, authTag]).toString('base64')
}

function decrypt(ciphertext: string, key: Buffer, iv: Buffer): string {
  const data = Buffer.from(ciphertext, 'base64')
  const authTag = data.slice(-AUTH_TAG_LENGTH)
  const encrypted = data.slice(0, -AUTH_TAG_LENGTH)
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  
  return decipher.update(encrypted) + decipher.final('utf8')
}

RUN ENGINE
ts// lib/runtime/engine.ts
import { createClient } from '@/lib/supabase/server'
import { decryptTokens } from '@/lib/encryption'
import { buildContext } from './context-builder'
import { callGemini } from './gemini-client'
import { validateOutput } from './output-validator'
import { fetchDriveData } from '@/lib/connectors/google-drive'
import { fetchGmailData } from '@/lib/connectors/gmail'

interface RunParams {
  installedAppId: string
  userId: string
  inputOverrides?: Record<string, unknown>
}

export async function executeRun(params: RunParams) {
  const { installedAppId, userId, inputOverrides } = params
  const supabase = await createClient()
  
  // 1. Load installed app with version
  const { data: installedApp } = await supabase
    .from('installed_apps')
    .select(`
      *,
      app:apps(*),
      version:app_versions(*),
      grants:installed_app_grants(*)
    `)
    .eq('id', installedAppId)
    .eq('user_id', userId)
    .single()
  
  if (!installedApp) throw new Error('App not found')
  
  const manifest = installedApp.version.manifest_json
  
  // 2. Create run record
  const { data: run } = await supabase
    .from('runs')
    .insert({
      installed_app_id: installedAppId,
      user_id: userId,
      version_id: installedApp.version_id,
      status: 'pending',
      started_at: new Date().toISOString(),
    })
    .select()
    .single()
  
  try {
    // 3. Fetch connector data based on grants
    await supabase.from('runs').update({ status: 'fetching' }).eq('id', run.id)
    
    const connectorData: Record<string, unknown> = {}
    
    for (const grant of installedApp.grants) {
      if (grant.status !== 'allowed') continue
      
      // Get connector account
      const { data: connector } = await supabase
        .from('connector_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('connector_type', grant.connector_type)
        .single()
      
      if (!connector) continue
      
      // Decrypt tokens
      const tokens = await decryptTokens({
        encryptedAccess: connector.access_token_encrypted,
        encryptedRefresh: connector.refresh_token_encrypted,
        iv: connector.token_iv,
      })
      
      // Fetch data based on connector type
      if (grant.connector_type === 'google_drive') {
        connectorData.drive = await fetchDriveData(tokens, grant.grant_json)
      } else if (grant.connector_type === 'gmail') {
        connectorData.gmail = await fetchGmailData(tokens, grant.grant_json)
      }
    }
    
    // 4. Build context
    await supabase.from('runs').update({ status: 'processing' }).eq('id', run.id)
    
    const prompt = buildContext({
      template: installedApp.version.run_template,
      connectorData,
      config: installedApp.config_json,
      inputOverrides,
    })
    
    // 5. Call Gemini
    const response = await callGemini({
      model: manifest.execution.model || 'gemini-2.5-flash',
      modelConfig: manifest.execution.modelConfig,
      prompt,
      outputSchema: installedApp.version.output_schema_json,
    })
    
    // 6. Validate output
    await supabase.from('runs').update({ status: 'validating' }).eq('id', run.id)
    
    const output = await validateOutput(response, installedApp.version.output_schema_json)
    
    // 7. Store results
    const completedAt = new Date()
    const durationMs = completedAt.getTime() - new Date(run.started_at).getTime()
    
    await supabase.from('runs').update({
      status: 'completed',
      completed_at: completedAt.toISOString(),
      duration_ms: durationMs,
    }).eq('id', run.id)
    
    await supabase.from('run_artifacts').insert({
      run_id: run.id,
      inputs_summary_json: { connectorTypes: Object.keys(connectorData) },
      output_json: output,
      raw_response: response.text,
      model_used: manifest.execution.model,
      tokens_input: response.usageMetadata?.promptTokenCount,
      tokens_output: response.usageMetadata?.candidatesTokenCount,
    })
    
    return { runId: run.id, status: 'completed', output }
    
  } catch (error) {
    await supabase.from('runs').update({
      status: 'error',
      completed_at: new Date().toISOString(),
      error_message: error instanceof Error ? error.message : 'Unknown error',
    }).eq('id', run.id)
    
    throw error
  }
}
ts// lib/runtime/gemini-client.ts
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

interface GeminiParams {
  model: string
  modelConfig?: {
    temperature?: number
    maxOutputTokens?: number
    enableThinking?: boolean
    thinkingBudget?: number
  }
  prompt: string
  outputSchema: object
}

export async function callGemini(params: GeminiParams) {
  const { model, modelConfig, prompt, outputSchema } = params
  
  const geminiModel = genAI.getGenerativeModel({
    model,
    generationConfig: {
      temperature: modelConfig?.temperature ?? 0.3,
      maxOutputTokens: modelConfig?.maxOutputTokens ?? 4096,
      responseMimeType: 'application/json',
      responseSchema: convertToGeminiSchema(outputSchema),
    },
  })
  
  const result = await geminiModel.generateContent(prompt)
  const response = result.response
  
  return {
    text: response.text(),
    usageMetadata: response.usageMetadata,
  }
}

function convertToGeminiSchema(jsonSchema: object): object {
  // Convert JSON Schema to Gemini Schema format
  // This is a simplified conversion - expand as needed
  return jsonSchema
}

APP MANIFEST TYPE
ts// types/manifest.ts
export interface AppManifest {
  id: string
  name: string
  description: string
  version: string
  icon: string
  category: string
  tags: string[]
  author: {
    name: string
    email: string
  }
  
  connectors: {
    required: ConnectorRequirement[]
    optional: ConnectorRequirement[]
  }
  
  config: {
    schema: JSONSchema
    ui?: Record<string, UIHint>
  }
  
  execution: {
    model: 'gemini-2.5-flash' | 'gemini-2.5-pro' | 'gemini-3-pro' | 'gemini-3-pro-preview'
    modelConfig?: {
      temperature?: number
      maxOutputTokens?: number
      enableThinking?: boolean
      thinkingBudget?: number
    }
    promptTemplate: string
    outputSchema: JSONSchema
    retryConfig?: {
      maxRetries?: number
      retryOnValidationFailure?: boolean
    }
  }
  
  ui?: {
    inputForm?: {
      layout: 'vertical' | 'horizontal'
      sections?: { title: string; fields: string[] }[]
    }
    outputRenderer: 'json' | 'table' | 'cards' | 'custom'
  }
}

export interface ConnectorRequirement {
  type: 'google_drive' | 'gmail' | 'slack' | 'notion'
  capabilities: string[]
  scopeSelector?: {
    type: 'folders' | 'labels' | 'channels' | 'databases'
    multiple: boolean
    label: string
  }
}

export interface JSONSchema {
  type: string
  properties?: Record<string, JSONSchema>
  required?: string[]
  items?: JSONSchema
  enum?: string[]
  [key: string]: unknown
}

export interface UIHint {
  widget?: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date'
  placeholder?: string
  rows?: number
  prefix?: string
}

ENVIRONMENT VARIABLES
env# .env.local

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google OAuth (for connectors, not auth)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Gemini
GEMINI_API_KEY=your-gemini-api-key

# Token Encryption (generate with: openssl rand -base64 32)
TOKEN_ENCRYPTION_KEY=your-32-byte-key-base64

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

SEED DATA: SubSentry Lite
Create this as the first marketplace app:
json{
  "slug": "subsentry-lite",
  "name": "SubSentry Lite",
  "description": "Analyze subscription data from CSV. Identifies duplicates, calculates spend, and flags savings opportunities.",
  "icon": "💳",
  "category": "finance",
  "tags": ["subscriptions", "csv", "analysis", "savings"],
  "status": "published"
}
With this version manifest:
json{
  "version": "1.0.0",
  "manifest_json": {
    "id": "subsentry-lite",
    "name": "SubSentry Lite",
    "connectors": { "required": [], "optional": [] },
    "config": {
      "schema": {
        "type": "object",
        "required": ["csvData"],
        "properties": {
          "csvData": { "type": "string", "title": "CSV Data" },
          "currency": { "type": "string", "default": "USD", "enum": ["USD", "EUR", "GBP"] },
          "monthlyBudget": { "type": "number", "title": "Monthly Budget" }
        }
      }
    },
    "execution": {
      "model": "gemini-2.5-flash",
      "modelConfig": { "temperature": 0.2 }
    }
  },
  "config_schema_json": { /* same as manifest.config.schema */ },
  "run_template": "Analyze this subscription CSV data:\n\n```csv\n{{config.csvData}}\n```\n\nCurrency: {{config.currency}}\nBudget: {{config.monthlyBudget}}\n\nIdentify duplicates, calculate totals, suggest savings.",
  "output_schema_json": {
    "type": "object",
    "required": ["summary", "subscriptions", "recommendations"],
    "properties": {
      "summary": {
        "type": "object",
        "properties": {
          "totalMonthly": { "type": "number" },
          "totalAnnual": { "type": "number" },
          "subscriptionCount": { "type": "integer" }
        }
      },
      "subscriptions": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "name": { "type": "string" },
            "monthlyAmount": { "type": "number" },
            "category": { "type": "string" },
            "flags": { "type": "array", "items": { "type": "string" } }
          }
        }
      },
      "recommendations": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "action": { "type": "string" },
            "subscription": { "type": "string" },
            "potentialSavings": { "type": "number" },
            "priority": { "type": "string", "enum": ["high", "medium", "low"] }
          }
        }
      }
    }
  },
  "is_active": true
}

BUILD ORDER
Execute in this sequence:

Database Setup - Run migrations in Supabase SQL editor
Auth Flow - Login page, callback, middleware
Profile & Admin - Profile creation, admin checks
Connections Page - Connector OAuth, list, disconnect
Marketplace - Browse, filter, app detail pages
Install Flow - Install app, configure grants
App Runner - Config form, run button, output viewer
Run Engine - Backend execution, Gemini integration
Admin Panel - App CRUD, manifest editor, runs viewer
Seed Data - SubSentry Lite app


VALIDATION CHECKLIST
After each phase:

 npm run build passes
 No hydration warnings in dev
 Server Components used where possible
 RLS policies working (test with different users)
 Admin routes blocked for non-admin
 Tokens encrypted before storage
 Run engine produces valid JSON output
```
