import { fetchGmailMessages } from '@/lib/connectors/gmail'
import { fetchDriveFiles } from '@/lib/connectors/google-drive'
import { decryptTokens } from '@/lib/encryption'
import { createClient } from '@/lib/supabase/server'
import type { Database, Json } from '@/types/database'
import type { AppManifest } from '@/types/manifest'
import { buildPrompt, createContextData, type ContextData } from './context'
import { callGemini, type GeminiModelId } from './gemini'
import { safeJsonParse, validateOutput } from './validation'

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

    const manifest = installedApp.version.manifest_json as unknown as AppManifest
    const runTemplate = installedApp.version.run_template
    const outputSchema = installedApp.version.output_schema_json as object

    // Merge stored config with any overrides
    const config = {
      ...(installedApp.config_json as Record<string, unknown>),
      ...context.inputOverrides,
    }

    // 2. Verify required grants are allowed
    const requiredConnectors = manifest.connectors?.filter((c) => c.required) || []
    for (const req of requiredConnectors) {
      const grant = installedApp.grants.find((g: Database['public']['Tables']['installed_app_grants']['Row']) => g.connector_type === req.type)
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
      if (retryConfig?.retryOnValidationFailure && (retryConfig?.maxRetries ?? 0) > 0) {
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
 * Adapts to existing connector function signatures: (accessToken, refreshToken, options)
 */
async function fetchConnectorData(
  userId: string,
  grants: Database['public']['Tables']['installed_app_grants']['Row'][],
  supabase: Awaited<ReturnType<typeof createClient>>
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

      // Map grantConfig (from grant_json) to connector options format
      const grantConfig = (grant.grant_json || {}) as Record<string, unknown>

      switch (grant.connector_type as ConnectorType) {
        case 'google_drive': {
          // Map grantConfig to Drive options: { pageSize?, pageToken?, q? }
          const options = {
            pageSize: (grantConfig.pageSize as number | undefined) || (grantConfig.maxResults as number | undefined) || 100,
            pageToken: grantConfig.pageToken as string | undefined,
            q: (grantConfig.query as string | undefined) || (grantConfig.q as string | undefined),
          }
          const result = await fetchDriveFiles(
            tokens.accessToken,
            tokens.refreshToken,
            options
          )
          data.google_drive = { files: result.files || [] }
          break
        }

        case 'gmail': {
          // Map grantConfig to Gmail options: { maxResults?, pageToken?, q? }
          const options = {
            maxResults: (grantConfig.maxResults as number | undefined) || (grantConfig.pageSize as number | undefined) || 50,
            pageToken: grantConfig.pageToken as string | undefined,
            q: (grantConfig.query as string | undefined) || (grantConfig.q as string | undefined),
            labelIds: grantConfig.labelIds as string[] | undefined,
          }
          const result = await fetchGmailMessages(
            tokens.accessToken,
            tokens.refreshToken,
            options
          )
          data.gmail = { messages: result.messages || [] }
          break
        }

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
    inputs_summary_json: artifacts.inputsSummary as Json | undefined,
    output_json: artifacts.output as Json | undefined,
    raw_response: artifacts.rawResponse,
    logs: artifacts.logs as Json | undefined,
    model_used: artifacts.modelUsed,
    tokens_input: artifacts.tokensInput,
    tokens_output: artifacts.tokensOutput,
  })

  if (error) {
    console.error(`Failed to save run artifacts: ${error.message}`)
  }
}
