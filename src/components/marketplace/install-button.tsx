"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { installApp } from '@/app/actions/installs'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface InstallButtonProps {
  appId: string
  versionId: string
  requiredConnectors: Array<{ type: string; scopes: string[]; description: string }>
}

export function InstallButton({
  appId,
  versionId,
  requiredConnectors,
}: InstallButtonProps) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleInstall = async () => {
    try {
      setLoading(true)
      await installApp({
        appId,
        versionId,
        requiredConnectors,
      })
      router.push('/apps')
      router.refresh()
    } catch (error) {
      console.error('Install error:', error)
      alert(error instanceof Error ? error.message : 'Failed to install app')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button onClick={handleInstall} disabled={loading} className="w-full">
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Installing...
        </>
      ) : (
        'Install App'
      )}
    </Button>
  )
}
