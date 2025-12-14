'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createRunRecord } from '@/lib/runtime/engine'

export async function createRun(installedAppId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // Verify user owns this installed app and get version
  const { data: installedApp, error: appError } = await supabase
    .from('installed_apps')
    .select('*, version:app_versions!inner(*)')
    .eq('id', installedAppId)
    .eq('user_id', user.id)
    .single()

  if (appError || !installedApp) {
    return { success: false, error: 'App not found' }
  }

  if (!installedApp.is_enabled) {
    return { success: false, error: 'App is disabled' }
  }

  try {
    const runId = await createRunRecord(
      installedAppId,
      user.id,
      installedApp.version_id
    )

    revalidatePath(`/apps/${installedAppId}`)
    revalidatePath('/runs')

    return { success: true, runId }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create run',
    }
  }
}

export async function getRun(runId: string) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  const { data: run } = await supabase
    .from('runs')
    .select(
      `
      *,
      artifacts:run_artifacts(*),
      installed_app:installed_apps!inner(
        *,
        app:apps!inner(*),
        version:app_versions!inner(*)
      )
    `
    )
    .eq('id', runId)
    .eq('user_id', user.id)
    .single()

  return run
}

export async function getUserRuns(limit = 50) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return []
  }

  const { data: runs } = await supabase
    .from('runs')
    .select(
      `
      *,
      installed_app:installed_apps!inner(
        app:apps!inner(name, icon, slug)
      )
    `
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  return runs || []
}
