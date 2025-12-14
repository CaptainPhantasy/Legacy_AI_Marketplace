"use client"

import { useState, useMemo } from 'react'
import { AppGrid } from './app-grid'
import { AppFilters } from './app-filters'
import { Database } from '@/types/database'

type App = Database['public']['Tables']['apps']['Row']

interface MarketplaceFiltersProps {
  categories: string[]
  apps: App[]
}

export function MarketplaceFilters({ categories, apps }: MarketplaceFiltersProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredApps = useMemo(() => {
    let filtered = apps

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(
        (app) =>
          app.name.toLowerCase().includes(searchLower) ||
          app.description?.toLowerCase().includes(searchLower) ||
          app.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
      )
    }

    // Apply category filter
    if (selectedCategory) {
      filtered = filtered.filter((app) => app.category === selectedCategory)
    }

    return filtered
  }, [apps, search, selectedCategory])

  return (
    <>
      <AppFilters
        categories={categories}
        onSearchChange={setSearch}
        onCategoryChange={setSelectedCategory}
        searchValue={search}
        selectedCategory={selectedCategory}
      />

      <div className="text-sm text-muted-foreground">
        Showing {filteredApps.length} of {apps.length} apps
      </div>

      <AppGrid apps={filteredApps} />
    </>
  )
}
