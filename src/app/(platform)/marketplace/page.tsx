import { createClient } from '@/lib/supabase/server'
import { AppGrid } from '@/components/marketplace/app-grid'
import { MarketplaceFilters } from '@/components/marketplace/marketplace-filters'
import { Database } from '@/types/database'

type App = Database['public']['Tables']['apps']['Row']

export default async function MarketplacePage() {
  const supabase = await createClient()

  const { data: apps, error } = await supabase
    .from('apps')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching apps:', error)
  }

  const appList = apps || []

  // Extract unique categories
  const categories = Array.from(
    new Set(appList.map((app) => app.category).filter(Boolean))
  ) as string[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <p className="text-muted-foreground">
          Browse and install apps to automate your workflows
        </p>
      </div>

      <MarketplaceFilters categories={categories} apps={appList} />
    </div>
  )
}
