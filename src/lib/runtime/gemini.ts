import { GoogleGenerativeAI, SchemaType, type Schema } from '@google/generative-ai'
import type { JsonSchema } from '@/types/manifest'

function getGenAI() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is required')
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
}

export interface GeminiRequest {
  model: string
  prompt: string
  outputSchema?: object
  config?: {
    temperature?: number
    maxOutputTokens?: number
    topP?: number
    topK?: number
  }
}

export interface GeminiResponse {
  text: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

/**
 * Convert JSON Schema to Gemini Schema format
 * Gemini uses a slightly different schema format
 */
function convertToGeminiSchema(jsonSchema: JsonSchema): Schema {
  const convert = (schema: JsonSchema): Schema => {
    if (!schema || typeof schema !== 'object') {
      return schema
    }

    const result: Record<string, unknown> = {}

    // Map type
    if (schema.type) {
      const typeMap: Record<string, SchemaType> = {
        string: SchemaType.STRING,
        number: SchemaType.NUMBER,
        integer: SchemaType.INTEGER,
        boolean: SchemaType.BOOLEAN,
        array: SchemaType.ARRAY,
        object: SchemaType.OBJECT,
      }
      result.type = typeMap[schema.type] || SchemaType.STRING
    }

    // Copy description
    if (schema.description) {
      result.description = schema.description
    }

    // Copy enum
    if (schema.enum) {
      result.enum = schema.enum
    }

    // Convert properties
    if (schema.properties) {
      const props: Record<string, Schema> = {}
      for (const [key, value] of Object.entries(schema.properties)) {
        props[key] = convert(value)
      }
      result.properties = props
    }

    // Copy required
    if (schema.required) {
      result.required = schema.required
    }

    // Convert items for arrays
    if (schema.items) {
      result.items = convert(schema.items)
    }

    // Handle nullable
    if (schema.nullable) {
      result.nullable = true
    }

    return result as unknown as Schema
  }

  return convert(jsonSchema)
}

export async function callGemini(request: GeminiRequest): Promise<GeminiResponse> {
  const generationConfig: {
    temperature: number
    maxOutputTokens: number
    topP: number
    topK: number
    responseMimeType?: string
    responseSchema?: Schema
  } = {
    temperature: request.config?.temperature ?? 0.3,
    maxOutputTokens: request.config?.maxOutputTokens ?? 8192,
    topP: request.config?.topP ?? 0.95,
    topK: request.config?.topK ?? 40,
  }

  // If output schema provided, use JSON mode
  if (request.outputSchema) {
    generationConfig.responseMimeType = 'application/json'
    generationConfig.responseSchema = convertToGeminiSchema(request.outputSchema as JsonSchema)
  }

  const modelConfig = {
    model: request.model,
    generationConfig,
  }

  const model = getGenAI().getGenerativeModel(modelConfig)

  const result = await model.generateContent(request.prompt)
  const response = result.response

  const text = response.text()
  const usage = response.usageMetadata

  return {
    text,
    usage: {
      promptTokens: usage?.promptTokenCount ?? 0,
      completionTokens: usage?.candidatesTokenCount ?? 0,
      totalTokens: usage?.totalTokenCount ?? 0,
    },
  }
}

/**
 * Available models with their capabilities
 */
export const GEMINI_MODELS = {
  'gemini-2.5-flash': {
    name: 'Gemini 2.5 Flash',
    description: 'Fast, efficient for most tasks',
    maxTokens: 8192,
  },
  'gemini-2.5-pro': {
    name: 'Gemini 2.5 Pro',
    description: 'Advanced reasoning, Deep Think mode',
    maxTokens: 8192,
  },
  'gemini-3-pro': {
    name: 'Gemini 3 Pro',
    description: 'Latest flagship model',
    maxTokens: 65536,
  },
  'gemini-3-pro-preview': {
    name: 'Gemini 3 Pro Preview',
    description: 'Experimental features',
    maxTokens: 65536,
  },
} as const

export type GeminiModelId = keyof typeof GEMINI_MODELS
