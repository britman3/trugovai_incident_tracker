import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/pir/:id/action-items/:itemId - Update action item
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    const body = await request.json()
    const { status, title, description, assignedTo, dueDate } = body

    const actionItem = await prisma.pIRActionItem.findFirst({
      where: {
        id: itemId,
        pirId: id,
      },
    })

    if (!actionItem) {
      return NextResponse.json(
        { error: 'Action item not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (status !== undefined) {
      updateData.status = status
      if (status === 'Completed') {
        updateData.completedAt = new Date()
      } else {
        updateData.completedAt = null
      }
    }

    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (assignedTo !== undefined) updateData.assignedTo = assignedTo
    if (dueDate !== undefined) updateData.dueDate = new Date(dueDate)

    const updatedItem = await prisma.pIRActionItem.update({
      where: { id: itemId },
      data: updateData,
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating action item:', error)
    return NextResponse.json(
      { error: 'Failed to update action item' },
      { status: 500 }
    )
  }
}

// DELETE /api/pir/:id/action-items/:itemId - Delete action item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params

    const actionItem = await prisma.pIRActionItem.findFirst({
      where: {
        id: itemId,
        pirId: id,
      },
    })

    if (!actionItem) {
      return NextResponse.json(
        { error: 'Action item not found' },
        { status: 404 }
      )
    }

    await prisma.pIRActionItem.delete({
      where: { id: itemId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting action item:', error)
    return NextResponse.json(
      { error: 'Failed to delete action item' },
      { status: 500 }
    )
  }
}
