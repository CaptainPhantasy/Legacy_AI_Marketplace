import { uninstallApp, updateAppConfig } from '@/app/actions/installs'
import { AppRunner } from '@/components/apps/app-runner'
import { ConfigForm } from '@/components/apps/config-form'
import { GrantManager } from '@/components/apps/grant-manager'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/server'
import { ArrowLeft, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import type { Database } from '@/types/database'
import type { AppManifest, ConnectorRequirement, JsonSchema } from '@/types/manifest'

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

  const manifest = installedApp.version.manifest_json as unknown as AppManifest
  const rawConfigSchema = installedApp.version.config_schema_json as JsonSchema | null
  const configSchema: JsonSchema = rawConfigSchema && typeof rawConfigSchema === 'object' && 'type' in rawConfigSchema
    ? { type: rawConfigSchema.type || 'object', properties: rawConfigSchema.properties || {}, required: rawConfigSchema.required }
    : { type: 'object', properties: {} }

  // Determine if app can run
  const requiredConnectors = manifest.connectors?.filter((c: ConnectorRequirement) => c.required) || []
  const allRequiredGranted = requiredConnectors.every((req: ConnectorRequirement) => {
    const grant = installedApp.grants.find((g: Database['public']['Tables']['installed_app_grants']['Row']) => g.connector_type === req.type)
    return grant?.status === 'allowed'
  })

  const missingConnections = requiredConnectors.filter(
    (req: ConnectorRequirement) => !userConnections.includes(req.type)
  )

  let disabledReason: string | undefined
  if (missingConnections.length > 0) {
    disabledReason = `Connect ${missingConnections.map((r: ConnectorRequirement) => r.type).join(', ')} first`
  } else if (!allRequiredGranted) {
    disabledReason = 'Grant required permissions above'
  }

  // Build connector requirements with required flag
  const allRequirements: ConnectorRequirement[] = [
    ...(manifest.connectors?.filter((c: ConnectorRequirement) => c.required) || []).map((r: ConnectorRequirement) => ({
      ...r,
      required: true,
    })),
    ...(manifest.connectors?.filter((c: ConnectorRequirement) => !c.required) || []).map((r: ConnectorRequirement) => ({
      ...r,
      required: false,
    })),
  ]

  // Create a server action wrapper for config save
  async function handleConfigSave(config: Record<string, unknown>) {
    'use server'
    const result = await updateAppConfig(id, config)
    if (!result.success) {
      throw new Error(result.error || 'Failed to save configuration')
    }
  }

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
                  grants={installedApp.grants.filter((g) => g.status !== null).map((g) => ({
                    id: g.id,
                    connector_type: g.connector_type,
                    status: g.status as 'allowed' | 'denied' | 'pending',
                    grant_json: (typeof g.grant_json === 'object' && g.grant_json !== null ? g.grant_json : {}) as Record<string, unknown>,
                  }))}
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
                onSave={handleConfigSave}
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
