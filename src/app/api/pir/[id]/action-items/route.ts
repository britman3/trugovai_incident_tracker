import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type ActionItem = {
  id: string
  pirId: string
  title: string
  description: string | null
  assignedTo: string
  dueDate: Date
  status: string
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

// GET /api/pir/:id/action-items - Get action items for PIR
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const pir = await prisma.postIncidentReview.findUnique({
      where: { id },
    })

    if (!pir) {
      return NextResponse.json(
        { error: 'PIR not found' },
        { status: 404 }
      )
    }

    const actionItems = await prisma.pIRActionItem.findMany({
      where: { pirId: id },
      orderBy: { dueDate: 'asc' },
    })

    // Update overdue status
    const now = new Date()
    const updatedItems = actionItems.map((item: ActionItem) => {
      if (
        item.status !== 'Completed' &&
        new Date(item.dueDate) < now
      ) {
        return { ...item, status: 'Overdue' }
      }
      return item
    })

    return NextResponse.json(updatedItems)
  } catch (error) {
    console.error('Error fetching action items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch action items' },
      { status: 500 }
    )
  }
}

// POST /api/pir/:id/action-items - Add action item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { title, description, assignedTo, dueDate } = body

    const pir = await prisma.postIncidentReview.findUnique({
      where: { id },
    })

    if (!pir) {
      return NextResponse.json(
        { error: 'PIR not found' },
        { status: 404 }
      )
    }

    const actionItem = await prisma.pIRActionItem.create({
      data: {
        pirId: id,
        title,
        description,
        assignedTo,
        dueDate: new Date(dueDate),
      },
    })

    return NextResponse.json(actionItem, { status: 201 })
  } catch (error) {
    console.error('Error creating action item:', error)
    return NextResponse.json(
      { error: 'Failed to create action item' },
      { status: 500 }
    )
  }
}
