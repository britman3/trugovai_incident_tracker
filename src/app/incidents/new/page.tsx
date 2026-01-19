'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Card,
  Button,
  Input,
  Textarea,
  Select,
  CheckboxGroup,
} from '@/components/ui'
import {
  SEVERITY_OPTIONS,
  CATEGORY_OPTIONS,
  DEPARTMENT_OPTIONS,
  DATA_TYPE_OPTIONS,
  AI_TOOLS,
} from '@/lib/utils'

export default function NewIncidentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [severity, setSeverity] = useState('')
  const [affectedTool, setAffectedTool] = useState('')
  const [otherTool, setOtherTool] = useState('')
  const [affectedDepartments, setAffectedDepartments] = useState<string[]>([])
  const [dataTypesInvolved, setDataTypesInvolved] = useState<string[]>([])
  const [reportedBy, setReportedBy] = useState('')
  const [reportedByEmail, setReportedByEmail] = useState('')
  const [tags, setTags] = useState('')

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!title || title.length < 5 || title.length > 100) {
      newErrors.title = 'Title must be between 5 and 100 characters'
    }

    if (!description || description.length < 20 || description.length > 5000) {
      newErrors.description = 'Description must be between 20 and 5000 characters'
    }

    if (!category) {
      newErrors.category = 'Category is required'
    }

    if (!severity) {
      newErrors.severity = 'Severity is required'
    }

    if (!affectedTool) {
      newErrors.affectedTool = 'Affected tool is required'
    }

    if (affectedTool === 'Other' && !otherTool) {
      newErrors.otherTool = 'Please specify the tool name'
    }

    if (dataTypesInvolved.length === 0) {
      newErrors.dataTypesInvolved = 'At least one data type must be selected'
    }

    if (!reportedBy) {
      newErrors.reportedBy = 'Reporter name is required'
    }

    if (!reportedByEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reportedByEmail)) {
      newErrors.reportedByEmail = 'Valid email is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (assignToMe: boolean = false) => {
    if (!validate()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          severity,
          affectedTool: affectedTool === 'Other' ? otherTool : affectedTool,
          affectedDepartments,
          dataTypesInvolved,
          reportedBy,
          reportedByEmail,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
          assignToMe,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create incident')
      }

      const incident = await res.json()
      router.push(`/incidents/${incident.id}?created=true`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-h1 text-navy">Report Incident</h1>
          <p className="text-body text-slate-700 mt-1">
            Log a new AI-related incident for tracking and response
          </p>
        </div>
        <Link href="/incidents">
          <Button variant="ghost">Cancel</Button>
        </Link>
      </div>

      {error && (
        <div className="bg-severity-critical/10 border border-severity-critical rounded-button p-4">
          <p className="text-severity-critical">{error}</p>
        </div>
      )}

      <form onSubmit={(e) => { e.preventDefault(); handleSubmit(false); }}>
        {/* Section 1: Incident Details */}
        <Card title="Incident Details" className="mb-6">
          <div className="space-y-6">
            <Input
              label="Title"
              placeholder="Brief summary of the incident"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              error={errors.title}
              required
              maxLength={100}
              helperText={`${title.length}/100 characters`}
            />

            <Textarea
              label="Description"
              placeholder="Provide detailed information about what happened, when it happened, and any relevant context..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={errors.description}
              required
              maxLength={5000}
              helperText={`${description.length}/5000 characters. Markdown supported.`}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Select
                label="Category"
                options={CATEGORY_OPTIONS.map((c) => ({
                  value: c.value,
                  label: c.label,
                  description: c.examples,
                }))}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                error={errors.category}
                required
              />

              <div>
                <Select
                  label="Severity"
                  options={SEVERITY_OPTIONS.map((s) => ({
                    value: s.label,
                    label: s.label,
                    description: s.description,
                  }))}
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  error={errors.severity}
                  required
                />
                {severity && (
                  <p className="text-small text-slate-700 mt-2">
                    {SEVERITY_OPTIONS.find((s) => s.label === severity)?.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Section 2: Context */}
        <Card title="Context" className="mb-6">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Select
                  label="Affected AI Tool"
                  options={AI_TOOLS.map((t) => ({ value: t, label: t }))}
                  value={affectedTool}
                  onChange={(e) => setAffectedTool(e.target.value)}
                  error={errors.affectedTool}
                  required
                />
              </div>

              {affectedTool === 'Other' && (
                <Input
                  label="Tool Name"
                  placeholder="Specify the AI tool name"
                  value={otherTool}
                  onChange={(e) => setOtherTool(e.target.value)}
                  error={errors.otherTool}
                  required
                />
              )}
            </div>

            <CheckboxGroup
              label="Affected Departments"
              options={DEPARTMENT_OPTIONS}
              values={affectedDepartments}
              onChange={setAffectedDepartments}
            />

            <CheckboxGroup
              label="Data Types Involved"
              options={DATA_TYPE_OPTIONS}
              values={dataTypesInvolved}
              onChange={setDataTypesInvolved}
              error={errors.dataTypesInvolved}
            />
          </div>
        </Card>

        {/* Section 3: Reporter */}
        <Card title="Reporter Information" className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input
              label="Reported By"
              placeholder="Your full name"
              value={reportedBy}
              onChange={(e) => setReportedBy(e.target.value)}
              error={errors.reportedBy}
              required
            />

            <Input
              label="Reporter Email"
              type="email"
              placeholder="your.email@company.com"
              value={reportedByEmail}
              onChange={(e) => setReportedByEmail(e.target.value)}
              error={errors.reportedByEmail}
              required
            />
          </div>

          <div className="mt-6">
            <Input
              label="Tags (optional)"
              placeholder="Comma-separated tags for categorisation"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              helperText="Example: urgent, customer-facing, regulatory"
            />
          </div>
        </Card>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleSubmit(true)}
            loading={loading}
          >
            Report & Assign to Me
          </Button>
          <Button type="submit" loading={loading}>
            Report Incident
          </Button>
        </div>
      </form>
    </div>
  )
}
