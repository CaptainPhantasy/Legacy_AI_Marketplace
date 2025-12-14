import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

const ADMIN_EMAIL = 'douglastalley1977@gmail.com'

/**
 * Check if the current user is an admin
 * @returns true if user is admin, false otherwise
 */
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  return user?.email === ADMIN_EMAIL
}

/**
 * Require admin access - redirects to marketplace if not admin
 * @returns The authenticated admin user
 * @throws Redirects if not admin
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }
  
  if (user.email !== ADMIN_EMAIL) {
    redirect('/marketplace')
  }
  
  return user
}

/**
 * Get admin email constant
 * @returns The admin email address
 */
export function getAdminEmail(): string {
  return ADMIN_EMAIL
}
