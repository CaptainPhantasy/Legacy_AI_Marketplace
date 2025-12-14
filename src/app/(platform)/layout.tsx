import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { LayoutDashboard, Plug, Store, Package, Play, Settings, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isAdmin } from '@/lib/admin'

async function SignOutButton() {
  'use server'
  
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function PlatformLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url, is_admin')
    .eq('id', user.id)
    .single()

  const userIsAdmin = await isAdmin()

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/connections', icon: Plug, label: 'Connections' },
    { href: '/marketplace', icon: Store, label: 'Marketplace' },
    { href: '/apps', icon: Package, label: 'My Apps' },
    { href: '/runs', icon: Play, label: 'Runs' },
  ]

  if (userIsAdmin) {
    navItems.push({ href: '/admin/apps', icon: Settings, label: 'Admin' })
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card">
        <div className="flex h-full flex-col">
          <div className="border-b border-border p-6">
            <h1 className="text-xl font-bold">Legacy AI</h1>
            <p className="text-sm text-muted-foreground">Platform</p>
          </div>
          
          <nav className="flex-1 space-y-1 p-4">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          <div className="border-t border-border p-4">
            <form action={SignOutButton}>
              <Button
                type="submit"
                variant="ghost"
                className="w-full justify-start gap-3"
              >
                <LogOut className="h-5 w-5" />
                Sign Out
              </Button>
            </form>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card">
          <div className="flex h-16 items-center justify-between px-6">
            <div className="flex items-center gap-4">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name || user.email || ''}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
                  {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-medium">
                  {profile?.full_name || user.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-background p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
