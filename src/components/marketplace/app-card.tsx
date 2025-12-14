import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Database } from '@/types/database'

type App = Database['public']['Tables']['apps']['Row']

interface AppCardProps {
  app: App
}

export function AppCard({ app }: AppCardProps) {
  return (
    <Link href={`/marketplace/${app.slug}`}>
      <Card className="transition-all hover:shadow-lg">
        <CardHeader>
          <div className="flex items-start gap-4">
            {app.icon && (
              <div className="text-4xl" role="img" aria-label={app.name}>
                {app.icon}
              </div>
            )}
            <div className="flex-1">
              <CardTitle>{app.name}</CardTitle>
              <CardDescription className="line-clamp-2">
                {app.description}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            {app.category && (
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium">
                {app.category}
              </span>
            )}
            {app.tags && app.tags.length > 0 && (
              <div className="flex gap-1">
                {app.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
