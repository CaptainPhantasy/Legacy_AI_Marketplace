import Link from 'next/link'
import { formatDistanceToNow } from '@/lib/utils'
import { RunStatus } from './run-status'
import { Card, CardContent } from '@/components/ui/card'
import { Clock } from 'lucide-react'
import type { Database } from '@/types/database'

interface Run {
  id: string
  status: Database['public']['Enums']['run_status'] | null
  created_at: string | null
  duration_ms: number | null
  installed_app: {
    app: {
      name: string
      icon: string | null
      slug: string
    }
  }
}

interface RunListProps {
  runs: Run[]
}

export function RunList({ runs }: RunListProps) {
  if (runs.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">No runs yet. Execute an app to see results here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {runs.map((run) => (
        <Link key={run.id} href={`/runs/${run.id}`}>
          <Card className="transition-colors hover:bg-gray-50">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{run.installed_app.app.icon || '📱'}</span>
                <div>
                  <p className="font-medium">{run.installed_app.app.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {run.created_at ? `${formatDistanceToNow(new Date(run.created_at))} ago` : 'Unknown'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {run.duration_ms && (
                  <div className="text-muted-foreground flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4" />
                    {(run.duration_ms / 1000).toFixed(1)}s
                  </div>
                )}
                <RunStatus status={run.status} />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
