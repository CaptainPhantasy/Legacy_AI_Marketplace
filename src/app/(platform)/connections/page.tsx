import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ConnectorCard } from '@/components/connectors/connector-card'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ConnectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get all connector accounts for user
  const { data: connectors } = await supabase
    .from('connector_accounts')
    .select('*')
    .eq('user_id', user.id)

  // Create a map for quick lookup
  const connectorMap = new Map(
    connectors?.map((c) => [c.connector_type, c]) || []
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Connections</h1>
        <p className="text-muted-foreground">
          Connect your services to use them with apps in the marketplace.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Services</CardTitle>
          <CardDescription>
            Connect once, use with any app that needs it
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <ConnectorCard
              connectorType="google_drive"
              connector={connectorMap.get('google_drive')}
            />
            <ConnectorCard
              connectorType="gmail"
              connector={connectorMap.get('gmail')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
