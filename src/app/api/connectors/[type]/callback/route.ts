import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAndValidateOAuthState } from '@/lib/connectors/oauth'
import { encryptTokens } from '@/lib/encryption'
import { OAuth2Client } from 'google-auth-library'
import { Database } from '@/types/database'

type ConnectorType = Database['public']['Enums']['connector_type']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type: connectorType } = await params
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  // Handle OAuth errors
  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=${encodeURIComponent(error)}`
    )
  }

  // Validate required parameters
  if (!code || !state) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=missing_parameters`
    )
  }

  // Validate state token
  const stateData = await getAndValidateOAuthState(state)
  if (!stateData || stateData.connectorType !== connectorType) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=invalid_state`
    )
  }

  // Check authentication
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/login`
    )
  }

  try {
    // Exchange code for tokens
    const oauth2Client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_APP_URL}/api/connectors/${connectorType}/callback`
    )

    const { tokens } = await oauth2Client.getToken(code)

    if (!tokens.access_token) {
      throw new Error('No access token received')
    }

    // Encrypt tokens
    const { encryptedAccess, encryptedRefresh, iv } = await encryptTokens({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || null,
    })

    // Calculate expiration time
    const expiresAt = tokens.expiry_date
      ? new Date(tokens.expiry_date).toISOString()
      : null

    // Get scopes
    const scopes = tokens.scope ? tokens.scope.split(' ') : []

    // Get external account info (for display)
    let externalAccountId: string | null = null
    let externalAccountName: string | null = null

    if (connectorType === 'gmail') {
      // Fetch Gmail profile to get email address
      const { google } = await import('googleapis')
      oauth2Client.setCredentials(tokens)
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
      const profile = await gmail.users.getProfile({ userId: 'me' })
      externalAccountId = profile.data.emailAddress || null
      externalAccountName = profile.data.emailAddress || null
    } else if (connectorType === 'google_drive') {
      // For Drive, we can use the user's email from their profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', user.id)
        .single()
      externalAccountId = profile?.email || null
      externalAccountName = profile?.email || null
    }

    // Upsert connector account
    const { error: upsertError } = await supabase
      .from('connector_accounts')
      .upsert({
        user_id: user.id,
        connector_type: connectorType as ConnectorType,
        access_token_encrypted: encryptedAccess,
        refresh_token_encrypted: encryptedRefresh,
        token_iv: iv,
        expires_at: expiresAt,
        scopes,
        status: 'connected',
        external_account_id: externalAccountId,
        external_account_name: externalAccountName,
      }, {
        onConflict: 'user_id,connector_type',
      })

    if (upsertError) {
      console.error('Error saving connector:', upsertError)
      throw new Error('Failed to save connector')
    }

    // Redirect to connections page with success
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/connections?success=${connectorType}`
    )
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_APP_URL}/connections?error=connection_failed`
    )
  }
}
