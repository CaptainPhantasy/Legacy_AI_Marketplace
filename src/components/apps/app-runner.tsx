'use client'

import { createRun } from '@/app/actions/runs'
import { RunOutput } from '@/components/runs/run-output'
import { RunStatusSteps } from '@/components/runs/run-status'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Database } from '@/types/database'
import { Loader2, Play } from 'lucide-react'
import { useCallback, useState } from 'react'

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
            } catch (parseError) {
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
