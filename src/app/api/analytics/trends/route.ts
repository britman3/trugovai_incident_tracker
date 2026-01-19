import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type TrendIncident = {
  reportedAt: Date
  category: string
  severity: string
}

type ResolvedIncident = {
  reportedAt: Date
  resolvedAt: Date | null
}

type CategoryGroup = {
  category: string
  _count: { id: number }
}

type SeverityGroup = {
  severity: string
  _count: { id: number }
}

// GET /api/analytics/trends - Incident trends over time
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const category = searchParams.get('category')
    const severity = searchParams.get('severity')

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

    if (category) {
      where.category = category
    }

    if (severity) {
      where.severity = severity
    }

    // Get all incidents matching filters
    const incidents = await prisma.incident.findMany({
      where,
      select: {
        reportedAt: true,
        category: true,
        severity: true,
      },
      orderBy: { reportedAt: 'asc' },
    })

    // Group by month
    const monthlyData: Record<string, { total: number; byCategory: Record<string, number> }> = {}

    incidents.forEach((incident: TrendIncident) => {
      const date = new Date(incident.reportedAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!monthlyData[key]) {
        monthlyData[key] = { total: 0, byCategory: {} }
      }

      monthlyData[key].total++

      const cat = incident.category
      if (!monthlyData[key].byCategory[cat]) {
        monthlyData[key].byCategory[cat] = 0
      }
      monthlyData[key].byCategory[cat]++
    })

    const trends = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        total: data.total,
        ...data.byCategory,
      }))

    // Category breakdown
    const categoryBreakdown = await prisma.incident.groupBy({
      by: ['category'],
      where,
      _count: { id: true },
    })

    // Severity breakdown
    const severityBreakdown = await prisma.incident.groupBy({
      by: ['severity'],
      where,
      _count: { id: true },
    })

    // MTTR trend by month
    const resolvedIncidents = await prisma.incident.findMany({
      where: {
        ...where,
        resolvedAt: { not: null },
      },
      select: {
        reportedAt: true,
        resolvedAt: true,
      },
    })

    const mttrByMonth: Record<string, { total: number; count: number }> = {}

    resolvedIncidents.forEach((incident: ResolvedIncident) => {
      const date = new Date(incident.reportedAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      const hours =
        (new Date(incident.resolvedAt!).getTime() - new Date(incident.reportedAt).getTime()) /
        (1000 * 60 * 60)

      if (!mttrByMonth[key]) {
        mttrByMonth[key] = { total: 0, count: 0 }
      }

      mttrByMonth[key].total += hours
      mttrByMonth[key].count++
    })

    const mttrTrend = Object.entries(mttrByMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        mttr: Math.round(data.total / data.count),
      }))

    return NextResponse.json({
      trends,
      categoryBreakdown: categoryBreakdown.map((c: CategoryGroup) => ({
        category: c.category,
        count: c._count.id,
      })),
      severityBreakdown: severityBreakdown.map((s: SeverityGroup) => ({
        severity: s.severity,
        count: s._count.id,
      })),
      mttrTrend,
    })
  } catch (error) {
    console.error('Error fetching analytics trends:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics trends' },
      { status: 500 }
    )
  }
}
