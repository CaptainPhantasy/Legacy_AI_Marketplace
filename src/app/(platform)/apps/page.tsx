import { InstalledAppCard } from '@/components/apps/installed-app-card'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/server'
import { Plus } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { AppManifest } from '@/types/manifest'

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
    if (!lastRunMap.has(run.installed_app_id) && run.created_at) {
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
            You haven&apos;t installed any apps yet.
          </p>
          <Link href="/marketplace">
            <Button>Browse Marketplace</Button>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {installedApps?.map((installed) => {
            const manifest = installed.version.manifest_json as unknown as AppManifest
            const requiredConnectors =
              manifest.connectors?.filter((c) => c.required).length || 0
            const allowedGrants = installed.grants.filter(
              (g) => g.status === 'allowed'
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
