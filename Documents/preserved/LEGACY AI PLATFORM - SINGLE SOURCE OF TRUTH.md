# LEGACY AI PLATFORM - SINGLE SOURCE OF TRUTH (SSOT)

**Last Updated**: December 14, 2025  
**Status**: Phase 5 - Marketplace (Complete)  
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
| **6** | Install Flow | ⬜ Not Started | Grant management UI refinement |
| **7** | App Runner | ⬜ Not Started | Config form, run UI, output |
| **8** | Run Engine | ⬜ Not Started | Gemini execution, validation |
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
│   │   ├── apps/page.tsx                     ⬜ TODO
│   │   ├── apps/[id]/page.tsx                ⬜ TODO
│   │   ├── apps/[id]/runs/[runId]/page.tsx   ⬜ TODO
│   │   └── runs/page.tsx                     ⬜ TODO
│   ├── (admin)/
│   │   ├── layout.tsx                        ✅ EXISTS
│   │   ├── apps/page.tsx                     ⬜ TODO
│   │   ├── apps/new/page.tsx                 ⬜ TODO
│   │   ├── apps/[id]/edit/page.tsx           ⬜ TODO
│   │   └── runs/page.tsx                     ⬜ TODO
│   ├── api/
│   │   ├── connectors/[type]/connect/route.ts    ✅ EXISTS
│   │   ├── connectors/[type]/callback/route.ts   ✅ EXISTS
│   │   └── runs/[id]/route.ts                    ⬜ TODO
│   ├── actions/
│   │   ├── apps.ts                           ⬜ TODO
│   │   ├── installs.ts                       ✅ EXISTS
│   │   ├── grants.ts                         ⬜ TODO
│   │   ├── connectors.ts                     ✅ EXISTS
│   │   └── runs.ts                           ⬜ TODO
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
│   │   ├── installed-app-card.tsx            ⬜ TODO
│   │   ├── app-runner.tsx                    ⬜ TODO
│   │   └── config-form.tsx                   ⬜ TODO
│   ├── runs/
│   │   ├── run-list.tsx                      ⬜ TODO
│   │   ├── run-status.tsx                    ⬜ TODO
│   │   └── run-output.tsx                    ⬜ TODO
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
│   │   ├── google-drive.ts                   ⬜ TODO
│   │   ├── gmail.ts                          ⬜ TODO
│   │   └── oauth.ts                          ⬜ TODO
│   ├── runtime/
│   │   ├── engine.ts                         ⬜ TODO
│   │   ├── gemini.ts                         ⬜ TODO
│   │   ├── context.ts                        ⬜ TODO
│   │   └── validation.ts                     ⬜ TODO
│   ├── encryption.ts                         ⬜ TODO
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

**Current Phase**: 6 - Install Flow Refinement (or Phase 7 - App Runner)

**Next Files to Generate**:
1. `src/app/(platform)/apps/page.tsx` - Installed apps list
2. `src/app/(platform)/apps/[id]/page.tsx` - App runner UI
3. `src/components/apps/installed-app-card.tsx` - App card component
4. `src/components/apps/app-runner.tsx` - Run execution UI
5. `src/components/apps/config-form.tsx` - Configuration form
6. `src/app/api/runs/[id]/route.ts` - Run execution API (streaming)
7. `src/lib/runtime/engine.ts` - Execution engine
8. `src/lib/runtime/gemini.ts` - Gemini client
9. `src/lib/runtime/context.ts` - Context building
10. `src/lib/runtime/validation.ts` - Output validation

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