# Legacy AI Platform - Project Documentation

## 📋 Table of Contents
- [Project Overview](#project-overview)
- [Tech Stack](#tech-stack)
- [File Structure](#file-structure)
- [Dependencies](#dependencies)
- [Architecture Principles](#architecture-principles)
- [Database Schema](#database-schema)
- [Environment Variables](#environment-variables)
- [Development Workflow](#development-workflow)
- [Cursor Rules Summary](#cursor-rules-summary)
- [Key Concepts](#key-concepts)

---

## Project Overview

**Legacy AI Platform** is a Next.js 16 micro-app marketplace platform with AI-powered runtime execution. It enables users to:

1. **Connect external services once** at the platform level (Google Drive, Gmail, Slack, Notion)
2. **Browse and install apps** from a marketplace
3. **Grant permissions** to installed apps to access connected services
4. **Execute AI-powered workflows** via Google Gemini

### The Key Insight

Users connect services **ONCE** at the platform level. Each installed app requests **GRANTS** to use those connections. The platform acts as a permission gateway between apps and external services.

```
┌─────────────────────────────────────────────────────────────────┐
│                      LEGACY AI PLATFORM                         │
├─────────────────────────────────────────────────────────────────┤
│  USER CONNECTS ONCE:     Google Drive ✓   Gmail ✓   Slack ○    │
├─────────────────────────────────────────────────────────────────┤
│  APP: SubSentry          [Grants: None needed]         → RUN   │
│  APP: ReturnPal          [Grants: Gmail ✓]             → RUN   │
│  APP: DriveAnalyzer      [Grants: Drive ✓, Gmail ✗]    → RUN   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Framework** | Next.js | 16.0.10 (App Router) |
| **React** | React | 19.2.1 |
| **Language** | TypeScript | 5.x (Strict) |
| **Styling** | Tailwind CSS | v4 |
| **Backend** | Supabase | Auth, Database, Storage |
| **AI Runtime** | Google Gemini | via @google/generative-ai |
| **OAuth** | Google APIs | googleapis, google-auth-library |
| **Validation** | Zod, Ajv | Schema validation |
| **Forms** | React Hook Form | 7.68.0 |

### Authentication
- **Method**: Google Sign-In (OIDC) via Supabase Auth
- **Single method**: No passwords, only Google OAuth
- **Admin**: Single email allowlist (`douglastalley1977@gmail.com`)

---

## File Structure

```
legacy-ai-platform/
├── .agent/
│   └── rules/
│       └── legacy-ai-market-rules.md    # Agent-specific rules
│
├── src/
│   ├── app/                             # Next.js App Router
│   │   ├── (auth)/                      # Route group: Public auth pages
│   │   │   ├── login/
│   │   │   │   └── page.tsx            # Google Sign-In page
│   │   │   └── auth/
│   │   │       └── callback/
│   │   │           └── route.ts        # Supabase auth callback
│   │   │
│   │   ├── (platform)/                 # Route group: Authenticated pages
│   │   │   ├── layout.tsx              # Platform shell (sidebar, header)
│   │   │   ├── page.tsx                # Dashboard / home
│   │   │   ├── connections/
│   │   │   │   └── page.tsx            # Manage connected services
│   │   │   ├── marketplace/
│   │   │   │   ├── page.tsx            # Browse apps
│   │   │   │   └── [slug]/
│   │   │   │       └── page.tsx        # App detail page
│   │   │   ├── apps/
│   │   │   │   ├── page.tsx            # Installed apps list
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx        # App runner UI
│   │   │   │       └── runs/
│   │   │   │           └── [runId]/
│   │   │   │               └── page.tsx # Run output viewer
│   │   │   └── runs/
│   │   │       └── page.tsx            # All runs history
│   │   │
│   │   ├── (admin)/                    # Route group: Admin-only pages
│   │   │   ├── layout.tsx              # Admin guard
│   │   │   ├── apps/
│   │   │   │   ├── page.tsx            # App CRUD list
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx        # Create app
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx        # Edit app
│   │   │   │       └── versions/
│   │   │   │           └── page.tsx    # Manage versions
│   │   │   └── runs/
│   │   │       └── page.tsx            # All runs (admin view)
│   │   │
│   │   ├── api/                        # API routes
│   │   │   ├── connectors/
│   │   │   │   ├── [type]/
│   │   │   │   │   ├── connect/
│   │   │   │   │   │   └── route.ts    # OAuth initiation
│   │   │   │   │   └── callback/
│   │   │   │   │       └── route.ts    # OAuth callback
│   │   │   │   └── disconnect/
│   │   │   │       └── route.ts        # Disconnect connector
│   │   │   └── runs/
│   │   │       └── [id]/
│   │   │           └── route.ts        # Run execution (streaming)
│   │   │
│   │   ├── actions/                    # Server Actions
│   │   │   ├── apps.ts                 # App CRUD operations
│   │   │   ├── installs.ts             # Install/uninstall apps
│   │   │   ├── grants.ts               # Grant management
│   │   │   └── runs.ts                 # Run creation
│   │   │
│   │   ├── layout.tsx                  # Root layout
│   │   ├── page.tsx                     # Home/landing page
│   │   ├── globals.css                  # Tailwind v4 entry
│   │   └── favicon.ico
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── server.ts                # Server-side Supabase client
│   │   │   ├── client.ts                # Client-side Supabase client
│   │   │   └── middleware.ts           # Auth session refresh
│   │   │
│   │   ├── connectors/
│   │   │   ├── google-drive.ts          # Google Drive API wrapper
│   │   │   ├── gmail.ts                 # Gmail API wrapper
│   │   │   └── oauth.ts                 # OAuth flow helpers
│   │   │
│   │   ├── runtime/
│   │   │   ├── engine.ts                # Run execution engine
│   │   │   ├── gemini.ts                # Gemini client
│   │   │   ├── context.ts               # Context building
│   │   │   └── validation.ts            # Output validation
│   │   │
│   │   ├── encryption.ts                # Token encryption/decryption (AES-256-GCM)
│   │   ├── admin.ts                     # Admin guard utilities
│   │   └── utils.ts                     # cn() and other utilities
│   │
│   ├── components/
│   │   ├── ui/                          # Shadcn UI primitives
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── input.tsx
│   │   │   └── ...
│   │   │
│   │   ├── auth/
│   │   │   └── login-button.tsx         # Google Sign-In button
│   │   │
│   │   ├── connectors/
│   │   │   ├── connector-card.tsx        # Connector status card
│   │   │   └── connect-button.tsx        # Connect/disconnect button
│   │   │
│   │   ├── marketplace/
│   │   │   ├── app-grid.tsx              # App grid layout
│   │   │   ├── app-card.tsx              # App card component
│   │   │   └── app-filters.tsx           # Filter/search UI
│   │   │
│   │   ├── apps/
│   │   │   ├── installed-app-card.tsx    # Installed app card
│   │   │   ├── app-runner.tsx             # Run execution UI
│   │   │   └── config-form.tsx           # App configuration form
│   │   │
│   │   ├── runs/
│   │   │   ├── run-list.tsx              # Runs history list
│   │   │   ├── run-status.tsx            # Status indicator
│   │   │   └── run-output.tsx            # Output viewer
│   │   │
│   │   └── admin/
│   │       ├── app-editor.tsx            # App manifest editor
│   │       └── version-editor.tsx        # Version editor
│   │
│   ├── middleware.ts                     # Next.js middleware (auth)
│   │
│   └── types/
│       ├── database.ts                   # Generated Supabase types
│       └── manifest.ts                   # App manifest types
│
├── supabase/
│   ├── migrations/
│   │   └── 20240101000000_init_schema.sql  # Initial database schema
│   ├── config.toml                        # Supabase config
│   └── .gitignore
│
├── public/                               # Static assets
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── .cursorrules                          # Cursor IDE rules
├── .gitignore
├── build instructions.md                 # Detailed build guide
├── Market.md                             # This file
├── README.md                             # Basic Next.js readme
│
├── package.json
├── package-lock.json
├── tsconfig.json                         # TypeScript config
├── next.config.ts                        # Next.js config
├── postcss.config.mjs                    # PostCSS config (Tailwind v4)
└── eslint.config.mjs                     # ESLint config
```

---

## Dependencies

### Production Dependencies

```json
{
  "@google/generative-ai": "^0.24.1",      // Google Gemini AI client
  "@hookform/resolvers": "^5.2.2",        // React Hook Form resolvers
  "@supabase/ssr": "^0.8.0",              // Supabase SSR utilities
  "@supabase/supabase-js": "^2.87.1",     // Supabase client
  "ajv": "^8.17.1",                       // JSON schema validation
  "ajv-formats": "^3.0.1",                // Additional AJV formats
  "class-variance-authority": "^0.7.1",   // Component variant utilities
  "clsx": "^2.1.1",                       // Conditional class names
  "google-auth-library": "^10.5.0",        // Google OAuth library
  "googleapis": "^168.0.0",               // Google APIs client
  "lucide-react": "^0.561.0",             // Icon library
  "next": "16.0.10",                      // Next.js framework
  "react": "19.2.1",                      // React library
  "react-dom": "19.2.1",                  // React DOM
  "react-hook-form": "^7.68.0",          // Form management
  "tailwind-merge": "^3.4.0",            // Tailwind class merging
  "zod": "^4.1.13"                        // Schema validation
}
```

### Development Dependencies

```json
{
  "@tailwindcss/postcss": "^4",           // Tailwind v4 PostCSS plugin
  "@types/node": "^20.19.27",             // Node.js types
  "@types/react": "^19",                  // React types
  "@types/react-dom": "^19",              // React DOM types
  "babel-plugin-react-compiler": "1.0.0", // React Compiler
  "eslint": "^9",                         // ESLint
  "eslint-config-next": "16.0.10",        // Next.js ESLint config
  "prettier": "^3.7.4",                   // Code formatter
  "prettier-plugin-tailwindcss": "^0.7.2", // Tailwind Prettier plugin
  "supabase": "^2.67.1",                  // Supabase CLI
  "tailwindcss": "^4",                    // Tailwind CSS v4
  "typescript": "^5"                      // TypeScript
}
```

### Key Package Purposes

- **@google/generative-ai**: Powers the AI runtime engine for executing app workflows
- **@supabase/ssr**: Enables server-side rendering with Supabase auth
- **googleapis**: Provides OAuth and API access to Google services (Drive, Gmail)
- **ajv**: Validates AI output against JSON schemas
- **zod**: Validates user input and form data
- **react-hook-form**: Manages complex form state (app configs, admin forms)

---

## Architecture Principles

### 1. Server-First by Default

**Rule**: Use Server Components unless interactivity is required.

- ✅ **Server Components** for data fetching, static content
- ✅ **Server Actions** for mutations (with admin checks)
- ❌ **Client Components** only for forms, buttons, dynamic UI
- ❌ **No "use client"** unless necessary

**Example**:
```typescript
// ✅ Good - Server Component
import { createClient } from '@/lib/supabase/server'

export default async function MarketplacePage() {
  const supabase = await createClient()
  const { data: apps } = await supabase
    .from('apps')
    .select('*')
    .eq('status', 'published')
  
  return <AppGrid apps={apps} />
}

// ❌ Bad - Client component for static data
"use client"
export default function MarketplacePage() {
  const [apps, setApps] = useState([])
  useEffect(() => { /* fetch */ }, [])
}
```

### 2. Security-First

**Rules**:
- All connector tokens encrypted (AES-256-GCM) before storage
- Admin checks in ALL write operations (apps, versions, runs)
- RLS policies on every Supabase table
- OAuth state validation for connector flows

**Token Encryption**:
```typescript
// Before storage
const { encryptedAccess, encryptedRefresh, iv } = await encryptTokens({
  accessToken: tokens.access_token,
  refreshToken: tokens.refresh_token,
})

// Before use
const { accessToken, refreshToken } = await decryptTokens({
  encryptedAccess: connector.access_token_encrypted,
  encryptedRefresh: connector.refresh_token_encrypted,
  iv: connector.token_iv,
})
```

**Admin Enforcement**:
```typescript
const ADMIN_EMAIL = 'douglastalley1977@gmail.com'

export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user || user.email !== ADMIN_EMAIL) {
    redirect('/marketplace')
  }
  
  return user
}
```

### 3. Type Safety

**Rules**:
- Generate types from Supabase: `npm run db:types`
- Use generated Database types everywhere
- Manifest types strictly enforce app structure
- No `any` types - use `unknown` and validate

**Type Generation**:
```bash
npm run db:types  # Generates src/types/database.ts
```

**Usage**:
```typescript
import { Database } from '@/types/database'

type App = Database['public']['Tables']['apps']['Row']
type AppInsert = Database['public']['Tables']['apps']['Insert']
```

### 4. Performance

**Strategies**:
- Static generation for marketplace pages where possible
- Streaming for long-running AI executions
- Optimistic updates for UI interactions
- Proper Next.js caching strategies

---

## Database Schema

### Core Tables

1. **profiles** - User profiles (extends `auth.users`)
2. **connector_accounts** - OAuth connections (Google Drive, Gmail, etc.)
3. **apps** - Marketplace apps
4. **app_versions** - App version manifests
5. **installed_apps** - User-installed apps with configs
6. **installed_app_grants** - Permissions granted to apps
7. **runs** - App execution records
8. **run_artifacts** - Run outputs and metadata

### Key Features

- **RLS (Row Level Security)**: Every table has RLS enabled
- **Auto-timestamps**: `created_at` and `updated_at` with triggers
- **Generated columns**: `profiles.is_admin` auto-generated from email
- **Indexes**: Performance indexes on foreign keys and commonly queried columns
- **Triggers**: Auto-create profiles on user signup

### Migration File

Location: `supabase/migrations/20240101000000_init_schema.sql`

This file contains the complete database schema including:
- All table definitions
- RLS policies (with optimized `auth.uid()` wrapping)
- Triggers for `updated_at` timestamps
- Profile auto-creation function and trigger
- Performance indexes

**To apply**:
```bash
# Via Supabase CLI (local)
npm run db:reset

# Via Supabase Dashboard
# Copy/paste SQL into SQL Editor
```

---

## Environment Variables

Required in `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Admin operations only

# Google OAuth (for connectors)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Gemini
GEMINI_API_KEY=your_gemini_api_key

# Encryption (generate with: openssl rand -base64 32)
TOKEN_ENCRYPTION_KEY=your_32_byte_base64_key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Generating Encryption Key

```bash
openssl rand -base64 32
```

---

## Development Workflow

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your keys
   ```

3. **Start Supabase (local)**:
   ```bash
   npm run db:start
   ```

4. **Run migrations**:
   ```bash
   # Via Supabase Dashboard SQL Editor
   # Or via CLI if configured
   ```

5. **Generate types**:
   ```bash
   npm run db:types
   ```

6. **Start dev server**:
   ```bash
   npm run dev
   ```

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run format       # Format code with Prettier

# Database
npm run db:start     # Start local Supabase
npm run db:stop      # Stop local Supabase
npm run db:reset     # Reset local database
npm run db:types     # Generate TypeScript types from schema
```

### Type Generation

After schema changes, regenerate types:

```bash
npm run db:types
```

This updates `src/types/database.ts` with the latest schema.

---

## Cursor Rules Summary

The project follows strict coding rules defined in `.cursorrules`. Key points:

### The Three Laws

1. **Never Touch Config to Fix Code** - If an error seems like it needs config changes, you've misdiagnosed it.
2. **One Pattern Per Problem** - Server Components fetch data. Client Components handle interactivity. No mixing.
3. **The 15-Minute Rule** - Debugging the same error for more than 15 minutes? Revert to last working state.

### Component Patterns

- **Start Server, go Client only when needed**
- **Server Actions for mutations** (with admin checks)
- **No "use client" by default**

### Tailwind v4 Syntax

```css
/* globals.css */
@import "tailwindcss";  /* ✅ Correct for v4 */

/* NOT @tailwind base; */  /* ❌ v3 syntax */
```

### Forbidden Actions

- ❌ Modifying `next.config.ts` to fix code
- ❌ Using `@tailwind base;` (v3 syntax)
- ❌ `// @ts-ignore`
- ❌ `any` in application code
- ❌ `"use client"` by default

### Allowed Actions

- ✅ `"use client"` when interactivity is needed
- ✅ `any` in `types/external.ts` (quarantine zone)
- ✅ Client-side fetching for real-time updates

---

## Key Concepts

### 1. Connector Accounts

Users connect external services (Google Drive, Gmail) **once** at the platform level. These connections are stored in `connector_accounts` with encrypted tokens.

### 2. App Grants

Each installed app requests **grants** to access specific connectors. Grants are stored in `installed_app_grants` with status (`allowed`, `denied`, `pending`).

### 3. App Execution Flow

1. User triggers app execution
2. System checks grants
3. Fetches connector data based on grants
4. Builds context from template + connector data + config
5. Calls Gemini with context
6. Validates output against schema
7. Stores results in `runs` and `run_artifacts`

### 4. Manifest System

Apps are defined by **manifests** (JSON) stored in `app_versions.manifest_json`:
- App metadata (name, description, icon)
- Required connectors
- Config schema
- Run template (prompt with `{{variable}}` syntax)
- Output schema

### 5. Admin System

Single admin email: `douglastalley1977@gmail.com`

Admin can:
- Create/edit/publish apps
- Manage app versions
- View all runs
- Access admin panel

---

## Common Patterns

### Fetch Authenticated User

```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) redirect('/login')
```

### Check Admin Status

```typescript
import { isAdmin } from '@/lib/admin'

if (!(await isAdmin())) {
  throw new Error('Unauthorized')
}
```

### Load Installed App with Relations

```typescript
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
```

### Execute Long-Running Task

```typescript
// Use API route with streaming response
export async function POST(request: Request) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(encoder.encode('data: {"status":"processing"}\n\n'))
      
      const result = await executeRun(params)
      
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(result)}\n\n`))
      controller.close()
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    }
  })
}
```

---

## When in Doubt

- **Is this data sensitive?** → Encrypt it
- **Does this mutation modify data?** → Check admin
- **Can this be a Server Component?** → Make it one
- **Does this need to be client-side?** → Only use "use client" if yes
- **Is this user-specific?** → Filter by `user_id` (RLS will enforce)

---

## Additional Resources

- **Build Instructions**: See `build instructions.md` for detailed implementation guide
- **Cursor Rules**: See `.cursorrules` for complete coding standards
- **Supabase Docs**: https://supabase.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Tailwind v4 Docs**: https://tailwindcss.com/docs

---

**Last Updated**: 2024
**Project Status**: Active Development
