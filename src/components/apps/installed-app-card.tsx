import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Settings, Check, AlertCircle } from 'lucide-react'

interface InstalledAppCardProps {
  id: string
  app: {
    name: string
    description: string | null
    icon: string | null
    slug: string
  }
  grantsAllowed: number
  grantsRequired: number
  lastRunAt?: string | null
}

export function InstalledAppCard({
  id,
  app,
  grantsAllowed,
  grantsRequired,
  lastRunAt,
}: InstalledAppCardProps) {
  const allGrantsAllowed = grantsAllowed >= grantsRequired
  const canRun = grantsRequired === 0 || allGrantsAllowed

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <span className="text-3xl">{app.icon || '📱'}</span>
            <div>
              <h3 className="font-semibold">{app.name}</h3>
              <p className="text-muted-foreground line-clamp-2 text-sm">
                {app.description}
              </p>
            </div>
          </div>
        </div>

        {/* Grant Status */}
        {grantsRequired > 0 && (
          <div className="mt-3 flex items-center gap-2">
            {allGrantsAllowed ? (
              <>
                <Check className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600">
                  All permissions granted
                </span>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span className="text-sm text-amber-600">
                  {grantsAllowed}/{grantsRequired} permissions granted
                </span>
              </>
            )}
          </div>
        )}

        {/* Last Run */}
        {lastRunAt && (
          <p className="text-muted-foreground mt-2 text-xs">
            Last run: {new Date(lastRunAt).toLocaleDateString()}
          </p>
        )}

        {/* Actions */}
        <div className="mt-4 flex gap-2">
          <Link href={`/apps/${id}`} className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Configure
            </Button>
          </Link>
          <Link href={`/apps/${id}`} className="flex-1">
            <Button
              className="w-full"
              size="sm"
              disabled={!canRun}
            >
              <Play className="mr-2 h-4 w-4" />
              Run
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
