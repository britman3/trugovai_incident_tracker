import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/incidents/:id/assign - Assign/reassign incident
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { assignedTo, assignedToEmail, updatedBy } = body

    const incident = await prisma.incident.findUnique({
      where: { id },
    })

    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      )
    }

    const previousAssignee = incident.assignedTo

    const updateData: Record<string, unknown> = {
      assignedTo,
      assignedToEmail,
      updatedAt: new Date(),
    }

    // Set acknowledgedAt if not already set
    if (!incident.acknowledgedAt && assignedTo) {
      updateData.acknowledgedAt = new Date()
    }

    // Move to InProgress if currently Open
    if (incident.status === 'Open' && assignedTo) {
      updateData.status = 'InProgress'
    }

    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: updateData,
      include: {
        attachments: true,
        activityLog: {
          orderBy: { timestamp: 'desc' },
        },
      },
    })

    // Create activity log entry
    await prisma.activityLogEntry.create({
      data: {
        incidentId: id,
        action: 'Assigned',
        performedBy: updatedBy || 'System',
        details: previousAssignee
          ? `Reassigned from ${previousAssignee} to ${assignedTo}`
          : `Assigned to ${assignedTo}`,
        previousValue: previousAssignee || undefined,
        newValue: assignedTo,
      },
    })

    // If status changed, add another entry
    if (incident.status === 'Open' && assignedTo) {
      await prisma.activityLogEntry.create({
        data: {
          incidentId: id,
          action: 'StatusChanged',
          performedBy: updatedBy || 'System',
          details: 'Status changed from Open to In Progress',
          previousValue: 'Open',
          newValue: 'InProgress',
        },
      })
    }

    return NextResponse.json(updatedIncident)
  } catch (error) {
    console.error('Error assigning incident:', error)
    return NextResponse.json(
      { error: 'Failed to assign incident' },
      { status: 500 }
    )
  }
}
