import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ConnectButton } from './connect-button'
import { Database } from '@/types/database'

type ConnectorAccount = Database['public']['Tables']['connector_accounts']['Row']

interface ConnectorCardProps {
  connectorType: 'google_drive' | 'gmail'
  connector?: ConnectorAccount | null
}

const connectorInfo = {
  google_drive: {
    name: 'Google Drive',
    description: 'Access your Google Drive files and folders',
    icon: '📁',
  },
  gmail: {
    name: 'Gmail',
    description: 'Read and manage your Gmail messages',
    icon: '📧',
  },
}

export function ConnectorCard({ connectorType, connector }: ConnectorCardProps) {
  const info = connectorInfo[connectorType]
  const isConnected = connector?.status === 'connected'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{info.icon}</span>
            <div>
              <CardTitle>{info.name}</CardTitle>
              <CardDescription>{info.description}</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/50 p-3">
              <div>
                <p className="text-sm font-medium">
                  {connector.external_account_name || 'Connected'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Connected {connector.created_at
                    ? new Date(connector.created_at).toLocaleDateString()
                    : ''}
                </p>
              </div>
              <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-200">
                Connected
              </span>
            </div>
            <ConnectButton connectorType={connectorType} isConnected={true} />
          </div>
        ) : (
          <ConnectButton connectorType={connectorType} isConnected={false} />
        )}
      </CardContent>
    </Card>
  )
}
