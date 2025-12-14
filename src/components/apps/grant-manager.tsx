'use client'

import { useState } from 'react'
import { updateGrant } from '@/app/actions/grants'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  HardDrive,
  Mail,
  MessageSquare,
  FileText,
  Check,
  X,
  AlertCircle,
  Loader2,
} from 'lucide-react'

interface Grant {
  id: string
  connector_type: string
  status: 'allowed' | 'denied' | 'pending' | null
  grant_json: Record<string, unknown> | null
}

interface ConnectorRequirement {
  type: string
  capabilities?: string[]
  scopes?: string[]
  description?: string
  required: boolean
}

interface GrantManagerProps {
  grants: Grant[]
  requirements: ConnectorRequirement[]
  userConnections: string[] // connector types the user has connected
}

const connectorIcons: Record<string, typeof HardDrive> = {
  google_drive: HardDrive,
  gmail: Mail,
  slack: MessageSquare,
  notion: FileText,
}

const connectorNames: Record<string, string> = {
  google_drive: 'Google Drive',
  gmail: 'Gmail',
  slack: 'Slack',
  notion: 'Notion',
}

export function GrantManager({
  grants,
  requirements,
  userConnections,
}: GrantManagerProps) {
  const [loading, setLoading] = useState<string | null>(null)

  const handleToggle = async (
    grantId: string,
    currentStatus: Grant['status']
  ) => {
    setLoading(grantId)
    const newStatus = currentStatus === 'allowed' ? 'denied' : 'allowed'
    await updateGrant(grantId, newStatus)
    setLoading(null)
  }

  if (requirements.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        This app doesn&apos;t require any connector permissions.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {requirements.map((req) => {
        const grant = grants.find((g) => g.connector_type === req.type)
        const isConnected = userConnections.includes(req.type)
        const Icon = connectorIcons[req.type] || FileText
        const name = connectorNames[req.type] || req.type
        const capabilities = req.capabilities || req.scopes || [req.description || 'Access data']

        return (
          <Card
            key={req.type}
            className={cn(
              'transition-colors',
              !isConnected && 'border-amber-200 bg-amber-50'
            )}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'rounded-lg p-2',
                    isConnected ? 'bg-gray-100' : 'bg-amber-100'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-5 w-5',
                      isConnected ? 'text-gray-600' : 'text-amber-600'
                    )}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{name}</p>
                    {req.required && (
                      <span className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-medium text-red-700">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {capabilities.join(', ')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isConnected ? (
                  <div className="flex items-center gap-2 text-amber-600">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">Not connected</span>
                  </div>
                ) : grant ? (
                  <Button
                    variant={grant.status === 'allowed' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleToggle(grant.id, grant.status ?? 'pending')}
                    disabled={loading === grant.id}
                    className={cn(
                      grant.status === 'allowed' &&
                        'bg-green-600 hover:bg-green-700'
                    )}
                  >
                    {loading === grant.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : grant.status === 'allowed' ? (
                      <>
                        <Check className="mr-1 h-4 w-4" /> Allowed
                      </>
                    ) : (
                      <>
                        <X className="mr-1 h-4 w-4" /> Denied
                      </>
                    )}
                  </Button>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    Pending setup
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
