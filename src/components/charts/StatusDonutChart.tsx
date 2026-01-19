'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface StatusData {
  name: string
  value: number
  color: string
}

interface StatusDonutChartProps {
  data: StatusData[]
  onSliceClick?: (status: string) => void
}

export function StatusDonutChart({ data, onSliceClick }: StatusDonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-700">
        No incidents to display
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          onClick={(entry) => onSliceClick?.(entry.name)}
          style={{ cursor: 'pointer' }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, name: string) => [value, name]}
          contentStyle={{
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }}
        />
        <Legend
          layout="vertical"
          align="right"
          verticalAlign="middle"
          formatter={(value, entry) => {
            const item = data.find((d) => d.name === value)
            return (
              <span className="text-small text-slate-700">
                {value} ({item?.value || 0})
              </span>
            )
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
