import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/incidents/:id/activity - Get activity log for incident
export async function GET(
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

    const activityLog = await prisma.activityLogEntry.findMany({
      where: { incidentId: id },
      orderBy: { timestamp: 'desc' },
    })

    return NextResponse.json(activityLog)
  } catch (error) {
    console.error('Error fetching activity log:', error)
    return NextResponse.json(
      { error: 'Failed to fetch activity log' },
      { status: 500 }
    )
  }
}
