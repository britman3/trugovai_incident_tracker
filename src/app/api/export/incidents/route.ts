import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type ExportIncident = {
  incidentNumber: string
  title: string
  description: string
  severity: string
  category: string
  status: string
  affectedTool: string
  affectedDepartments: string[]
  dataTypesInvolved: string[]
  reportedBy: string
  reportedByEmail: string
  assignedTo: string | null
  assignedToEmail: string | null
  escalatedTo: string | null
  reportedAt: Date
  acknowledgedAt: Date | null
  resolvedAt: Date | null
  closedAt: Date | null
  rootCause: string | null
  immediateActions: string | null
  resolution: string | null
  preventiveMeasures: string | null
  businessImpact: string | null
  dataSubjectsAffected: number | null
  financialImpact: number | null
  regulatoryNotificationRequired: boolean | null
  regulatoryNotificationDate: Date | null
  tags: string[]
}

// GET /api/export/incidents - Export incidents as CSV
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')?.split(',')
    const severity = searchParams.get('severity')?.split(',')
    const category = searchParams.get('category')?.split(',')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const where: Record<string, unknown> = {}

    if (status && status.length > 0 && status[0] !== '') {
      where.status = { in: status }
    }

    if (severity && severity.length > 0 && severity[0] !== '') {
      where.severity = { in: severity }
    }

    if (category && category.length > 0 && category[0] !== '') {
      where.category = { in: category }
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

    const incidents = await prisma.incident.findMany({
      where,
      orderBy: { reportedAt: 'desc' },
    })

    // Create CSV content
    const headers = [
      'Incident Number',
      'Title',
      'Description',
      'Severity',
      'Category',
      'Status',
      'Affected Tool',
      'Affected Departments',
      'Data Types Involved',
      'Reported By',
      'Reported By Email',
      'Assigned To',
      'Assigned To Email',
      'Escalated To',
      'Reported At',
      'Acknowledged At',
      'Resolved At',
      'Closed At',
      'Root Cause',
      'Immediate Actions',
      'Resolution',
      'Preventive Measures',
      'Business Impact',
      'Data Subjects Affected',
      'Financial Impact',
      'Regulatory Notification Required',
      'Regulatory Notification Date',
      'Tags',
    ]

    const escapeCSV = (value: string | number | boolean | null | undefined): string => {
      if (value === null || value === undefined) return ''
      const str = String(value)
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const rows = incidents.map((incident: ExportIncident) => [
      incident.incidentNumber,
      incident.title,
      incident.description,
      incident.severity,
      incident.category,
      incident.status,
      incident.affectedTool,
      incident.affectedDepartments.join('; '),
      incident.dataTypesInvolved.join('; '),
      incident.reportedBy,
      incident.reportedByEmail,
      incident.assignedTo,
      incident.assignedToEmail,
      incident.escalatedTo,
      incident.reportedAt?.toISOString(),
      incident.acknowledgedAt?.toISOString(),
      incident.resolvedAt?.toISOString(),
      incident.closedAt?.toISOString(),
      incident.rootCause,
      incident.immediateActions,
      incident.resolution,
      incident.preventiveMeasures,
      incident.businessImpact,
      incident.dataSubjectsAffected,
      incident.financialImpact,
      incident.regulatoryNotificationRequired,
      incident.regulatoryNotificationDate?.toISOString(),
      incident.tags.join('; '),
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row: (string | number | boolean | null | undefined)[]) => row.map(escapeCSV).join(',')),
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="incidents-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error('Error exporting incidents:', error)
    return NextResponse.json(
      { error: 'Failed to export incidents' },
      { status: 500 }
    )
  }
}
