'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Card,
  Button,
  SeverityBadge,
  StatusBadge,
  SLABadge,
  Input,
  Select,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
} from '@/components/ui'
import {
  formatDate,
  calculateSLAStatus,
  SEVERITY_OPTIONS,
  CATEGORY_OPTIONS,
  STATUS_OPTIONS,
  AI_TOOLS,
} from '@/lib/utils'
import { Severity, IncidentStatus } from '@/types'

interface Incident {
  id: string
  incidentNumber: string
  title: string
  severity: string
  category: string
  status: string
  affectedTool: string
  reportedBy: string
  reportedAt: string
  acknowledgedAt: string | null
  resolvedAt: string | null
  assignedTo: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function IncidentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [incidents, setIncidents] = useState<Incident[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '')
  const [severityFilter, setSeverityFilter] = useState(searchParams.get('severity') || '')
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || '')
  const [toolFilter, setToolFilter] = useState(searchParams.get('affectedTool') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'reportedAt')
  const [sortOrder, setSortOrder] = useState(searchParams.get('sortOrder') || 'desc')

  const fetchIncidents = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (severityFilter) params.set('severity', severityFilter)
      if (categoryFilter) params.set('category', categoryFilter)
      if (toolFilter) params.set('affectedTool', toolFilter)
      params.set('sortBy', sortBy)
      params.set('sortOrder', sortOrder)
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())

      const res = await fetch(`/api/incidents?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch incidents')

      const data = await res.json()
      setIncidents(data.incidents)
      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter, severityFilter, categoryFilter, toolFilter, sortBy, sortOrder, pagination.page, pagination.limit])

  useEffect(() => {
    fetchIncidents()
  }, [fetchIncidents])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination((p) => ({ ...p, page: 1 }))
    fetchIncidents()
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('')
    setSeverityFilter('')
    setCategoryFilter('')
    setToolFilter('')
    setPagination((p) => ({ ...p, page: 1 }))
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(column)
      setSortOrder('desc')
    }
    setPagination((p) => ({ ...p, page: 1 }))
  }

  const getSeverityEnum = (severity: string): Severity => {
    switch (severity) {
      case 'Critical': return Severity.Critical
      case 'High': return Severity.High
      case 'Medium': return Severity.Medium
      case 'Low': return Severity.Low
      default: return Severity.Medium
    }
  }

  const getStatusEnum = (status: string): IncidentStatus => {
    return status.replace(' ', '') as IncidentStatus
  }

  const handleExport = async () => {
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (severityFilter) params.set('severity', severityFilter)
    if (categoryFilter) params.set('category', categoryFilter)

    window.location.href = `/api/export/incidents?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-navy">Incidents</h1>
          <p className="text-body text-slate-700 mt-1">
            Manage and track AI-related incidents
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport}>
            Export CSV
          </Button>
          <Link href="/incidents/new">
            <Button>Report Incident</Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input
              placeholder="Search by ID, title, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              placeholder="Status"
            />
            <Select
              options={SEVERITY_OPTIONS.map((s) => ({
                value: s.label,
                label: s.label,
              }))}
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              placeholder="Severity"
            />
            <Select
              options={CATEGORY_OPTIONS.map((c) => ({
                value: c.value,
                label: c.label,
              }))}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              placeholder="Category"
            />
            <Select
              options={AI_TOOLS.map((t) => ({ value: t, label: t }))}
              value={toolFilter}
              onChange={(e) => setToolFilter(e.target.value)}
              placeholder="Affected Tool"
            />
          </div>
          <div className="flex justify-between items-center">
            <Button type="button" variant="ghost" onClick={clearFilters}>
              Clear Filters
            </Button>
            <Button type="submit">Search</Button>
          </div>
        </form>
      </Card>

      {/* Results */}
      <Card>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-severity-critical">{error}</p>
            <Button onClick={fetchIncidents} className="mt-4">
              Retry
            </Button>
          </div>
        ) : incidents.length === 0 ? (
          <EmptyState
            title="No incidents found"
            description="Try adjusting your filters or report a new incident"
            action={
              <Link href="/incidents/new">
                <Button>Report Incident</Button>
              </Link>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:text-teal"
                      onClick={() => handleSort('incidentNumber')}
                    >
                      ID {sortBy === 'incidentNumber' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-teal"
                      onClick={() => handleSort('title')}
                    >
                      Title {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-teal"
                      onClick={() => handleSort('severity')}
                    >
                      Severity {sortBy === 'severity' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-teal"
                      onClick={() => handleSort('status')}
                    >
                      Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead>Assigned</TableHead>
                    <TableHead
                      className="cursor-pointer hover:text-teal"
                      onClick={() => handleSort('reportedAt')}
                    >
                      Reported {sortBy === 'reportedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </TableHead>
                    <TableHead>SLA</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incidents.map((incident) => {
                    const slaStatus = calculateSLAStatus(
                      getSeverityEnum(incident.severity),
                      incident.reportedAt,
                      incident.acknowledgedAt,
                      incident.resolvedAt
                    )
                    return (
                      <TableRow
                        key={incident.id}
                        onClick={() => router.push(`/incidents/${incident.id}`)}
                        className="cursor-pointer"
                      >
                        <TableCell className="font-mono text-teal">
                          {incident.incidentNumber}
                        </TableCell>
                        <TableCell className="max-w-xs truncate font-medium">
                          {incident.title}
                        </TableCell>
                        <TableCell>
                          <SeverityBadge severity={getSeverityEnum(incident.severity)} />
                        </TableCell>
                        <TableCell className="text-small">
                          {CATEGORY_OPTIONS.find((c) => c.value === incident.category)?.label ||
                            incident.category}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={getStatusEnum(incident.status)} />
                        </TableCell>
                        <TableCell>{incident.assignedTo || '-'}</TableCell>
                        <TableCell className="text-small">
                          {formatDate(incident.reportedAt)}
                        </TableCell>
                        <TableCell>
                          <SLABadge status={slaStatus.overallStatus} />
                        </TableCell>
                        <TableCell>
                          <Link
                            href={`/incidents/${incident.id}`}
                            className="text-teal hover:underline text-small"
                            onClick={(e) => e.stopPropagation()}
                          >
                            View
                          </Link>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
              <p className="text-small text-slate-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} incidents
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page === 1}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  )
}
