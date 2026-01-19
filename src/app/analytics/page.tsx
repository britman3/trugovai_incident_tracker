'use client'

import { useState, useEffect } from 'react'
import { Card, Button, Input, Select } from '@/components/ui'
import {
  IncidentLineChart,
  SeverityBarChart,
  StatusDonutChart,
} from '@/components/charts'
import { CATEGORY_OPTIONS } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts'

type TabType = 'overview' | 'sla' | 'tools' | 'rootCauses'

const CATEGORY_COLORS: Record<string, string> = {
  DataLeakage: '#DC2626',
  ComplianceViolation: '#F59E0B',
  SecurityIncident: '#FF6B6B',
  BiasDicrimination: '#8B5CF6',
  Misinformation: '#3B82F6',
  OperationalFailure: '#6B7280',
  PolicyViolation: '#F97316',
  VendorIssue: '#71D1C8',
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [loading, setLoading] = useState(true)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [data, setData] = useState<Record<string, unknown>>({})

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateFrom) params.set('dateFrom', dateFrom)
      if (dateTo) params.set('dateTo', dateTo)

      let endpoint = ''
      switch (activeTab) {
        case 'overview':
          endpoint = '/api/analytics/trends'
          break
        case 'sla':
          endpoint = '/api/analytics/sla'
          break
        case 'tools':
          endpoint = '/api/analytics/tools'
          break
        case 'rootCauses':
          endpoint = '/api/analytics/root-causes'
          break
      }

      const res = await fetch(`${endpoint}?${params.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch analytics')
      const result = await res.json()
      setData(result)
    } catch (err) {
      console.error('Error fetching analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    fetchData()
  }

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'sla', label: 'SLA Performance' },
    { id: 'tools', label: 'Tool Analysis' },
    { id: 'rootCauses', label: 'Root Cause Analysis' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-navy">Analytics</h1>
          <p className="text-body text-slate-700 mt-1">
            Incident trends, patterns, and insights
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-4 py-3 text-small font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? 'border-teal text-teal'
                  : 'border-transparent text-slate-700 hover:text-navy'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Filters */}
      <Card>
        <div className="flex items-end gap-4">
          <Input
            label="From"
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <Input
            label="To"
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
          <Button onClick={applyFilters}>Apply Filters</Button>
        </div>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal"></div>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <Card title="Incident Volume Trend">
                <IncidentLineChart
                  data={(data.trends as { month: string; total: number }[]) || []}
                />
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Category Breakdown">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={(data.categoryBreakdown as { category: string; count: number }[]) || []}
                      layout="vertical"
                      margin={{ left: 100 }}
                    >
                      <XAxis type="number" />
                      <YAxis
                        type="category"
                        dataKey="category"
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) =>
                          CATEGORY_OPTIONS.find((c) => c.value === value)?.label || value
                        }
                      />
                      <Tooltip />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {((data.categoryBreakdown as { category: string; count: number }[]) || []).map(
                          (entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={CATEGORY_COLORS[entry.category] || '#6B7280'}
                            />
                          )
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card title="Severity Breakdown">
                  <SeverityBarChart
                    data={
                      ((data.severityBreakdown as { severity: string; count: number }[]) || []).map(
                        (s) => ({
                          severity: s.severity,
                          count: s.count,
                          color:
                            s.severity === 'Critical'
                              ? '#DC2626'
                              : s.severity === 'High'
                              ? '#FF6B6B'
                              : s.severity === 'Medium'
                              ? '#F59E0B'
                              : '#7BC96F',
                        })
                      )
                    }
                  />
                </Card>
              </div>

              <Card title="Mean Time to Resolve (MTTR) Trend">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={(data.mttrTrend as { month: string; mttr: number }[]) || []}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip formatter={(value: number) => [`${value}h`, 'MTTR']} />
                    <Line
                      type="monotone"
                      dataKey="mttr"
                      stroke="#1AA7A1"
                      strokeWidth={3}
                      dot={{ fill: '#1AA7A1' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>
            </div>
          )}

          {/* SLA Performance Tab */}
          {activeTab === 'sla' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <p className="text-small text-slate-700">Overall SLA Compliance</p>
                  <p className="text-h2 text-navy mt-1">
                    {(data.overallRate as number) || 0}%
                  </p>
                </Card>
                <Card>
                  <p className="text-small text-slate-700">Total Resolved</p>
                  <p className="text-h2 text-navy mt-1">
                    {(data.totalResolved as number) || 0}
                  </p>
                </Card>
                <Card>
                  <p className="text-small text-slate-700">Within SLA</p>
                  <p className="text-h2 text-severity-low mt-1">
                    {(data.resolvedWithinSLA as number) || 0}
                  </p>
                </Card>
                <Card>
                  <p className="text-small text-slate-700">Breached</p>
                  <p className="text-h2 text-severity-critical mt-1">
                    {(data.totalResolved as number) - (data.resolvedWithinSLA as number) || 0}
                  </p>
                </Card>
              </div>

              <Card title="SLA Compliance Over Time">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={(data.complianceOverTime as { month: string; rate: number }[]) || []}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(value: number) => [`${value}%`, 'Compliance']} />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      stroke="#7BC96F"
                      strokeWidth={3}
                      dot={{ fill: '#7BC96F' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Compliance by Severity">
                  <div className="space-y-4">
                    {((data.complianceBySeverity as {
                      severity: string
                      total: number
                      breaches: number
                      rate: number
                    }[]) || []).map((item) => (
                      <div key={item.severity} className="flex items-center justify-between">
                        <span className="text-body text-navy">{item.severity}</span>
                        <div className="flex items-center gap-4">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                item.rate >= 95
                                  ? 'bg-severity-low'
                                  : item.rate >= 85
                                  ? 'bg-severity-medium'
                                  : 'bg-severity-critical'
                              }`}
                              style={{ width: `${item.rate}%` }}
                            />
                          </div>
                          <span className="text-small text-slate-700 w-12">{item.rate}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card title="Breaches by Category">
                  <div className="space-y-3">
                    {((data.breachesByCategory as { category: string; count: number }[]) || [])
                      .slice(0, 5)
                      .map((item) => (
                        <div key={item.category} className="flex items-center justify-between">
                          <span className="text-small text-slate-700">
                            {CATEGORY_OPTIONS.find((c) => c.value === item.category)?.label ||
                              item.category}
                          </span>
                          <span className="text-body text-severity-critical">{item.count}</span>
                        </div>
                      ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* Tools Tab */}
          {activeTab === 'tools' && (
            <div className="space-y-6">
              <Card title="Incidents by Tool">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart
                    data={(data.toolBreakdown as { tool: string; count: number }[]) || []}
                    layout="vertical"
                    margin={{ left: 100 }}
                  >
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="tool" tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#1AA7A1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {(data.topTools as string[])?.length > 0 && (
                <Card title="Tool Incident Trends">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={(data.toolTrends as Record<string, unknown>[]) || []}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      {(data.topTools as string[])?.map((tool, index) => (
                        <Line
                          key={tool}
                          type="monotone"
                          dataKey={tool}
                          stroke={
                            ['#1AA7A1', '#FF6B6B', '#F59E0B', '#8B5CF6', '#3B82F6'][index % 5]
                          }
                          strokeWidth={2}
                          dot={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex flex-wrap gap-4 mt-4 justify-center">
                    {(data.topTools as string[])?.map((tool, index) => (
                      <div key={tool} className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: ['#1AA7A1', '#FF6B6B', '#F59E0B', '#8B5CF6', '#3B82F6'][
                              index % 5
                            ],
                          }}
                        />
                        <span className="text-small text-slate-700">{tool}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Root Causes Tab */}
          {activeTab === 'rootCauses' && (
            <div className="space-y-6">
              <Card title="Common Root Cause Themes">
                <div className="space-y-4">
                  {((data.themeBreakdown as { theme: string; count: number }[]) || []).map(
                    (item) => (
                      <div key={item.theme} className="flex items-center justify-between">
                        <span className="text-body text-navy">{item.theme}</span>
                        <div className="flex items-center gap-4">
                          <div className="w-48 bg-gray-200 rounded-full h-3">
                            <div
                              className="h-3 rounded-full bg-teal"
                              style={{
                                width: `${Math.min(
                                  (item.count / (data.totalWithRootCause as number || 1)) * 100,
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                          <span className="text-small text-slate-700 w-8">{item.count}</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </Card>

              <Card title="Top Keywords in Root Causes">
                <div className="flex flex-wrap gap-2">
                  {((data.topKeywords as { word: string; count: number }[]) || []).map((item) => (
                    <span
                      key={item.word}
                      className="px-3 py-1 bg-ice rounded-full text-small"
                      style={{
                        fontSize: `${Math.min(Math.max(item.count * 2 + 10, 12), 24)}px`,
                      }}
                    >
                      {item.word}
                    </span>
                  ))}
                </div>
              </Card>

              <Card title="Root Causes by Category">
                <div className="space-y-6">
                  {((data.categoryRootCauses as {
                    category: string
                    count: number
                    examples: string[]
                  }[]) || []).map((item) => (
                    <div key={item.category}>
                      <h4 className="font-medium text-navy mb-2">
                        {CATEGORY_OPTIONS.find((c) => c.value === item.category)?.label ||
                          item.category}{' '}
                        ({item.count})
                      </h4>
                      {item.examples.length > 0 && (
                        <ul className="list-disc list-inside text-small text-slate-700 space-y-1">
                          {item.examples.map((example, idx) => (
                            <li key={idx} className="truncate">
                              {example}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  )
}
