import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/incidents/:id - Get single incident with full details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const incident = await prisma.incident.findUnique({
      where: { id },
      include: {
        attachments: true,
        activityLog: {
          orderBy: { timestamp: 'desc' },
        },
        pir: {
          include: {
            actionItems: true,
          },
        },
        relatedIncidents: {
          include: {
            to: {
              select: {
                id: true,
                incidentNumber: true,
                title: true,
                status: true,
                severity: true,
              },
            },
          },
        },
        relatedTo: {
          include: {
            from: {
              select: {
                id: true,
                incidentNumber: true,
                title: true,
                status: true,
                severity: true,
              },
            },
          },
        },
      },
    })

    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(incident)
  } catch (error) {
    console.error('Error fetching incident:', error)
    return NextResponse.json(
      { error: 'Failed to fetch incident' },
      { status: 500 }
    )
  }
}

// PUT /api/incidents/:id - Update incident
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { updatedBy, ...updates } = body

    const existingIncident = await prisma.incident.findUnique({
      where: { id },
    })

    if (!existingIncident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      )
    }

    // Validate title if provided
    if (updates.title && (updates.title.length < 5 || updates.title.length > 100)) {
      return NextResponse.json(
        { error: 'Title must be between 5 and 100 characters' },
        { status: 400 }
      )
    }

    // Validate description if provided
    if (updates.description && (updates.description.length < 20 || updates.description.length > 5000)) {
      return NextResponse.json(
        { error: 'Description must be between 20 and 5000 characters' },
        { status: 400 }
      )
    }

    // Validate resolution requirement for Critical/High on resolution
    if (updates.status === 'Resolved') {
      if (
        (existingIncident.severity === 'Critical' || existingIncident.severity === 'High') &&
        !updates.rootCause &&
        !existingIncident.rootCause
      ) {
        return NextResponse.json(
          { error: 'Root cause is required for Critical/High severity incidents' },
          { status: 400 }
        )
      }
      if (!updates.resolution && !existingIncident.resolution) {
        return NextResponse.json(
          { error: 'Resolution is required to mark incident as resolved' },
          { status: 400 }
        )
      }
    }

    const incident = await prisma.incident.update({
      where: { id },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
      include: {
        attachments: true,
        activityLog: {
          orderBy: { timestamp: 'desc' },
        },
      },
    })

    // Create activity log entry
    const changes = Object.keys(updates).filter(
      (key) => updates[key] !== existingIncident[key as keyof typeof existingIncident]
    )

    if (changes.length > 0) {
      await prisma.activityLogEntry.create({
        data: {
          incidentId: id,
          action: 'Updated',
          performedBy: updatedBy || 'System',
          details: `Updated: ${changes.join(', ')}`,
        },
      })
    }

    return NextResponse.json(incident)
  } catch (error) {
    console.error('Error updating incident:', error)
    return NextResponse.json(
      { error: 'Failed to update incident' },
      { status: 500 }
    )
  }
}

// DELETE /api/incidents/:id - Delete incident (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const incident = await prisma.incident.findUnique({
      where: { id },
    })

    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      )
    }

    await prisma.incident.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting incident:', error)
    return NextResponse.json(
      { error: 'Failed to delete incident' },
      { status: 500 }
    )
  }
}
