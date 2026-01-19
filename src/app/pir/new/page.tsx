'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, Button, Input, Textarea, Select } from '@/components/ui'
import { formatDate } from '@/lib/utils'

interface Incident {
  id: string
  incidentNumber: string
  title: string
  description: string
  severity: string
  category: string
  affectedTool: string
  rootCause: string | null
  resolution: string | null
  reportedAt: string
  resolvedAt: string | null
}

interface ActionItem {
  title: string
  description: string
  assignedTo: string
  dueDate: string
}

function NewPIRContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const incidentId = searchParams.get('incidentId')

  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [conductedBy, setConductedBy] = useState('')
  const [whatHappened, setWhatHappened] = useState('')
  const [whyItHappened, setWhyItHappened] = useState('')
  const [whatWentWell, setWhatWentWell] = useState('')
  const [whatCouldImprove, setWhatCouldImprove] = useState('')
  const [lessonsLearned, setLessonsLearned] = useState('')
  const [policyChangesNeeded, setPolicyChangesNeeded] = useState(false)
  const [trainingNeeded, setTrainingNeeded] = useState(false)
  const [actionItems, setActionItems] = useState<ActionItem[]>([])

  useEffect(() => {
    if (!incidentId) {
      setError('No incident specified')
      setLoading(false)
      return
    }

    async function fetchIncident() {
      try {
        const res = await fetch(`/api/incidents/${incidentId}`)
        if (!res.ok) throw new Error('Failed to fetch incident')
        const data = await res.json()

        if (!['Resolved', 'Closed'].includes(data.status)) {
          setError('PIR can only be created for resolved or closed incidents')
          setLoading(false)
          return
        }

        setIncident(data)
        setWhatHappened(data.description)
        if (data.rootCause) setWhyItHappened(data.rootCause)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchIncident()
  }, [incidentId])

  const addActionItem = () => {
    setActionItems([
      ...actionItems,
      { title: '', description: '', assignedTo: '', dueDate: '' },
    ])
  }

  const updateActionItem = (index: number, field: keyof ActionItem, value: string) => {
    const updated = [...actionItems]
    updated[index][field] = value
    setActionItems(updated)
  }

  const removeActionItem = (index: number) => {
    setActionItems(actionItems.filter((_, i) => i !== index))
  }

  const handleSubmit = async (status: 'Draft' | 'InReview') => {
    if (!conductedBy) {
      alert('Please enter who is conducting this review')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/pir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentId,
          conductedBy,
          whatHappened,
          whyItHappened,
          whatWentWell,
          whatCouldImprove,
          lessonsLearned,
          policyChangesNeeded,
          trainingNeeded,
          actionItems: actionItems.filter((a) => a.title && a.assignedTo && a.dueDate),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create PIR')
      }

      const pir = await res.json()

      // If submitting for review, update status
      if (status === 'InReview') {
        await fetch(`/api/pir/${pir.id}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'InReview', updatedBy: conductedBy }),
        })
      }

      router.push(`/pir/${pir.id}`)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal"></div>
      </div>
    )
  }

  if (error || !incident) {
    return (
      <div className="text-center py-12">
        <h2 className="text-h3 text-navy mb-2">Cannot Create PIR</h2>
        <p className="text-body text-slate-700 mb-4">{error || 'Incident not found'}</p>
        <Link href="/incidents">
          <Button>Back to Incidents</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-navy">Post-Incident Review</h1>
          <p className="text-body text-slate-700 mt-1">
            Conduct a review for {incident.incidentNumber}
          </p>
        </div>
        <Link href={`/incidents/${incident.id}`}>
          <Button variant="ghost">Cancel</Button>
        </Link>
      </div>

      {/* Incident Summary */}
      <Card title="Incident Summary">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-small text-slate-700 font-medium">Incident</p>
            <p className="text-body">{incident.incidentNumber}: {incident.title}</p>
          </div>
          <div>
            <p className="text-small text-slate-700 font-medium">Severity</p>
            <p className="text-body">{incident.severity}</p>
          </div>
          <div>
            <p className="text-small text-slate-700 font-medium">Affected Tool</p>
            <p className="text-body">{incident.affectedTool}</p>
          </div>
          <div>
            <p className="text-small text-slate-700 font-medium">Timeline</p>
            <p className="text-body">
              {formatDate(incident.reportedAt)} - {incident.resolvedAt ? formatDate(incident.resolvedAt) : 'N/A'}
            </p>
          </div>
        </div>
      </Card>

      {/* Conducted By */}
      <Card title="Review Details">
        <Input
          label="Conducted By"
          placeholder="Your name"
          value={conductedBy}
          onChange={(e) => setConductedBy(e.target.value)}
          required
        />
      </Card>

      {/* What Happened */}
      <Card title="What Happened">
        <Textarea
          label="Summary of the Incident"
          placeholder="Describe what happened during this incident..."
          value={whatHappened}
          onChange={(e) => setWhatHappened(e.target.value)}
          helperText="Pre-filled from incident description. Edit as needed."
        />
      </Card>

      {/* Root Cause Analysis */}
      <Card title="Root Cause Analysis">
        <Textarea
          label="Why Did This Happen?"
          placeholder="What was the root cause of this incident?"
          value={whyItHappened}
          onChange={(e) => setWhyItHappened(e.target.value)}
          helperText={incident.rootCause ? 'Pre-filled from incident root cause.' : undefined}
        />
      </Card>

      {/* Response Evaluation */}
      <Card title="Response Evaluation">
        <div className="space-y-6">
          <Textarea
            label="What Went Well?"
            placeholder="What aspects of the incident response were effective?"
            value={whatWentWell}
            onChange={(e) => setWhatWentWell(e.target.value)}
          />
          <Textarea
            label="What Could Improve?"
            placeholder="What could have been done better?"
            value={whatCouldImprove}
            onChange={(e) => setWhatCouldImprove(e.target.value)}
          />
        </div>
      </Card>

      {/* Action Items */}
      <Card
        title="Action Items"
        action={
          <Button variant="outline" size="sm" onClick={addActionItem}>
            Add Action Item
          </Button>
        }
      >
        {actionItems.length === 0 ? (
          <p className="text-slate-700">No action items yet. Click "Add Action Item" to add one.</p>
        ) : (
          <div className="space-y-6">
            {actionItems.map((item, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-button space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-navy">Action Item {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeActionItem(index)}
                  >
                    Remove
                  </Button>
                </div>
                <Input
                  label="Title"
                  placeholder="Action item title"
                  value={item.title}
                  onChange={(e) => updateActionItem(index, 'title', e.target.value)}
                />
                <Textarea
                  label="Description"
                  placeholder="Describe the action item"
                  value={item.description}
                  onChange={(e) => updateActionItem(index, 'description', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Assigned To"
                    placeholder="Who is responsible?"
                    value={item.assignedTo}
                    onChange={(e) => updateActionItem(index, 'assignedTo', e.target.value)}
                  />
                  <Input
                    label="Due Date"
                    type="date"
                    value={item.dueDate}
                    onChange={(e) => updateActionItem(index, 'dueDate', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Lessons Learned */}
      <Card title="Lessons Learned">
        <div className="space-y-6">
          <Textarea
            label="Key Takeaways"
            placeholder="What are the key lessons from this incident?"
            value={lessonsLearned}
            onChange={(e) => setLessonsLearned(e.target.value)}
          />
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={policyChangesNeeded}
                onChange={(e) => setPolicyChangesNeeded(e.target.checked)}
                className="w-4 h-4 text-teal rounded focus:ring-teal"
              />
              <span className="text-body text-slate-700">Policy changes needed</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={trainingNeeded}
                onChange={(e) => setTrainingNeeded(e.target.checked)}
                className="w-4 h-4 text-teal rounded focus:ring-teal"
              />
              <span className="text-body text-slate-700">Training needed</span>
            </label>
          </div>
        </div>
      </Card>

      {/* Submit Actions */}
      <div className="flex items-center justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => handleSubmit('Draft')}
          loading={submitting}
        >
          Save Draft
        </Button>
        <Button onClick={() => handleSubmit('InReview')} loading={submitting}>
          Submit for Review
        </Button>
      </div>
    </div>
  )
}

export default function NewPIRPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal"></div>
      </div>
    }>
      <NewPIRContent />
    </Suspense>
  )
}
