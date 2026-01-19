import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/incidents - List all incidents with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')?.split(',')
    const severity = searchParams.get('severity')?.split(',')
    const category = searchParams.get('category')?.split(',')
    const assignedTo = searchParams.get('assignedTo')
    const affectedTool = searchParams.get('affectedTool')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'reportedAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

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

    if (assignedTo) {
      where.assignedTo = assignedTo
    }

    if (affectedTool) {
      where.affectedTool = { contains: affectedTool, mode: 'insensitive' }
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

    if (search) {
      where.OR = [
        { incidentNumber: { contains: search, mode: 'insensitive' } },
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    const [incidents, total] = await Promise.all([
      prisma.incident.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          attachments: true,
          activityLog: {
            orderBy: { timestamp: 'desc' },
            take: 5,
          },
        },
      }),
      prisma.incident.count({ where }),
    ])

    return NextResponse.json({
      incidents,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching incidents:', error)
    return NextResponse.json(
      { error: 'Failed to fetch incidents' },
      { status: 500 }
    )
  }
}

// POST /api/incidents - Create new incident
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      title,
      description,
      category,
      severity,
      affectedTool,
      affectedToolId,
      affectedDepartments,
      dataTypesInvolved,
      reportedBy,
      reportedByEmail,
      tags,
      assignToMe,
    } = body

    // Validate required fields
    if (!title || title.length < 5 || title.length > 100) {
      return NextResponse.json(
        { error: 'Title must be between 5 and 100 characters' },
        { status: 400 }
      )
    }

    if (!description || description.length < 20 || description.length > 5000) {
      return NextResponse.json(
        { error: 'Description must be between 20 and 5000 characters' },
        { status: 400 }
      )
    }

    if (!category) {
      return NextResponse.json(
        { error: 'Category is required' },
        { status: 400 }
      )
    }

    if (!severity) {
      return NextResponse.json(
        { error: 'Severity is required' },
        { status: 400 }
      )
    }

    if (!affectedTool) {
      return NextResponse.json(
        { error: 'Affected tool is required' },
        { status: 400 }
      )
    }

    if (!dataTypesInvolved || dataTypesInvolved.length === 0) {
      return NextResponse.json(
        { error: 'At least one data type must be selected' },
        { status: 400 }
      )
    }

    // Get or create organisation (single-org context for v1)
    let organisation = await prisma.organisation.findFirst()
    if (!organisation) {
      organisation = await prisma.organisation.create({
        data: { name: 'Default Organisation' },
      })
    }

    // Generate incident number
    const year = new Date().getFullYear()
    const counter = await prisma.incidentCounter.upsert({
      where: { year },
      update: { count: { increment: 1 } },
      create: { year, count: 1 },
    })
    const incidentNumber = `INC-${year}-${counter.count.toString().padStart(4, '0')}`

    // Create incident
    const incident = await prisma.incident.create({
      data: {
        incidentNumber,
        organisationId: organisation.id,
        title,
        description,
        category,
        severity,
        affectedTool,
        affectedToolId,
        affectedDepartments: affectedDepartments || [],
        dataTypesInvolved,
        reportedBy,
        reportedByEmail,
        assignedTo: assignToMe ? reportedBy : null,
        assignedToEmail: assignToMe ? reportedByEmail : null,
        acknowledgedAt: assignToMe ? new Date() : null,
        status: assignToMe ? 'InProgress' : 'Open',
        tags: tags || [],
      },
      include: {
        attachments: true,
        activityLog: true,
      },
    })

    // Create activity log entry
    await prisma.activityLogEntry.create({
      data: {
        incidentId: incident.id,
        action: 'Created',
        performedBy: reportedBy,
        details: `Incident ${incidentNumber} created`,
      },
    })

    if (assignToMe) {
      await prisma.activityLogEntry.create({
        data: {
          incidentId: incident.id,
          action: 'Assigned',
          performedBy: reportedBy,
          details: `Assigned to ${reportedBy}`,
          newValue: reportedBy,
        },
      })
    }

    return NextResponse.json(incident, { status: 201 })
  } catch (error) {
    console.error('Error creating incident:', error)
    return NextResponse.json(
      { error: 'Failed to create incident' },
      { status: 500 }
    )
  }
}
