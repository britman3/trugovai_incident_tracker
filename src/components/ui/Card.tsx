import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  action?: React.ReactNode
}

export function Card({ children, className, title, subtitle, action }: CardProps) {
  return (
    <div className={cn('card', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-4">
          <div>
            {title && <h3 className="text-h3 text-navy">{title}</h3>}
            {subtitle && <p className="text-small text-slate-700 mt-1">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  )
}

export function CardStat({
  label,
  value,
  trend,
  trendLabel,
  icon,
}: {
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'stable'
  trendLabel?: string
  icon?: React.ReactNode
}) {
  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-small text-slate-700">{label}</p>
          <p className="text-h2 text-navy mt-1">{value}</p>
          {trendLabel && (
            <p className={cn(
              'text-small mt-2 flex items-center',
              trend === 'up' ? 'text-severity-high' :
              trend === 'down' ? 'text-severity-low' :
              'text-slate-700'
            )}>
              {trend === 'up' && '↑'}
              {trend === 'down' && '↓'}
              {trend === 'stable' && '→'}
              <span className="ml-1">{trendLabel}</span>
            </p>
          )}
        </div>
        {icon && (
          <div className="text-teal text-3xl">{icon}</div>
        )}
      </div>
    </div>
  )
}
