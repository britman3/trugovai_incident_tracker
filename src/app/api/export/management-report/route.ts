import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type ResolvedIncident = {
  severity: string
  reportedAt: Date
  resolvedAt: Date | null
}

type IncidentDate = {
  reportedAt: Date
}

type StatusGroup = {
  status: string
  _count: { id: number }
}

type SeverityGroup = {
  severity: string
  _count: { id: number }
}

type CategoryGroup = {
  category: string
  _count: { id: number }
}

type ToolGroup = {
  affectedTool: string
  _count: { id: number }
}

// GET /api/export/management-report - Generate management report data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    if (!dateFrom || !dateTo) {
      return NextResponse.json(
        { error: 'Date range is required' },
        { status: 400 }
      )
    }

    const startDate = new Date(dateFrom)
    const endDate = new Date(dateTo)

    const where = {
      reportedAt: {
        gte: startDate,
        lte: endDate,
      },
    }

    // Summary statistics
    const totalIncidents = await prisma.incident.count({ where })

    const statusBreakdown = await prisma.incident.groupBy({
      by: ['status'],
      where,
      _count: { id: true },
    })

    const severityBreakdown = await prisma.incident.groupBy({
      by: ['severity'],
      where,
      _count: { id: true },
    })

    const categoryBreakdown = await prisma.incident.groupBy({
      by: ['category'],
      where,
      _count: { id: true },
    })

    // SLA performance
    const resolvedIncidents = await prisma.incident.findMany({
      where: {
        ...where,
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
    let totalMTTR = 0

    resolvedIncidents.forEach((incident: ResolvedIncident) => {
      const hoursToResolve =
        (new Date(incident.resolvedAt!).getTime() - new Date(incident.reportedAt).getTime()) /
        (1000 * 60 * 60)
      totalMTTR += hoursToResolve

      if (hoursToResolve <= slaConfig[incident.severity]) {
        withinSLA++
      }
    })

    const slaComplianceRate =
      resolvedIncidents.length > 0
        ? Math.round((withinSLA / resolvedIncidents.length) * 100)
        : 100

    const mttr =
      resolvedIncidents.length > 0
        ? Math.round(totalMTTR / resolvedIncidents.length)
        : 0

    // Top incidents
    const topIncidents = await prisma.incident.findMany({
      where: {
        ...where,
        severity: { in: ['Critical', 'High'] },
      },
      orderBy: { reportedAt: 'desc' },
      take: 10,
      select: {
        incidentNumber: true,
        title: true,
        severity: true,
        status: true,
        category: true,
        affectedTool: true,
        reportedAt: true,
        resolvedAt: true,
      },
    })

    // Most affected tools
    const toolIncidents = await prisma.incident.groupBy({
      by: ['affectedTool'],
      where,
      _count: { id: true },
      orderBy: {
        _count: { id: 'desc' },
      },
      take: 5,
    })

    // Monthly trends
    const incidents = await prisma.incident.findMany({
      where,
      select: {
        reportedAt: true,
      },
    })

    const monthlyTrends: Record<string, number> = {}
    incidents.forEach((incident: IncidentDate) => {
      const date = new Date(incident.reportedAt)
      const key = date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
      monthlyTrends[key] = (monthlyTrends[key] || 0) + 1
    })

    return NextResponse.json({
      reportPeriod: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      summary: {
        totalIncidents,
        resolvedIncidents: resolvedIncidents.length,
        slaComplianceRate,
        meanTimeToResolve: mttr,
      },
      statusBreakdown: statusBreakdown.map((s: StatusGroup) => ({
        status: s.status,
        count: s._count.id,
      })),
      severityBreakdown: severityBreakdown.map((s: SeverityGroup) => ({
        severity: s.severity,
        count: s._count.id,
      })),
      categoryBreakdown: categoryBreakdown.map((c: CategoryGroup) => ({
        category: c.category,
        count: c._count.id,
      })),
      topIncidents,
      mostAffectedTools: toolIncidents.map((t: ToolGroup) => ({
        tool: t.affectedTool,
        count: t._count.id,
      })),
      monthlyTrends: Object.entries(monthlyTrends).map(([month, count]) => ({
        month,
        count,
      })),
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error generating management report:', error)
    return NextResponse.json(
      { error: 'Failed to generate management report' },
      { status: 500 }
    )
  }
}
