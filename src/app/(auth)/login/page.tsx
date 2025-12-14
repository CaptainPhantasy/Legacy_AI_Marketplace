import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LoginButton } from '@/components/auth/login-button'

export default async function LoginPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // If already logged in, redirect to platform
  if (user) {
    redirect('/')
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-black">
      <main className="flex w-full max-w-md flex-col items-center gap-8 rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-black dark:text-zinc-50">
            Legacy AI Platform
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Sign in with your Google account to continue
          </p>
        </div>
        
        <LoginButton />
      </main>
    </div>
  )
}
