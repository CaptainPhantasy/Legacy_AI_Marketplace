import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits

/**
 * Get encryption key from environment variable
 */
function getEncryptionKey(): Buffer {
  const key = process.env.TOKEN_ENCRYPTION_KEY || process.env.ENCRYPTION_KEY
  
  if (!key) {
    throw new Error('TOKEN_ENCRYPTION_KEY or ENCRYPTION_KEY environment variable is required')
  }

  // Decode base64 key to buffer
  const keyBuffer = Buffer.from(key, 'base64')
  
  if (keyBuffer.length !== KEY_LENGTH) {
    throw new Error(`Encryption key must be ${KEY_LENGTH} bytes (${KEY_LENGTH * 8} bits) when base64 decoded`)
  }

  return keyBuffer
}

/**
 * Encrypt OAuth tokens using AES-256-GCM
 * @param params - Access and refresh tokens to encrypt
 * @returns Encrypted tokens and IV
 */
export async function encryptTokens(params: {
  accessToken: string
  refreshToken: string | null
}): Promise<{ encryptedAccess: string; encryptedRefresh: string | null; iv: string }> {
  const key = getEncryptionKey()
  
  // Generate random IV for each encryption
  const iv = crypto.randomBytes(16)
  
  // Encrypt access token
  const cipherAccess = crypto.createCipheriv(ALGORITHM, key, iv)
  let encryptedAccess = cipherAccess.update(params.accessToken, 'utf8', 'hex')
  encryptedAccess += cipherAccess.final('hex')
  const authTagAccess = cipherAccess.getAuthTag()
  
  // Combine encrypted data with auth tag
  const accessTokenData = {
    encrypted: encryptedAccess,
    authTag: authTagAccess.toString('hex'),
  }
  
  // Encrypt refresh token if provided
  let encryptedRefresh: string | null = null
  if (params.refreshToken) {
    const cipherRefresh = crypto.createCipheriv(ALGORITHM, key, iv)
    let encrypted = cipherRefresh.update(params.refreshToken, 'utf8', 'hex')
    encrypted += cipherRefresh.final('hex')
    const authTagRefresh = cipherRefresh.getAuthTag()
    
    encryptedRefresh = JSON.stringify({
      encrypted,
      authTag: authTagRefresh.toString('hex'),
    })
  }
  
  return {
    encryptedAccess: JSON.stringify(accessTokenData),
    encryptedRefresh,
    iv: iv.toString('hex'),
  }
}

/**
 * Decrypt OAuth tokens using AES-256-GCM
 * @param params - Encrypted tokens and IV
 * @returns Decrypted access and refresh tokens
 */
export async function decryptTokens(params: {
  encryptedAccess: string
  encryptedRefresh: string | null
  iv: string
}): Promise<{ accessToken: string; refreshToken: string | null }> {
  const key = getEncryptionKey()
  const iv = Buffer.from(params.iv, 'hex')
  
  // Decrypt access token
  const accessTokenData = JSON.parse(params.encryptedAccess)
  const decipherAccess = crypto.createDecipheriv(ALGORITHM, key, iv)
  decipherAccess.setAuthTag(Buffer.from(accessTokenData.authTag, 'hex'))
  
  let accessToken = decipherAccess.update(accessTokenData.encrypted, 'hex', 'utf8')
  accessToken += decipherAccess.final('utf8')
  
  // Decrypt refresh token if provided
  let refreshToken: string | null = null
  if (params.encryptedRefresh) {
    const refreshTokenData = JSON.parse(params.encryptedRefresh)
    const decipherRefresh = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipherRefresh.setAuthTag(Buffer.from(refreshTokenData.authTag, 'hex'))
    
    let decrypted = decipherRefresh.update(refreshTokenData.encrypted, 'hex', 'utf8')
    decrypted += decipherRefresh.final('utf8')
    refreshToken = decrypted
  }
  
  return {
    accessToken,
    refreshToken,
  }
}
