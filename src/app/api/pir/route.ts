import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/pir - List all PIRs
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const incidentId = searchParams.get('incidentId')

    const where: Record<string, unknown> = {}

    if (status) {
      where.status = status
    }

    if (incidentId) {
      where.incidentId = incidentId
    }

    const pirs = await prisma.postIncidentReview.findMany({
      where,
      include: {
        incident: {
          select: {
            id: true,
            incidentNumber: true,
            title: true,
            severity: true,
            category: true,
          },
        },
        actionItems: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(pirs)
  } catch (error) {
    console.error('Error fetching PIRs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch PIRs' },
      { status: 500 }
    )
  }
}

// POST /api/pir - Create PIR for incident
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      incidentId,
      conductedBy,
      whatHappened,
      whyItHappened,
      whatWentWell,
      whatCouldImprove,
      lessonsLearned,
      policyChangesNeeded,
      trainingNeeded,
      actionItems,
    } = body

    // Check if incident exists and is Resolved or Closed
    const incident = await prisma.incident.findUnique({
      where: { id: incidentId },
    })

    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      )
    }

    if (!['Resolved', 'Closed'].includes(incident.status)) {
      return NextResponse.json(
        { error: 'PIR can only be created for resolved or closed incidents' },
        { status: 400 }
      )
    }

    // Check if PIR already exists for this incident
    const existingPir = await prisma.postIncidentReview.findUnique({
      where: { incidentId },
    })

    if (existingPir) {
      return NextResponse.json(
        { error: 'PIR already exists for this incident' },
        { status: 400 }
      )
    }

    // Create PIR with action items
    const pir = await prisma.postIncidentReview.create({
      data: {
        incidentId,
        conductedBy,
        whatHappened: whatHappened || incident.description,
        whyItHappened: whyItHappened || incident.rootCause || '',
        whatWentWell: whatWentWell || '',
        whatCouldImprove: whatCouldImprove || '',
        lessonsLearned: lessonsLearned || '',
        policyChangesNeeded: policyChangesNeeded || false,
        trainingNeeded: trainingNeeded || false,
        actionItems: actionItems
          ? {
              create: actionItems.map((item: {
                title: string
                description: string
                assignedTo: string
                dueDate: string
              }) => ({
                title: item.title,
                description: item.description,
                assignedTo: item.assignedTo,
                dueDate: new Date(item.dueDate),
              })),
            }
          : undefined,
      },
      include: {
        incident: {
          select: {
            id: true,
            incidentNumber: true,
            title: true,
          },
        },
        actionItems: true,
      },
    })

    // Add activity log entry
    await prisma.activityLogEntry.create({
      data: {
        incidentId,
        action: 'Updated',
        performedBy: conductedBy,
        details: 'Post-Incident Review created',
      },
    })

    return NextResponse.json(pir, { status: 201 })
  } catch (error) {
    console.error('Error creating PIR:', error)
    return NextResponse.json(
      { error: 'Failed to create PIR' },
      { status: 500 }
    )
  }
}
