'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database } from '@/types/database'

type ConnectorType = Database['public']['Enums']['connector_type']

export async function updateGrant(
  grantId: string,
  status: 'allowed' | 'denied'
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Verify user owns this grant through installed_app
  const { data: grant } = await supabase
    .from('installed_app_grants')
    .select(
      `
      id,
      installed_app:installed_apps!inner(
        user_id,
        app_id
      )
    `
    )
    .eq('id', grantId)
    .single()

  if (!grant || grant.installed_app.user_id !== user.id) {
    return { success: false, error: 'Grant not found' }
  }

  const { error } = await supabase
    .from('installed_app_grants')
    .update({ status })
    .eq('id', grantId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/apps')
  return { success: true }
}

export async function createGrantsForApp(
  installedAppId: string,
  connectorRequirements: Array<{ type: string; required: boolean }>
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Verify ownership
  const { data: installedApp } = await supabase
    .from('installed_apps')
    .select('id')
    .eq('id', installedAppId)
    .eq('user_id', user.id)
    .single()

  if (!installedApp) {
    return { success: false, error: 'App not found' }
  }

  // Create grants for each connector requirement
  const grants = connectorRequirements.map((req) => ({
    installed_app_id: installedAppId,
    connector_type: req.type as ConnectorType,
    status: 'pending' as const,
    grant_json: {},
  }))

  const { error } = await supabase.from('installed_app_grants').upsert(grants, {
    onConflict: 'installed_app_id,connector_type',
  })

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/apps')
  return { success: true }
}
