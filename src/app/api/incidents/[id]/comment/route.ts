import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/incidents/:id/comment - Add comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { comment, commentBy } = body

    if (!comment || comment.length < 1 || comment.length > 2000) {
      return NextResponse.json(
        { error: 'Comment must be between 1 and 2000 characters' },
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

    // Create activity log entry for comment
    const activityEntry = await prisma.activityLogEntry.create({
      data: {
        incidentId: id,
        action: 'CommentAdded',
        performedBy: commentBy || 'Anonymous',
        details: comment,
      },
    })

    // Update incident's updatedAt
    await prisma.incident.update({
      where: { id },
      data: { updatedAt: new Date() },
    })

    return NextResponse.json(activityEntry, { status: 201 })
  } catch (error) {
    console.error('Error adding comment:', error)
    return NextResponse.json(
      { error: 'Failed to add comment' },
      { status: 500 }
    )
  }
}
