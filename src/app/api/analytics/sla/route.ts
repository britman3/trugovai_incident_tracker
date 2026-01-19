import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type SLAIncident = {
  severity: string
  category: string
  affectedTool: string
  reportedAt: Date
  acknowledgedAt: Date | null
  resolvedAt: Date | null
  status: string
}

const SLA_CONFIG: Record<string, { responseTime: number; resolutionTarget: number }> = {
  Critical: { responseTime: 1, resolutionTarget: 24 },
  High: { responseTime: 4, resolutionTarget: 48 },
  Medium: { responseTime: 24, resolutionTarget: 168 },
  Low: { responseTime: 72, resolutionTarget: 336 },
}

// GET /api/analytics/sla - SLA performance data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: Record<string, unknown> = {}

    if (dateFrom || dateTo) {
      where.reportedAt = {}
      if (dateFrom) {
        (where.reportedAt as Record<string, Date>).gte = new Date(dateFrom)
      }
      if (dateTo) {
        (where.reportedAt as Record<string, Date>).lte = new Date(dateTo)
      }
    }

    // Get all incidents
    const incidents = await prisma.incident.findMany({
      where,
      select: {
        severity: true,
        category: true,
        affectedTool: true,
        reportedAt: true,
        acknowledgedAt: true,
        resolvedAt: true,
        status: true,
      },
    })

    const now = new Date()

    // Calculate SLA compliance
    let totalResolved = 0
    let resolvedWithinSLA = 0
    const breachesBySeverity: Record<string, number> = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
    }
    const breachesByCategory: Record<string, number> = {}
    const breachesByTool: Record<string, number> = {}

    incidents.forEach((incident: SLAIncident) => {
      const config = SLA_CONFIG[incident.severity]

      if (incident.resolvedAt) {
        totalResolved++
        const hoursToResolve =
          (new Date(incident.resolvedAt).getTime() - new Date(incident.reportedAt).getTime()) /
          (1000 * 60 * 60)

        if (hoursToResolve <= config.resolutionTarget) {
          resolvedWithinSLA++
        } else {
          breachesBySeverity[incident.severity]++
          breachesByCategory[incident.category] = (breachesByCategory[incident.category] || 0) + 1
          breachesByTool[incident.affectedTool] = (breachesByTool[incident.affectedTool] || 0) + 1
        }
      } else if (!['Closed'].includes(incident.status)) {
        // Check if open incident is breaching SLA
        const hoursElapsed =
          (now.getTime() - new Date(incident.reportedAt).getTime()) / (1000 * 60 * 60)

        if (hoursElapsed > config.resolutionTarget) {
          breachesBySeverity[incident.severity]++
          breachesByCategory[incident.category] = (breachesByCategory[incident.category] || 0) + 1
          breachesByTool[incident.affectedTool] = (breachesByTool[incident.affectedTool] || 0) + 1
        }
      }
    })

    // Calculate SLA compliance rate over time
    const resolvedIncidents = incidents.filter((i: SLAIncident) => i.resolvedAt)
    const monthlyCompliance: Record<string, { total: number; withinSLA: number }> = {}

    resolvedIncidents.forEach((incident: SLAIncident) => {
      const date = new Date(incident.reportedAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const config = SLA_CONFIG[incident.severity]
      const hoursToResolve =
        (new Date(incident.resolvedAt!).getTime() - new Date(incident.reportedAt).getTime()) /
        (1000 * 60 * 60)

      if (!monthlyCompliance[key]) {
        monthlyCompliance[key] = { total: 0, withinSLA: 0 }
      }

      monthlyCompliance[key].total++
      if (hoursToResolve <= config.resolutionTarget) {
        monthlyCompliance[key].withinSLA++
      }
    })

    const complianceOverTime = Object.entries(monthlyCompliance)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        rate: Math.round((data.withinSLA / data.total) * 100),
      }))

    // SLA compliance by severity
    const complianceBySeverity = Object.entries(breachesBySeverity).map(([severity, breaches]) => {
      const severityIncidents = resolvedIncidents.filter((i: SLAIncident) => i.severity === severity)
      const total = severityIncidents.length
      return {
        severity,
        total,
        breaches,
        rate: total > 0 ? Math.round(((total - breaches) / total) * 100) : 100,
      }
    })

    return NextResponse.json({
      overallRate: totalResolved > 0 ? Math.round((resolvedWithinSLA / totalResolved) * 100) : 100,
      totalIncidents: incidents.length,
      totalResolved,
      resolvedWithinSLA,
      breachesBySeverity,
      breachesByCategory: Object.entries(breachesByCategory)
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
      breachesByTool: Object.entries(breachesByTool)
        .map(([tool, count]) => ({ tool, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      complianceOverTime,
      complianceBySeverity,
    })
  } catch (error) {
    console.error('Error fetching SLA analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SLA analytics' },
      { status: 500 }
    )
  }
}
