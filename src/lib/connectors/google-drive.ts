import { google } from 'googleapis'
import { OAuth2Client } from 'google-auth-library'

/**
 * Create Google Drive API client from OAuth tokens
 */
export function createDriveClient(accessToken: string, refreshToken: string | null) {
  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXT_PUBLIC_APP_URL + '/api/connectors/google_drive/callback'
  )

  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken || undefined,
  })

  return google.drive({ version: 'v3', auth: oauth2Client })
}

/**
 * Fetch files from Google Drive
 */
export async function fetchDriveFiles(
  accessToken: string,
  refreshToken: string | null,
  options?: {
    pageSize?: number
    pageToken?: string
    q?: string
  }
) {
  const drive = createDriveClient(accessToken, refreshToken)

  const response = await drive.files.list({
    pageSize: options?.pageSize || 10,
    pageToken: options?.pageToken,
    q: options?.q,
    fields: 'nextPageToken, files(id, name, mimeType, modifiedTime, size)',
  })

  return {
    files: response.data.files || [],
    nextPageToken: response.data.nextPageToken,
  }
}

/**
 * Get file metadata from Google Drive
 */
export async function getDriveFileMetadata(
  accessToken: string,
  refreshToken: string | null,
  fileId: string
) {
  const drive = createDriveClient(accessToken, refreshToken)

  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, modifiedTime, size, webViewLink',
  })

  return response.data
}
