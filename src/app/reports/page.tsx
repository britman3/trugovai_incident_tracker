'use client'

import { useState } from 'react'
import { Card, Button, Input } from '@/components/ui'
import { formatDate } from '@/lib/utils'

export default function ReportsPage() {
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [generating, setGenerating] = useState(false)
  const [reportData, setReportData] = useState<Record<string, unknown> | null>(null)

  const handleGenerateReport = async () => {
    if (!dateFrom || !dateTo) {
      alert('Please select a date range')
      return
    }

    setGenerating(true)
    try {
      const res = await fetch(
        `/api/export/management-report?dateFrom=${dateFrom}&dateTo=${dateTo}`
      )
      if (!res.ok) throw new Error('Failed to generate report')
      const data = await res.json()
      setReportData(data)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setGenerating(false)
    }
  }

  const handleExportCSV = () => {
    const params = new URLSearchParams()
    if (dateFrom) params.set('dateFrom', dateFrom)
    if (dateTo) params.set('dateTo', dateTo)
    window.location.href = `/api/export/incidents?${params.toString()}`
  }

  const handlePrintReport = () => {
    window.print()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-navy">Reports</h1>
          <p className="text-body text-slate-700 mt-1">
            Generate and export incident reports
          </p>
        </div>
      </div>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="Export Incidents">
          <p className="text-small text-slate-700 mb-4">
            Export all incidents or filtered incidents as a CSV file for further analysis.
          </p>
          <Button onClick={handleExportCSV}>Export as CSV</Button>
        </Card>

        <Card title="Single Incident PDF">
          <p className="text-small text-slate-700 mb-4">
            To export a single incident as PDF, go to the incident detail page and use the export option there.
          </p>
          <Button variant="outline" onClick={() => (window.location.href = '/incidents')}>
            View Incidents
          </Button>
        </Card>

        <Card title="PIR Export">
          <p className="text-small text-slate-700 mb-4">
            Post-Incident Review documents can be exported from the individual PIR pages.
          </p>
          <Button variant="outline" onClick={() => (window.location.href = '/incidents')}>
            View Incidents
          </Button>
        </Card>
      </div>

      {/* Management Report */}
      <Card title="Management Report">
        <p className="text-body text-slate-700 mb-6">
          Generate a comprehensive management report with summary statistics, charts, and key incidents for a specified period.
        </p>

        <div className="flex items-end gap-4 mb-6">
          <Input
            label="From Date"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            label="To Date"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <Button onClick={handleGenerateReport} loading={generating}>
            Generate Report
          </Button>
        </div>

        {reportData && (
          <div className="mt-8 border-t border-gray-200 pt-8 print:border-0">
            {/* Report Header */}
            <div className="text-center mb-8 print:mb-12">
              <h2 className="text-h2 text-navy">
                TruGovAI™ AI Incident Management Report
              </h2>
              <p className="text-body text-slate-700 mt-2">
                {formatDate((reportData.reportPeriod as { from: string }).from)} -{' '}
                {formatDate((reportData.reportPeriod as { to: string }).to)}
              </p>
              <p className="text-small text-slate-700 mt-1">
                Generated on {formatDate((reportData.generatedAt as string))}
              </p>
            </div>

            {/* Summary Statistics */}
            <div className="mb-8">
              <h3 className="text-h3 text-navy mb-4">Executive Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-ice rounded-button p-4">
                  <p className="text-small text-slate-700">Total Incidents</p>
                  <p className="text-h2 text-navy">
                    {(reportData.summary as { totalIncidents: number }).totalIncidents}
                  </p>
                </div>
                <div className="bg-ice rounded-button p-4">
                  <p className="text-small text-slate-700">Resolved</p>
                  <p className="text-h2 text-navy">
                    {(reportData.summary as { resolvedIncidents: number }).resolvedIncidents}
                  </p>
                </div>
                <div className="bg-ice rounded-button p-4">
                  <p className="text-small text-slate-700">SLA Compliance</p>
                  <p className="text-h2 text-severity-low">
                    {(reportData.summary as { slaComplianceRate: number }).slaComplianceRate}%
                  </p>
                </div>
                <div className="bg-ice rounded-button p-4">
                  <p className="text-small text-slate-700">Avg Resolution Time</p>
                  <p className="text-h2 text-navy">
                    {(reportData.summary as { meanTimeToResolve: number }).meanTimeToResolve}h
                  </p>
                </div>
              </div>
            </div>

            {/* Severity Breakdown */}
            <div className="mb-8">
              <h3 className="text-h3 text-navy mb-4">Incidents by Severity</h3>
              <div className="grid grid-cols-4 gap-4">
                {(
                  reportData.severityBreakdown as { severity: string; count: number }[]
                ).map((item) => (
                  <div key={item.severity} className="text-center">
                    <p
                      className={`text-h2 ${
                        item.severity === 'Critical'
                          ? 'text-severity-critical'
                          : item.severity === 'High'
                          ? 'text-severity-high'
                          : item.severity === 'Medium'
                          ? 'text-severity-medium'
                          : 'text-severity-low'
                      }`}
                    >
                      {item.count}
                    </p>
                    <p className="text-small text-slate-700">{item.severity}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Breakdown */}
            <div className="mb-8">
              <h3 className="text-h3 text-navy mb-4">Incidents by Category</h3>
              <div className="space-y-2">
                {(reportData.categoryBreakdown as { category: string; count: number }[]).map(
                  (item) => (
                    <div key={item.category} className="flex items-center justify-between">
                      <span className="text-body text-slate-700">{item.category}</span>
                      <span className="text-body text-navy font-medium">{item.count}</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Most Affected Tools */}
            <div className="mb-8">
              <h3 className="text-h3 text-navy mb-4">Most Affected AI Tools</h3>
              <div className="space-y-2">
                {(reportData.mostAffectedTools as { tool: string; count: number }[]).map(
                  (item, index) => (
                    <div key={item.tool} className="flex items-center gap-4">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-navy text-white text-small font-bold">
                        {index + 1}
                      </span>
                      <span className="text-body text-slate-700 flex-1">{item.tool}</span>
                      <span className="text-body text-navy font-medium">{item.count} incidents</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Top Incidents */}
            <div className="mb-8">
              <h3 className="text-h3 text-navy mb-4">Critical/High Priority Incidents</h3>
              {(
                reportData.topIncidents as {
                  incidentNumber: string
                  title: string
                  severity: string
                  status: string
                  affectedTool: string
                }[]
              ).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left text-small font-medium text-slate-700 py-2">ID</th>
                        <th className="text-left text-small font-medium text-slate-700 py-2">
                          Title
                        </th>
                        <th className="text-left text-small font-medium text-slate-700 py-2">
                          Severity
                        </th>
                        <th className="text-left text-small font-medium text-slate-700 py-2">
                          Status
                        </th>
                        <th className="text-left text-small font-medium text-slate-700 py-2">
                          Tool
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(
                        reportData.topIncidents as {
                          incidentNumber: string
                          title: string
                          severity: string
                          status: string
                          affectedTool: string
                        }[]
                      ).map((incident) => (
                        <tr key={incident.incidentNumber} className="border-b border-gray-100">
                          <td className="py-2 font-mono text-teal">{incident.incidentNumber}</td>
                          <td className="py-2 text-small">{incident.title}</td>
                          <td className="py-2">
                            <span
                              className={`px-2 py-1 rounded text-small text-white ${
                                incident.severity === 'Critical'
                                  ? 'bg-severity-critical'
                                  : 'bg-severity-high'
                              }`}
                            >
                              {incident.severity}
                            </span>
                          </td>
                          <td className="py-2 text-small">{incident.status}</td>
                          <td className="py-2 text-small">{incident.affectedTool}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-700">No critical or high priority incidents in this period.</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 print:hidden">
              <Button variant="outline" onClick={handlePrintReport}>
                Print / Save as PDF
              </Button>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-6 border-t border-gray-200 text-center print:fixed print:bottom-0 print:left-0 print:right-0 print:bg-white">
              <p className="text-small text-slate-700">
                TruGovAI™ - "Board-ready AI governance in 30 days"
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
