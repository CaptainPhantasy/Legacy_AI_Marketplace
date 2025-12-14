import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

/**
 * Create Gmail API client from OAuth tokens
 */
export function createGmailClient(accessToken: string, refreshToken: string | null) {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_APP_URL + '/api/connectors/gmail/callback'
  )

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken || undefined,
  })

  return google.gmail({ version: 'v1', auth: oauth2Client })
}

/**
 * Fetch messages from Gmail
 */
export async function fetchGmailMessages(
  accessToken: string,
  refreshToken: string | null,
  options?: {
    maxResults?: number
    pageToken?: string
    q?: string
  }
) {
  const gmail = createGmailClient(accessToken, refreshToken)

  const response = await gmail.users.messages.list({
    userId: 'me',
    maxResults: options?.maxResults || 10,
    pageToken: options?.pageToken,
    q: options?.q,
  })

  return {
    messages: response.data.messages || [],
    nextPageToken: response.data.nextPageToken,
  }
}

/**
 * Get message details from Gmail
 */
export async function getGmailMessage(
  accessToken: string,
  refreshToken: string | null,
  messageId: string
) {
  const gmail = createGmailClient(accessToken, refreshToken)

  const response = await gmail.users.messages.get({
    userId: 'me',
    id: messageId,
    format: 'full',
  })

  return response.data
}

/**
 * Get user profile from Gmail
 */
export async function getGmailProfile(
  accessToken: string,
  refreshToken: string | null
) {
  const gmail = createGmailClient(accessToken, refreshToken)

  const response = await gmail.users.getProfile({
    userId: 'me',
  })

  return response.data
}
