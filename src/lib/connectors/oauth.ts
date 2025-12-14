import crypto from 'crypto'
import { cookies } from 'next/headers'

const STATE_COOKIE_NAME = 'oauth_state'
const STATE_COOKIE_MAX_AGE = 600 // 10 minutes

/**
 * Generate a random state token for OAuth flow
 */
export function generateStateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Store OAuth state in cookie
 */
export async function storeOAuthState(state: string, connectorType: string): Promise<void> {
  const cookieStore = await cookies()
  const stateData = {
    state,
    connectorType,
    timestamp: Date.now(),
  }
  
  cookieStore.set(STATE_COOKIE_NAME, JSON.stringify(stateData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: STATE_COOKIE_MAX_AGE,
    path: '/',
  })
}

/**
 * Get and validate OAuth state from cookie
 */
export async function getAndValidateOAuthState(
  receivedState: string
): Promise<{ connectorType: string } | null> {
  const cookieStore = await cookies()
  const stateCookie = cookieStore.get(STATE_COOKIE_NAME)
  
  if (!stateCookie?.value) {
    return null
  }
  
  try {
    const stateData = JSON.parse(stateCookie.value)
    
    // Check if state matches
    if (stateData.state !== receivedState) {
      return null
    }
    
    // Check if state is expired (10 minutes)
    const age = Date.now() - stateData.timestamp
    if (age > STATE_COOKIE_MAX_AGE * 1000) {
      return null
    }
    
    // Delete the cookie after validation
    cookieStore.delete(STATE_COOKIE_NAME)
    
    return {
      connectorType: stateData.connectorType,
    }
  } catch {
    return null
  }
}

/**
 * Get Google OAuth scopes for a connector type
 */
export function getGoogleScopes(connectorType: string): string[] {
  switch (connectorType) {
    case 'google_drive':
      return [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.metadata.readonly',
      ]
    case 'gmail':
      return [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.metadata',
      ]
    default:
      throw new Error(`Unknown connector type: ${connectorType}`)
  }
}

/**
 * Build Google OAuth authorization URL
 */
export function buildGoogleOAuthUrl(
  connectorType: string,
  state: string,
  redirectUri: string
): string {
  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID environment variable is required')
  }

  const scopes = getGoogleScopes(connectorType)
  const scopeString = scopes.join(' ')

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: scopeString,
    state,
    access_type: 'offline',
    prompt: 'consent',
  })

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
}
