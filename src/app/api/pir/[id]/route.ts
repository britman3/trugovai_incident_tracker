import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/pir/:id - Get single PIR
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const pir = await prisma.postIncidentReview.findUnique({
      where: { id },
      include: {
        incident: {
          select: {
            id: true,
            incidentNumber: true,
            title: true,
            severity: true,
            category: true,
            description: true,
            rootCause: true,
            resolution: true,
            affectedTool: true,
            reportedAt: true,
            resolvedAt: true,
          },
        },
        actionItems: {
          orderBy: { dueDate: 'asc' },
        },
      },
    })

    if (!pir) {
      return NextResponse.json(
        { error: 'PIR not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(pir)
  } catch (error) {
    console.error('Error fetching PIR:', error)
    return NextResponse.json(
      { error: 'Failed to fetch PIR' },
      { status: 500 }
    )
  }
}

// PUT /api/pir/:id - Update PIR
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { updatedBy, actionItems, ...updates } = body

    const pir = await prisma.postIncidentReview.findUnique({
      where: { id },
      include: { actionItems: true },
    })

    if (!pir) {
      return NextResponse.json(
        { error: 'PIR not found' },
        { status: 404 }
      )
    }

    // Update PIR
    const updatedPir = await prisma.postIncidentReview.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
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

    // Handle action items if provided
    if (actionItems) {
      // Delete existing action items
      await prisma.pIRActionItem.deleteMany({
        where: { pirId: id },
      })

      // Create new action items
      await prisma.pIRActionItem.createMany({
        data: actionItems.map((item: {
          title: string
          description: string
          assignedTo: string
          dueDate: string
          status?: string
          completedAt?: string
        }) => ({
          pirId: id,
          title: item.title,
          description: item.description,
          assignedTo: item.assignedTo,
          dueDate: new Date(item.dueDate),
          status: item.status || 'Pending',
          completedAt: item.completedAt ? new Date(item.completedAt) : null,
        })),
      })
    }

    // Add activity log entry
    if (pir.incidentId) {
      await prisma.activityLogEntry.create({
        data: {
          incidentId: pir.incidentId,
          action: 'Updated',
          performedBy: updatedBy || 'System',
          details: 'Post-Incident Review updated',
        },
      })
    }

    return NextResponse.json(updatedPir)
  } catch (error) {
    console.error('Error updating PIR:', error)
    return NextResponse.json(
      { error: 'Failed to update PIR' },
      { status: 500 }
    )
  }
}
