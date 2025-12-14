# LEGACY AI PLATFORM - SINGLE SOURCE OF TRUTH (SSOT)

**Last Updated**: December 14, 2025  
**Status**: Phase 8 - Run Engine (Complete)  
**Build Method**: AI Studio Generation → Cursor Execution

---

## 🎯 PROJECT IDENTITY

| Field | Value |
|-------|-------|
| **Name** | Legacy AI Platform |
| **Type** | Micro-app marketplace + AI runtime platform |
| **Stack** | Next.js 16 + React 19 + Tailwind v4 + Supabase |
| **Auth** | Google Sign-In (OIDC) via Supabase - No passwords |
| **Admin** | `douglastalley1977@gmail.com` (hardcoded, single admin) |
| **AI Runtime** | Google Gemini (2.5 Flash default, 3 Pro for complex) |

---

## 📊 BUILD PROGRESS

### Phase Status

| Phase | Description | Status | Notes |
|-------|-------------|--------|-------|
| **1** | Database Schema | ✅ Complete | Migration in `supabase/migrations/` |
| **2** | Auth Flow | ✅ Complete | Login page, callback, middleware, admin guards |
| **3** | Platform Shell & Dashboard | ✅ Complete | Layout, dashboard, admin guard, UI components |
| **4** | Connections & OAuth | ✅ Complete | OAuth flows, encryption, connector management |
| **5** | Marketplace | ✅ Complete | Browse, filter, app detail, install flow |
| **6** | Install Flow | ✅ Complete | Grant management UI, config forms, installed apps page |
| **7** | App Runner | ✅ Complete | Run execution UI, streaming status, output rendering |
| **8** | Run Engine | ✅ Complete | Gemini execution, validation, context building |
| **9** | Admin Panel | ⬜ Not Started | App CRUD, manifest editor |
| **10** | Seed Data | ⬜ Not Started | SubSentry Lite app |

### File Completion Tracker

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx                    ✅ EXISTS
│   │   └── auth/callback/route.ts            ✅ EXISTS
│   ├── (platform)/
│   │   ├── layout.tsx                        ✅ EXISTS
│   │   ├── page.tsx                          ✅ EXISTS
│   │   ├── connections/page.tsx              ✅ EXISTS
│   │   ├── marketplace/page.tsx              ✅ EXISTS
│   │   ├── marketplace/[slug]/page.tsx       ✅ EXISTS
│   │   ├── apps/page.tsx                     ✅ EXISTS
│   │   ├── apps/[id]/page.tsx                ✅ EXISTS
│   │   └── runs/page.tsx                     ✅ EXISTS
│   │   └── runs/[id]/page.tsx                ✅ EXISTS
│   ├── (admin)/
│   │   ├── layout.tsx                        ✅ EXISTS
│   │   ├── apps/page.tsx                     ⬜ TODO
│   │   ├── apps/new/page.tsx                 ⬜ TODO
│   │   ├── apps/[id]/edit/page.tsx           ⬜ TODO
│   │   └── runs/page.tsx                     ⬜ TODO
│   ├── api/
│   │   ├── connectors/[type]/connect/route.ts    ✅ EXISTS
│   │   ├── connectors/[type]/callback/route.ts   ✅ EXISTS
│   │   └── runs/[id]/execute/route.ts           ✅ EXISTS
│   ├── actions/
│   │   ├── apps.ts                           ⬜ TODO
│   │   ├── installs.ts                       ✅ EXISTS
│   │   ├── grants.ts                         ✅ EXISTS
│   │   ├── connectors.ts                     ✅ EXISTS
│   │   ├── runs.ts                           ✅ EXISTS
│   │   └── installs.ts                       ✅ EXISTS (updated with updateAppConfig)
│   ├── layout.tsx                            ✅ EXISTS (default)
│   ├── page.tsx                              ✅ EXISTS (needs update)
│   └── globals.css                           ✅ EXISTS
│
├── components/
│   ├── ui/                                   ✅ EXISTS (button, card, input)
│   ├── auth/
│   │   └── login-button.tsx                  ✅ EXISTS
│   ├── connectors/
│   │   ├── connector-card.tsx                ✅ EXISTS
│   │   └── connect-button.tsx                 ✅ EXISTS
│   ├── marketplace/
│   │   ├── app-grid.tsx                      ✅ EXISTS
│   │   ├── app-card.tsx                       ✅ EXISTS
│   │   ├── app-filters.tsx                   ✅ EXISTS
│   │   ├── marketplace-filters.tsx            ✅ EXISTS
│   │   └── install-button.tsx                 ✅ EXISTS
│   ├── apps/
│   │   ├── installed-app-card.tsx            ✅ EXISTS
│   │   ├── app-runner.tsx                    ✅ EXISTS
│   │   ├── config-form.tsx                   ✅ EXISTS
│   │   └── grant-manager.tsx                 ✅ EXISTS
│   ├── runs/
│   │   ├── run-list.tsx                      ✅ EXISTS
│   │   ├── run-status.tsx                    ✅ EXISTS
│   │   └── run-output.tsx                    ✅ EXISTS
│   ├── ui/
│   │   └── label.tsx                         ✅ EXISTS
│   └── admin/
│       ├── app-editor.tsx                    ⬜ TODO
│       └── version-editor.tsx                ⬜ TODO
│
├── lib/
│   ├── supabase/
│   │   ├── server.ts                         ✅ EXISTS
│   │   ├── client.ts                         ✅ EXISTS
│   │   └── middleware.ts                     ✅ EXISTS
│   ├── connectors/
│   │   ├── google-drive.ts                   ✅ EXISTS
│   │   ├── gmail.ts                          ✅ EXISTS
│   │   └── oauth.ts                          ✅ EXISTS
│   ├── runtime/
│   │   ├── engine.ts                         ✅ EXISTS
│   │   ├── gemini.ts                         ✅ EXISTS
│   │   ├── context.ts                        ✅ EXISTS
│   │   └── validation.ts                     ✅ EXISTS
│   ├── encryption.ts                         ✅ EXISTS
│   ├── admin.ts                              ✅ EXISTS
│   └── utils.ts                              ✅ EXISTS
│
├── types/
│   ├── database.ts                           ✅ EXISTS
│   └── manifest.ts                           ✅ EXISTS
│
└── middleware.ts                             ✅ EXISTS
```

---

## 🗄️ DATABASE TABLES

| Table | Purpose | RLS | Status |
|-------|---------|-----|--------|
| `profiles` | User profiles (extends auth.users) | ✅ | Defined |
| `connector_accounts` | OAuth tokens (encrypted) | ✅ | Defined |
| `apps` | Marketplace apps | ✅ | Defined |
| `app_versions` | App manifests & templates | ✅ | Defined |
| `installed_apps` | User installations | ✅ | Defined |
| `installed_app_grants` | Per-app permissions | ✅ | Defined |
| `runs` | Execution records | ✅ | Defined |
| `run_artifacts` | Output & logs | ✅ | Defined |

**Migration Location**: `supabase/migrations/20240101000000_init_schema.sql`

---

## 🔐 SECURITY INVARIANTS

These rules are **NON-NEGOTIABLE**:

1. **Admin Email Hardcoded**: `douglastalley1977@gmail.com` - checked server-side in ALL admin operations
2. **Token Encryption**: All OAuth tokens encrypted with AES-256-GCM before storage
3. **RLS Everywhere**: Every table has Row Level Security enabled
4. **Server-Side Auth**: Never trust client for auth decisions
5. **Grant Enforcement**: Apps can only access connectors with `status = 'allowed'`

---

## 🧩 CORE PATTERNS

### Authentication Check (Server Component)
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) redirect('/login')
```

### Admin Guard (Server Action)
```typescript
const ADMIN_EMAIL = 'douglastalley1977@gmail.com'

const { data: { user } } = await supabase.auth.getUser()
if (!user || user.email !== ADMIN_EMAIL) {
  throw new Error('Unauthorized: Admin access required')
}
```

### Connector Data Fetch Pattern
```typescript
// 1. Check grant status
const grant = installedApp.grants.find(g => g.connector_type === 'gmail')
if (grant?.status !== 'allowed') return null

// 2. Get connector account
const { data: connector } = await supabase
  .from('connector_accounts')
  .select('*')
  .eq('user_id', userId)
  .eq('connector_type', 'gmail')
  .single()

// 3. Decrypt tokens
const tokens = await decryptTokens({
  encryptedAccess: connector.access_token_encrypted,
  encryptedRefresh: connector.refresh_token_encrypted,
  iv: connector.token_iv,
})

// 4. Fetch data
const data = await fetchGmailData(tokens, grant.grant_json)
```

---

## 📦 DEPENDENCIES (INSTALLED)

### Production
- `@supabase/supabase-js`, `@supabase/ssr` - Database & Auth
- `googleapis`, `google-auth-library` - Google OAuth & APIs
- `@google/generative-ai` - Gemini SDK
- `lucide-react` - Icons
- `class-variance-authority`, `clsx`, `tailwind-merge` - Styling utilities
- `react-hook-form`, `zod`, `@hookform/resolvers` - Forms
- `ajv`, `ajv-formats` - JSON Schema validation

### Dev
- `supabase` - CLI for local dev & type generation
- `prettier`, `prettier-plugin-tailwindcss` - Formatting

---

## 🌐 ENVIRONMENT VARIABLES

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Google OAuth (connectors)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Gemini
GEMINI_API_KEY=

# Encryption (openssl rand -base64 32)
TOKEN_ENCRYPTION_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🚀 NEXT BUILD TASK

**Current Phase**: 9 - Admin Panel

**Next Files to Generate**:
1. `src/app/(admin)/apps/page.tsx` - Admin apps list
2. `src/app/(admin)/apps/new/page.tsx` - Create app page
3. `src/app/(admin)/apps/[id]/edit/page.tsx` - Edit app page
4. `src/app/(admin)/runs/page.tsx` - Admin runs view
5. `src/components/admin/app-editor.tsx` - App manifest editor
6. `src/components/admin/version-editor.tsx` - Version editor
7. `src/app/actions/apps.ts` - App CRUD server actions

---

## 📝 CHANGE LOG

| Date | Phase | Changes |
|------|-------|---------|
| 2025-12-14 | Setup | Initial Next.js 16 project created |
| 2025-12-14 | Setup | All dependencies installed |
| 2025-12-14 | Phase 1 | Database migration created |
| 2025-12-14 | Docs | SSOT and rules established |
| 2025-12-14 | Phase 2 | Auth flow completed: login page, callback route, admin guards, login button component |
| 2025-12-14 | Build Fix | Fixed "generate is not a function" error by unsetting Cursor IDE environment variables in build script |
| 2025-12-14 | Phase 3 | Platform shell completed: layout with sidebar/header, dashboard page, admin layout guard, UI components (button, card, input) |
| 2025-12-14 | Phase 4 | Connections & OAuth completed: encryption utilities (AES-256-GCM), OAuth flow helpers, Google Drive/Gmail wrappers, connect/callback API routes, connections page |
| 2025-12-14 | Phase 5 | Marketplace completed: browse page with filters, app detail page, install/uninstall flow, manifest types, all marketplace components |
| 2025-12-14 | Cleanup | Removed orphaned Field Service Management functions from database, verified clean RLS policies |
| 2025-12-14 | Phase 8 | Runtime Engine completed: Gemini client, context builder, validation, execution engine with connector data fetching |
| 2025-12-14 | Phase 7 | App Runner completed: streaming API route, run actions, status/output components, run history pages |
| 2025-12-14 | Phase 6 | My Apps & Grants completed: installed apps page, grant manager, config form, app detail/runner page |

---

## ⚠️ KNOWN ISSUES / BLOCKERS

*None currently*

**Resolved**: Build error `TypeError: generate is not a function` was caused by Cursor IDE environment variables interfering with Next.js build. Fixed by unsetting these variables in the build script: `__NEXT_PRIVATE_STANDALONE_CONFIG`, `__NEXT_PRIVATE_ORIGIN`, `NEXT_DEPLOYMENT_ID`, `__NEXT_PRIVATE_RUNTIME_TYPE`, `NEXT_OTEL_FETCH_DISABLED`.

---

## 🔗 REFERENCE FILES

- **Build Guide**: `build instructions.md`
- **Project Docs**: `Market.md`
- **Cursor Rules**: `.cursorrules`
- **Agent Rules**: `.agent/rules/legacy-ai-market-rules.md`
- **This File**: `SSOT.md`