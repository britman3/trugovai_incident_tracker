import { cn, getSeverityLabel, getSeverityColor, getStatusColor } from '@/lib/utils'
import { Severity, IncidentStatus } from '@/types'

interface SeverityBadgeProps {
  severity: Severity
  className?: string
}

export function SeverityBadge({ severity, className }: SeverityBadgeProps) {
  return (
    <span
      className={cn(
        'badge text-white',
        getSeverityColor(severity),
        className
      )}
    >
      {getSeverityLabel(severity)}
    </span>
  )
}

interface StatusBadgeProps {
  status: IncidentStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'status-badge',
        getStatusColor(status),
        className
      )}
    >
      {status}
    </span>
  )
}

interface SLABadgeProps {
  status: 'On Track' | 'Breached'
  className?: string
}

export function SLABadge({ status, className }: SLABadgeProps) {
  return (
    <span
      className={cn(
        'badge',
        status === 'On Track'
          ? 'bg-severity-low/10 text-severity-low'
          : 'bg-severity-critical/10 text-severity-critical',
        className
      )}
    >
      {status}
    </span>
  )
}
