// Enums
export enum Severity {
  Critical = 1,
  High = 2,
  Medium = 3,
  Low = 4,
}

export enum IncidentCategory {
  DataLeakage = "Data Leakage",
  ComplianceViolation = "Compliance Violation",
  SecurityIncident = "Security Incident",
  BiasDicrimination = "Bias/Discrimination",
  Misinformation = "Misinformation",
  OperationalFailure = "Operational Failure",
  PolicyViolation = "Policy Violation",
  VendorIssue = "Vendor Issue",
}

export enum IncidentStatus {
  Open = "Open",
  InProgress = "In Progress",
  Escalated = "Escalated",
  Resolved = "Resolved",
  Reopened = "Reopened",
  Closed = "Closed",
}

export enum BusinessImpact {
  None = "None",
  Minor = "Minor",
  Moderate = "Moderate",
  Major = "Major",
  Severe = "Severe",
}

export enum ActivityAction {
  Created = "Created",
  Updated = "Updated",
  StatusChanged = "Status Changed",
  Assigned = "Assigned",
  Escalated = "Escalated",
  CommentAdded = "Comment Added",
  AttachmentAdded = "Attachment Added",
  Resolved = "Resolved",
  Closed = "Closed",
  Reopened = "Reopened",
}

export enum DataType {
  CustomerData = "Customer Data",
  FinancialData = "Financial Data",
  EmployeeData = "Employee Data",
  InternalCode = "Internal Code",
  PublicData = "Public Data",
  Other = "Other",
}

export enum Department {
  Marketing = "Marketing",
  HR = "HR",
  IT = "IT",
  Finance = "Finance",
  Operations = "Operations",
  Legal = "Legal",
  Other = "Other",
}

export enum PIRStatus {
  Draft = "Draft",
  InReview = "In Review",
  Approved = "Approved",
}

export enum ActionItemStatus {
  Pending = "Pending",
  InProgress = "In Progress",
  Completed = "Completed",
  Overdue = "Overdue",
}

// Interfaces
export interface Incident {
  id: string;
  incidentNumber: string;
  organisationId: string;

  // Classification
  severity: Severity;
  category: IncidentCategory;
  status: IncidentStatus;

  // Description
  title: string;
  description: string;
  affectedTool: string;
  affectedToolId?: string;
  affectedDepartments: Department[];
  dataTypesInvolved: DataType[];

  // People
  reportedBy: string;
  reportedByEmail: string;
  assignedTo?: string;
  assignedToEmail?: string;
  escalatedTo?: string;

  // Timeline
  reportedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;

  // Response
  rootCause?: string;
  immediateActions?: string;
  resolution?: string;
  preventiveMeasures?: string;

  // Impact Assessment
  businessImpact?: BusinessImpact;
  dataSubjectsAffected?: number;
  financialImpact?: number;
  regulatoryNotificationRequired?: boolean;
  regulatoryNotificationDate?: Date;

  // Metadata
  tags: string[];
  attachments: Attachment[];
  activityLog: ActivityLogEntry[];
  relatedIncidents: string[];

  createdAt: Date;
  updatedAt: Date;
}

export interface ActivityLogEntry {
  id: string;
  incidentId: string;
  timestamp: Date;
  action: ActivityAction;
  performedBy: string;
  details: string;
  previousValue?: string;
  newValue?: string;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  uploadedBy: string;
  uploadedAt: Date;
  size: number;
}

export interface PostIncidentReview {
  id: string;
  incidentId: string;
  conductedBy: string;
  conductedAt: Date;

  // Analysis
  whatHappened: string;
  whyItHappened: string;
  whatWentWell: string;
  whatCouldImprove: string;

  // Action Items
  actionItems: PIRActionItem[];

  // Lessons Learned
  lessonsLearned: string;
  policyChangesNeeded: boolean;
  trainingNeeded: boolean;

  status: PIRStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface PIRActionItem {
  id: string;
  pirId: string;
  title: string;
  description: string;
  assignedTo: string;
  dueDate: Date;
  status: ActionItemStatus;
  completedAt?: Date;
}

// SLA Configuration
export interface SLAConfig {
  responseTime: number; // hours
  resolutionTarget: number; // hours
}

export const SLA_CONFIG: Record<Severity, SLAConfig> = {
  [Severity.Critical]: { responseTime: 1, resolutionTarget: 24 },
  [Severity.High]: { responseTime: 4, resolutionTarget: 48 },
  [Severity.Medium]: { responseTime: 24, resolutionTarget: 168 }, // 1 week
  [Severity.Low]: { responseTime: 72, resolutionTarget: 336 }, // 2 weeks
};

export interface SLAStatus {
  responseDeadline: number;
  resolutionDeadline: number;
  hoursElapsed: number;
  acknowledged: boolean;
  resolved: boolean;
  responseSLABreached: boolean;
  resolutionSLABreached: boolean;
  overallStatus: 'On Track' | 'Breached';
}

// Form Types
export interface CreateIncidentInput {
  title: string;
  description: string;
  category: IncidentCategory;
  severity: Severity;
  affectedTool: string;
  affectedToolId?: string;
  affectedDepartments: Department[];
  dataTypesInvolved: DataType[];
  reportedBy: string;
  reportedByEmail: string;
  tags?: string[];
}

export interface UpdateIncidentInput {
  title?: string;
  description?: string;
  category?: IncidentCategory;
  severity?: Severity;
  status?: IncidentStatus;
  affectedTool?: string;
  affectedToolId?: string;
  affectedDepartments?: Department[];
  dataTypesInvolved?: DataType[];
  assignedTo?: string;
  assignedToEmail?: string;
  rootCause?: string;
  immediateActions?: string;
  resolution?: string;
  preventiveMeasures?: string;
  businessImpact?: BusinessImpact;
  dataSubjectsAffected?: number;
  financialImpact?: number;
  regulatoryNotificationRequired?: boolean;
  regulatoryNotificationDate?: Date;
  tags?: string[];
}

export interface EscalateIncidentInput {
  escalateTo: string;
  escalationReason: string;
  requestedActions?: string;
}

// Dashboard Types
export interface DashboardSummary {
  openIncidents: number;
  openBySeverity: Record<string, number>;
  slaBreaches: number;
  slaBreachPercentage: number;
  meanTimeToResolve: number;
  mttrTrend: 'up' | 'down' | 'stable';
  incidentsThisMonth: number;
  incidentsPreviousMonth: number;
}

export interface ChartData {
  statusDistribution: { name: string; value: number; color: string }[];
  severityDistribution: { severity: string; count: number; color: string }[];
  incidentsOverTime: { month: string; total: number }[];
  problematicTools: { name: string; count: number; lastIncident: string }[];
  recentIncidents: Incident[];
  slaPerformance: number;
}

// Filter Types
export interface IncidentFilters {
  status?: IncidentStatus[];
  severity?: Severity[];
  category?: IncidentCategory[];
  assignedTo?: string;
  affectedTool?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}
