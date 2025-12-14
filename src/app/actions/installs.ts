"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Database, Json } from '@/types/database'

type ConnectorType = Database['public']['Enums']['connector_type']
type GrantStatus = Database['public']['Enums']['grant_status']

interface InstallAppParams {
  appId: string
  versionId: string
  requiredConnectors: Array<{
    type: string
    scopes: string[]
    description: string
  }>
}

/**
 * Install an app for the current user
 */
export async function installApp(params: InstallAppParams) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Check if app is already installed
  const { data: existing } = await supabase
    .from('installed_apps')
    .select('id')
    .eq('user_id', user.id)
    .eq('app_id', params.appId)
    .single()

  if (existing) {
    throw new Error('App is already installed')
  }

  // Verify user has required connectors
  const { data: connectors } = await supabase
    .from('connector_accounts')
    .select('connector_type')
    .eq('user_id', user.id)
    .eq('status', 'connected')

  const connectedTypes = new Set(
    connectors?.map((c) => c.connector_type) || []
  )

  const missingConnectors = params.requiredConnectors.filter(
    (c) => !connectedTypes.has(c.type as ConnectorType)
  )

  if (missingConnectors.length > 0) {
    throw new Error(
      `Missing required connectors: ${missingConnectors.map((c) => c.type).join(', ')}`
    )
  }

  // Create installed app
  const { data: installedApp, error: installError } = await supabase
    .from('installed_apps')
    .insert({
      user_id: user.id,
      app_id: params.appId,
      version_id: params.versionId,
      is_enabled: true,
      config_json: null,
    })
    .select()
    .single()

  if (installError) {
    throw new Error(`Failed to install app: ${installError.message}`)
  }

  // Create grants for required connectors
  if (params.requiredConnectors.length > 0) {
    const grants = params.requiredConnectors.map((connector) => ({
      installed_app_id: installedApp.id,
      connector_type: connector.type as ConnectorType,
      status: 'allowed' as GrantStatus,
      grant_json: {
        scopes: connector.scopes,
        description: connector.description,
      },
    }))

    const { error: grantsError } = await supabase
      .from('installed_app_grants')
      .insert(grants)

    if (grantsError) {
      // Clean up installed app if grants fail
      await supabase
        .from('installed_apps')
        .delete()
        .eq('id', installedApp.id)

      throw new Error(`Failed to create grants: ${grantsError.message}`)
    }
  }

  revalidatePath('/apps')
  revalidatePath('/marketplace')
}

/**
 * Uninstall an app for the current user
 */
export async function uninstallApp(installedAppId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  // Verify ownership
  const { data: installedApp } = await supabase
    .from('installed_apps')
    .select('id')
    .eq('id', installedAppId)
    .eq('user_id', user.id)
    .single()

  if (!installedApp) {
    throw new Error('App not found or access denied')
  }

  // Delete grants first (foreign key constraint)
  const { error: grantsError } = await supabase
    .from('installed_app_grants')
    .delete()
    .eq('installed_app_id', installedAppId)

  if (grantsError) {
    throw new Error(`Failed to delete grants: ${grantsError.message}`)
  }

  // Delete installed app
  const { error: deleteError } = await supabase
    .from('installed_apps')
    .delete()
    .eq('id', installedAppId)

  if (deleteError) {
    throw new Error(`Failed to uninstall app: ${deleteError.message}`)
  }

  revalidatePath('/apps')
  revalidatePath('/marketplace')
}

/**
 * Update app configuration
 */
export async function updateAppConfig(
  installedAppId: string,
  config: Record<string, unknown>
) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('installed_apps')
    .update({ config_json: config as Json })
    .eq('id', installedAppId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(`/apps/${installedAppId}`)
  return { success: true }
}
