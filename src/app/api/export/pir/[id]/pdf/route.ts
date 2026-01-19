import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/export/pir/:id/pdf - Export PIR as PDF data
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
            description: true,
            severity: true,
            category: true,
            affectedTool: true,
            reportedAt: true,
            resolvedAt: true,
            rootCause: true,
            resolution: true,
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

    // Return PIR data for client-side PDF generation
    return NextResponse.json({
      pir,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error fetching PIR for PDF:', error)
    return NextResponse.json(
      { error: 'Failed to fetch PIR for PDF' },
      { status: 500 }
    )
  }
}
