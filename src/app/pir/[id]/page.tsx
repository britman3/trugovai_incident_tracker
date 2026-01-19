'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Card, Button, StatusBadge, SeverityBadge } from '@/components/ui'
import { formatDate } from '@/lib/utils'
import { Severity, IncidentStatus } from '@/types'

interface PIR {
  id: string
  incidentId: string
  conductedBy: string
  conductedAt: string
  whatHappened: string
  whyItHappened: string
  whatWentWell: string
  whatCouldImprove: string
  lessonsLearned: string
  policyChangesNeeded: boolean
  trainingNeeded: boolean
  status: string
  incident: {
    id: string
    incidentNumber: string
    title: string
    severity: string
    category: string
    affectedTool: string
    reportedAt: string
    resolvedAt: string | null
  }
  actionItems: ActionItem[]
}

interface ActionItem {
  id: string
  title: string
  description: string
  assignedTo: string
  dueDate: string
  status: string
  completedAt: string | null
}

export default function PIRDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [pir, setPIR] = useState<PIR | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchPIR()
  }, [id])

  const fetchPIR = async () => {
    try {
      const res = await fetch(`/api/pir/${id}`)
      if (!res.ok) throw new Error('Failed to fetch PIR')
      const data = await res.json()
      setPIR(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/pir/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, updatedBy: pir?.conductedBy }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      await fetchPIR()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  const handleActionItemStatusChange = async (itemId: string, newStatus: string) => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/pir/${id}/action-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error('Failed to update action item')
      await fetchPIR()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal"></div>
      </div>
    )
  }

  if (error || !pir) {
    return (
      <div className="text-center py-12">
        <h2 className="text-h3 text-navy mb-2">Error Loading PIR</h2>
        <p className="text-body text-slate-700 mb-4">{error || 'PIR not found'}</p>
        <Link href="/incidents">
          <Button>Back to Incidents</Button>
        </Link>
      </div>
    )
  }

  const severityEnum = pir.incident.severity === 'Critical' ? Severity.Critical
    : pir.incident.severity === 'High' ? Severity.High
    : pir.incident.severity === 'Medium' ? Severity.Medium
    : Severity.Low

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`px-3 py-1 rounded-full text-small font-medium ${
              pir.status === 'Approved' ? 'bg-severity-low/10 text-severity-low' :
              pir.status === 'InReview' ? 'bg-severity-medium/10 text-severity-medium' :
              'bg-gray-100 text-slate-700'
            }`}>
              {pir.status === 'InReview' ? 'In Review' : pir.status}
            </span>
          </div>
          <h1 className="text-h2 text-navy">Post-Incident Review</h1>
          <p className="text-body text-slate-700 mt-1">
            Conducted by {pir.conductedBy} on {formatDate(pir.conductedAt)}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/incidents/${pir.incidentId}`}>
            <Button variant="ghost">View Incident</Button>
          </Link>
          {pir.status === 'Draft' && (
            <Button onClick={() => handleStatusChange('InReview')} loading={actionLoading}>
              Submit for Review
            </Button>
          )}
          {pir.status === 'InReview' && (
            <Button onClick={() => handleStatusChange('Approved')} loading={actionLoading}>
              Approve
            </Button>
          )}
        </div>
      </div>

      {/* Incident Summary */}
      <Card title="Incident Summary">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <Link
              href={`/incidents/${pir.incident.id}`}
              className="font-mono text-teal hover:underline"
            >
              {pir.incident.incidentNumber}
            </Link>
            <h3 className="text-body font-medium text-navy mt-1">{pir.incident.title}</h3>
            <div className="flex items-center gap-4 mt-2">
              <SeverityBadge severity={severityEnum} />
              <span className="text-small text-slate-700">{pir.incident.category}</span>
              <span className="text-small text-slate-700">{pir.incident.affectedTool}</span>
            </div>
          </div>
          <div className="text-right text-small text-slate-700">
            <p>Reported: {formatDate(pir.incident.reportedAt)}</p>
            {pir.incident.resolvedAt && (
              <p>Resolved: {formatDate(pir.incident.resolvedAt)}</p>
            )}
          </div>
        </div>
      </Card>

      {/* What Happened */}
      <Card title="What Happened">
        <p className="text-body text-slate-700 whitespace-pre-wrap">{pir.whatHappened}</p>
      </Card>

      {/* Root Cause Analysis */}
      <Card title="Why It Happened">
        <p className="text-body text-slate-700 whitespace-pre-wrap">
          {pir.whyItHappened || 'Not documented'}
        </p>
      </Card>

      {/* Response Evaluation */}
      <Card title="Response Evaluation">
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-navy mb-2">What Went Well</h4>
            <p className="text-body text-slate-700 whitespace-pre-wrap">
              {pir.whatWentWell || 'Not documented'}
            </p>
          </div>
          <div>
            <h4 className="font-medium text-navy mb-2">What Could Improve</h4>
            <p className="text-body text-slate-700 whitespace-pre-wrap">
              {pir.whatCouldImprove || 'Not documented'}
            </p>
          </div>
        </div>
      </Card>

      {/* Action Items */}
      <Card title="Action Items">
        {pir.actionItems && pir.actionItems.length > 0 ? (
          <div className="space-y-4">
            {pir.actionItems.map((item) => (
              <div
                key={item.id}
                className="p-4 border border-gray-200 rounded-button"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-navy">{item.title}</h4>
                    <p className="text-small text-slate-700 mt-1">{item.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-small text-slate-700">
                      <span>Assigned: {item.assignedTo}</span>
                      <span>Due: {formatDate(item.dueDate)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-small font-medium ${
                      item.status === 'Completed' ? 'bg-severity-low/10 text-severity-low' :
                      item.status === 'Overdue' ? 'bg-severity-critical/10 text-severity-critical' :
                      item.status === 'InProgress' ? 'bg-severity-medium/10 text-severity-medium' :
                      'bg-gray-100 text-slate-700'
                    }`}>
                      {item.status === 'InProgress' ? 'In Progress' : item.status}
                    </span>
                    {item.status !== 'Completed' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleActionItemStatusChange(
                          item.id,
                          item.status === 'Pending' ? 'InProgress' : 'Completed'
                        )}
                        loading={actionLoading}
                      >
                        {item.status === 'Pending' ? 'Start' : 'Complete'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-slate-700">No action items recorded.</p>
        )}
      </Card>

      {/* Lessons Learned */}
      <Card title="Lessons Learned">
        <p className="text-body text-slate-700 whitespace-pre-wrap mb-4">
          {pir.lessonsLearned || 'Not documented'}
        </p>
        <div className="flex items-center gap-6">
          {pir.policyChangesNeeded && (
            <span className="px-3 py-1 bg-severity-medium/10 text-severity-medium rounded-full text-small">
              Policy changes needed
            </span>
          )}
          {pir.trainingNeeded && (
            <span className="px-3 py-1 bg-teal/10 text-teal rounded-full text-small">
              Training needed
            </span>
          )}
        </div>
      </Card>
    </div>
  )
}
