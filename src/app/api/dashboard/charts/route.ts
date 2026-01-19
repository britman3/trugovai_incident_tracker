import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const STATUS_COLORS: Record<string, string> = {
  Open: '#FF6B6B',
  InProgress: '#F59E0B',
  Escalated: '#DC2626',
  Resolved: '#7BC96F',
  Reopened: '#F59E0B',
  Closed: '#6B7280',
}

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#DC2626',
  High: '#FF6B6B',
  Medium: '#F59E0B',
  Low: '#7BC96F',
}

// GET /api/dashboard/charts - Get chart data for dashboard
export async function GET() {
  try {
    // Status distribution
    const statusDistribution = await prisma.incident.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    const statusData = statusDistribution.map((item) => ({
      name: item.status === 'InProgress' ? 'In Progress' : item.status,
      value: item._count.id,
      color: STATUS_COLORS[item.status] || '#6B7280',
    }))

    // Severity distribution
    const severityDistribution = await prisma.incident.groupBy({
      by: ['severity'],
      _count: { id: true },
    })

    const severityData = ['Critical', 'High', 'Medium', 'Low'].map((severity) => {
      const found = severityDistribution.find((s) => s.severity === severity)
      return {
        severity,
        count: found?._count.id || 0,
        color: SEVERITY_COLORS[severity],
      }
    })

    // Incidents over time (last 12 months)
    const twelveMonthsAgo = new Date()
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11)
    twelveMonthsAgo.setDate(1)
    twelveMonthsAgo.setHours(0, 0, 0, 0)

    const incidents = await prisma.incident.findMany({
      where: {
        reportedAt: { gte: twelveMonthsAgo },
      },
      select: {
        reportedAt: true,
      },
    })

    const monthlyData: Record<string, number> = {}
    const now = new Date()

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
      monthlyData[key] = 0
    }

    incidents.forEach((incident) => {
      const date = new Date(incident.reportedAt)
      const key = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
      if (monthlyData[key] !== undefined) {
        monthlyData[key]++
      }
    })

    const incidentsOverTime = Object.entries(monthlyData).map(([month, total]) => ({
      month,
      total,
    }))

    // Most problematic tools
    const toolIncidents = await prisma.incident.groupBy({
      by: ['affectedTool'],
      _count: { id: true },
      orderBy: {
        _count: { id: 'desc' },
      },
      take: 5,
    })

    const toolsWithLastIncident = await Promise.all(
      toolIncidents.map(async (tool) => {
        const lastIncident = await prisma.incident.findFirst({
          where: { affectedTool: tool.affectedTool },
          orderBy: { reportedAt: 'desc' },
          select: { reportedAt: true },
        })
        return {
          name: tool.affectedTool,
          count: tool._count.id,
          lastIncident: lastIncident?.reportedAt.toISOString() || '',
        }
      })
    )

    // Recent incidents
    const recentIncidents = await prisma.incident.findMany({
      orderBy: { reportedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        incidentNumber: true,
        title: true,
        severity: true,
        status: true,
        reportedAt: true,
        assignedTo: true,
      },
    })

    // SLA performance (percentage resolved within SLA)
    const resolvedIncidents = await prisma.incident.findMany({
      where: {
        resolvedAt: { not: null },
      },
      select: {
        severity: true,
        reportedAt: true,
        resolvedAt: true,
      },
    })

    const slaConfig: Record<string, number> = {
      Critical: 24,
      High: 48,
      Medium: 168,
      Low: 336,
    }

    let withinSLA = 0
    resolvedIncidents.forEach((incident) => {
      const target = slaConfig[incident.severity]
      const hoursToResolve =
        (new Date(incident.resolvedAt!).getTime() - new Date(incident.reportedAt).getTime()) /
        (1000 * 60 * 60)
      if (hoursToResolve <= target) {
        withinSLA++
      }
    })

    const slaPerformance =
      resolvedIncidents.length > 0
        ? Math.round((withinSLA / resolvedIncidents.length) * 100)
        : 100

    return NextResponse.json({
      statusDistribution: statusData,
      severityDistribution: severityData,
      incidentsOverTime,
      problematicTools: toolsWithLastIncident,
      recentIncidents,
      slaPerformance,
    })
  } catch (error) {
    console.error('Error fetching chart data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch chart data' },
      { status: 500 }
    )
  }
}
