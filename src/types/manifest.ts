import { Database } from './database'

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
}

/**
 * JSON Schema type (simplified)
 */
export interface JsonSchema {
  type: string
  properties?: Record<string, JsonSchema>
  required?: string[]
  items?: JsonSchema
  [key: string]: unknown
}
