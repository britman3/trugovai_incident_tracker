import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/export/incident/:id/pdf - Export single incident as PDF data
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
      },
    })

    if (!incident) {
      return NextResponse.json(
        { error: 'Incident not found' },
        { status: 404 }
      )
    }

    // Return incident data for client-side PDF generation
    return NextResponse.json({
      incident,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching incident for PDF:', error)
    return NextResponse.json(
      { error: 'Failed to fetch incident for PDF' },
      { status: 500 }
    )
  }
}
