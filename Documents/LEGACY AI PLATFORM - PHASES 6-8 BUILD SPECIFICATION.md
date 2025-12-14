# LEGACY AI PLATFORM - PHASES 6-8 BUILD SPECIFICATION
**Current Status**: Phases 1-5 Complete, Build Passing **Next**: Phase 6 → Phase 7 → Phase 8

## PHASE 6: MY APPS & GRANT MANAGEMENT
**Goal**: Users can view their installed apps, manage connector grants per app, and configure app settings.
### Files to Create
| **File** | **Type** | **Purpose** |
|:-:|:-:|:-:|
| src/app/(platform)/apps/page.tsx | Server Component | List of user's installed apps |
| src/app/(platform)/apps/[id]/page.tsx | Server Component | Single app view with config & grants |
| src/components/apps/installed-app-card.tsx | Client Component | Card displaying installed app with status |
| src/components/apps/grant-manager.tsx | Client Component | UI to allow/deny connector grants |
| src/components/apps/config-form.tsx | Client Component | Dynamic form from app's config schema |
| src/app/actions/grants.ts | Server Action | Update grant status (allow/deny) |
### Database Queries Needed
// Get user's installed apps with app details and grants
const { data: installedApps } = await supabase
  .from('installed_apps')
  .select(`
    *,
    app:apps(*),
    version:app_versions(*),
    grants:installed_app_grants(*)
  `)
  .eq('user_id', userId)
  .eq('is_enabled', true)

// Update grant status
await supabase
  .from('installed_app_grants')
  .update({ status: 'allowed' })
  .eq('id', grantId)
### UI Requirements
**My Apps Page (****/apps****)**:
* •	Grid of installed app cards
* •	Each card shows: icon, name, description, grant status indicators
* •	Click card → navigate to app detail page
* •	Empty state if no apps installed

⠀**App Detail Page (****/apps/[id]****)**:
* •	App header (icon, name, description)
* **•	Grants Section**: List required/optional connectors with allow/deny toggles
* **•	Config Section**: Dynamic form based on config_schema_json
* **•	Run Button**: Disabled until required grants are allowed
* •	Link back to marketplace for uninstall

⠀**Grant Manager Component**:
* •	For each connector requirement from manifest:
  * ◦	Show connector type icon
  * ◦	Show if required or optional
  * ◦	Show current status (allowed/denied/pending)
  * ◦	Toggle button to allow/deny
  * ◦	Warning if user hasn't connected this service yet

⠀**Config Form Component**:
* •	Render form fields from JSON Schema (config_schema_json)
* •	Support field types: text, textarea, number, select, checkbox
* •	Save config to installed_apps.config_json
* •	Validate with Zod schema generated from JSON Schema

⠀Acceptance Criteria
* •	[ ] User can view all their installed apps at /apps
* •	[ ] User can click an app to see detail view
* •	[ ] User can allow/deny grants for each connector
* •	[ ] User can configure app settings via dynamic form
* •	[ ] Config persists to database
* •	[ ] Run button shows correct enabled/disabled state
* •	[ ] Build passes

⠀
## PHASE 7: APP RUNNER & RUN HISTORY
**Goal**: Users can execute apps and view run results. The UI shows real-time status during execution.
### Files to Create
| **File** | **Type** | **Purpose** |
|:-:|:-:|:-:|
| src/components/apps/run-button.tsx | Client Component | Triggers app execution |
| src/components/apps/app-runner.tsx | Client Component | Full runner UI with status |
| src/components/runs/run-status.tsx | Client Component | Status badge/indicator |
| src/components/runs/run-output.tsx | Client Component | Renders structured output |
| src/components/runs/run-list.tsx | Server Component | List of runs |
| src/app/(platform)/apps/[id]/runs/[runId]/page.tsx | Server Component | Single run detail view |
| src/app/(platform)/runs/page.tsx | Server Component | All runs history |
| src/app/actions/runs.ts | Server Action | Create run record |
| src/app/api/runs/[id]/execute/route.ts | API Route | Execute run (streaming) |
### Execution Flow
User clicks "Run" 
    → Server Action creates run record (status: 'pending')
    → Client calls API route to execute
    → API route streams status updates:
        → 'fetching' (getting connector data)
        → 'processing' (calling Gemini)
        → 'validating' (checking output schema)
        → 'completed' or 'error'
    → Client updates UI in real-time
    → On complete, show output
### API Route (Streaming)
// src/app/api/runs/[id]/execute/route.ts
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      const sendStatus = (status: string, data?: any) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ status, ...data })}\n\n`))
      }
      
      try {
        sendStatus('fetching')
        // ... fetch connector data
        
        sendStatus('processing')
        // ... call Gemini
        
        sendStatus('validating')
        // ... validate output
        
        sendStatus('completed', { output })
      } catch (error) {
        sendStatus('error', { message: error.message })
      } finally {
        controller.close()
      }
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
### UI Requirements
**Run Button**:
* •	Disabled if required grants not allowed
* •	Shows loading spinner during execution
* •	Tooltip explaining why disabled (if applicable)

⠀**App Runner Component**:
* •	Shows current run status with progress indicator
* •	Status steps: Fetching → Processing → Validating → Complete
* •	Error state with message
* •	On complete, render output

⠀**Run Output Component**:
* •	Render based on outputRenderer from manifest:
  * ◦	json: Pretty-printed JSON tree
  * ◦	table: Data table for array outputs
  * ◦	cards: Card grid for structured data
* •	Expandable sections for large outputs
* •	Copy to clipboard button

⠀**Run History Page (****/runs****)**:
* •	List all user's runs (most recent first)
* •	Show: app name, status, duration, timestamp
* •	Click to view run detail
* •	Filter by app, status

⠀**Run Detail Page (****/apps/[id]/runs/[runId]****)**:
* •	Full run information
* •	Input summary (what config/data was used)
* •	Output display
* •	Execution metadata (model, tokens, duration)
* •	Re-run button

⠀Acceptance Criteria
* •	[ ] User can click Run and see real-time status updates
* •	[ ] Execution completes and shows output
* •	[ ] Errors are displayed clearly
* •	[ ] Run history shows all past runs
* •	[ ] User can view individual run details
* •	[ ] Output renders correctly based on manifest renderer type
* •	[ ] Build passes

⠀
## PHASE 8: RUNTIME ENGINE & GEMINI INTEGRATION
**Goal**: The backend that actually executes apps - fetches connector data, builds prompts, calls Gemini, validates output.
### Files to Create
| **File** | **Type** | **Purpose** |
|:-:|:-:|:-:|
| src/lib/runtime/engine.ts | Library | Main orchestrator |
| src/lib/runtime/gemini.ts | Library | Gemini API client |
| src/lib/runtime/context.ts | Library | Template rendering |
| src/lib/runtime/validation.ts | Library | Output schema validation |
### Engine Architecture
// src/lib/runtime/engine.ts

export interface RunContext {
  installedAppId: string
  userId: string
  config: Record<string, unknown>
  inputOverrides?: Record<string, unknown>
}

export interface RunResult {
  status: 'completed' | 'error'
  output?: unknown
  error?: string
  metadata: {
    model: string
    tokensInput: number
    tokensOutput: number
    durationMs: number
  }
}

export async function executeRun(
  context: RunContext,
  onStatus: (status: string) => void
): Promise<RunResult> {
  // 1. Load installed app with manifest
  // 2. Verify grants
  // 3. Fetch connector data (based on grants)
  // 4. Build prompt from template
  // 5. Call Gemini
  // 6. Validate output
  // 7. Return result
}
### Gemini Client
// src/lib/runtime/gemini.ts

import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export interface GeminiRequest {
  model: string
  prompt: string
  outputSchema: object
  config?: {
    temperature?: number
    maxOutputTokens?: number
  }
}

export interface GeminiResponse {
  text: string
  parsed: unknown
  usage: {
    promptTokens: number
    completionTokens: number
  }
}

export async function callGemini(request: GeminiRequest): Promise<GeminiResponse> {
  const model = genAI.getGenerativeModel({
    model: request.model,
    generationConfig: {
      temperature: request.config?.temperature ?? 0.3,
      maxOutputTokens: request.config?.maxOutputTokens ?? 4096,
      responseMimeType: 'application/json',
      responseSchema: convertJsonSchemaToGemini(request.outputSchema),
    },
  })
  
  const result = await model.generateContent(request.prompt)
  const response = result.response
  
  return {
    text: response.text(),
    parsed: JSON.parse(response.text()),
    usage: {
      promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
      completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
    },
  }
}
### Context Builder
// src/lib/runtime/context.ts

export interface ContextData {
  config: Record<string, unknown>
  connectors: {
    google_drive?: { files: any[] }
    gmail?: { messages: any[] }
  }
  currentDate: string
}

export function buildPrompt(template: string, data: ContextData): string {
  // Simple Handlebars-style replacement
  let prompt = template
  
  // Replace {{config.field}}
  for (const [key, value] of Object.entries(data.config)) {
    prompt = prompt.replace(new RegExp(`\\{\\{config\\.${key}\\}\\}`, 'g'), String(value))
  }
  
  // Replace {{connectors.type.data}}
  for (const [type, connectorData] of Object.entries(data.connectors)) {
    for (const [key, value] of Object.entries(connectorData)) {
      prompt = prompt.replace(
        new RegExp(`\\{\\{connectors\\.${type}\\.${key}\\}\\}`, 'g'),
        JSON.stringify(value)
      )
    }
  }
  
  // Replace {{currentDate}}
  prompt = prompt.replace(/\{\{currentDate\}\}/g, data.currentDate)
  
  // Handle conditionals {{ config.field}}...{{/if}}
  // (simplified - expand as needed)
  
  return prompt
}
### Output Validation
// src/lib/runtime/validation.ts

import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const ajv = new Ajv({ allErrors: true })
addFormats(ajv)

export interface ValidationResult {
  valid: boolean
  errors?: string[]
  data?: unknown
}

export function validateOutput(output: unknown, schema: object): ValidationResult {
  const validate = ajv.compile(schema)
  const valid = validate(output)
  
  if (valid) {
    return { valid: true, data: output }
  }
  
  return {
    valid: false,
    errors: validate.errors?.map(e => `${e.instancePath} ${e.message}`) ?? ['Unknown validation error'],
  }
}
### Connector Data Fetching
The engine needs to call the existing connector wrappers:
// In engine.ts

import { fetchDriveFiles } from '@/lib/connectors/google-drive'
import { fetchGmailMessages } from '@/lib/connectors/gmail'
import { decryptTokens } from '@/lib/encryption'

async function fetchConnectorData(
  userId: string,
  grants: Grant[],
  supabase: SupabaseClient
): Promise<Record<string, unknown>> {
  const data: Record<string, unknown> = {}
  
  for (const grant of grants) {
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
    
    // Fetch based on type
    switch (grant.connector_type) {
      case 'google_drive':
        data.google_drive = { files: await fetchDriveFiles(tokens, grant.grant_json) }
        break
      case 'gmail':
        data.gmail = { messages: await fetchGmailMessages(tokens, grant.grant_json) }
        break
    }
  }
  
  return data
}
### Acceptance Criteria
* •	[ ] Engine can load installed app and manifest
* •	[ ] Engine verifies grants before fetching
* •	[ ] Engine fetches connector data using encrypted tokens
* •	[ ] Context builder renders templates correctly
* •	[ ] Gemini client calls API with JSON mode
* •	[ ] Output validator checks against schema
* •	[ ] Failed validation triggers retry (up to 2x)
* •	[ ] All execution metadata captured
* •	[ ] Build passes

⠀
## PHASE DEPENDENCIES
Phase 6 (My Apps)
    └── Phase 7 (App Runner)
            └── Phase 8 (Runtime Engine)
Phase 7 UI calls Phase 8 backend. Phase 6 provides the entry point to Phase 7.

## RECOMMENDED BUILD ORDER
1. **1	Phase 8 first** (backend) - Build the engine so you can test it
2. **2	Phase 7 second** (runner UI) - Connect UI to engine
3. **3	Phase 6 last** (my apps) - Polish the entry point

⠀Or build sequentially 6 → 7 → 8, stubbing the engine initially.

## ESTIMATED FILE COUNT
| **Phase** | **New Files** | **Modified Files** |
|:-:|:-:|:-:|
| Phase 6 | 6 | 1 (SSOT) |
| Phase 7 | 9 | 2 (SSOT, maybe app/[id]/page.tsx) |
| Phase 8 | 4 | 1 (SSOT) |
| **Total** | **19** | **4** |

## VALIDATION AFTER EACH PHASE
# After each phase
npm run build
npm run lint

# Manual testing
# Phase 6: Navigate to /apps, click an app, toggle grants, save config
# Phase 7: Click Run, watch status updates, see output
# Phase 8: Check logs for correct execution flow

*Legacy AI Platform - Phases 6-8 Specification v1.0*


# LEGACY AI PLATFORM - COMPLETE BUILD PROMPT (PHASES 6-8)

## BUILD ORDER: Phase 8 → Phase 7 → Phase 6

**Copy this entire document into Cursor. Execute sections in order.**

---

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 8: RUNTIME ENGINE (Build First)
# ═══════════════════════════════════════════════════════════════════════════════

## 8.1 Create Output Validation Utility

**File: `src/lib/runtime/validation.ts`**

```typescript
import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

export interface ValidationResult {
  valid: boolean
  errors?: string[]
  data?: unknown
}

export function validateOutput(output: unknown, schema: object): ValidationResult {
  try {
    const validate = ajv.compile(schema)
    const valid = validate(output)

    if (valid) {
      return { valid: true, data: output }
    }

    return {
      valid: false,
      errors: validate.errors?.map((e) => `${e.instancePath || 'root'} ${e.message}`) ?? [
        'Unknown validation error',
      ],
    }
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'Schema compilation failed'],
    }
  }
}

export function safeJsonParse(text: string): { success: true; data: unknown } | { success: false; error: string } {
  try {
    // Handle potential markdown code blocks in response
    let cleanText = text.trim()
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.slice(7)
    }
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.slice(3)
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.slice(0, -3)
    }
    
    const data = JSON.parse(cleanText.trim())
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'JSON parse failed' }
  }
}
```

---

## 8.2 Create Context Builder (Template Rendering)

**File: `src/lib/runtime/context.ts`**

```typescript
export interface ContextData {
  config: Record<string, unknown>
  connectors: {
    google_drive?: { files: unknown[] }
    gmail?: { messages: unknown[] }
  }
  currentDate: string
  currentDateTime: string
}

/**
 * Build prompt from template with Handlebars-style placeholders
 * Supports:
 * - {{config.fieldName}}
 * - {{connectors.google_drive.files}}
 * - {{connectors.gmail.messages}}
 * - {{currentDate}}
 * - {{currentDateTime}}
 * - {{#if config.field}}...{{/if}}
 * - {{#each connectors.gmail.messages}}...{{/each}}
 */
export function buildPrompt(template: string, data: ContextData): string {
  let prompt = template

  // Replace {{currentDate}} and {{currentDateTime}}
  prompt = prompt.replace(/\{\{currentDate\}\}/g, data.currentDate)
  prompt = prompt.replace(/\{\{currentDateTime\}\}/g, data.currentDateTime)

  // Replace {{config.field}}
  for (const [key, value] of Object.entries(data.config)) {
    const placeholder = new RegExp(`\\{\\{config\\.${escapeRegex(key)}\\}\\}`, 'g')
    const replacement = formatValue(value)
    prompt = prompt.replace(placeholder, replacement)
  }

  // Replace {{connectors.type.field}}
  for (const [connectorType, connectorData] of Object.entries(data.connectors)) {
    if (!connectorData) continue
    for (const [key, value] of Object.entries(connectorData)) {
      const placeholder = new RegExp(
        `\\{\\{connectors\\.${escapeRegex(connectorType)}\\.${escapeRegex(key)}\\}\\}`,
        'g'
      )
      const replacement = formatValue(value)
      prompt = prompt.replace(placeholder, replacement)
    }
  }

  // Handle {{#if config.field}}content{{/if}}
  prompt = processConditionals(prompt, data)

  // Handle {{#each connectors.type.field}}...{{/each}}
  prompt = processEachBlocks(prompt, data)

  return prompt
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

function processConditionals(template: string, data: ContextData): string {
  // Match {{#if path}}content{{/if}}
  const ifRegex = /\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g

  return template.replace(ifRegex, (_, path: string, content: string) => {
    const value = getNestedValue(data, path)
    // Truthy check: not null, undefined, empty string, 0, false
    if (value !== null && value !== undefined && value !== '' && value !== 0 && value !== false) {
      return content
    }
    return ''
  })
}

function processEachBlocks(template: string, data: ContextData): string {
  // Match {{#each path}}content{{/each}}
  const eachRegex = /\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g

  return template.replace(eachRegex, (_, path: string, content: string) => {
    const value = getNestedValue(data, path)
    if (!Array.isArray(value)) {
      return ''
    }

    return value
      .map((item, index) => {
        let itemContent = content
        // Replace {{this}} with current item
        itemContent = itemContent.replace(/\{\{this\}\}/g, formatValue(item))
        // Replace {{@index}} with current index
        itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index))
        // Replace {{this.field}} for object items
        if (typeof item === 'object' && item !== null) {
          for (const [key, val] of Object.entries(item)) {
            itemContent = itemContent.replace(
              new RegExp(`\\{\\{this\\.${escapeRegex(key)}\\}\\}`, 'g'),
              formatValue(val)
            )
          }
        }
        return itemContent
      })
      .join('\n')
  })
}

function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }
    if (typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[part]
  }

  return current
}

/**
 * Create context data object with current timestamps
 */
export function createContextData(
  config: Record<string, unknown>,
  connectorData: ContextData['connectors']
): ContextData {
  const now = new Date()
  return {
    config,
    connectors: connectorData,
    currentDate: now.toISOString().split('T')[0],
    currentDateTime: now.toISOString(),
  }
}
```

---

## 8.3 Create Gemini Client

**File: `src/lib/runtime/gemini.ts`**

```typescript
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai'

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required')
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

export interface GeminiRequest {
  model: string
  prompt: string
  outputSchema?: object
  config?: {
    temperature?: number
    maxOutputTokens?: number
    topP?: number
    topK?: number
  }
}

export interface GeminiResponse {
  text: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Convert JSON Schema to Gemini Schema format
 * Gemini uses a slightly different schema format
 */
function convertToGeminiSchema(jsonSchema: object): object {
  const convert = (schema: any): any => {
    if (!schema || typeof schema !== 'object') {
      return schema
    }

    const result: any = {}

    // Map type
    if (schema.type) {
      const typeMap: Record<string, SchemaType> = {
        string: SchemaType.STRING,
        number: SchemaType.NUMBER,
        integer: SchemaType.INTEGER,
        boolean: SchemaType.BOOLEAN,
        array: SchemaType.ARRAY,
        object: SchemaType.OBJECT,
      }
      result.type = typeMap[schema.type] || SchemaType.STRING
    }

    // Copy description
    if (schema.description) {
      result.description = schema.description
    }

    // Copy enum
    if (schema.enum) {
      result.enum = schema.enum
    }

    // Convert properties
    if (schema.properties) {
      result.properties = {}
      for (const [key, value] of Object.entries(schema.properties)) {
        result.properties[key] = convert(value)
      }
    }

    // Copy required
    if (schema.required) {
      result.required = schema.required
    }

    // Convert items for arrays
    if (schema.items) {
      result.items = convert(schema.items)
    }

    // Handle nullable
    if (schema.nullable) {
      result.nullable = true
    }

    return result
  }

  return convert(jsonSchema)
}

export async function callGemini(request: GeminiRequest): Promise<GeminiResponse> {
  const modelConfig: any = {
    model: request.model,
    generationConfig: {
      temperature: request.config?.temperature ?? 0.3,
      maxOutputTokens: request.config?.maxOutputTokens ?? 8192,
      topP: request.config?.topP ?? 0.95,
      topK: request.config?.topK ?? 40,
    },
  }

  // If output schema provided, use JSON mode
  if (request.outputSchema) {
    modelConfig.generationConfig.responseMimeType = 'application/json'
    modelConfig.generationConfig.responseSchema = convertToGeminiSchema(request.outputSchema)
  }

  const model = genAI.getGenerativeModel(modelConfig)

  const result = await model.generateContent(request.prompt)
  const response = result.response

  const text = response.text()
  const usage = response.usageMetadata

  return {
    text,
    usage: {
      promptTokens: usage?.promptTokenCount ?? 0,
      completionTokens: usage?.candidatesTokenCount ?? 0,
      totalTokens: usage?.totalTokenCount ?? 0,
    },
  }
}

/**
 * Available models with their capabilities
 */
export const GEMINI_MODELS = {
  'gemini-2.5-flash': {
    name: 'Gemini 2.5 Flash',
    description: 'Fast, efficient for most tasks',
    maxTokens: 8192,
  },
  'gemini-2.5-pro': {
    name: 'Gemini 2.5 Pro',
    description: 'Advanced reasoning, Deep Think mode',
    maxTokens: 8192,
  },
  'gemini-3-pro': {
    name: 'Gemini 3 Pro',
    description: 'Latest flagship model',
    maxTokens: 65536,
  },
  'gemini-3-pro-preview': {
    name: 'Gemini 3 Pro Preview',
    description: 'Experimental features',
    maxTokens: 65536,
  },
} as const

export type GeminiModelId = keyof typeof GEMINI_MODELS
```

---

## 8.4 Create Main Execution Engine

**File: `src/lib/runtime/engine.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { decryptTokens } from '@/lib/encryption'
import { buildPrompt, createContextData, type ContextData } from './context'
import { callGemini, type GeminiModelId } from './gemini'
import { validateOutput, safeJsonParse } from './validation'
import { fetchDriveFiles } from '@/lib/connectors/google-drive'
import { fetchGmailMessages } from '@/lib/connectors/gmail'
import type { Database } from '@/types/database'

type ConnectorType = Database['public']['Enums']['connector_type']
type RunStatus = Database['public']['Enums']['run_status']

export interface RunContext {
  installedAppId: string
  userId: string
  inputOverrides?: Record<string, unknown>
}

export interface RunResult {
  status: 'completed' | 'failed' | 'error'
  output?: unknown
  error?: string
  metadata: {
    model: string
    tokensInput: number
    tokensOutput: number
    durationMs: number
  }
}

export type StatusCallback = (status: RunStatus, message?: string) => void

/**
 * Main execution engine for running apps
 */
export async function executeRun(
  context: RunContext,
  onStatus?: StatusCallback
): Promise<RunResult> {
  const startTime = Date.now()
  const supabase = await createClient()

  const updateStatus = (status: RunStatus, message?: string) => {
    onStatus?.(status, message)
  }

  try {
    // 1. Load installed app with all relations
    updateStatus('pending', 'Loading app configuration...')

    const { data: installedApp, error: loadError } = await supabase
      .from('installed_apps')
      .select(
        `
        *,
        app:apps!inner(*),
        version:app_versions!inner(*),
        grants:installed_app_grants(*)
      `
      )
      .eq('id', context.installedAppId)
      .eq('user_id', context.userId)
      .single()

    if (loadError || !installedApp) {
      throw new Error('App not found or access denied')
    }

    if (!installedApp.is_enabled) {
      throw new Error('App is disabled')
    }

    const manifest = installedApp.version.manifest_json as any
    const configSchema = installedApp.version.config_schema_json as object
    const runTemplate = installedApp.version.run_template
    const outputSchema = installedApp.version.output_schema_json as object

    // Merge stored config with any overrides
    const config = {
      ...(installedApp.config_json as Record<string, unknown>),
      ...context.inputOverrides,
    }

    // 2. Verify required grants are allowed
    const requiredConnectors = manifest.connectors?.required || []
    for (const req of requiredConnectors) {
      const grant = installedApp.grants.find((g: any) => g.connector_type === req.type)
      if (!grant || grant.status !== 'allowed') {
        throw new Error(`Required connector '${req.type}' is not authorized`)
      }
    }

    // 3. Fetch connector data
    updateStatus('fetching', 'Fetching data from connected services...')

    const connectorData = await fetchConnectorData(
      context.userId,
      installedApp.grants,
      supabase
    )

    // 4. Build prompt from template
    updateStatus('processing', 'Processing with AI...')

    const contextData = createContextData(config, connectorData)
    const prompt = buildPrompt(runTemplate, contextData)

    // 5. Call Gemini
    const modelId = (manifest.execution?.model || 'gemini-2.5-flash') as GeminiModelId
    const modelConfig = manifest.execution?.modelConfig || {}

    const geminiResponse = await callGemini({
      model: modelId,
      prompt,
      outputSchema,
      config: {
        temperature: modelConfig.temperature,
        maxOutputTokens: modelConfig.maxOutputTokens,
      },
    })

    // 6. Parse and validate output
    updateStatus('validating', 'Validating output...')

    const parseResult = safeJsonParse(geminiResponse.text)
    if (!parseResult.success) {
      throw new Error(`Failed to parse AI response: ${parseResult.error}`)
    }

    const validationResult = validateOutput(parseResult.data, outputSchema)

    if (!validationResult.valid) {
      // Retry logic could go here
      const retryConfig = manifest.execution?.retryConfig
      if (retryConfig?.retryOnValidationFailure && retryConfig?.maxRetries > 0) {
        // For now, just fail - retry logic can be added later
        console.warn('Validation failed, retry not implemented:', validationResult.errors)
      }
      throw new Error(`Output validation failed: ${validationResult.errors?.join(', ')}`)
    }

    const durationMs = Date.now() - startTime

    return {
      status: 'completed',
      output: validationResult.data,
      metadata: {
        model: modelId,
        tokensInput: geminiResponse.usage.promptTokens,
        tokensOutput: geminiResponse.usage.completionTokens,
        durationMs,
      },
    }
  } catch (error) {
    const durationMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

    updateStatus('error', errorMessage)

    return {
      status: 'error',
      error: errorMessage,
      metadata: {
        model: 'unknown',
        tokensInput: 0,
        tokensOutput: 0,
        durationMs,
      },
    }
  }
}

/**
 * Fetch data from all allowed connectors
 */
async function fetchConnectorData(
  userId: string,
  grants: any[],
  supabase: any
): Promise<ContextData['connectors']> {
  const data: ContextData['connectors'] = {}

  for (const grant of grants) {
    if (grant.status !== 'allowed') continue

    try {
      // Get connector account
      const { data: connector, error } = await supabase
        .from('connector_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('connector_type', grant.connector_type)
        .single()

      if (error || !connector) {
        console.warn(`Connector ${grant.connector_type} not found for user`)
        continue
      }

      // Check if connector is still valid
      if (connector.status !== 'connected') {
        console.warn(`Connector ${grant.connector_type} status is ${connector.status}`)
        continue
      }

      // Decrypt tokens
      const tokens = await decryptTokens({
        encryptedAccess: connector.access_token_encrypted,
        encryptedRefresh: connector.refresh_token_encrypted,
        iv: connector.token_iv,
      })

      // Fetch data based on connector type
      const grantConfig = grant.grant_json || {}

      switch (grant.connector_type as ConnectorType) {
        case 'google_drive':
          const files = await fetchDriveFiles(tokens.accessToken, grantConfig)
          data.google_drive = { files }
          break

        case 'gmail':
          const messages = await fetchGmailMessages(tokens.accessToken, grantConfig)
          data.gmail = { messages }
          break

        // Add other connector types as needed
        default:
          console.warn(`Unknown connector type: ${grant.connector_type}`)
      }
    } catch (error) {
      console.error(`Failed to fetch data from ${grant.connector_type}:`, error)
      // Continue with other connectors
    }
  }

  return data
}

/**
 * Create a run record in the database
 */
export async function createRunRecord(
  installedAppId: string,
  userId: string,
  versionId: string
): Promise<string> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('runs')
    .insert({
      installed_app_id: installedAppId,
      user_id: userId,
      version_id: versionId,
      status: 'pending',
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error) {
    throw new Error(`Failed to create run record: ${error.message}`)
  }

  return data.id
}

/**
 * Update run status in the database
 */
export async function updateRunStatus(
  runId: string,
  status: RunStatus,
  additionalData?: {
    error_message?: string
    error_code?: string
    completed_at?: string
    duration_ms?: number
  }
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('runs')
    .update({
      status,
      ...additionalData,
    })
    .eq('id', runId)

  if (error) {
    console.error(`Failed to update run status: ${error.message}`)
  }
}

/**
 * Save run artifacts (output, logs, metadata)
 */
export async function saveRunArtifacts(
  runId: string,
  artifacts: {
    inputsSummary?: object
    output?: unknown
    rawResponse?: string
    logs?: object
    modelUsed?: string
    tokensInput?: number
    tokensOutput?: number
  }
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase.from('run_artifacts').insert({
    run_id: runId,
    inputs_summary_json: artifacts.inputsSummary,
    output_json: artifacts.output,
    raw_response: artifacts.rawResponse,
    logs: artifacts.logs,
    model_used: artifacts.modelUsed,
    tokens_input: artifacts.tokensInput,
    tokens_output: artifacts.tokensOutput,
  })

  if (error) {
    console.error(`Failed to save run artifacts: ${error.message}`)
  }
}
```

---

## 8.5 Update Connector Wrappers (If Needed)

Ensure these files have the correct export signatures:

**File: `src/lib/connectors/google-drive.ts`** (verify/update)

```typescript
import { google } from 'googleapis'

export interface DriveFile {
  id: string
  name: string
  mimeType: string
  createdTime?: string
  modifiedTime?: string
  size?: string
  webViewLink?: string
}

export async function fetchDriveFiles(
  accessToken: string,
  options?: {
    folderId?: string
    query?: string
    maxResults?: number
  }
): Promise<DriveFile[]> {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })

  const drive = google.drive({ version: 'v3', auth })

  let query = "trashed = false"
  if (options?.folderId) {
    query += ` and '${options.folderId}' in parents`
  }
  if (options?.query) {
    query += ` and ${options.query}`
  }

  const response = await drive.files.list({
    q: query,
    pageSize: options?.maxResults || 100,
    fields: 'files(id, name, mimeType, createdTime, modifiedTime, size, webViewLink)',
  })

  return (response.data.files || []) as DriveFile[]
}

export async function getDriveFileContent(
  accessToken: string,
  fileId: string
): Promise<string> {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })

  const drive = google.drive({ version: 'v3', auth })

  const response = await drive.files.get({
    fileId,
    alt: 'media',
  }, {
    responseType: 'text',
  })

  return response.data as string
}
```

**File: `src/lib/connectors/gmail.ts`** (verify/update)

```typescript
import { google } from 'googleapis'

export interface GmailMessage {
  id: string
  threadId: string
  snippet: string
  subject?: string
  from?: string
  to?: string
  date?: string
  body?: string
}

export async function fetchGmailMessages(
  accessToken: string,
  options?: {
    labelIds?: string[]
    query?: string
    maxResults?: number
  }
): Promise<GmailMessage[]> {
  const auth = new google.auth.OAuth2()
  auth.setCredentials({ access_token: accessToken })

  const gmail = google.gmail({ version: 'v1', auth })

  const listParams: any = {
    userId: 'me',
    maxResults: options?.maxResults || 50,
  }

  if (options?.labelIds?.length) {
    listParams.labelIds = options.labelIds
  }
  if (options?.query) {
    listParams.q = options.query
  }

  const listResponse = await gmail.users.messages.list(listParams)
  const messages = listResponse.data.messages || []

  // Fetch full message details
  const fullMessages: GmailMessage[] = []

  for (const msg of messages.slice(0, options?.maxResults || 50)) {
    try {
      const detail = await gmail.users.messages.get({
        userId: 'me',
        id: msg.id!,
        format: 'full',
      })

      const headers = detail.data.payload?.headers || []
      const getHeader = (name: string) =>
        headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value

      fullMessages.push({
        id: msg.id!,
        threadId: msg.threadId!,
        snippet: detail.data.snippet || '',
        subject: getHeader('subject'),
        from: getHeader('from'),
        to: getHeader('to'),
        date: getHeader('date'),
        body: extractBody(detail.data.payload),
      })
    } catch (error) {
      console.error(`Failed to fetch message ${msg.id}:`, error)
    }
  }

  return fullMessages
}

function extractBody(payload: any): string {
  if (!payload) return ''

  // Check for plain text body
  if (payload.mimeType === 'text/plain' && payload.body?.data) {
    return Buffer.from(payload.body.data, 'base64').toString('utf-8')
  }

  // Check parts for multipart messages
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8')
      }
    }
    // Fallback to HTML if no plain text
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8')
      }
    }
  }

  return ''
}
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 7: APP RUNNER & RUN HISTORY
# ═══════════════════════════════════════════════════════════════════════════════

## 7.1 Create Run Execution API Route (Streaming)

**File: `src/app/api/runs/[id]/execute/route.ts`**

```typescript
import { createClient } from '@/lib/supabase/server'
import {
  executeRun,
  updateRunStatus,
  saveRunArtifacts,
} from '@/lib/runtime/engine'
import type { Database } from '@/types/database'

type RunStatus = Database['public']['Enums']['run_status']

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: runId } = await params
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (status: RunStatus, data?: Record<string, unknown>) => {
        const event = JSON.stringify({ status, ...data })
        controller.enqueue(encoder.encode(`data: ${event}\n\n`))
      }

      try {
        const supabase = await createClient()

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          sendEvent('error', { message: 'Unauthorized' })
          controller.close()
          return
        }

        // Get run record with installed app details
        const { data: run, error: runError } = await supabase
          .from('runs')
          .select(
            `
            *,
            installed_app:installed_apps!inner(
              *,
              version:app_versions!inner(*)
            )
          `
          )
          .eq('id', runId)
          .eq('user_id', user.id)
          .single()

        if (runError || !run) {
          sendEvent('error', { message: 'Run not found' })
          controller.close()
          return
        }

        // Execute the run with status callbacks
        const result = await executeRun(
          {
            installedAppId: run.installed_app_id,
            userId: user.id,
          },
          (status, message) => {
            sendEvent(status, message ? { message } : undefined)
            // Update database status
            updateRunStatus(runId, status)
          }
        )

        // Save final status and artifacts
        if (result.status === 'completed') {
          await updateRunStatus(runId, 'completed', {
            completed_at: new Date().toISOString(),
            duration_ms: result.metadata.durationMs,
          })

          await saveRunArtifacts(runId, {
            output: result.output,
            modelUsed: result.metadata.model,
            tokensInput: result.metadata.tokensInput,
            tokensOutput: result.metadata.tokensOutput,
          })

          sendEvent('completed', { output: result.output, metadata: result.metadata })
        } else {
          await updateRunStatus(runId, 'error', {
            completed_at: new Date().toISOString(),
            duration_ms: result.metadata.durationMs,
            error_message: result.error,
          })

          sendEvent('error', { message: result.error })
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Execution failed'
        sendEvent('error', { message })
        await updateRunStatus(runId, 'error', { error_message: message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
```

---

## 7.2 Create Server Action for Runs

**File: `src/app/actions/runs.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createRunRecord } from '@/lib/runtime/engine'

export async function createRun(installedAppId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Verify user owns this installed app and get version
  const { data: installedApp, error: appError } = await supabase
    .from('installed_apps')
    .select('*, version:app_versions!inner(*)')
    .eq('id', installedAppId)
    .eq('user_id', user.id)
    .single()

  if (appError || !installedApp) {
    return { success: false, error: 'App not found' }
  }

  if (!installedApp.is_enabled) {
    return { success: false, error: 'App is disabled' }
  }

  try {
    const runId = await createRunRecord(
      installedAppId,
      user.id,
      installedApp.version_id
    )

    revalidatePath(`/apps/${installedAppId}`)
    revalidatePath('/runs')

    return { success: true, runId }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create run',
    }
  }
}

export async function getRun(runId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  const { data: run } = await supabase
    .from('runs')
    .select(
      `
      *,
      artifacts:run_artifacts(*),
      installed_app:installed_apps!inner(
        *,
        app:apps!inner(*),
        version:app_versions!inner(*)
      )
    `
    )
    .eq('id', runId)
    .eq('user_id', user.id)
    .single()

  return run
}

export async function getUserRuns(limit = 50) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  const { data: runs } = await supabase
    .from('runs')
    .select(
      `
      *,
      installed_app:installed_apps!inner(
        app:apps!inner(name, icon, slug)
      )
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return runs || []
}
```

---

## 7.3 Create Run Status Component

**File: `src/components/runs/run-status.tsx`**

```typescript
import { cn } from '@/lib/utils'
import { Loader2, CheckCircle, XCircle, Clock, Download, Cpu, CheckCheck } from 'lucide-react'
import type { Database } from '@/types/database'

type RunStatus = Database['public']['Enums']['run_status']

interface RunStatusProps {
  status: RunStatus
  className?: string
  showLabel?: boolean
}

const statusConfig: Record<
  RunStatus,
  { label: string; icon: typeof Loader2; color: string; bgColor: string }
> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
  },
  fetching: {
    label: 'Fetching Data',
    icon: Download,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
  },
  processing: {
    label: 'Processing',
    icon: Cpu,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
  },
  validating: {
    label: 'Validating',
    icon: CheckCheck,
    color: 'text-amber-500',
    bgColor: 'bg-amber-100',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
  },
  error: {
    label: 'Error',
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
  },
}

export function RunStatus({ status, className, showLabel = true }: RunStatusProps) {
  const config = statusConfig[status]
  const Icon = config.icon
  const isAnimated = ['pending', 'fetching', 'processing', 'validating'].includes(status)

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      <Icon className={cn('h-4 w-4', isAnimated && 'animate-spin')} />
      {showLabel && <span>{config.label}</span>}
    </div>
  )
}

export function RunStatusSteps({ currentStatus }: { currentStatus: RunStatus }) {
  const steps: RunStatus[] = ['fetching', 'processing', 'validating', 'completed']
  const currentIndex = steps.indexOf(currentStatus)
  const isError = currentStatus === 'error' || currentStatus === 'failed'

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const config = statusConfig[step]
        const Icon = config.icon
        const isActive = step === currentStatus
        const isComplete = currentIndex > index
        const isPending = currentIndex < index

        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all',
                isActive && !isError && `${config.bgColor} ${config.color}`,
                isComplete && 'bg-green-100 text-green-600',
                isPending && 'bg-gray-100 text-gray-400',
                isError && isActive && 'bg-red-100 text-red-500'
              )}
            >
              {isActive && !isError ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isComplete ? (
                <CheckCircle className="h-4 w-4" />
              ) : isError && isActive ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{config.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-4 transition-colors',
                  isComplete ? 'bg-green-300' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
```

---

## 7.4 Create Run Output Component

**File: `src/components/runs/run-output.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react'

interface RunOutputProps {
  output: unknown
  renderer?: 'json' | 'table' | 'cards'
  className?: string
}

export function RunOutput({ output, renderer = 'json', className }: RunOutputProps) {
  switch (renderer) {
    case 'table':
      return <TableOutput data={output} className={className} />
    case 'cards':
      return <CardsOutput data={output} className={className} />
    default:
      return <JsonOutput data={output} className={className} />
  }
}

function JsonOutput({ data, className }: { data: unknown; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        size="sm"
        className="absolute right-2 top-2 z-10"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
      <pre className="overflow-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
    </div>
  )
}

function TableOutput({ data, className }: { data: unknown; className?: string }) {
  if (!Array.isArray(data)) {
    return <JsonOutput data={data} className={className} />
  }

  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">No data</p>
  }

  const columns = Object.keys(data[0] || {})

  return (
    <div className={cn('overflow-auto', className)}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((row, i) => (
            <tr key={i}>
              {columns.map((col) => (
                <td key={col} className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                  {formatCellValue((row as Record<string, unknown>)[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CardsOutput({ data, className }: { data: unknown; className?: string }) {
  if (!Array.isArray(data)) {
    if (typeof data === 'object' && data !== null) {
      return <ObjectCard data={data as Record<string, unknown>} className={className} />
    }
    return <JsonOutput data={data} className={className} />
  }

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {data.map((item, i) => (
        <ObjectCard key={i} data={item as Record<string, unknown>} />
      ))}
    </div>
  )
}

function ObjectCard({
  data,
  className,
}: {
  data: Record<string, unknown>
  className?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const entries = Object.entries(data)
  const preview = entries.slice(0, 3)
  const hasMore = entries.length > 3

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <dl className="space-y-2">
          {(expanded ? entries : preview).map(([key, value]) => (
            <div key={key}>
              <dt className="text-xs font-medium text-gray-500">{key}</dt>
              <dd className="text-sm text-gray-900">{formatCellValue(value)}</dd>
            </div>
          ))}
        </dl>
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronDown className="mr-1 h-4 w-4" /> Show less
              </>
            ) : (
              <>
                <ChevronRight className="mr-1 h-4 w-4" /> Show {entries.length - 3} more
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
```

---

## 7.5 Create Run List Component

**File: `src/components/runs/run-list.tsx`**

```typescript
import Link from 'next/link'
import { formatDistanceToNow } from '@/lib/utils'
import { RunStatus } from './run-status'
import { Card, CardContent } from '@/components/ui/card'
import { Clock } from 'lucide-react'

interface Run {
  id: string
  status: string
  created_at: string
  duration_ms: number | null
  installed_app: {
    app: {
      name: string
      icon: string | null
      slug: string
    }
  }
}

interface RunListProps {
  runs: Run[]
}

export function RunList({ runs }: RunListProps) {
  if (runs.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No runs yet. Execute an app to see results here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {runs.map((run) => (
        <Link key={run.id} href={`/runs/${run.id}`}>
          <Card className="transition-colors hover:bg-gray-50">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{run.installed_app.app.icon || '📱'}</span>
                <div>
                  <p className="font-medium">{run.installed_app.app.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(run.created_at))} ago
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {run.duration_ms && (
                  <div className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4" />
                    {(run.duration_ms / 1000).toFixed(1)}s
                  </div>
                )}
                <RunStatus status={run.status as any} />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
```

---

## 7.6 Create App Runner Component

**File: `src/components/apps/app-runner.tsx`**

```typescript
'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RunStatus, RunStatusSteps } from '@/components/runs/run-status'
import { RunOutput } from '@/components/runs/run-output'
import { createRun } from '@/app/actions/runs'
import { Play, Loader2 } from 'lucide-react'
import type { Database } from '@/types/database'

type RunStatusType = Database['public']['Enums']['run_status']

interface AppRunnerProps {
  installedAppId: string
  appName: string
  outputRenderer?: 'json' | 'table' | 'cards'
  disabled?: boolean
  disabledReason?: string
}

export function AppRunner({
  installedAppId,
  appName,
  outputRenderer = 'json',
  disabled = false,
  disabledReason,
}: AppRunnerProps) {
  const [status, setStatus] = useState<RunStatusType | null>(null)
  const [output, setOutput] = useState<unknown>(null)
  const [error, setError] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)

  const handleRun = useCallback(async () => {
    setIsRunning(true)
    setStatus('pending')
    setOutput(null)
    setError(null)

    try {
      // Create run record
      const result = await createRun(installedAppId)

      if (!result.success || !result.runId) {
        throw new Error(result.error || 'Failed to create run')
      }

      // Execute via streaming API
      const response = await fetch(`/api/runs/${result.runId}/execute`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to start execution')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response stream')
      }

      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              setStatus(data.status)

              if (data.status === 'completed' && data.output) {
                setOutput(data.output)
              }

              if (data.status === 'error' && data.message) {
                setError(data.message)
              }
            } catch (e) {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsRunning(false)
    }
  }, [installedAppId])

  return (
    <div className="space-y-6">
      {/* Run Button */}
      <div className="flex items-center gap-4">
        <Button
          size="lg"
          onClick={handleRun}
          disabled={disabled || isRunning}
          className="min-w-32"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Play className="mr-2 h-4 w-4" />
              Run {appName}
            </>
          )}
        </Button>

        {disabled && disabledReason && (
          <p className="text-sm text-amber-600">{disabledReason}</p>
        )}
      </div>

      {/* Status Display */}
      {status && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Execution Status</CardTitle>
          </CardHeader>
          <CardContent>
            <RunStatusSteps currentStatus={status} />
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Output Display */}
      {output && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Output</CardTitle>
          </CardHeader>
          <CardContent>
            <RunOutput output={output} renderer={outputRenderer} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

---

## 7.7 Create Runs History Page

**File: `src/app/(platform)/runs/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RunList } from '@/components/runs/run-list'

export default async function RunsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: runs } = await supabase
    .from('runs')
    .select(
      `
      id,
      status,
      created_at,
      duration_ms,
      installed_app:installed_apps!inner(
        app:apps!inner(name, icon, slug)
      )
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Run History</h1>
        <p className="text-muted-foreground">View all your app executions</p>
      </div>

      <RunList runs={runs || []} />
    </div>
  )
}
```

---

## 7.8 Create Single Run Detail Page

**File: `src/app/(platform)/runs/[id]/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RunStatus } from '@/components/runs/run-status'
import { RunOutput } from '@/components/runs/run-output'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, Cpu, Hash } from 'lucide-react'
import Link from 'next/link'

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: run } = await supabase
    .from('runs')
    .select(
      `
      *,
      artifacts:run_artifacts(*),
      installed_app:installed_apps!inner(
        *,
        app:apps!inner(*),
        version:app_versions!inner(*)
      )
    `
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!run) notFound()

  const artifact = run.artifacts?.[0]
  const manifest = run.installed_app.version.manifest_json as any

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/runs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Runs
          </Button>
        </Link>
      </div>

      {/* App Info */}
      <div className="flex items-center gap-4">
        <span className="text-4xl">{run.installed_app.app.icon || '📱'}</span>
        <div>
          <h1 className="text-2xl font-bold">{run.installed_app.app.name}</h1>
          <p className="text-muted-foreground">
            Run executed {new Date(run.created_at).toLocaleString()}
          </p>
        </div>
        <div className="ml-auto">
          <RunStatus status={run.status} />
        </div>
      </div>

      {/* Metadata */}
      <div className="grid gap-4 sm:grid-cols-3">
        {run.duration_ms && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Clock className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Duration</p>
                <p className="font-medium">{(run.duration_ms / 1000).toFixed(2)}s</p>
              </div>
            </CardContent>
          </Card>
        )}

        {artifact?.model_used && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Cpu className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Model</p>
                <p className="font-medium">{artifact.model_used}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {artifact?.tokens_input && (
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <Hash className="text-muted-foreground h-5 w-5" />
              <div>
                <p className="text-muted-foreground text-sm">Tokens</p>
                <p className="font-medium">
                  {artifact.tokens_input} in / {artifact.tokens_output} out
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Error Message */}
      {run.error_message && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600">{run.error_message}</p>
          </CardContent>
        </Card>
      )}

      {/* Output */}
      {artifact?.output_json && (
        <Card>
          <CardHeader>
            <CardTitle>Output</CardTitle>
          </CardHeader>
          <CardContent>
            <RunOutput
              output={artifact.output_json}
              renderer={manifest?.ui?.outputRenderer || 'json'}
            />
          </CardContent>
        </Card>
      )}

      {/* Re-run Button */}
      <div className="flex justify-end">
        <Link href={`/apps/${run.installed_app_id}`}>
          <Button>Run Again</Button>
        </Link>
      </div>
    </div>
  )
}
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 6: MY APPS & GRANT MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

## 6.1 Create Grants Server Action

**File: `src/app/actions/grants.ts`**

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function updateGrant(
  grantId: string,
  status: 'allowed' | 'denied'
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Verify user owns this grant through installed_app
  const { data: grant } = await supabase
    .from('installed_app_grants')
    .select(
      `
      id,
      installed_app:installed_apps!inner(
        user_id,
        app_id
      )
    `
    )
    .eq('id', grantId)
    .single()

  if (!grant || grant.installed_app.user_id !== user.id) {
    return { success: false, error: 'Grant not found' }
  }

  const { error } = await supabase
    .from('installed_app_grants')
    .update({ status })
    .eq('id', grantId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/apps')
  return { success: true }
}

export async function createGrantsForApp(
  installedAppId: string,
  connectorRequirements: Array<{ type: string; required: boolean }>
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Verify ownership
  const { data: installedApp } = await supabase
    .from('installed_apps')
    .select('id')
    .eq('id', installedAppId)
    .eq('user_id', user.id)
    .single()

  if (!installedApp) {
    return { success: false, error: 'App not found' }
  }

  // Create grants for each connector requirement
  const grants = connectorRequirements.map((req) => ({
    installed_app_id: installedAppId,
    connector_type: req.type,
    status: 'pending' as const,
    grant_json: {},
  }))

  const { error } = await supabase.from('installed_app_grants').upsert(grants, {
    onConflict: 'installed_app_id,connector_type',
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/apps')
  return { success: true }
}
```

---

## 6.2 Create Grant Manager Component

**File: `src/components/apps/grant-manager.tsx`**

```typescript
'use client'

import { useState } from 'react'
import { updateGrant } from '@/app/actions/grants'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  HardDrive,
  Mail,
  MessageSquare,
  FileText,
  Check,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react'

interface Grant {
  id: string
  connector_type: string
  status: 'allowed' | 'denied' | 'pending'
  grant_json: Record<string, unknown>
}

interface ConnectorRequirement {
  type: string
  capabilities: string[]
  required: boolean
}

interface GrantManagerProps {
  grants: Grant[]
  requirements: ConnectorRequirement[]
  userConnections: string[] // connector types the user has connected
}

const connectorIcons: Record<string, typeof HardDrive> = {
  google_drive: HardDrive,
  gmail: Mail,
  slack: MessageSquare,
  notion: FileText,
}

const connectorNames: Record<string, string> = {
  google_drive: 'Google Drive',
  gmail: 'Gmail',
  slack: 'Slack',
  notion: 'Notion',
}

export function GrantManager({
  grants,
  requirements,
  userConnections,
}: GrantManagerProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleToggle = async (grantId: string, currentStatus: string) => {
    setLoading(grantId)
    const newStatus = currentStatus === 'allowed' ? 'denied' : 'allowed'
    await updateGrant(grantId, newStatus)
    setLoading(null)
  }

  if (requirements.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        This app doesn't require any connector permissions.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {requirements.map((req) => {
        const grant = grants.find((g) => g.connector_type === req.type)
        const isConnected = userConnections.includes(req.type)
        const Icon = connectorIcons[req.type] || FileText
        const name = connectorNames[req.type] || req.type

        return (
          <Card
            key={req.type}
            className={cn(
              'transition-colors',
              !isConnected && 'border-amber-200 bg-amber-50'
            )}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'rounded-lg p-2',
                    isConnected ? 'bg-gray-100' : 'bg-amber-100'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      isConnected ? 'text-gray-600' : 'text-amber-600'
                    )}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{name}</p>
                    {req.required && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {req.capabilities.join(', ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isConnected ? (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Not connected</span>
                  </div>
                ) : grant ? (
                  <Button
                    variant={grant.status === 'allowed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleToggle(grant.id, grant.status)}
                    disabled={loading === grant.id}
                    className={cn(
                      grant.status === 'allowed' &&
                        'bg-green-600 hover:bg-green-700'
                    )}
                  >
                    {loading === grant.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : grant.status === 'allowed' ? (
                      <>
                        <Check className="mr-1 h-4 w-4" /> Allowed
                      </>
                    ) : (
                      <>
                        <X className="mr-1 h-4 w-4" /> Denied
                      </>
                    )}
                  </Button>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    Pending setup
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
```

---

## 6.3 Create Config Form Component

**File: `src/components/apps/config-form.tsx`**

```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Loader2, Save } from 'lucide-react'
import { useState } from 'react'

interface ConfigFormProps {
  schema: {
    type: string
    properties?: Record<string, any>
    required?: string[]
  }
  currentConfig: Record<string, unknown>
  onSave: (config: Record<string, unknown>) => Promise<void>
}

export function ConfigForm({ schema, currentConfig, onSave }: ConfigFormProps) {
  const [saving, setSaving] = useState(false)

  // Build Zod schema from JSON Schema
  const zodSchema = buildZodSchema(schema)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues: currentConfig,
  })

  const onSubmit = async (data: Record<string, unknown>) => {
    setSaving(true)
    try {
      await onSave(data)
    } finally {
      setSaving(false)
    }
  }

  if (!schema.properties || Object.keys(schema.properties).length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        This app has no configurable settings.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {Object.entries(schema.properties).map(([key, prop]) => (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>
            {prop.title || key}
            {schema.required?.includes(key) && (
              <span className="ml-1 text-red-500">*</span>
            )}
          </Label>

          {renderField(key, prop, register, errors)}

          {prop.description && (
            <p className="text-muted-foreground text-sm">{prop.description}</p>
          )}

          {errors[key] && (
            <p className="text-sm text-red-500">
              {errors[key]?.message as string}
            </p>
          )}
        </div>
      ))}

      <Button type="submit" disabled={saving || !isDirty}>
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
          </>
        )}
      </Button>
    </form>
  )
}

function renderField(
  key: string,
  prop: any,
  register: any,
  errors: any
) {
  const commonProps = {
    id: key,
    ...register(key),
    className: errors[key] ? 'border-red-500' : '',
  }

  // Select (enum)
  if (prop.enum) {
    return (
      <select
        {...commonProps}
        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {prop.enum.map((opt: string) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    )
  }

  // Textarea (string with rows hint or long description)
  if (prop.type === 'string' && (prop.rows || prop.format === 'textarea')) {
    return (
      <textarea
        {...commonProps}
        rows={prop.rows || 4}
        placeholder={prop.placeholder}
        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    )
  }

  // Checkbox (boolean)
  if (prop.type === 'boolean') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...commonProps}
          className="h-4 w-4 rounded border-gray-300"
        />
        <span className="text-sm text-gray-600">{prop.description}</span>
      </div>
    )
  }

  // Number
  if (prop.type === 'number' || prop.type === 'integer') {
    return (
      <Input
        type="number"
        {...commonProps}
        placeholder={prop.placeholder}
        min={prop.minimum}
        max={prop.maximum}
        step={prop.type === 'integer' ? 1 : 'any'}
      />
    )
  }

  // Default: text input
  return (
    <Input
      type="text"
      {...commonProps}
      placeholder={prop.placeholder || prop.default}
    />
  )
}

function buildZodSchema(jsonSchema: any): z.ZodObject<any> {
  const shape: Record<string, z.ZodTypeAny> = {}

  if (!jsonSchema.properties) {
    return z.object({})
  }

  for (const [key, prop] of Object.entries(jsonSchema.properties) as [
    string,
    any,
  ][]) {
    let fieldSchema: z.ZodTypeAny

    switch (prop.type) {
      case 'number':
      case 'integer':
        fieldSchema = z.coerce.number()
        if (prop.minimum !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).min(prop.minimum)
        }
        if (prop.maximum !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).max(prop.maximum)
        }
        break

      case 'boolean':
        fieldSchema = z.boolean()
        break

      case 'string':
      default:
        fieldSchema = z.string()
        if (prop.enum) {
          fieldSchema = z.enum(prop.enum as [string, ...string[]])
        }
        if (prop.minLength) {
          fieldSchema = (fieldSchema as z.ZodString).min(prop.minLength)
        }
        if (prop.maxLength) {
          fieldSchema = (fieldSchema as z.ZodString).max(prop.maxLength)
        }
    }

    // Make optional if not required
    if (!jsonSchema.required?.includes(key)) {
      fieldSchema = fieldSchema.optional()
    }

    shape[key] = fieldSchema
  }

  return z.object(shape)
}
```

---

## 6.4 Create Installed App Card Component

**File: `src/components/apps/installed-app-card.tsx`**

```typescript
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Settings, Check, AlertCircle } from 'lucide-react'

interface InstalledAppCardProps {
  id: string
  app: {
    name: string
    description: string | null
    icon: string | null
    slug: string
  }
  grantsAllowed: number
  grantsRequired: number
  lastRunAt?: string | null
}

export function InstalledAppCard({
  id,
  app,
  grantsAllowed,
  grantsRequired,
  lastRunAt,
}: InstalledAppCardProps) {
  const allGrantsAllowed = grantsAllowed >= grantsRequired
  const canRun = grantsRequired === 0 || allGrantsAllowed

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{app.icon || '📱'}</span>
            <div>
              <h3 className="font-semibold">{app.name}</h3>
              <p className="text-muted-foreground line-clamp-2 text-sm">
                {app.description}
              </p>
            </div>
          </div>
        </div>

        {/* Grant Status */}
        {grantsRequired > 0 && (
          <div className="mt-3 flex items-center gap-2">
            {allGrantsAllowed ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">
                  All permissions granted
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-600">
                  {grantsAllowed}/{grantsRequired} permissions granted
                </span>
              </>
            )}
          </div>
        )}

        {/* Last Run */}
        {lastRunAt && (
          <p className="text-muted-foreground mt-2 text-xs">
            Last run: {new Date(lastRunAt).toLocaleDateString()}
          </p>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Link href={`/apps/${id}`} className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Configure
            </Button>
          </Link>
          <Link href={`/apps/${id}`} className="flex-1">
            <Button
              className="w-full"
              size="sm"
              disabled={!canRun}
            >
              <Play className="mr-2 h-4 w-4" />
              Run
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
```

---

## 6.5 Create My Apps Page

**File: `src/app/(platform)/apps/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { InstalledAppCard } from '@/components/apps/installed-app-card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus } from 'lucide-react'

export default async function MyAppsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get installed apps with grants and last run
  const { data: installedApps } = await supabase
    .from('installed_apps')
    .select(
      `
      id,
      is_enabled,
      app:apps!inner(
        id,
        name,
        description,
        icon,
        slug
      ),
      version:app_versions!inner(
        manifest_json
      ),
      grants:installed_app_grants(
        status,
        connector_type
      )
    `
    )
    .eq('user_id', user.id)
    .eq('is_enabled', true)
    .order('installed_at', { ascending: false })

  // Get last run for each app
  const appIds = installedApps?.map((a) => a.id) || []
  const { data: lastRuns } = await supabase
    .from('runs')
    .select('installed_app_id, created_at')
    .in('installed_app_id', appIds)
    .order('created_at', { ascending: false })

  const lastRunMap = new Map<string, string>()
  lastRuns?.forEach((run) => {
    if (!lastRunMap.has(run.installed_app_id)) {
      lastRunMap.set(run.installed_app_id, run.created_at)
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Apps</h1>
          <p className="text-muted-foreground">
            Manage and run your installed apps
          </p>
        </div>
        <Link href="/marketplace">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Browse Marketplace
          </Button>
        </Link>
      </div>

      {installedApps?.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-muted-foreground mb-4">
            You haven't installed any apps yet.
          </p>
          <Link href="/marketplace">
            <Button>Browse Marketplace</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {installedApps?.map((installed) => {
            const manifest = installed.version.manifest_json as any
            const requiredConnectors =
              manifest.connectors?.required?.length || 0
            const allowedGrants = installed.grants.filter(
              (g: any) => g.status === 'allowed'
            ).length

            return (
              <InstalledAppCard
                key={installed.id}
                id={installed.id}
                app={installed.app}
                grantsRequired={requiredConnectors}
                grantsAllowed={allowedGrants}
                lastRunAt={lastRunMap.get(installed.id)}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
```

---

## 6.6 Create App Detail/Runner Page

**File: `src/app/(platform)/apps/[id]/page.tsx`**

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GrantManager } from '@/components/apps/grant-manager'
import { ConfigForm } from '@/components/apps/config-form'
import { AppRunner } from '@/components/apps/app-runner'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { uninstallApp, updateAppConfig } from '@/app/actions/installs'

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Get installed app with all details
  const { data: installedApp } = await supabase
    .from('installed_apps')
    .select(
      `
      *,
      app:apps!inner(*),
      version:app_versions!inner(*),
      grants:installed_app_grants(*)
    `
    )
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!installedApp) notFound()

  // Get user's connector accounts
  const { data: connectors } = await supabase
    .from('connector_accounts')
    .select('connector_type, status')
    .eq('user_id', user.id)
    .eq('status', 'connected')

  const userConnections = connectors?.map((c) => c.connector_type) || []

  const manifest = installedApp.version.manifest_json as any
  const configSchema = installedApp.version.config_schema_json || { properties: {} }

  // Determine if app can run
  const requiredConnectors = manifest.connectors?.required || []
  const allRequiredGranted = requiredConnectors.every((req: any) => {
    const grant = installedApp.grants.find((g: any) => g.connector_type === req.type)
    return grant?.status === 'allowed'
  })

  const missingConnections = requiredConnectors.filter(
    (req: any) => !userConnections.includes(req.type)
  )

  let disabledReason: string | undefined
  if (missingConnections.length > 0) {
    disabledReason = `Connect ${missingConnections.map((r: any) => r.type).join(', ')} first`
  } else if (!allRequiredGranted) {
    disabledReason = 'Grant required permissions above'
  }

  // Build connector requirements with required flag
  const allRequirements = [
    ...(manifest.connectors?.required || []).map((r: any) => ({
      ...r,
      required: true,
    })),
    ...(manifest.connectors?.optional || []).map((r: any) => ({
      ...r,
      required: false,
    })),
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/apps">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Apps
          </Button>
        </Link>
      </div>

      {/* App Info */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <span className="text-5xl">{installedApp.app.icon || '📱'}</span>
          <div>
            <h1 className="text-2xl font-bold">{installedApp.app.name}</h1>
            <p className="text-muted-foreground">
              {installedApp.app.description}
            </p>
          </div>
        </div>

        <form action={uninstallApp.bind(null, id)}>
          <Button variant="outline" size="sm" className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Uninstall
          </Button>
        </form>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column: Permissions & Config */}
        <div className="space-y-6">
          {/* Permissions */}
          {allRequirements.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <GrantManager
                  grants={installedApp.grants}
                  requirements={allRequirements}
                  userConnections={userConnections}
                />
              </CardContent>
            </Card>
          )}

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <ConfigForm
                schema={configSchema}
                currentConfig={installedApp.config_json as Record<string, unknown>}
                onSave={async (config) => {
                  'use server'
                  await updateAppConfig(id, config)
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Runner */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Run App</CardTitle>
            </CardHeader>
            <CardContent>
              <AppRunner
                installedAppId={id}
                appName={installedApp.app.name}
                outputRenderer={manifest.ui?.outputRenderer || 'json'}
                disabled={!!disabledReason}
                disabledReason={disabledReason}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
```

---

## 6.7 Update Installs Action (Add Config Update)

**File: `src/app/actions/installs.ts`** (update existing file)

Add this function to the existing file:

```typescript
export async function updateAppConfig(
  installedAppId: string,
  config: Record<string, unknown>
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('installed_apps')
    .update({ config_json: config })
    .eq('id', installedAppId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/apps/${installedAppId}`)
  return { success: true }
}
```

---

## 6.8 Add Label Component (if missing)

**File: `src/components/ui/label.tsx`**

```typescript
import * as React from 'react'
import { cn } from '@/lib/utils'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
        className
      )}
      {...props}
    />
  )
)
Label.displayName = 'Label'

export { Label }
```

---

## 6.9 Add Utility Function (if missing)

**File: `src/lib/utils.ts`** (add if not present)

```typescript
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDistanceToNow(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m`
  if (diffHour < 24) return `${diffHour}h`
  if (diffDay < 30) return `${diffDay}d`
  return date.toLocaleDateString()
}
```

---

# ═══════════════════════════════════════════════════════════════════════════════
# POST-BUILD: UPDATE SSOT
# ═══════════════════════════════════════════════════════════════════════════════

After completing all phases, update `SSOT.md`:

```markdown
## 📊 BUILD PROGRESS

### Phase Status

| Phase | Description | Status | Notes |
|-------|-------------|--------|-------|
| **1** | Database Schema | ✅ Complete | Migration in `supabase/migrations/` |
| **2** | Auth Flow | ✅ Complete | Login, callback, middleware |
| **3** | Platform Shell | ✅ Complete | Layout, dashboard, UI components |
| **4** | Connections & OAuth | ✅ Complete | OAuth flows, encryption |
| **5** | Marketplace | ✅ Complete | Browse,