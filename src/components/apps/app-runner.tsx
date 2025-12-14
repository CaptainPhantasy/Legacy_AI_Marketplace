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
    //#region agent log
    fetch('http://127.0.0.1:7242/ingest/12c64e3b-347d-4b62-8e56-7e1c05930134',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-runner.tsx:34',message:'handleRun started',data:{installedAppId},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A,B,C'})}).catch(()=>{});
    //#endregion

    setIsRunning(true)
    setStatus('pending')
    setOutput(null)
    setError(null)

    try {
      //#region agent log
      fetch('http://127.0.0.1:7242/ingest/12c64e3b-347d-4b62-8e56-7e1c05930134',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-runner.tsx:41',message:'About to create run',data:{installedAppId},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
      //#endregion

      // Create run record
      const result = await createRun(installedAppId)

      //#region agent log
      fetch('http://127.0.0.1:7242/ingest/12c64e3b-347d-4b62-8e56-7e1c05930134',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-runner.tsx:42',message:'createRun result',data:{result: {success: result.success, runId: result.runId, error: result.error}},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
      //#endregion

      if (!result.success || !result.runId) {
        throw new Error(result.error || 'Failed to create run')
      }

      //#region agent log
      fetch('http://127.0.0.1:7242/ingest/12c64e3b-347d-4b62-8e56-7e1c05930134',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-runner.tsx:48',message:'About to fetch streaming API',data:{runId: result.runId, url: `/api/runs/${result.runId}/execute`},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
      //#endregion

      // Execute via streaming API
      const response = await fetch(`/api/runs/${result.runId}/execute`, {
        method: 'POST',
      })

      //#region agent log
      fetch('http://127.0.0.1:7242/ingest/12c64e3b-347d-4b62-8e56-7e1c05930134',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-runner.tsx:49',message:'Fetch response received',data:{ok: response.ok, status: response.status, statusText: response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'C'})}).catch(()=>{});
      //#endregion

      if (!response.ok) {
        throw new Error('Failed to start execution')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response stream')
      }

      const decoder = new TextDecoder()

      //#region agent log
      fetch('http://127.0.0.1:7242/ingest/12c64e3b-347d-4b62-8e56-7e1c05930134',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-runner.tsx:63',message:'Starting stream reading loop',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
      //#endregion

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value)
        const lines = text.split('\n')

        //#region agent log
        fetch('http://127.0.0.1:7242/ingest/12c64e3b-347d-4b62-8e56-7e1c05930134',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-runner.tsx:68',message:'Received stream chunk',data:{textLength: text.length, linesCount: lines.length},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
        //#endregion

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))

              //#region agent log
              fetch('http://127.0.0.1:7242/ingest/12c64e3b-347d-4b62-8e56-7e1c05930134',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-runner.tsx:74',message:'Parsed SSE data',data:{status: data.status, hasOutput: !!data.output, hasMessage: !!data.message},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A,B'})}).catch(()=>{});
              //#endregion

              setStatus(data.status)

              if (data.status === 'completed' && data.output) {
                setOutput(data.output)
              }

              if (data.status === 'error' && data.message) {
                setError(data.message)
              }
            } catch (parseError) {
              //#region agent log
              fetch('http://127.0.0.1:7242/ingest/12c64e3b-347d-4b62-8e56-7e1c05930134',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-runner.tsx:84',message:'JSON parse error in SSE',data:{line, error: parseError instanceof Error ? parseError.message : 'Unknown parse error'},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A'})}).catch(()=>{});
              //#endregion
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }
    } catch (err) {
      //#region agent log
      fetch('http://127.0.0.1:7242/ingest/12c64e3b-347d-4b62-8e56-7e1c05930134',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-runner.tsx:90',message:'Caught error in handleRun',data:{error: err instanceof Error ? err.message : 'Unknown error', errorType: err instanceof Error ? err.constructor.name : typeof err},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
      //#endregion

      setStatus('error')
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsRunning(false)

      //#region agent log
      fetch('http://127.0.0.1:7242/ingest/12c64e3b-347d-4b62-8e56-7e1c05930134',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app-runner.tsx:94',message:'handleRun finished',data:{isRunning: false},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'A,B,C,D'})}).catch(()=>{});
      //#endregion
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
      {!!status && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Execution Status</CardTitle>
          </CardHeader>
          <CardContent>
            <RunStatusSteps currentStatus={status as RunStatusType} />
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {typeof error === 'string' && !!error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="font-medium text-red-800">Error</p>
            <p className="text-sm text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Output Display */}
      {!!output && (
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
