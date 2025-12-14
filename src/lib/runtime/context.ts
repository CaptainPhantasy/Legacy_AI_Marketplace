export interface ContextData {
  config: Record<string, unknown>
  connectors: {
    google_drive?: { files: unknown[] }
    gmail?: { messages: unknown[] }
  }
  currentDate: string
  currentDateTime: string
}

/**
 * Build prompt from template with Handlebars-style placeholders
 * Supports:
 * - {{config.fieldName}}
 * - {{connectors.google_drive.files}}
 * - {{connectors.gmail.messages}}
 * - {{currentDate}}
 * - {{currentDateTime}}
 * - {{#if config.field}}...{{/if}}
 * - {{#each connectors.gmail.messages}}...{{/each}}
 */
export function buildPrompt(template: string, data: ContextData): string {
  let prompt = template

  // Replace {{currentDate}} and {{currentDateTime}}
  prompt = prompt.replace(/\{\{currentDate\}\}/g, data.currentDate)
  prompt = prompt.replace(/\{\{currentDateTime\}\}/g, data.currentDateTime)

  // Replace {{config.field}}
  for (const [key, value] of Object.entries(data.config)) {
    const placeholder = new RegExp(`\\{\\{config\\.${escapeRegex(key)}\\}\\}`, 'g')
    const replacement = formatValue(value)
    prompt = prompt.replace(placeholder, replacement)
  }

  // Replace {{connectors.type.field}}
  for (const [connectorType, connectorData] of Object.entries(data.connectors)) {
    if (!connectorData) continue
    for (const [key, value] of Object.entries(connectorData)) {
      const placeholder = new RegExp(
        `\\{\\{connectors\\.${escapeRegex(connectorType)}\\.${escapeRegex(key)}\\}\\}`,
        'g'
      )
      const replacement = formatValue(value)
      prompt = prompt.replace(placeholder, replacement)
    }
  }

  // Handle {{#if config.field}}content{{/if}}
  prompt = processConditionals(prompt, data)

  // Handle {{#each connectors.type.field}}...{{/each}}
  prompt = processEachBlocks(prompt, data)

  return prompt
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }
  return String(value)
}

function processConditionals(template: string, data: ContextData): string {
  // Match {{#if path}}content{{/if}}
  const ifRegex = /\{\{#if\s+([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g

  return template.replace(ifRegex, (_, path: string, content: string) => {
    const value = getNestedValue(data, path)
    // Truthy check: not null, undefined, empty string, 0, false
    if (value !== null && value !== undefined && value !== '' && value !== 0 && value !== false) {
      return content
    }
    return ''
  })
}

function processEachBlocks(template: string, data: ContextData): string {
  // Match {{#each path}}content{{/each}}
  const eachRegex = /\{\{#each\s+([\w.]+)\}\}([\s\S]*?)\{\{\/each\}\}/g

  return template.replace(eachRegex, (_, path: string, content: string) => {
    const value = getNestedValue(data, path)
    if (!Array.isArray(value)) {
      return ''
    }

    return value
      .map((item, index) => {
        let itemContent = content
        // Replace {{this}} with current item
        itemContent = itemContent.replace(/\{\{this\}\}/g, formatValue(item))
        // Replace {{@index}} with current index
        itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index))
        // Replace {{this.field}} for object items
        if (typeof item === 'object' && item !== null) {
          for (const [key, val] of Object.entries(item)) {
            itemContent = itemContent.replace(
              new RegExp(`\\{\\{this\\.${escapeRegex(key)}\\}\\}`, 'g'),
              formatValue(val)
            )
          }
        }
        return itemContent
      })
      .join('\n')
  })
}

function getNestedValue(obj: unknown, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined
    }
    if (typeof current !== 'object') {
      return undefined
    }
    current = (current as Record<string, unknown>)[part]
  }

  return current
}

/**
 * Create context data object with current timestamps
 */
export function createContextData(
  config: Record<string, unknown>,
  connectorData: ContextData['connectors']
): ContextData {
  const now = new Date()
  return {
    config,
    connectors: connectorData,
    currentDate: now.toISOString().split('T')[0],
    currentDateTime: now.toISOString(),
  }
}
