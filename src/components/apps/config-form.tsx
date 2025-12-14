'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, Save } from 'lucide-react'
import { useState } from 'react'
import { useForm, type FieldErrors, type UseFormRegister } from 'react-hook-form'
import { z } from 'zod'
import type { JsonSchema } from '@/types/manifest'

interface ConfigFormProps {
  schema: JsonSchema
  currentConfig: Record<string, unknown>
  onSave: (config: Record<string, unknown>) => Promise<void>
}

export function ConfigForm({ schema, currentConfig, onSave }: ConfigFormProps) {
  const [saving, setSaving] = useState(false)

  // Build Zod schema from JSON Schema
  const zodSchema = buildZodSchema(schema)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(zodSchema),
    defaultValues: currentConfig,
  })

  const onSubmit = async (data: Record<string, unknown>) => {
    setSaving(true)
    try {
      await onSave(data)
    } finally {
      setSaving(false)
    }
  }

  if (!schema.properties || Object.keys(schema.properties).length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        This app has no configurable settings.
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {Object.entries(schema.properties).map(([key, prop]) => (
        <div key={key} className="space-y-2">
          <Label htmlFor={key}>
            {prop.title || key}
            {schema.required?.includes(key) && (
              <span className="ml-1 text-red-500">*</span>
            )}
          </Label>

          {renderField(key, prop, register, errors)}

          {prop.description && (
            <p className="text-muted-foreground text-sm">{prop.description}</p>
          )}

          {errors[key] && (
            <p className="text-sm text-red-500">
              {errors[key]?.message as string}
            </p>
          )}
        </div>
      ))}

      <Button type="submit" disabled={saving || !isDirty}>
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="mr-2 h-4 w-4" />
            Save Configuration
          </>
        )}
      </Button>
    </form>
  )
}

function renderField(
  key: string,
  prop: JsonSchema,
  register: UseFormRegister<Record<string, unknown>>,
  errors: FieldErrors<Record<string, unknown>>
) {
  const commonProps = {
    id: key,
    ...register(key),
    className: errors[key] ? 'border-red-500' : '',
  }

  // Select (enum)
  if (prop.enum) {
    return (
      <select
        {...commonProps}
        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {prop.enum.map((opt: string) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    )
  }

  // Textarea (string with rows hint or long description)
  if (prop.type === 'string' && (prop.rows || prop.format === 'textarea')) {
    return (
      <textarea
        {...commonProps}
        rows={prop.rows || 4}
        placeholder={prop.placeholder}
        className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    )
  }

  // Checkbox (boolean)
  if (prop.type === 'boolean') {
    return (
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          {...commonProps}
          className="h-4 w-4 rounded border-gray-300"
        />
        <span className="text-sm text-gray-600">{prop.description}</span>
      </div>
    )
  }

  // Number
  if (prop.type === 'number' || prop.type === 'integer') {
    return (
      <Input
        type="number"
        {...commonProps}
        placeholder={prop.placeholder}
        min={prop.minimum}
        max={prop.maximum}
        step={prop.type === 'integer' ? 1 : 'any'}
      />
    )
  }

  // Default: text input
  return (
    <Input
      type="text"
      {...commonProps}
      placeholder={prop.placeholder || (prop.default !== undefined ? String(prop.default) : undefined)}
    />
  )
}

function buildZodSchema(jsonSchema: JsonSchema): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}

  if (!jsonSchema.properties) {
    return z.object({})
  }

  for (const [key, prop] of Object.entries(jsonSchema.properties) as [
    string,
    JsonSchema,
  ][]) {
    let fieldSchema: z.ZodTypeAny

    switch (prop.type) {
      case 'number':
      case 'integer':
        fieldSchema = z.coerce.number()
        if (prop.minimum !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).min(prop.minimum)
        }
        if (prop.maximum !== undefined) {
          fieldSchema = (fieldSchema as z.ZodNumber).max(prop.maximum)
        }
        break

      case 'boolean':
        fieldSchema = z.boolean()
        break

      case 'string':
      default:
        fieldSchema = z.string()
        if (prop.enum) {
          fieldSchema = z.enum(prop.enum as [string, ...string[]])
        }
        if (prop.minLength) {
          fieldSchema = (fieldSchema as z.ZodString).min(prop.minLength)
        }
        if (prop.maxLength) {
          fieldSchema = (fieldSchema as z.ZodString).max(prop.maxLength)
        }
    }

    // Make optional if not required
    if (!jsonSchema.required?.includes(key)) {
      fieldSchema = fieldSchema.optional()
    }

    shape[key] = fieldSchema
  }

  return z.object(shape)
}
