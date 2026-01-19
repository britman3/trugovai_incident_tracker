import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type ResolvedIncident = {
  reportedAt: Date
  resolvedAt: Date | null
}

type SeverityGroupItem = {
  severity: string
  _count: { id: number }
}

// GET /api/dashboard/summary - Get dashboard summary stats
export async function GET() {
  try {
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)

    // Open incidents count
    const openIncidents = await prisma.incident.count({
      where: {
        status: { in: ['Open', 'InProgress', 'Escalated', 'Reopened'] },
      },
    })

    // Open by severity
    const openBySeverity = await prisma.incident.groupBy({
      by: ['severity'],
      where: {
        status: { in: ['Open', 'InProgress', 'Escalated', 'Reopened'] },
      },
      _count: { id: true },
    })

    // Calculate SLA breaches
    const openIncidentsForSLA = await prisma.incident.findMany({
      where: {
        status: { in: ['Open', 'InProgress', 'Escalated', 'Reopened'] },
      },
      select: {
        severity: true,
        reportedAt: true,
        acknowledgedAt: true,
        resolvedAt: true,
      },
    })

    const slaConfig: Record<string, { responseTime: number; resolutionTarget: number }> = {
      Critical: { responseTime: 1, resolutionTarget: 24 },
      High: { responseTime: 4, resolutionTarget: 48 },
      Medium: { responseTime: 24, resolutionTarget: 168 },
      Low: { responseTime: 72, resolutionTarget: 336 },
    }

    let slaBreaches = 0
    for (const incident of openIncidentsForSLA) {
      const config = slaConfig[incident.severity]
      const hoursElapsed = (now.getTime() - new Date(incident.reportedAt).getTime()) / (1000 * 60 * 60)

      const responseSLABreached = !incident.acknowledgedAt && hoursElapsed > config.responseTime
      const resolutionSLABreached = !incident.resolvedAt && hoursElapsed > config.resolutionTarget

      if (responseSLABreached || resolutionSLABreached) {
        slaBreaches++
      }
    }

    const slaBreachPercentage = openIncidents > 0
      ? Math.round((slaBreaches / openIncidents) * 100)
      : 0

    // Mean Time to Resolve
    const resolvedIncidents = await prisma.incident.findMany({
      where: {
        resolvedAt: { not: null },
      },
      select: {
        reportedAt: true,
        resolvedAt: true,
      },
    })

    let mttr = 0
    if (resolvedIncidents.length > 0) {
      const totalHours = resolvedIncidents.reduce((sum: number, incident: ResolvedIncident) => {
        const reported = new Date(incident.reportedAt)
        const resolved = new Date(incident.resolvedAt!)
        return sum + (resolved.getTime() - reported.getTime()) / (1000 * 60 * 60)
      }, 0)
      mttr = Math.round(totalHours / resolvedIncidents.length)
    }

    // Incidents this month vs last month
    const incidentsThisMonth = await prisma.incident.count({
      where: {
        reportedAt: { gte: thisMonthStart },
      },
    })

    const incidentsPreviousMonth = await prisma.incident.count({
      where: {
        reportedAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
    })

    // Calculate MTTR trend
    const recentResolvedIncidents = await prisma.incident.findMany({
      where: {
        resolvedAt: { not: null },
        reportedAt: { gte: thisMonthStart },
      },
      select: {
        reportedAt: true,
        resolvedAt: true,
      },
    })

    const previousResolvedIncidents = await prisma.incident.findMany({
      where: {
        resolvedAt: { not: null },
        reportedAt: {
          gte: lastMonthStart,
          lte: lastMonthEnd,
        },
      },
      select: {
        reportedAt: true,
        resolvedAt: true,
      },
    })

    let mttrTrend: 'up' | 'down' | 'stable' = 'stable'
    if (recentResolvedIncidents.length > 0 && previousResolvedIncidents.length > 0) {
      const recentMttr = recentResolvedIncidents.reduce((sum: number, i: ResolvedIncident) => {
        return sum + (new Date(i.resolvedAt!).getTime() - new Date(i.reportedAt).getTime())
      }, 0) / recentResolvedIncidents.length

      const previousMttr = previousResolvedIncidents.reduce((sum: number, i: ResolvedIncident) => {
        return sum + (new Date(i.resolvedAt!).getTime() - new Date(i.reportedAt).getTime())
      }, 0) / previousResolvedIncidents.length

      if (recentMttr < previousMttr * 0.9) {
        mttrTrend = 'down' // Improved (lower is better)
      } else if (recentMttr > previousMttr * 1.1) {
        mttrTrend = 'up' // Worsened
      }
    }

    return NextResponse.json({
      openIncidents,
      openBySeverity: openBySeverity.reduce((acc: Record<string, number>, item: SeverityGroupItem) => {
        acc[item.severity] = item._count.id
        return acc
      }, {} as Record<string, number>),
      slaBreaches,
      slaBreachPercentage,
      meanTimeToResolve: mttr,
      mttrTrend,
      incidentsThisMonth,
      incidentsPreviousMonth,
    })
  } catch (error) {
    console.error('Error fetching dashboard summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard summary' },
      { status: 500 }
    )
  }
}
