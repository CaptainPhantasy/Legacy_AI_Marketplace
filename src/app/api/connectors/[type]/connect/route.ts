import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateStateToken, storeOAuthState, buildGoogleOAuthUrl } from '@/lib/connectors/oauth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type: connectorType } = await params

  // Validate connector type
  const validTypes = ['google_drive', 'gmail']
  if (!validTypes.includes(connectorType)) {
    return NextResponse.json(
      { error: 'Invalid connector type' },
      { status: 400 }
    )
  }

  // Check authentication
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  // Generate state token
  const state = generateStateToken()
  await storeOAuthState(state, connectorType)

  // Build OAuth URL
  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL}/api/connectors/${connectorType}/callback`
  const authUrl = buildGoogleOAuthUrl(connectorType, state, redirectUri)

  // Redirect to Google OAuth
  return NextResponse.redirect(authUrl)
}
