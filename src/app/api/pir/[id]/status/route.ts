import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Valid PIR status transitions
const validTransitions: Record<string, string[]> = {
  Draft: ['InReview'],
  InReview: ['Draft', 'Approved'],
  Approved: [], // No transitions from Approved
}

// PATCH /api/pir/:id/status - Change PIR status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { status, updatedBy } = body

    const pir = await prisma.postIncidentReview.findUnique({
      where: { id },
    })

    if (!pir) {
      return NextResponse.json(
        { error: 'PIR not found' },
        { status: 404 }
      )
    }

    // Validate status transition
    const allowedTransitions = validTransitions[pir.status]
    if (!allowedTransitions.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${pir.status} to ${status}` },
        { status: 400 }
      )
    }

    const updatedPir = await prisma.postIncidentReview.update({
      where: { id },
      data: {
        status,
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

    // Add activity log entry
    if (pir.incidentId) {
      await prisma.activityLogEntry.create({
        data: {
          incidentId: pir.incidentId,
          action: 'Updated',
          performedBy: updatedBy || 'System',
          details: `PIR status changed from ${pir.status} to ${status}`,
        },
      })
    }

    return NextResponse.json(updatedPir)
  } catch (error) {
    console.error('Error updating PIR status:', error)
    return NextResponse.json(
      { error: 'Failed to update PIR status' },
      { status: 500 }
    )
  }
}
