"use server"

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Database } from '@/types/database'

type ConnectorType = Database['public']['Enums']['connector_type']

/**
 * Disconnect a connector account
 */
export async function disconnectConnector(connectorType: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const { error } = await supabase
    .from('connector_accounts')
    .delete()
    .eq('user_id', user.id)
    .eq('connector_type', connectorType as ConnectorType)

  if (error) {
    throw new Error(`Failed to disconnect: ${error.message}`)
  }

  revalidatePath('/connections')
}
