"use client"

import { Button } from '@/components/ui/button'
import { disconnectConnector } from '@/app/actions/connectors'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface ConnectButtonProps {
  connectorType: 'google_drive' | 'gmail'
  isConnected: boolean
}

export function ConnectButton({ connectorType, isConnected }: ConnectButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleConnect = () => {
    window.location.href = `/api/connectors/${connectorType}/connect`
  }

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect this service?')) {
      return
    }

    try {
      setLoading(true)
      await disconnectConnector(connectorType)
      window.location.reload()
    } catch (error) {
      console.error('Disconnect error:', error)
      alert('Failed to disconnect. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (isConnected) {
    return (
      <Button
        variant="destructive"
        onClick={handleDisconnect}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Disconnecting...
          </>
        ) : (
          'Disconnect'
        )}
      </Button>
    )
  }

  return (
    <Button onClick={handleConnect} className="w-full">
      Connect {connectorType === 'google_drive' ? 'Google Drive' : 'Gmail'}
    </Button>
  )
}
