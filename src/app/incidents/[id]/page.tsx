'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Card,
  Button,
  SeverityBadge,
  StatusBadge,
  SLABadge,
  Input,
  Textarea,
  Select,
  Modal,
} from '@/components/ui'
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatHours,
  calculateSLAStatus,
  getSeverityLabel,
  CATEGORY_OPTIONS,
  STATUS_OPTIONS,
  ESCALATION_CONTACTS,
  AI_TOOLS,
} from '@/lib/utils'
import { Severity, IncidentStatus, BusinessImpact } from '@/types'

interface Incident {
  id: string
  incidentNumber: string
  organisationId: string
  severity: string
  category: string
  status: string
  title: string
  description: string
  affectedTool: string
  affectedDepartments: string[]
  dataTypesInvolved: string[]
  reportedBy: string
  reportedByEmail: string
  assignedTo: string | null
  assignedToEmail: string | null
  escalatedTo: string | null
  reportedAt: string
  acknowledgedAt: string | null
  resolvedAt: string | null
  closedAt: string | null
  rootCause: string | null
  immediateActions: string | null
  resolution: string | null
  preventiveMeasures: string | null
  businessImpact: string | null
  dataSubjectsAffected: number | null
  financialImpact: number | null
  regulatoryNotificationRequired: boolean | null
  tags: string[]
  activityLog: ActivityLogEntry[]
  pir: PostIncidentReview | null
  relatedIncidents: { to: RelatedIncident }[]
  relatedTo: { from: RelatedIncident }[]
}

interface ActivityLogEntry {
  id: string
  timestamp: string
  action: string
  performedBy: string
  details: string
  previousValue: string | null
  newValue: string | null
}

interface PostIncidentReview {
  id: string
  status: string
}

interface RelatedIncident {
  id: string
  incidentNumber: string
  title: string
  status: string
  severity: string
}

export default function IncidentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const justCreated = searchParams.get('created') === 'true'

  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Modals
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showEscalateModal, setShowEscalateModal] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [showResponseSection, setShowResponseSection] = useState(false)

  // Form states
  const [newStatus, setNewStatus] = useState('')
  const [statusResolution, setStatusResolution] = useState('')
  const [statusRootCause, setStatusRootCause] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [assignedToEmail, setAssignedToEmail] = useState('')
  const [escalateTo, setEscalateTo] = useState('')
  const [escalationReason, setEscalationReason] = useState('')
  const [requestedActions, setRequestedActions] = useState('')
  const [comment, setComment] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  // Response form state
  const [rootCause, setRootCause] = useState('')
  const [immediateActions, setImmediateActions] = useState('')
  const [resolution, setResolution] = useState('')
  const [preventiveMeasures, setPreventiveMeasures] = useState('')
  const [businessImpact, setBusinessImpact] = useState('')
  const [dataSubjectsAffected, setDataSubjectsAffected] = useState('')
  const [financialImpact, setFinancialImpact] = useState('')

  useEffect(() => {
    fetchIncident()
  }, [id])

  const fetchIncident = async () => {
    try {
      const res = await fetch(`/api/incidents/${id}`)
      if (!res.ok) throw new Error('Failed to fetch incident')
      const data = await res.json()
      setIncident(data)

      // Pre-fill response fields
      if (data.rootCause) setRootCause(data.rootCause)
      if (data.immediateActions) setImmediateActions(data.immediateActions)
      if (data.resolution) setResolution(data.resolution)
      if (data.preventiveMeasures) setPreventiveMeasures(data.preventiveMeasures)
      if (data.businessImpact) setBusinessImpact(data.businessImpact)
      if (data.dataSubjectsAffected) setDataSubjectsAffected(String(data.dataSubjectsAffected))
      if (data.financialImpact) setFinancialImpact(String(data.financialImpact))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async () => {
    if (!newStatus) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/incidents/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          resolution: statusResolution || undefined,
          rootCause: statusRootCause || undefined,
          updatedBy: incident?.assignedTo || 'System',
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to update status')
      }
      await fetchIncident()
      setShowStatusModal(false)
      setNewStatus('')
      setStatusResolution('')
      setStatusRootCause('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAssign = async () => {
    if (!assignedTo || !assignedToEmail) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/incidents/${id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignedTo,
          assignedToEmail,
          updatedBy: incident?.reportedBy || 'System',
        }),
      })
      if (!res.ok) throw new Error('Failed to assign incident')
      await fetchIncident()
      setShowAssignModal(false)
      setAssignedTo('')
      setAssignedToEmail('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  const handleEscalate = async () => {
    if (!escalateTo || !escalationReason) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/incidents/${id}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escalateTo,
          escalationReason,
          requestedActions: requestedActions || undefined,
          escalatedBy: incident?.assignedTo || incident?.reportedBy || 'System',
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to escalate incident')
      }
      await fetchIncident()
      setShowEscalateModal(false)
      setEscalateTo('')
      setEscalationReason('')
      setRequestedActions('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAddComment = async () => {
    if (!comment) return
    setActionLoading(true)
    try {
      const res = await fetch(`/api/incidents/${id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          comment,
          commentBy: incident?.assignedTo || incident?.reportedBy || 'Anonymous',
        }),
      })
      if (!res.ok) throw new Error('Failed to add comment')
      await fetchIncident()
      setShowCommentModal(false)
      setComment('')
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateResponse = async () => {
    setActionLoading(true)
    try {
      const res = await fetch(`/api/incidents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rootCause: rootCause || undefined,
          immediateActions: immediateActions || undefined,
          resolution: resolution || undefined,
          preventiveMeasures: preventiveMeasures || undefined,
          businessImpact: businessImpact || undefined,
          dataSubjectsAffected: dataSubjectsAffected ? parseInt(dataSubjectsAffected) : undefined,
          financialImpact: financialImpact ? parseFloat(financialImpact) : undefined,
          updatedBy: incident?.assignedTo || 'System',
        }),
      })
      if (!res.ok) throw new Error('Failed to update incident')
      await fetchIncident()
      alert('Response details updated successfully')
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

  if (error || !incident) {
    return (
      <div className="text-center py-12">
        <h2 className="text-h3 text-navy mb-2">Error Loading Incident</h2>
        <p className="text-body text-slate-700 mb-4">{error || 'Incident not found'}</p>
        <Link href="/incidents">
          <Button>Back to Incidents</Button>
        </Link>
      </div>
    )
  }

  const severityEnum = incident.severity === 'Critical' ? Severity.Critical
    : incident.severity === 'High' ? Severity.High
    : incident.severity === 'Medium' ? Severity.Medium
    : Severity.Low

  const statusEnum = incident.status.replace(' ', '') as IncidentStatus

  const slaStatus = calculateSLAStatus(
    severityEnum,
    incident.reportedAt,
    incident.acknowledgedAt,
    incident.resolvedAt
  )

  const allRelatedIncidents = [
    ...(incident.relatedIncidents?.map((r) => r.to) || []),
    ...(incident.relatedTo?.map((r) => r.from) || []),
  ]

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      {justCreated && (
        <div className="bg-severity-low/10 border border-severity-low rounded-button p-4">
          <p className="text-severity-low font-medium">
            Incident {incident.incidentNumber} has been created successfully.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="font-mono text-teal text-body">{incident.incidentNumber}</span>
            <SeverityBadge severity={severityEnum} />
            <StatusBadge status={statusEnum} />
          </div>
          <h1 className="text-h2 text-navy">{incident.title}</h1>
          <p className="text-small text-slate-700 mt-2">
            Reported by {incident.reportedBy} on {formatDateTime(incident.reportedAt)}
            {incident.assignedTo && ` • Assigned to ${incident.assignedTo}`}
          </p>
        </div>
        <Link href="/incidents">
          <Button variant="ghost">Back to List</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <Card title="Incident Details">
            <div className="prose prose-sm max-w-none text-slate-700">
              <p className="whitespace-pre-wrap">{incident.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
              <div>
                <p className="text-small text-slate-700 font-medium">Category</p>
                <p className="text-body">
                  {CATEGORY_OPTIONS.find((c) => c.value === incident.category)?.label || incident.category}
                </p>
              </div>
              <div>
                <p className="text-small text-slate-700 font-medium">Affected Tool</p>
                <p className="text-body">{incident.affectedTool}</p>
              </div>
              <div>
                <p className="text-small text-slate-700 font-medium">Departments</p>
                <p className="text-body">{incident.affectedDepartments.join(', ') || 'None specified'}</p>
              </div>
              <div>
                <p className="text-small text-slate-700 font-medium">Data Types</p>
                <p className="text-body">{incident.dataTypesInvolved.join(', ')}</p>
              </div>
            </div>
          </Card>

          {/* SLA Status Card */}
          <Card title="SLA Status">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-small text-slate-700 font-medium">Response SLA</p>
                <p className="text-body">
                  Target: {formatHours(slaStatus.responseDeadline)} •{' '}
                  {slaStatus.acknowledged ? (
                    <span className="text-severity-low">Acknowledged</span>
                  ) : slaStatus.responseSLABreached ? (
                    <span className="text-severity-critical">Breached</span>
                  ) : (
                    <span className="text-severity-medium">Pending</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-small text-slate-700 font-medium">Resolution SLA</p>
                <p className="text-body">
                  Target: {formatHours(slaStatus.resolutionDeadline)} •{' '}
                  {slaStatus.resolved ? (
                    <span className="text-severity-low">Resolved</span>
                  ) : slaStatus.resolutionSLABreached ? (
                    <span className="text-severity-critical">Breached</span>
                  ) : (
                    <span className="text-teal">On Track</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-small text-slate-700 font-medium">Time Elapsed</p>
                <p className="text-body">{formatHours(slaStatus.hoursElapsed)}</p>
              </div>
              <div>
                <p className="text-small text-slate-700 font-medium">Overall Status</p>
                <SLABadge status={slaStatus.overallStatus} />
              </div>
            </div>
          </Card>

          {/* Response Section */}
          <Card
            title="Response Details"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResponseSection(!showResponseSection)}
              >
                {showResponseSection ? 'Collapse' : 'Expand'}
              </Button>
            }
          >
            {showResponseSection || incident.status === 'InProgress' || incident.status === 'Escalated' ? (
              <div className="space-y-6">
                <Textarea
                  label="Immediate Actions Taken"
                  placeholder="Describe the immediate steps taken to address the incident..."
                  value={immediateActions}
                  onChange={(e) => setImmediateActions(e.target.value)}
                />
                <Textarea
                  label="Root Cause"
                  placeholder="What was the underlying cause of this incident?"
                  value={rootCause}
                  onChange={(e) => setRootCause(e.target.value)}
                />
                <Textarea
                  label="Resolution"
                  placeholder="How was the incident resolved?"
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                />
                <Textarea
                  label="Preventive Measures"
                  placeholder="What measures will be taken to prevent recurrence?"
                  value={preventiveMeasures}
                  onChange={(e) => setPreventiveMeasures(e.target.value)}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Select
                    label="Business Impact"
                    options={Object.values(BusinessImpact).map((v) => ({ value: v, label: v }))}
                    value={businessImpact}
                    onChange={(e) => setBusinessImpact(e.target.value)}
                  />
                  <Input
                    label="Data Subjects Affected"
                    type="number"
                    placeholder="0"
                    value={dataSubjectsAffected}
                    onChange={(e) => setDataSubjectsAffected(e.target.value)}
                  />
                  <Input
                    label="Financial Impact"
                    type="number"
                    placeholder="0.00"
                    value={financialImpact}
                    onChange={(e) => setFinancialImpact(e.target.value)}
                  />
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleUpdateResponse} loading={actionLoading}>
                    Save Response Details
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-slate-700">
                {incident.rootCause || incident.resolution ? (
                  <div className="space-y-4">
                    {incident.rootCause && (
                      <div>
                        <p className="font-medium">Root Cause</p>
                        <p>{incident.rootCause}</p>
                      </div>
                    )}
                    {incident.resolution && (
                      <div>
                        <p className="font-medium">Resolution</p>
                        <p>{incident.resolution}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>No response details recorded yet.</p>
                )}
              </div>
            )}
          </Card>

          {/* Activity Log */}
          <Card title="Activity Log" action={
            <Button variant="outline" size="sm" onClick={() => setShowCommentModal(true)}>
              Add Comment
            </Button>
          }>
            {incident.activityLog && incident.activityLog.length > 0 ? (
              <div className="space-y-4">
                {incident.activityLog.map((entry) => (
                  <div key={entry.id} className="flex gap-4 pb-4 border-b border-gray-100 last:border-0">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-teal"></div>
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between">
                        <p className="text-small font-medium text-navy">{entry.action}</p>
                        <p className="text-small text-slate-700">{formatRelativeTime(entry.timestamp)}</p>
                      </div>
                      <p className="text-small text-slate-700 mt-1">{entry.details}</p>
                      <p className="text-small text-slate-700">by {entry.performedBy}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-700">No activity recorded yet.</p>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card title="Quick Actions">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowStatusModal(true)}
                disabled={incident.status === 'Closed'}
              >
                Change Status
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowAssignModal(true)}
              >
                {incident.assignedTo ? 'Reassign' : 'Assign'}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowEscalateModal(true)}
                disabled={!['Open', 'InProgress', 'Reopened'].includes(incident.status)}
              >
                Escalate
              </Button>
            </div>
          </Card>

          {/* Post-Incident Review */}
          <Card title="Post-Incident Review">
            {incident.pir ? (
              <div>
                <p className="text-small text-slate-700 mb-2">Status: {incident.pir.status}</p>
                <Link href={`/pir/${incident.pir.id}`}>
                  <Button variant="outline" size="sm" className="w-full">
                    View PIR
                  </Button>
                </Link>
              </div>
            ) : ['Resolved', 'Closed'].includes(incident.status) ? (
              <Link href={`/pir/new?incidentId=${incident.id}`}>
                <Button variant="outline" size="sm" className="w-full">
                  Create PIR
                </Button>
              </Link>
            ) : (
              <p className="text-small text-slate-700">
                PIR available after incident is resolved.
              </p>
            )}
          </Card>

          {/* Related Incidents */}
          <Card title="Related Incidents">
            {allRelatedIncidents.length > 0 ? (
              <div className="space-y-2">
                {allRelatedIncidents.map((related) => (
                  <Link
                    key={related.id}
                    href={`/incidents/${related.id}`}
                    className="block p-2 rounded hover:bg-ice transition-colors"
                  >
                    <p className="font-mono text-small text-teal">{related.incidentNumber}</p>
                    <p className="text-small text-navy truncate">{related.title}</p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-small text-slate-700">No related incidents.</p>
            )}
          </Card>

          {/* Tags */}
          {incident.tags && incident.tags.length > 0 && (
            <Card title="Tags">
              <div className="flex flex-wrap gap-2">
                {incident.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 bg-ice rounded text-small text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Change Status Modal */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title="Change Status"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowStatusModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusChange} loading={actionLoading}>
              Update Status
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="New Status"
            options={STATUS_OPTIONS.filter((s) => {
              const transitions: Record<string, string[]> = {
                Open: ['InProgress', 'Escalated'],
                InProgress: ['Resolved', 'Escalated'],
                Escalated: ['InProgress', 'Resolved'],
                Resolved: ['Closed', 'Reopened'],
                Reopened: ['InProgress', 'Resolved', 'Escalated'],
                Closed: [],
              }
              return transitions[incident.status]?.includes(s.value)
            })}
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            required
          />
          {newStatus === 'Resolved' && (
            <>
              <Textarea
                label="Resolution"
                placeholder="How was the incident resolved?"
                value={statusResolution}
                onChange={(e) => setStatusResolution(e.target.value)}
                required
              />
              {(incident.severity === 'Critical' || incident.severity === 'High') && (
                <Textarea
                  label="Root Cause"
                  placeholder="What was the root cause?"
                  value={statusRootCause}
                  onChange={(e) => setStatusRootCause(e.target.value)}
                  required
                />
              )}
            </>
          )}
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={incident.assignedTo ? 'Reassign Incident' : 'Assign Incident'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowAssignModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssign} loading={actionLoading}>
              Assign
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Assignee Name"
            placeholder="Enter name"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            required
          />
          <Input
            label="Assignee Email"
            type="email"
            placeholder="Enter email"
            value={assignedToEmail}
            onChange={(e) => setAssignedToEmail(e.target.value)}
            required
          />
        </div>
      </Modal>

      {/* Escalate Modal */}
      <Modal
        isOpen={showEscalateModal}
        onClose={() => setShowEscalateModal(false)}
        title="Escalate Incident"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowEscalateModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleEscalate} loading={actionLoading}>
              Escalate
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Escalate To"
            options={ESCALATION_CONTACTS}
            value={escalateTo}
            onChange={(e) => setEscalateTo(e.target.value)}
            required
          />
          <Textarea
            label="Escalation Reason"
            placeholder="Why is this incident being escalated?"
            value={escalationReason}
            onChange={(e) => setEscalationReason(e.target.value)}
            required
          />
          <Textarea
            label="Requested Actions (Optional)"
            placeholder="What actions are you requesting?"
            value={requestedActions}
            onChange={(e) => setRequestedActions(e.target.value)}
          />
        </div>
      </Modal>

      {/* Add Comment Modal */}
      <Modal
        isOpen={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        title="Add Comment"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowCommentModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddComment} loading={actionLoading}>
              Add Comment
            </Button>
          </>
        }
      >
        <Textarea
          label="Comment"
          placeholder="Add your comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          required
        />
      </Modal>
    </div>
  )
}
