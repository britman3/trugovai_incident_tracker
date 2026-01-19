import { clsx, type ClassValue } from 'clsx'
import { Severity, IncidentStatus, SLA_CONFIG, SLAStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: Date | string): string {
  const d = new Date(date)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return formatDate(date)
}

export function getSeverityLabel(severity: Severity): string {
  switch (severity) {
    case Severity.Critical:
      return 'Critical'
    case Severity.High:
      return 'High'
    case Severity.Medium:
      return 'Medium'
    case Severity.Low:
      return 'Low'
    default:
      return 'Unknown'
  }
}

export function getSeverityColor(severity: Severity): string {
  switch (severity) {
    case Severity.Critical:
      return 'bg-severity-critical'
    case Severity.High:
      return 'bg-severity-high'
    case Severity.Medium:
      return 'bg-severity-medium'
    case Severity.Low:
      return 'bg-severity-low'
    default:
      return 'bg-gray-500'
  }
}

export function getStatusColor(status: IncidentStatus): string {
  switch (status) {
    case IncidentStatus.Open:
      return 'status-open'
    case IncidentStatus.InProgress:
      return 'status-inprogress'
    case IncidentStatus.Escalated:
      return 'status-escalated'
    case IncidentStatus.Resolved:
      return 'status-resolved'
    case IncidentStatus.Reopened:
      return 'status-reopened'
    case IncidentStatus.Closed:
      return 'status-closed'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function calculateSLAStatus(
  severity: Severity,
  reportedAt: Date | string,
  acknowledgedAt?: Date | string | null,
  resolvedAt?: Date | string | null
): SLAStatus {
  const config = SLA_CONFIG[severity]
  const now = new Date()
  const reported = new Date(reportedAt)

  const hoursElapsed = (now.getTime() - reported.getTime()) / (1000 * 60 * 60)

  const responseDeadline = config.responseTime
  const acknowledged = acknowledgedAt !== null && acknowledgedAt !== undefined
  const responseSLABreached = !acknowledged && hoursElapsed > responseDeadline

  const resolutionDeadline = config.resolutionTarget
  const resolved = resolvedAt !== null && resolvedAt !== undefined
  const resolutionSLABreached = !resolved && hoursElapsed > resolutionDeadline

  return {
    responseDeadline,
    resolutionDeadline,
    hoursElapsed: Math.round(hoursElapsed),
    acknowledged,
    resolved,
    responseSLABreached,
    resolutionSLABreached,
    overallStatus: responseSLABreached || resolutionSLABreached ? 'Breached' : 'On Track',
  }
}

export function formatHours(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m`
  if (hours < 24) return `${Math.round(hours)}h`
  const days = Math.round(hours / 24)
  return `${days}d`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function generateIncidentNumber(year: number, count: number): string {
  return `INC-${year}-${count.toString().padStart(4, '0')}`
}

// Prisma enum to TypeScript enum conversion helpers
export function mapPrismaSeverity(severity: string): Severity {
  switch (severity) {
    case 'Critical':
      return Severity.Critical
    case 'High':
      return Severity.High
    case 'Medium':
      return Severity.Medium
    case 'Low':
      return Severity.Low
    default:
      return Severity.Medium
  }
}

export function mapSeverityToPrisma(severity: Severity): string {
  switch (severity) {
    case Severity.Critical:
      return 'Critical'
    case Severity.High:
      return 'High'
    case Severity.Medium:
      return 'Medium'
    case Severity.Low:
      return 'Low'
    default:
      return 'Medium'
  }
}

export const SEVERITY_OPTIONS = [
  { value: Severity.Critical, label: 'Critical', description: 'Data breach, regulatory violation, reputational crisis. Response: <1 hour' },
  { value: Severity.High, label: 'High', description: 'Significant data exposure, compliance risk, service outage. Response: <4 hours' },
  { value: Severity.Medium, label: 'Medium', description: 'Policy violation, minor data leak, operational disruption. Response: <24 hours' },
  { value: Severity.Low, label: 'Low', description: 'Near-miss, policy reminder needed, process improvement. Response: <72 hours' },
]

export const CATEGORY_OPTIONS = [
  { value: 'DataLeakage', label: 'Data Leakage', examples: 'Customer data entered into AI, PII exposure, confidential info shared' },
  { value: 'ComplianceViolation', label: 'Compliance Violation', examples: 'GDPR breach, EU AI Act violation, contractual breach' },
  { value: 'SecurityIncident', label: 'Security Incident', examples: 'Unauthorised access, credential exposure, malware via AI' },
  { value: 'BiasDicrimination', label: 'Bias/Discrimination', examples: 'Biased output, discriminatory decision, unfair treatment' },
  { value: 'Misinformation', label: 'Misinformation', examples: 'AI hallucination used in business decision, false information published' },
  { value: 'OperationalFailure', label: 'Operational Failure', examples: 'AI tool outage, incorrect output causing errors, workflow disruption' },
  { value: 'PolicyViolation', label: 'Policy Violation', examples: 'Unapproved tool usage, bypassing controls, ignoring guidelines' },
  { value: 'VendorIssue', label: 'Vendor Issue', examples: 'Vendor breach, SLA failure, contract violation by vendor' },
]

export const DEPARTMENT_OPTIONS = [
  { value: 'Marketing', label: 'Marketing' },
  { value: 'HR', label: 'HR' },
  { value: 'IT', label: 'IT' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Other', label: 'Other' },
]

export const DATA_TYPE_OPTIONS = [
  { value: 'CustomerData', label: 'Customer Data' },
  { value: 'FinancialData', label: 'Financial Data' },
  { value: 'EmployeeData', label: 'Employee Data' },
  { value: 'InternalCode', label: 'Internal Code' },
  { value: 'PublicData', label: 'Public Data' },
  { value: 'Other', label: 'Other' },
]

export const STATUS_OPTIONS = [
  { value: 'Open', label: 'Open' },
  { value: 'InProgress', label: 'In Progress' },
  { value: 'Escalated', label: 'Escalated' },
  { value: 'Resolved', label: 'Resolved' },
  { value: 'Reopened', label: 'Reopened' },
  { value: 'Closed', label: 'Closed' },
]

export const AI_TOOLS = [
  'ChatGPT',
  'Claude',
  'GitHub Copilot',
  'Jasper',
  'Midjourney',
  'DALL-E',
  'Stable Diffusion',
  'Google Bard',
  'Microsoft Copilot',
  'Other',
]

export const ESCALATION_CONTACTS = [
  { value: 'IT Security Lead', label: 'IT Security Lead' },
  { value: 'Data Protection Officer', label: 'Data Protection Officer' },
  { value: 'AI Governance Committee', label: 'AI Governance Committee' },
  { value: 'Legal Counsel', label: 'Legal Counsel' },
  { value: 'Executive Leadership', label: 'Executive Leadership' },
]
