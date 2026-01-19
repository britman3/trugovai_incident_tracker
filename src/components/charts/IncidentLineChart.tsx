'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface TimeSeriesData {
  month: string
  total: number
}

interface IncidentLineChartProps {
  data: TimeSeriesData[]
}

export function IncidentLineChart({ data }: IncidentLineChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-700">
        No data to display
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis
          dataKey="month"
          tick={{ fill: '#4C5D6B', fontSize: 12 }}
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
        <Line
          type="monotone"
          dataKey="total"
          stroke="#1AA7A1"
          strokeWidth={3}
          dot={{ fill: '#1AA7A1', strokeWidth: 2 }}
          activeDot={{ r: 6, fill: '#1AA7A1' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
