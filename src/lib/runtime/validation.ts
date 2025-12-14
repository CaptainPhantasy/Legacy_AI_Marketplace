import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

export interface ValidationResult {
  valid: boolean
  errors?: string[]
  data?: unknown
}

export function validateOutput(output: unknown, schema: object): ValidationResult {
  try {
    const validate = ajv.compile(schema)
    const valid = validate(output)

    if (valid) {
      return { valid: true, data: output }
    }

    return {
      valid: false,
      errors: validate.errors?.map((e) => `${e.instancePath || 'root'} ${e.message}`) ?? [
        'Unknown validation error',
      ],
    }
  } catch (error) {
    return {
      valid: false,
      errors: [error instanceof Error ? error.message : 'Schema compilation failed'],
    }
  }
}

export function safeJsonParse(text: string): { success: true; data: unknown } | { success: false; error: string } {
  try {
    // Handle potential markdown code blocks in response
    let cleanText = text.trim()
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.slice(7)
    }
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.slice(3)
    }
    if (cleanText.endsWith('```')) {
      cleanText = cleanText.slice(0, -3)
    }
    
    const data = JSON.parse(cleanText.trim())
    return { success: true, data }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'JSON parse failed' }
  }
}
