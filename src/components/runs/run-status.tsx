import { cn } from '@/lib/utils'
import { Loader2, CheckCircle, XCircle, Clock, Download, Cpu, CheckCheck } from 'lucide-react'
import type { Database } from '@/types/database'

type RunStatus = Database['public']['Enums']['run_status']

interface RunStatusProps {
  status: RunStatus | null
  className?: string
  showLabel?: boolean
}

const statusConfig: Record<
  RunStatus,
  { label: string; icon: typeof Loader2; color: string; bgColor: string }
> = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-gray-500',
    bgColor: 'bg-gray-100',
  },
  fetching: {
    label: 'Fetching Data',
    icon: Download,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100',
  },
  processing: {
    label: 'Processing',
    icon: Cpu,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100',
  },
  validating: {
    label: 'Validating',
    icon: CheckCheck,
    color: 'text-amber-500',
    bgColor: 'bg-amber-100',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle,
    color: 'text-green-500',
    bgColor: 'bg-green-100',
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
  },
  error: {
    label: 'Error',
    icon: XCircle,
    color: 'text-red-500',
    bgColor: 'bg-red-100',
  },
}

export function RunStatus({ status, className, showLabel = true }: RunStatusProps) {
  if (!status) {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium',
          'bg-gray-100 text-gray-500',
          className
        )}
      >
        <Clock className="h-4 w-4" />
        {showLabel && <span>Unknown</span>}
      </div>
    )
  }
  const config = statusConfig[status]
  const Icon = config.icon
  const isAnimated = ['pending', 'fetching', 'processing', 'validating'].includes(status)

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-medium',
        config.bgColor,
        config.color,
        className
      )}
    >
      <Icon className={cn('h-4 w-4', isAnimated && 'animate-spin')} />
      {showLabel && <span>{config.label}</span>}
    </div>
  )
}

export function RunStatusSteps({ currentStatus }: { currentStatus: RunStatus | null }) {
  if (!currentStatus) {
    return null
  }
  const steps: RunStatus[] = ['fetching', 'processing', 'validating', 'completed']
  const currentIndex = steps.indexOf(currentStatus)
  const isError = currentStatus === 'error' || currentStatus === 'failed'

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const config = statusConfig[step]
        const Icon = config.icon
        const isActive = step === currentStatus
        const isComplete = currentIndex > index
        const isPending = currentIndex < index

        return (
          <div key={step} className="flex items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-all',
                isActive && !isError && `${config.bgColor} ${config.color}`,
                isComplete && 'bg-green-100 text-green-600',
                isPending && 'bg-gray-100 text-gray-400',
                isError && isActive && 'bg-red-100 text-red-500'
              )}
            >
              {isActive && !isError ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isComplete ? (
                <CheckCircle className="h-4 w-4" />
              ) : isError && isActive ? (
                <XCircle className="h-4 w-4" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">{config.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-4 transition-colors',
                  isComplete ? 'bg-green-300' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
