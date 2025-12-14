'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Copy, Check, ChevronDown, ChevronRight } from 'lucide-react'

interface RunOutputProps {
  output: unknown
  renderer?: 'json' | 'table' | 'cards'
  className?: string
}

export function RunOutput({ output, renderer = 'json', className }: RunOutputProps) {
  switch (renderer) {
    case 'table':
      return <TableOutput data={output} className={className} />
    case 'cards':
      return <CardsOutput data={output} className={className} />
    default:
      return <JsonOutput data={output} className={className} />
  }
}

function JsonOutput({ data, className }: { data: unknown; className?: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(data, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={cn('relative', className)}>
      <Button
        variant="outline"
        size="sm"
        className="absolute right-2 top-2 z-10"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
      <pre className="overflow-auto rounded-lg bg-gray-900 p-4 text-sm text-gray-100">
        <code>{JSON.stringify(data, null, 2)}</code>
      </pre>
    </div>
  )
}

function TableOutput({ data, className }: { data: unknown; className?: string }) {
  if (!Array.isArray(data)) {
    return <JsonOutput data={data} className={className} />
  }

  if (data.length === 0) {
    return <p className="text-muted-foreground text-sm">No data</p>
  }

  const columns = Object.keys(data[0] || {})

  return (
    <div className={cn('overflow-auto', className)}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col}
                className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((row, i) => (
            <tr key={`${i}-${JSON.stringify(row)}`}>
              {columns.map((col) => (
                <td key={col} className="whitespace-nowrap px-4 py-3 text-sm text-gray-900">
                  {formatCellValue((row as Record<string, unknown>)[col])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CardsOutput({ data, className }: { data: unknown; className?: string }) {
  if (!Array.isArray(data)) {
    if (typeof data === 'object' && data !== null) {
      return <ObjectCard data={data as Record<string, unknown>} className={className} />
    }
    return <JsonOutput data={data} className={className} />
  }

  return (
    <div className={cn('grid gap-4 sm:grid-cols-2 lg:grid-cols-3', className)}>
      {data.map((item, i) => (
        <ObjectCard key={`${i}-${JSON.stringify(item)}`} data={item as Record<string, unknown>} />
      ))}
    </div>
  )
}

function ObjectCard({
  data,
  className,
}: {
  data: Record<string, unknown>
  className?: string
}) {
  const [expanded, setExpanded] = useState(false)
  const entries = Object.entries(data)
  const preview = entries.slice(0, 3)
  const hasMore = entries.length > 3

  return (
    <Card className={className}>
      <CardContent className="p-4">
        <dl className="space-y-2">
          {(expanded ? entries : preview).map(([key, value]) => (
            <div key={key}>
              <dt className="text-xs font-medium text-gray-500">{key}</dt>
              <dd className="text-sm text-gray-900">{formatCellValue(value)}</dd>
            </div>
          ))}
        </dl>
        {hasMore && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 w-full"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? (
              <>
                <ChevronDown className="mr-1 h-4 w-4" /> Show less
              </>
            ) : (
              <>
                <ChevronRight className="mr-1 h-4 w-4" /> Show {entries.length - 3} more
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

function formatCellValue(value: unknown): string {
  if (value === null || value === undefined) return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}
