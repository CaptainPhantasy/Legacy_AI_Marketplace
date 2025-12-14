import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plug, Package, Play, Store } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Get connector count
  const { count: connectorCount } = await supabase
    .from('connector_accounts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'connected')

  // Get installed apps count
  const { count: installedAppsCount } = await supabase
    .from('installed_apps')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // Get recent runs (last 5)
  const { data: recentRuns } = await supabase
    .from('runs')
    .select('id, status, created_at, installed_app_id, installed_apps(app_id, apps(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}!
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your apps and connections.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Connected Services
            </CardTitle>
            <Plug className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectorCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Active connections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Installed Apps
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{installedAppsCount || 0}</div>
            <p className="text-xs text-muted-foreground">
              Apps ready to use
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Recent Runs
            </CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentRuns?.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last 5 executions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Get started with the platform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild className="w-full justify-start gap-2">
              <Link href="/connections">
                <Plug className="h-4 w-4" />
                Connect Services
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start gap-2">
              <Link href="/marketplace">
                <Store className="h-4 w-4" />
                Browse Marketplace
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Runs */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Runs</CardTitle>
            <CardDescription>
              Your latest app executions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {recentRuns && recentRuns.length > 0 ? (
              <div className="space-y-2">
                {recentRuns.map((run) => {
                  const appName = run.installed_apps && typeof run.installed_apps === 'object' && 'apps' in run.installed_apps
                    ? (run.installed_apps.apps as { name: string })?.name
                    : 'Unknown App'
                  
                  return (
                    <div
                      key={run.id}
                      className="flex items-center justify-between rounded-lg border border-border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{appName}</p>
                        <p className="text-xs text-muted-foreground">
                          {run.created_at
                            ? new Date(run.created_at).toLocaleDateString()
                            : 'Unknown date'}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          run.status === 'completed'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : run.status === 'failed' || run.status === 'error'
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {run.status}
                      </span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No runs yet. Install an app and run it to see results here.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
