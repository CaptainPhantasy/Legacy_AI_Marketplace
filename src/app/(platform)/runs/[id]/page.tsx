import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RunStatus } from '@/components/runs/run-status'
import { RunOutput } from '@/components/runs/run-output'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Clock, Cpu, Hash } from 'lucide-react'
import Link from 'next/link'
import type { AppManifest } from '@/types/manifest'

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
  const manifest = run.installed_app.version.manifest_json as unknown as AppManifest

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
            Run executed {run.created_at ? new Date(run.created_at).toLocaleString() : 'Unknown'}
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
