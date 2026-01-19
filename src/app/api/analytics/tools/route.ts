import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type ToolGroup = {
  affectedTool: string
  _count: { id: number }
}

type ToolIncident = {
  severity: string
  category: string
  reportedAt: Date
}

type ToolTrendIncident = {
  affectedTool: string
  reportedAt: Date
}

// GET /api/analytics/tools - Incidents by tool analysis
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

    // Incidents per tool
    const toolIncidents = await prisma.incident.groupBy({
      by: ['affectedTool'],
      where,
      _count: { id: true },
      orderBy: {
        _count: { id: 'desc' },
      },
    })

    // Get details for each tool
    const toolDetails = await Promise.all(
      toolIncidents.map(async (tool: ToolGroup) => {
        const incidents = await prisma.incident.findMany({
          where: {
            ...where,
            affectedTool: tool.affectedTool,
          },
          select: {
            severity: true,
            category: true,
            reportedAt: true,
          },
        })

        const severityBreakdown: Record<string, number> = {
          Critical: 0,
          High: 0,
          Medium: 0,
          Low: 0,
        }

        const categoryBreakdown: Record<string, number> = {}

        incidents.forEach((incident: ToolIncident) => {
          severityBreakdown[incident.severity]++
          categoryBreakdown[incident.category] = (categoryBreakdown[incident.category] || 0) + 1
        })

        const lastIncident = incidents.length > 0
          ? incidents.reduce((latest: ToolIncident, current: ToolIncident) =>
              new Date(current.reportedAt) > new Date(latest.reportedAt) ? current : latest
            ).reportedAt
          : null

        return {
          tool: tool.affectedTool,
          count: tool._count.id,
          severityBreakdown,
          categoryBreakdown: Object.entries(categoryBreakdown)
            .map(([category, count]) => ({ category, count }))
            .sort((a, b) => b.count - a.count),
          lastIncident,
        }
      })
    )

    // Tool trends (incidents per month per tool for top 5 tools)
    const topTools = toolIncidents.slice(0, 5).map((t: ToolGroup) => t.affectedTool)

    const toolTrendsIncidents = await prisma.incident.findMany({
      where: {
        ...where,
        affectedTool: { in: topTools },
      },
      select: {
        affectedTool: true,
        reportedAt: true,
      },
    })

    const toolTrends: Record<string, Record<string, number>> = {}
    topTools.forEach((tool: string) => {
      toolTrends[tool] = {}
    })

    toolTrendsIncidents.forEach((incident: ToolTrendIncident) => {
      const date = new Date(incident.reportedAt)
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      if (!toolTrends[incident.affectedTool][month]) {
        toolTrends[incident.affectedTool][month] = 0
      }
      toolTrends[incident.affectedTool][month]++
    })

    // Get all unique months and sort
    const allMonths = new Set<string>()
    Object.values(toolTrends).forEach((data: Record<string, number>) => {
      Object.keys(data).forEach((month: string) => allMonths.add(month))
    })

    const sortedMonths = Array.from(allMonths).sort()

    const toolTrendsData = sortedMonths.map((month: string) => {
      const dataPoint: Record<string, string | number> = { month }
      topTools.forEach((tool: string) => {
        dataPoint[tool] = toolTrends[tool][month] || 0
      })
      return dataPoint
    })

    return NextResponse.json({
      toolBreakdown: toolDetails,
      toolTrends: toolTrendsData,
      topTools,
    })
  } catch (error) {
    console.error('Error fetching tool analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tool analytics' },
      { status: 500 }
    )
  }
}
