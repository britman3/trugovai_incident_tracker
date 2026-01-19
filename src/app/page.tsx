'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardStat, SeverityBadge, StatusBadge, Button } from '@/components/ui'
import {
  StatusDonutChart,
  SeverityBarChart,
  IncidentLineChart,
  SLAGauge,
} from '@/components/charts'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import { Severity, IncidentStatus } from '@/types'

interface DashboardSummary {
  openIncidents: number
  openBySeverity: Record<string, number>
  slaBreaches: number
  slaBreachPercentage: number
  meanTimeToResolve: number
  mttrTrend: 'up' | 'down' | 'stable'
  incidentsThisMonth: number
  incidentsPreviousMonth: number
}

interface ChartData {
  statusDistribution: { name: string; value: number; color: string }[]
  severityDistribution: { severity: string; count: number; color: string }[]
  incidentsOverTime: { month: string; total: number }[]
  problematicTools: { name: string; count: number; lastIncident: string }[]
  recentIncidents: {
    id: string
    incidentNumber: string
    title: string
    severity: string
    status: string
    reportedAt: string
    assignedTo: string | null
  }[]
  slaPerformance: number
}

export default function Dashboard() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [summaryRes, chartsRes] = await Promise.all([
          fetch('/api/dashboard/summary'),
          fetch('/api/dashboard/charts'),
        ])

        if (!summaryRes.ok || !chartsRes.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const summaryData = await summaryRes.json()
        const chartsData = await chartsRes.json()

        setSummary(summaryData)
        setChartData(chartsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-h3 text-navy mb-2">Error Loading Dashboard</h2>
        <p className="text-body text-slate-700 mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    )
  }

  const monthChange = summary && summary.incidentsPreviousMonth > 0
    ? Math.round(
        ((summary.incidentsThisMonth - summary.incidentsPreviousMonth) /
          summary.incidentsPreviousMonth) *
          100
      )
    : 0

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-navy">Dashboard</h1>
          <p className="text-body text-slate-700 mt-1">
            AI Incident overview and response performance
          </p>
        </div>
        <Link href="/incidents/new">
          <Button>Report Incident</Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardStat
          label="Open Incidents"
          value={summary?.openIncidents || 0}
          trendLabel={
            summary?.openBySeverity
              ? `${summary.openBySeverity['Critical'] || 0} Critical, ${summary.openBySeverity['High'] || 0} High`
              : undefined
          }
        />
        <CardStat
          label="SLA Breaches"
          value={summary?.slaBreaches || 0}
          trend={summary?.slaBreachPercentage && summary.slaBreachPercentage > 10 ? 'up' : 'stable'}
          trendLabel={`${summary?.slaBreachPercentage || 0}% of open incidents`}
        />
        <CardStat
          label="Mean Time to Resolve"
          value={`${summary?.meanTimeToResolve || 0}h`}
          trend={summary?.mttrTrend}
          trendLabel={
            summary?.mttrTrend === 'down'
              ? 'Improving'
              : summary?.mttrTrend === 'up'
              ? 'Increasing'
              : 'Stable'
          }
        />
        <CardStat
          label="Incidents This Month"
          value={summary?.incidentsThisMonth || 0}
          trend={monthChange > 0 ? 'up' : monthChange < 0 ? 'down' : 'stable'}
          trendLabel={`${monthChange > 0 ? '+' : ''}${monthChange}% vs last month`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Incidents by Status">
          <StatusDonutChart
            data={chartData?.statusDistribution || []}
            onSliceClick={(status) => {
              window.location.href = `/incidents?status=${status.replace(' ', '')}`
            }}
          />
        </Card>
        <Card title="Severity Distribution">
          <SeverityBarChart data={chartData?.severityDistribution || []} />
        </Card>
      </div>

      {/* Incidents Over Time */}
      <Card title="Incidents Over Time" subtitle="Last 12 months">
        <IncidentLineChart data={chartData?.incidentsOverTime || []} />
      </Card>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Most Problematic Tools */}
        <Card title="Most Problematic Tools" className="lg:col-span-1">
          {chartData?.problematicTools && chartData.problematicTools.length > 0 ? (
            <div className="space-y-4">
              {chartData.problematicTools.map((tool, index) => (
                <div
                  key={tool.name}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center rounded-full bg-navy text-white text-small font-bold">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-body font-medium text-navy">{tool.name}</p>
                      <p className="text-small text-slate-700">
                        Last: {tool.lastIncident ? formatRelativeTime(tool.lastIncident) : 'N/A'}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`/incidents?affectedTool=${encodeURIComponent(tool.name)}`}
                    className="text-teal hover:underline text-small font-medium"
                  >
                    {tool.count} incidents
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-700 text-center py-4">No tool data available</p>
          )}
        </Card>

        {/* SLA Performance */}
        <Card title="SLA Performance" className="lg:col-span-1">
          <SLAGauge percentage={chartData?.slaPerformance || 100} />
        </Card>

        {/* Recent Incidents */}
        <Card
          title="Recent Incidents"
          className="lg:col-span-1"
          action={
            <Link href="/incidents" className="text-teal hover:underline text-small">
              View All
            </Link>
          }
        >
          {chartData?.recentIncidents && chartData.recentIncidents.length > 0 ? (
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {chartData.recentIncidents.slice(0, 5).map((incident) => (
                <Link
                  key={incident.id}
                  href={`/incidents/${incident.id}`}
                  className="block p-3 rounded-button hover:bg-ice transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-small text-teal">
                        {incident.incidentNumber}
                      </p>
                      <p className="text-body text-navy font-medium truncate">
                        {incident.title}
                      </p>
                      <p className="text-small text-slate-700 mt-1">
                        {formatRelativeTime(incident.reportedAt)}
                        {incident.assignedTo && ` • ${incident.assignedTo}`}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <SeverityBadge
                        severity={
                          incident.severity === 'Critical'
                            ? Severity.Critical
                            : incident.severity === 'High'
                            ? Severity.High
                            : incident.severity === 'Medium'
                            ? Severity.Medium
                            : Severity.Low
                        }
                      />
                      <StatusBadge
                        status={incident.status.replace(' ', '') as IncidentStatus}
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-slate-700 text-center py-4">No recent incidents</p>
          )}
        </Card>
      </div>
    </div>
  )
}
