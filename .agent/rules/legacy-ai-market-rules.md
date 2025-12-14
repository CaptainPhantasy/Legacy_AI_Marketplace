---
trigger: glob
globs: **/*
---

# Legacy AI Platform - Agent Rules

## PROJECT CONTEXT

This is the **Legacy AI Platform** - a micro-app marketplace with Gemini-powered runtime.

**Single Source of Truth**: Always check `SSOT.md` before making changes.

---

## THE THREE LAWS (NON-NEGOTIABLE)

### Law 1: Never Touch Config to Fix Code
If an error seems like it needs changes to `next.config.ts`, `tsconfig.json`, or `tailwind.config.ts` — **you've misdiagnosed it.** The fix is in your component code.

### Law 2: One Pattern Per Problem
- Server Components → fetch data
- Client Components → handle interactivity  
- Server Actions → mutate data
- **No mixing patterns. No "just this once."**

### Law 3: The 15-Minute Rule
Debugging the same error for more than 15 minutes? **Revert to last working state.**

---

## STACK CONSTRAINTS

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 16 (App Router) |
| React | React | 19 |
| Styling | Tailwind CSS | v4 |
| Backend | Supabase | Auth + Database |
| AI | Google Gemini | via @google/generative-ai |

---

## SECURITY INVARIANTS

**These are HARDCODED and IMMUTABLE:**

1. **Admin Email**: `douglastalley1977@gmail.com`
   - Check server-side in ALL admin operations
   - Never trust client-side admin claims
   
2. **Token Encryption**: AES-256-GCM
   - NEVER store raw OAuth tokens
   - Always use `encryptTokens()` before insert
   - Always use `decryptTokens()` before use

3. **RLS**: Every table has Row Level Security
   - Don't bypass with service role unless absolutely necessary
   - Document any service role usage

---

## FILE PATTERNS

### Server Components (Default)
```typescript
// NO "use client" = Server Component
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data } = await supabase.from('apps').select('*')
  return <AppGrid apps={data} />
}
```

### Client Components (Only When Needed)
```typescript
"use client"

import { useState } from 'react'

export function InteractiveWidget() {
  const [state, setState] = useState(false)
  return <button onClick={() => setState(!state)}>Toggle</button>
}
```

### Server Actions
```typescript
"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createApp(formData: FormData) {
  const supabase = await createClient()
  // ... mutation
  revalidatePath('/admin/apps')
}
```

---

## ADMIN ENFORCEMENT PATTERN

**ALWAYS use this pattern for admin operations:**

```typescript
const ADMIN_EMAIL = 'douglastalley1977@gmail.com'

export async function adminAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // ENFORCE ADMIN - DO NOT SKIP
  if (!user || user.email !== ADMIN_EMAIL) {
    throw new Error('Unauthorized: Admin access required')
  }
  
  // ... proceed with action
}
```

---

## CONNECTOR GRANT ENFORCEMENT

**Apps can ONLY access connectors they've been granted:**

```typescript
// ALWAYS check grant status before fetching connector data
const grant = installedApp.grants.find(g => g.connector_type === connectorType)

if (!grant || grant.status !== 'allowed') {
  // DO NOT FETCH - app not authorized
  return null
}

// Only now fetch connector data
```

---

## TAILWIND v4 SYNTAX

```css
/* ✅ CORRECT - Tailwind v4 */
@import "tailwindcss";

/* ❌ WRONG - This is v3 syntax */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## FORBIDDEN ACTIONS

| Action | Reason |
|--------|--------|
| `// @ts-ignore` | Fix the type error properly |
| `any` in app code | Use `unknown` + validation |
| `"use client"` by default | Start with Server Components |
| `useEffect` for initial data | Use Server Components |
| Raw token storage | Always encrypt |
| Client-side admin checks | Always server-side |

---

## ALLOWED EXCEPTIONS

| Action | When |
|--------|------|
| `"use client"` | Forms, buttons, interactive UI |
| `any` in `types/external.ts` | Quarantine for external APIs |
| Service role Supabase | Explicit admin operations only |

---

## BEFORE EVERY CHANGE

1. **Check SSOT.md** for current build status
2. **Identify the phase** you're working on
3. **Confirm file doesn't exist** before creating
4. **Update SSOT.md** after completing files

---

## COMPONENT NAMING CONVENTIONS

| Type | Convention | Example |
|------|------------|---------|
| Pages | `page.tsx` | `app/(platform)/marketplace/page.tsx` |
| Layouts | `layout.tsx` | `app/(platform)/layout.tsx` |
| API Routes | `route.ts` | `app/api/connectors/[type]/connect/route.ts` |
| Server Actions | `*.ts` in `/actions` | `app/actions/apps.ts` |
| Components | `kebab-case.tsx` | `components/marketplace/app-card.tsx` |
| Utilities | `*.ts` in `/lib` | `lib/encryption.ts` |

---

## SUPABASE PATTERNS

### Server-Side (Await cookies)
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()  // Note: await
  // ...
}
```

### Client-Side (No await)
```typescript
"use client"
import { createClient } from '@/lib/supabase/client'

export function ClientComponent() {
  const supabase = createClient()  // No await
  // ...
}
```

---

## ERROR HANDLING

### Supabase Queries
```typescript
const { data, error } = await supabase.from('apps').select('*')

if (error) {
  console.error('Failed to fetch apps:', error.message)
  throw new Error('Failed to load apps')
}

if (!data || data.length === 0) {
  return <EmptyState />
}
```

### Server Actions
```typescript
"use server"

export async function createApp(formData: FormData) {
  try {
    // ... action
    revalidatePath('/admin/apps')
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}
```

---

## VALIDATION CHECKLIST (After Each File)

- [ ] `npm run build` passes
- [ ] No `"use client"` unless interactive
- [ ] Admin operations check email server-side
- [ ] Tokens encrypted before storage
- [ ] RLS policies respected (user_id filters)
- [ ] SSOT.md updated

---

## COMMON MISTAKES TO AVOID

1. **Forgetting `await` on `createClient()` (server)**
   ```typescript
   // ❌ Wrong
   const supabase = createClient()
   
   // ✅ Correct  
   const supabase = await createClient()
   ```

2. **Using `redirect()` in try/catch**
   ```typescript
   // ❌ Wrong - redirect throws, catch swallows it
   try {
     redirect('/dashboard')
   } catch (e) {}
   
   // ✅ Correct - redirect outside try/catch
   if (!user) redirect('/login')
   ```

3. **Checking admin on client**
   ```typescript
   // ❌ Wrong - client can be spoofed
   if (user.isAdmin) { /* admin UI */ }
   
   // ✅ Correct - check email server-side
   if (user.email === ADMIN_EMAIL) { /* admin UI */ }
   ```

---

## REFERENCE

- **SSOT**: `SSOT.md`
- **Build Guide**: `build instructions.md`
- **Cursor Rules**: `.cursorrules`
