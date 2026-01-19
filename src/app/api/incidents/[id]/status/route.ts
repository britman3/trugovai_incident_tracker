import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Valid status transitions
const validTransitions: Record<string, string[]> = {
  Open: ['InProgress', 'Escalated'],
  InProgress: ['Resolved', 'Escalated'],
  Escalated: ['InProgress', 'Resolved'],
  Resolved: ['Closed', 'Reopened'],
  Reopened: ['InProgress', 'Resolved', 'Escalated'],
  Closed: [], // No transitions from Closed
}

// PATCH /api/incidents/:id/status - Update status only
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, updatedBy, resolution, rootCause } = body

    const incident = await prisma.incident.findUnique({
      where: { id },
    })

    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      )
    }

    // Validate status transition
    const allowedTransitions = validTransitions[incident.status]
    if (!allowedTransitions.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${incident.status} to ${status}` },
        { status: 400 }
      )
    }

    // Validate resolution requirement for Resolved status
    if (status === 'Resolved') {
      if (
        (incident.severity === 'Critical' || incident.severity === 'High') &&
        !rootCause &&
        !incident.rootCause
      ) {
        return NextResponse.json(
          { error: 'Root cause is required for Critical/High severity incidents' },
          { status: 400 }
        )
      }
      if (!resolution && !incident.resolution) {
        return NextResponse.json(
          { error: 'Resolution is required to mark incident as resolved' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    }

    // Set acknowledgedAt when moving to InProgress
    if (status === 'InProgress' && !incident.acknowledgedAt) {
      updateData.acknowledgedAt = new Date()
    }

    // Set resolvedAt when moving to Resolved
    if (status === 'Resolved') {
      updateData.resolvedAt = new Date()
      if (resolution) updateData.resolution = resolution
      if (rootCause) updateData.rootCause = rootCause
    }

    // Set closedAt when moving to Closed
    if (status === 'Closed') {
      updateData.closedAt = new Date()
    }

    // Clear resolved/closed timestamps when reopening
    if (status === 'Reopened') {
      updateData.resolvedAt = null
      updateData.closedAt = null
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
    type ActivityActionType = 'StatusChanged' | 'Resolved' | 'Closed' | 'Reopened'
    let action: ActivityActionType = 'StatusChanged'
    if (status === 'Resolved') action = 'Resolved'
    if (status === 'Closed') action = 'Closed'
    if (status === 'Reopened') action = 'Reopened'

    await prisma.activityLogEntry.create({
      data: {
        incidentId: id,
        action: action,
        performedBy: updatedBy || 'System',
        details: `Status changed from ${incident.status} to ${status}`,
        previousValue: incident.status,
        newValue: status,
      },
    })

    return NextResponse.json(updatedIncident)
  } catch (error) {
    console.error('Error updating incident status:', error)
    return NextResponse.json(
      { error: 'Failed to update incident status' },
      { status: 500 }
    )
  }
}
