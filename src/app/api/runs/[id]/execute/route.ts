import { createClient } from '@/lib/supabase/server'
import {
  executeRun,
  updateRunStatus,
  saveRunArtifacts,
} from '@/lib/runtime/engine'
import type { Database } from '@/types/database'

type RunStatus = Database['public']['Enums']['run_status']

export async function POST(
  _request: Request,
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
