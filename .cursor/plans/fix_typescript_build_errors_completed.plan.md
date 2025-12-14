---
name: Fix TypeScript Build Errors
overview: Fix the remaining TypeScript build error in engine.ts by properly typing the saveRunArtifacts function to match Supabase's Json type.
todos:
  - id: fix-engine-type
    content: Fix Awaited type in engine.ts line 180
    status: completed
  - id: fix-grant-null
    content: Handle null status in grant-manager.tsx line 136
    status: completed
  - id: remove-debug-logs
    content: Remove all debug instrumentation from app-runner.tsx
    status: completed
  - id: add-execution-type
    content: Add execution property to AppManifest in manifest.ts
    status: completed
  - id: fix-save-artifacts
    content: Fix saveRunArtifacts type casting for Json compatibility
    status: completed
  - id: verify-build
    content: Run npm run build to verify all errors resolved
    status: completed
---

# Fix TypeScript Build Error in engine.ts

## Current Status

Four fixes have been applied:

- engine.ts line 180: Awaited type - DONE
- grant-manager.tsx line 136: null handling - DONE
- app-runner.tsx: debug logs removed - DONE
- manifest.ts: execution property added - DONE

**One error remains at `engine.ts:339`**

---

## Remaining Error Analysis

```
Type error: No overload matches this call.
  Object literal may only specify known properties, and 'run_id' does not exist...
```

The error about `'run_id' does not exist` is **misleading**. The real problem:

1. `artifacts.inputsSummary` is typed as `object | undefined`
2. `artifacts.output` is typed as `unknown`
3. `artifacts.logs` is typed as `object | undefined`

These don't match Supabase's `Json` type:

```typescript
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]
```

TypeScript's `object` type is too broad (includes functions, classes, etc.) and doesn't satisfy `Json`.

When TypeScript can't match the insert to any overload, it shows a confusing error about the first property it tries to resolve.

---

## Fix: saveRunArtifacts Function

**Location:** [src/lib/runtime/engine.ts](src/lib/runtime/engine.ts) lines 324-352

**Changes Required:**

1. Import `Json` type from database types
2. Cast artifact fields to `Json` when inserting
```typescript
// Line 5: Update import
import type { Database, Json } from '@/types/database'

// Lines 338-347: Add type casts to the insert
const { error } = await supabase.from('run_artifacts').insert({
  run_id: runId,
  inputs_summary_json: artifacts.inputsSummary as Json | undefined,
  output_json: artifacts.output as Json | undefined,
  raw_response: artifacts.rawResponse,
  logs: artifacts.logs as Json | undefined,
  model_used: artifacts.modelUsed,
  tokens_input: artifacts.tokensInput,
  tokens_output: artifacts.tokensOutput,
})
```


**Why this is safe:**

- We control what gets passed to `saveRunArtifacts`
- The data comes from Gemini responses which are valid JSON
- The casts tell TypeScript "trust me, this is valid Json"

---

## Verification

After the fix, run:

```bash
npm run build
```

Expected: Build passes with no TypeScript errors.