'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface SeverityData {
  severity: string
  count: number
  color: string
}

interface SeverityBarChartProps {
  data: SeverityData[]
}

export function SeverityBarChart({ data }: SeverityBarChartProps) {
  if (data.every((d) => d.count === 0)) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-700">
        No incidents to display
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <XAxis
          dataKey="severity"
          tick={{ fill: '#4C5D6B', fontSize: 14 }}
          axisLine={{ stroke: '#E5E7EB' }}
        />
        <YAxis
          tick={{ fill: '#4C5D6B', fontSize: 14 }}
          axisLine={{ stroke: '#E5E7EB' }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'white',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
          }}
          formatter={(value: number) => [value, 'Incidents']}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
