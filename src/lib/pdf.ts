// PDF generation utilities using jsPDF
// Note: This is a client-side module for PDF generation

export async function generateIncidentPDF(incidentId: string) {
  try {
    // Dynamically import jsPDF on client side
    const { jsPDF } = await import('jspdf')

    // Fetch incident data
    const res = await fetch(`/api/export/incident/${incidentId}/pdf`)
    if (!res.ok) throw new Error('Failed to fetch incident data')
    const { incident, generatedAt } = await res.json()

    // Create PDF
    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.setTextColor(15, 42, 58) // Navy
    doc.text('TruGovAI™ AI Incident Report', 20, 20)

    doc.setFontSize(10)
    doc.setTextColor(76, 93, 107) // Slate
    doc.text(`Generated: ${new Date(generatedAt).toLocaleString()}`, 20, 28)

    // Incident Number and Title
    doc.setFontSize(14)
    doc.setTextColor(26, 167, 161) // Teal
    doc.text(incident.incidentNumber, 20, 45)

    doc.setFontSize(16)
    doc.setTextColor(15, 42, 58)
    doc.text(incident.title, 20, 55)

    // Status badges
    doc.setFontSize(10)
    doc.text(`Severity: ${incident.severity}`, 20, 65)
    doc.text(`Status: ${incident.status}`, 70, 65)
    doc.text(`Category: ${incident.category}`, 120, 65)

    // Details
    let y = 80

    doc.setFontSize(12)
    doc.setTextColor(15, 42, 58)
    doc.text('Description', 20, y)
    y += 7

    doc.setFontSize(10)
    doc.setTextColor(76, 93, 107)
    const descLines = doc.splitTextToSize(incident.description, 170)
    doc.text(descLines, 20, y)
    y += descLines.length * 5 + 10

    // Context
    doc.setFontSize(12)
    doc.setTextColor(15, 42, 58)
    doc.text('Context', 20, y)
    y += 7

    doc.setFontSize(10)
    doc.setTextColor(76, 93, 107)
    doc.text(`Affected Tool: ${incident.affectedTool}`, 20, y)
    y += 5
    doc.text(`Departments: ${incident.affectedDepartments?.join(', ') || 'N/A'}`, 20, y)
    y += 5
    doc.text(`Data Types: ${incident.dataTypesInvolved?.join(', ') || 'N/A'}`, 20, y)
    y += 10

    // Timeline
    doc.setFontSize(12)
    doc.setTextColor(15, 42, 58)
    doc.text('Timeline', 20, y)
    y += 7

    doc.setFontSize(10)
    doc.setTextColor(76, 93, 107)
    doc.text(`Reported: ${new Date(incident.reportedAt).toLocaleString()}`, 20, y)
    y += 5
    if (incident.acknowledgedAt) {
      doc.text(`Acknowledged: ${new Date(incident.acknowledgedAt).toLocaleString()}`, 20, y)
      y += 5
    }
    if (incident.resolvedAt) {
      doc.text(`Resolved: ${new Date(incident.resolvedAt).toLocaleString()}`, 20, y)
      y += 5
    }
    y += 5

    // People
    doc.setFontSize(12)
    doc.setTextColor(15, 42, 58)
    doc.text('People', 20, y)
    y += 7

    doc.setFontSize(10)
    doc.setTextColor(76, 93, 107)
    doc.text(`Reported By: ${incident.reportedBy}`, 20, y)
    y += 5
    if (incident.assignedTo) {
      doc.text(`Assigned To: ${incident.assignedTo}`, 20, y)
      y += 5
    }
    y += 5

    // Response (if available)
    if (incident.rootCause || incident.resolution) {
      // Check if we need a new page
      if (y > 250) {
        doc.addPage()
        y = 20
      }

      doc.setFontSize(12)
      doc.setTextColor(15, 42, 58)
      doc.text('Response', 20, y)
      y += 7

      doc.setFontSize(10)
      doc.setTextColor(76, 93, 107)

      if (incident.rootCause) {
        doc.text('Root Cause:', 20, y)
        y += 5
        const rcLines = doc.splitTextToSize(incident.rootCause, 170)
        doc.text(rcLines, 20, y)
        y += rcLines.length * 5 + 5
      }

      if (incident.resolution) {
        doc.text('Resolution:', 20, y)
        y += 5
        const resLines = doc.splitTextToSize(incident.resolution, 170)
        doc.text(resLines, 20, y)
        y += resLines.length * 5 + 5
      }

      if (incident.preventiveMeasures) {
        doc.text('Preventive Measures:', 20, y)
        y += 5
        const pmLines = doc.splitTextToSize(incident.preventiveMeasures, 170)
        doc.text(pmLines, 20, y)
      }
    }

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128)
      doc.text(
        'TruGovAI™ - "Board-ready AI governance in 30 days"',
        105,
        290,
        { align: 'center' }
      )
      doc.text(`Page ${i} of ${pageCount}`, 190, 290, { align: 'right' })
    }

    // Save
    doc.save(`${incident.incidentNumber}.pdf`)

    return true
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw error
  }
}

export async function generatePIRPDF(pirId: string) {
  try {
    const { jsPDF } = await import('jspdf')

    const res = await fetch(`/api/export/pir/${pirId}/pdf`)
    if (!res.ok) throw new Error('Failed to fetch PIR data')
    const { pir, generatedAt } = await res.json()

    const doc = new jsPDF()

    // Header
    doc.setFontSize(20)
    doc.setTextColor(15, 42, 58)
    doc.text('TruGovAI™ Post-Incident Review', 20, 20)

    doc.setFontSize(10)
    doc.setTextColor(76, 93, 107)
    doc.text(`Generated: ${new Date(generatedAt).toLocaleString()}`, 20, 28)

    // Incident reference
    doc.setFontSize(12)
    doc.setTextColor(26, 167, 161)
    doc.text(`Incident: ${pir.incident.incidentNumber}`, 20, 45)

    doc.setFontSize(14)
    doc.setTextColor(15, 42, 58)
    doc.text(pir.incident.title, 20, 55)

    let y = 70

    // Review details
    doc.setFontSize(10)
    doc.setTextColor(76, 93, 107)
    doc.text(`Conducted by: ${pir.conductedBy}`, 20, y)
    y += 5
    doc.text(`Date: ${new Date(pir.conductedAt).toLocaleDateString()}`, 20, y)
    y += 5
    doc.text(`Status: ${pir.status}`, 20, y)
    y += 15

    // Sections
    const sections = [
      { title: 'What Happened', content: pir.whatHappened },
      { title: 'Why It Happened (Root Cause)', content: pir.whyItHappened },
      { title: 'What Went Well', content: pir.whatWentWell },
      { title: 'What Could Improve', content: pir.whatCouldImprove },
      { title: 'Lessons Learned', content: pir.lessonsLearned },
    ]

    for (const section of sections) {
      if (y > 250) {
        doc.addPage()
        y = 20
      }

      doc.setFontSize(12)
      doc.setTextColor(15, 42, 58)
      doc.text(section.title, 20, y)
      y += 7

      doc.setFontSize(10)
      doc.setTextColor(76, 93, 107)
      const lines = doc.splitTextToSize(section.content || 'Not documented', 170)
      doc.text(lines, 20, y)
      y += lines.length * 5 + 10
    }

    // Action items
    if (pir.actionItems && pir.actionItems.length > 0) {
      if (y > 220) {
        doc.addPage()
        y = 20
      }

      doc.setFontSize(12)
      doc.setTextColor(15, 42, 58)
      doc.text('Action Items', 20, y)
      y += 10

      for (const item of pir.actionItems) {
        if (y > 270) {
          doc.addPage()
          y = 20
        }

        doc.setFontSize(10)
        doc.setTextColor(15, 42, 58)
        doc.text(`• ${item.title}`, 20, y)
        y += 5

        doc.setTextColor(76, 93, 107)
        doc.text(`  Assigned: ${item.assignedTo} | Due: ${new Date(item.dueDate).toLocaleDateString()} | Status: ${item.status}`, 20, y)
        y += 8
      }
    }

    // Footer
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(128, 128, 128)
      doc.text(
        'TruGovAI™ - "Board-ready AI governance in 30 days"',
        105,
        290,
        { align: 'center' }
      )
      doc.text(`Page ${i} of ${pageCount}`, 190, 290, { align: 'right' })
    }

    doc.save(`PIR-${pir.incident.incidentNumber}.pdf`)

    return true
  } catch (error) {
    console.error('Error generating PIR PDF:', error)
    throw error
  }
}
