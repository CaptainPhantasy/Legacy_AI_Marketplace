import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InstallButton } from '@/components/marketplace/install-button'
import type { Database } from '@/types/database'
import type { AppManifest } from '@/types/manifest'

type App = Database['public']['Tables']['apps']['Row']
type AppVersion = Database['public']['Tables']['app_versions']['Row']

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get app by slug
  const { data: app } = await supabase
    .from('apps')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (!app) {
    notFound()
  }

  // Get active version
  const { data: version } = await supabase
    .from('app_versions')
    .select('*')
    .eq('app_id', app.id)
    .eq('is_active', true)
    .single()

  if (!version) {
    notFound()
  }

  // Parse manifest
  const manifest = version.manifest_json as unknown as AppManifest

  // Check if app is already installed
  const { data: installedApp } = await supabase
    .from('installed_apps')
    .select('id')
    .eq('user_id', user.id)
    .eq('app_id', app.id)
    .single()

  // Get user's connected connectors
  const { data: connectors } = await supabase
    .from('connector_accounts')
    .select('connector_type')
    .eq('user_id', user.id)
    .eq('status', 'connected')

  const connectedTypes = new Set(
    connectors?.map((c) => c.connector_type) || []
  )

  // Check required connectors
  const requiredConnectors = manifest.connectors?.filter((c) => c.required) || []
  const missingConnectors = requiredConnectors.filter(
    (c) => !connectedTypes.has(c.type)
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-6">
        {app.icon && (
          <div className="text-6xl" role="img" aria-label={app.name}>
            {app.icon}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{app.name}</h1>
          {app.category && (
            <span className="mt-2 inline-block rounded-full bg-secondary px-3 py-1 text-sm font-medium">
              {app.category}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {app.description || manifest.description}
              </p>
            </CardContent>
          </Card>

          {manifest.connectors && manifest.connectors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Required Services</CardTitle>
                <CardDescription>
                  Connect these services to use this app
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {manifest.connectors.map((connector) => {
                    const isConnected = connectedTypes.has(connector.type)
                    return (
                      <div
                        key={connector.type}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div>
                          <p className="font-medium capitalize">
                            {connector.type.replace('_', ' ')}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {connector.description}
                          </p>
                        </div>
                        {connector.required ? (
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${
                              isConnected
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}
                          >
                            {isConnected ? 'Connected' : 'Required'}
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                            Optional
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {version.release_notes && (
            <Card>
              <CardHeader>
                <CardTitle>Release Notes</CardTitle>
                <CardDescription>Version {version.version}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {version.release_notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Install</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {installedApp ? (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    This app is already installed.
                  </p>
                  <Button asChild className="w-full">
                    <Link href="/apps">Go to My Apps</Link>
                  </Button>
                </div>
              ) : missingConnectors.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">
                    Missing required connections
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Connect {missingConnectors.map((c) => c.type.replace('_', ' ')).join(', ')} to install this app.
                  </p>
                  <Button asChild variant="outline" className="w-full">
                    <Link href="/connections">Go to Connections</Link>
                  </Button>
                </div>
              ) : (
                <InstallButton
                  appId={app.id}
                  versionId={version.id}
                  requiredConnectors={requiredConnectors}
                />
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Version Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Version:</span>
                  <span className="font-medium">{version.version}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Released:</span>
                  <span className="font-medium">
                    {version.created_at
                      ? new Date(version.created_at).toLocaleDateString()
                      : 'Unknown'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
