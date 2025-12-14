import type { Database } from './database'

export type Json = Database['public']['Tables']['app_versions']['Row']['manifest_json']

/**
 * Connector requirement for an app
 */
export interface ConnectorRequirement {
  type: 'google_drive' | 'gmail' | 'slack' | 'notion'
  required: boolean
  scopes: string[]
  description: string
}

/**
 * App manifest structure
 */
export interface AppManifest {
  name: string
  description: string
  icon: string
  category: string
  connectors: ConnectorRequirement[]
  config_schema?: JsonSchema
  output_schema: JsonSchema
  ui?: {
    outputRenderer?: 'json' | 'table' | 'cards'
  }
  execution?: {
    model?: string
    modelConfig?: {
      temperature?: number
      maxOutputTokens?: number
    }
    retryConfig?: {
      retryOnValidationFailure?: boolean
      maxRetries?: number
    }
  }
}

/**
 * JSON Schema type (simplified)
 */
export interface JsonSchema {
  type: string
  title?: string
  description?: string
  properties?: Record<string, JsonSchema>
  required?: string[]
  items?: JsonSchema
  enum?: string[]
  format?: string
  placeholder?: string
  rows?: number
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  default?: string | number | boolean
  [key: string]: unknown
}
