import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/incidents/:id/escalate - Escalate incident
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { escalateTo, escalationReason, requestedActions, escalatedBy } = body

    if (!escalateTo) {
      return NextResponse.json(
        { error: 'Escalation target is required' },
        { status: 400 }
      )
    }

    if (!escalationReason) {
      return NextResponse.json(
        { error: 'Escalation reason is required' },
        { status: 400 }
      )
    }

    const incident = await prisma.incident.findUnique({
      where: { id },
    })

    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      )
    }

    // Can only escalate from Open, InProgress, or Reopened
    if (!['Open', 'InProgress', 'Reopened'].includes(incident.status)) {
      return NextResponse.json(
        { error: `Cannot escalate incident with status ${incident.status}` },
        { status: 400 }
      )
    }

    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: {
        status: 'Escalated',
        escalatedTo: escalateTo,
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
    await prisma.activityLogEntry.create({
      data: {
        incidentId: id,
        action: 'Escalated',
        performedBy: escalatedBy || 'System',
        details: `Escalated to ${escalateTo}. Reason: ${escalationReason}${requestedActions ? `. Actions requested: ${requestedActions}` : ''}`,
        previousValue: incident.status,
        newValue: 'Escalated',
      },
    })

    return NextResponse.json(updatedIncident)
  } catch (error) {
    console.error('Error escalating incident:', error)
    return NextResponse.json(
      { error: 'Failed to escalate incident' },
      { status: 500 }
    )
  }
}
