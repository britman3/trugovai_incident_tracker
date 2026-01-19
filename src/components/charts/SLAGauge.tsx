'use client'

interface SLAGaugeProps {
  percentage: number
  target?: number
}

export function SLAGauge({ percentage, target = 95 }: SLAGaugeProps) {
  const radius = 80
  const strokeWidth = 12
  const normalizedRadius = radius - strokeWidth / 2
  const circumference = normalizedRadius * 2 * Math.PI
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  const getColor = () => {
    if (percentage >= target) return '#7BC96F' // Green - on track
    if (percentage >= target - 10) return '#F59E0B' // Amber - at risk
    return '#DC2626' // Red - breached
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative">
        <svg width={radius * 2} height={radius * 2}>
          {/* Background circle */}
          <circle
            stroke="#E5E7EB"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <circle
            stroke={getColor()}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference + ' ' + circumference}
            style={{
              strokeDashoffset,
              transform: 'rotate(-90deg)',
              transformOrigin: '50% 50%',
              transition: 'stroke-dashoffset 0.5s ease-in-out',
            }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Target line */}
          <line
            x1={radius}
            y1={strokeWidth / 2}
            x2={radius}
            y2={strokeWidth / 2 + 10}
            stroke="#0F2A3A"
            strokeWidth={2}
            style={{
              transform: `rotate(${(target / 100) * 360 - 90}deg)`,
              transformOrigin: `${radius}px ${radius}px`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-h2 text-navy font-bold">{percentage}%</span>
          <span className="text-small text-slate-700">SLA Compliance</span>
        </div>
      </div>
      <div className="flex items-center gap-4 mt-4 text-small">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-severity-low rounded-full" />
          <span className="text-slate-700">{">"}={target}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-severity-medium rounded-full" />
          <span className="text-slate-700">{target - 10}-{target - 1}%</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-severity-critical rounded-full" />
          <span className="text-slate-700">{"<"}{target - 10}%</span>
        </div>
      </div>
    </div>
  )
}
