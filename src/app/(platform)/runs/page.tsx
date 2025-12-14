import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { RunList } from '@/components/runs/run-list'

export default async function RunsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: runs } = await supabase
    .from('runs')
    .select(
      `
      id,
      status,
      created_at,
      duration_ms,
      installed_app:installed_apps!inner(
        app:apps!inner(name, icon, slug)
      )
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Run History</h1>
        <p className="text-muted-foreground">View all your app executions</p>
      </div>

      <RunList runs={runs || []} />
    </div>
  )
}
