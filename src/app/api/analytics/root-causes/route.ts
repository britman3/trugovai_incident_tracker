import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type IncidentRootCause = {
  rootCause: string | null
  category: string
  severity: string
}

// GET /api/analytics/root-causes - Root cause analysis
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: Record<string, unknown> = {
      rootCause: { not: null },
    }

    if (dateFrom || dateTo) {
      where.reportedAt = {}
      if (dateFrom) {
        (where.reportedAt as Record<string, Date>).gte = new Date(dateFrom)
      }
      if (dateTo) {
        (where.reportedAt as Record<string, Date>).lte = new Date(dateTo)
      }
    }

    // Get all incidents with root causes
    const incidents = await prisma.incident.findMany({
      where,
      select: {
        rootCause: true,
        category: true,
        severity: true,
      },
    })

    // Extract common keywords from root causes
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during',
      'before', 'after', 'above', 'below', 'is', 'are', 'was', 'were', 'be',
      'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can',
      'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we',
      'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all',
      'each', 'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such',
      'no', 'not', 'only', 'same', 'so', 'than', 'too', 'very', 'just', 'also',
    ])

    const wordFrequency: Record<string, number> = {}

    incidents.forEach((incident: IncidentRootCause) => {
      if (incident.rootCause) {
        const words = incident.rootCause
          .toLowerCase()
          .replace(/[^a-zA-Z\s]/g, '')
          .split(/\s+/)
          .filter((word: string) => word.length > 2 && !stopWords.has(word))

        words.forEach((word: string) => {
          wordFrequency[word] = (wordFrequency[word] || 0) + 1
        })
      }
    })

    // Get top keywords
    const topKeywords = Object.entries(wordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([word, count]) => ({ word, count }))

    // Common themes (simplified categorisation based on keywords)
    const themes: Record<string, { count: number; keywords: string[] }> = {
      'Lack of Training': { count: 0, keywords: ['training', 'awareness', 'education', 'knowledge', 'understanding'] },
      'Policy Gap': { count: 0, keywords: ['policy', 'guideline', 'procedure', 'process', 'rule'] },
      'Human Error': { count: 0, keywords: ['mistake', 'error', 'oversight', 'forgotten', 'missed'] },
      'Tool Limitation': { count: 0, keywords: ['tool', 'system', 'software', 'limitation', 'bug'] },
      'Communication': { count: 0, keywords: ['communication', 'unclear', 'misunderstanding', 'confusion'] },
      'Access Control': { count: 0, keywords: ['access', 'permission', 'authorisation', 'credential'] },
    }

    incidents.forEach((incident: IncidentRootCause) => {
      if (incident.rootCause) {
        const rootCauseLower = incident.rootCause.toLowerCase()

        Object.entries(themes).forEach(([theme, data]) => {
          if (data.keywords.some((keyword: string) => rootCauseLower.includes(keyword))) {
            themes[theme].count++
          }
        })
      }
    })

    const themeBreakdown = Object.entries(themes)
      .map(([theme, data]) => ({ theme, count: data.count }))
      .filter((t) => t.count > 0)
      .sort((a, b) => b.count - a.count)

    // Root causes by category
    const rootCausesByCategory: Record<string, string[]> = {}

    incidents.forEach((incident: IncidentRootCause) => {
      if (incident.rootCause) {
        if (!rootCausesByCategory[incident.category]) {
          rootCausesByCategory[incident.category] = []
        }
        rootCausesByCategory[incident.category].push(incident.rootCause)
      }
    })

    const categoryRootCauses = Object.entries(rootCausesByCategory).map(([category, causes]) => ({
      category,
      count: causes.length,
      examples: causes.slice(0, 3),
    }))

    return NextResponse.json({
      totalWithRootCause: incidents.length,
      topKeywords,
      themeBreakdown,
      categoryRootCauses,
    })
  } catch (error) {
    console.error('Error fetching root cause analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch root cause analytics' },
      { status: 500 }
    )
  }
}
