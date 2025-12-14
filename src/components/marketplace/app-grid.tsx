import { AppCard } from './app-card'
import { Database } from '@/types/database'

type App = Database['public']['Tables']['apps']['Row']

interface AppGridProps {
  apps: App[]
}

export function AppGrid({ apps }: AppGridProps) {
  if (apps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-lg font-medium text-muted-foreground">
          No apps found
        </p>
        <p className="text-sm text-muted-foreground">
          Try adjusting your filters or check back later.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {apps.map((app) => (
        <AppCard key={app.id} app={app} />
      ))}
    </div>
  )
}
