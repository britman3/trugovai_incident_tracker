# TruGovAI™ AI Incident Tracker
#— Authoritative Specification

This document is the single source of truth for this application.

## Mandatory Implementation Rules

The implementing agent MUST follow these rules:

1. Implement the application exactly as specified in this document.
2. Do NOT invent features, screens, fields, workflows, or data models.
3. Do NOT remove, simplify, or reinterpret any requirement.
4. Do NOT change the tech stack, libraries, or architecture unless explicitly required to make the app run.
5. If any requirement is ambiguous or technically conflicting, STOP and ask a clarification question before proceeding.
6. Build incrementally and confirm completion of each major section before moving on.
7. If assumptions conflict with this document, THIS DOCUMENT WINS.

## Scope Control

- This specification defines **v1 only**.
- Features listed under *Future Considerations* must NOT be implemented.
- Assume a **single-organisation context** (no multi-tenancy UI or logic in v1).

## Authority & Compliance

- File name: `SPEC.md`
- Status: **Authoritative / Contractual**
- Any deviation from this document is considered an error.

Proceed only after confirming full understanding of this specification.
## Project Overview

Build a web application for logging, managing, and analysing AI-related incidents. Users log incidents via structured forms, follow guided response workflows, track resolution progress, and conduct post-incident reviews. A dashboard shows incident trends, problematic tools, and response time metrics.

**Target users:** IT managers, compliance officers, AI governance committees, incident responders  
**Core value:** Replace spreadsheet-based incident tracking with a structured, auditable system that provides regulatory defensibility and feeds back into risk scoring

---

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS  
- **Backend:** Node.js + Express (or Next.js API routes)  
- **Database:** PostgreSQL (with Prisma ORM)  
- **Auth:** NextAuth.js or Clerk (email/password + Google SSO)  
- **Charts:** Recharts (bar charts, line charts, pie charts)  
- **Notifications:** Email via SendGrid/Resend + optional Slack webhook  
- **Export:** jsPDF + html2canvas for PDF generation

---

## Brand Guidelines

### Colours (use these exact hex values)

```css  
:root {  
  /* Primary */  
  --navy: #0F2A3A;        /* Primary background, headers */  
  --teal: #1AA7A1;        /* Primary accent, buttons, links */  
  --ice: #F4F7F9;         /* Light background */  
    
  /* Secondary */  
  --slate700: #4C5D6B;    /* Body text on light backgrounds */  
  --mint300: #71D1C8;     /* Charts, secondary accent */  
    
  /* Severity Colours */  
  --critical: #DC2626;    /* Critical - Red 600 */  
  --high: #FF6B6B;        /* High - Coral */  
  --medium: #F59E0B;      /* Medium - Amber */  
  --low: #7BC96F;         /* Low - Lime */  
    
  /* Status Colours */  
  --open: #FF6B6B;        /* Open incidents */  
  --inProgress: #F59E0B;  /* Under investigation */  
  --resolved: #7BC96F;    /* Resolved */  
  --closed: #6B7280;      /* Closed (grey) */  
    
  /* UI */  
  --radius: 14px;  
  --shadow: 0 8px 24px rgba(0,0,0,0.08);  
}  
```

### Typography  
- **Primary font:** Inter (fallback: system-ui, sans-serif)  
- **Scale:** H1 44px | H2 32px | H3 24px | Body 16px | Small 14px  
- **Mono (for IDs/timestamps):** JetBrains Mono

### Component Style  
- Buttons: 12px/16px padding, 8px radius, bold 16px text  
- Cards: 14px radius, subtle shadow, white background on ice  
- Status badges: Pill shape, colour-coded per status  
- Severity badges: Bold background colour with white text

---

## Incident Classification Framework

### Severity Levels

| Level | Name | Response Time | Description |
|-------|------|---------------|-------------|
| 1 | Critical | < 1 hour | Data breach, regulatory violation, reputational crisis |
| 2 | High | < 4 hours | Significant data exposure, compliance risk, service outage |
| 3 | Medium | < 24 hours | Policy violation, minor data leak, operational disruption |
| 4 | Low | < 72 hours | Near-miss, policy reminder needed, process improvement |

### Incident Categories

| Category | Examples |
|----------|----------|
| Data Leakage | Customer data entered into AI, PII exposure, confidential info shared |
| Compliance Violation | GDPR breach, EU AI Act violation, contractual breach |
| Security Incident | Unauthorised access, credential exposure, malware via AI |
| Bias/Discrimination | Biased output, discriminatory decision, unfair treatment |
| Misinformation | AI hallucination used in business decision, false information published |
| Operational Failure | AI tool outage, incorrect output causing errors, workflow disruption |
| Policy Violation | Unapproved tool usage, bypassing controls, ignoring guidelines |
| Vendor Issue | Vendor breach, SLA failure, contract violation by vendor |

### Incident Status Workflow

```
[Open] → [In Progress] → [Resolved] → [Closed]
                ↓              ↓
           [Escalated]    [Reopened]
```

---

## Data Model

### Incident (core entity)

```typescript  
interface Incident {  
  id: string;                    // UUID  
  incidentNumber: string;        // Human-readable: INC-2026-0001  
  organisationId: string;  
    
  // Classification  
  severity: Severity;            // 1-4  
  category: IncidentCategory;  
  status: IncidentStatus;  
    
  // Description  
  title: string;                 // Brief summary  
  description: string;           // Full details  
  affectedTool: string;          // AI tool involved (link to Inventory)  
  affectedToolId?: string;       // Optional FK to AI Tool Inventory  
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
  relatedIncidents: string[];    // IDs of related incidents  
    
  createdAt: Date;  
  updatedAt: Date;  
}

interface ActivityLogEntry {  
  id: string;  
  incidentId: string;  
  timestamp: Date;  
  action: ActivityAction;  
  performedBy: string;  
  details: string;  
  previousValue?: string;  
  newValue?: string;  
}

interface Attachment {  
  id: string;  
  filename: string;  
  url: string;  
  uploadedBy: string;  
  uploadedAt: Date;  
  size: number;  
}

enum Severity {  
  Critical = 1,  
  High = 2,  
  Medium = 3,  
  Low = 4  
}

enum IncidentCategory {  
  DataLeakage = "Data Leakage",  
  ComplianceViolation = "Compliance Violation",  
  SecurityIncident = "Security Incident",  
  BiasDicrimination = "Bias/Discrimination",  
  Misinformation = "Misinformation",  
  OperationalFailure = "Operational Failure",  
  PolicyViolation = "Policy Violation",  
  VendorIssue = "Vendor Issue"  
}

enum IncidentStatus {  
  Open = "Open",  
  InProgress = "In Progress",  
  Escalated = "Escalated",  
  Resolved = "Resolved",  
  Reopened = "Reopened",  
  Closed = "Closed"  
}

enum BusinessImpact {  
  None = "None",  
  Minor = "Minor",  
  Moderate = "Moderate",  
  Major = "Major",  
  Severe = "Severe"  
}

enum ActivityAction {  
  Created = "Created",  
  Updated = "Updated",  
  StatusChanged = "Status Changed",  
  Assigned = "Assigned",  
  Escalated = "Escalated",  
  CommentAdded = "Comment Added",  
  AttachmentAdded = "Attachment Added",  
  Resolved = "Resolved",  
  Closed = "Closed",  
  Reopened = "Reopened"  
}

enum DataType {  
  CustomerData = "Customer Data",  
  FinancialData = "Financial Data",  
  EmployeeData = "Employee Data",  
  InternalCode = "Internal Code",  
  PublicData = "Public Data",  
  Other = "Other"  
}

enum Department {  
  Marketing = "Marketing",  
  HR = "HR",  
  IT = "IT",  
  Finance = "Finance",  
  Operations = "Operations",  
  Legal = "Legal",  
  Other = "Other"  
}  
```

### Post-Incident Review (PIR)

```typescript  
interface PostIncidentReview {  
  id: string;  
  incidentId: string;  
  conductedBy: string;  
  conductedAt: Date;  
    
  // Analysis  
  whatHappened: string;  
  whyItHappened: string;         // Root cause analysis  
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

interface PIRActionItem {  
  id: string;  
  pirId: string;  
  title: string;  
  description: string;  
  assignedTo: string;  
  dueDate: Date;  
  status: ActionItemStatus;  
  completedAt?: Date;  
}

enum PIRStatus {  
  Draft = "Draft",  
  InReview = "In Review",  
  Approved = "Approved"  
}

enum ActionItemStatus {  
  Pending = "Pending",  
  InProgress = "In Progress",  
  Completed = "Completed",  
  Overdue = "Overdue"  
}  
```

---

## SLA Calculations

```typescript  
interface SLAConfig {  
  [Severity.Critical]: { responseTime: 1, resolutionTarget: 24 },    // hours  
  [Severity.High]: { responseTime: 4, resolutionTarget: 48 },  
  [Severity.Medium]: { responseTime: 24, resolutionTarget: 168 },    // 1 week  
  [Severity.Low]: { responseTime: 72, resolutionTarget: 336 }        // 2 weeks  
}

function calculateSLAStatus(incident: Incident): SLAStatus {  
  const config = SLAConfig[incident.severity];  
  const now = new Date();  
  const reportedAt = new Date(incident.reportedAt);  
    
  const hoursElapsed = (now.getTime() - reportedAt.getTime()) / (1000 * 60 * 60);  
    
  // Response SLA  
  const responseDeadline = config.responseTime;  
  const acknowledged = incident.acknowledgedAt !== null;  
  const responseSLABreached = !acknowledged && hoursElapsed > responseDeadline;  
    
  // Resolution SLA  
  const resolutionDeadline = config.resolutionTarget;  
  const resolved = incident.resolvedAt !== null;  
  const resolutionSLABreached = !resolved && hoursElapsed > resolutionDeadline;  
    
  return {  
    responseDeadline,  
    resolutionDeadline,  
    hoursElapsed: Math.round(hoursElapsed),  
    acknowledged,  
    resolved,  
    responseSLABreached,  
    resolutionSLABreached,  
    overallStatus: responseSLABreached || resolutionSLABreached ? 'Breached' : 'On Track'  
  };  
}  
```

---

## Features & Screens

### 1. Dashboard (Home)

**Purpose:** Executive overview of incident landscape and response performance

**Components:**  
- **Summary Cards (top row):**  
  - Open Incidents (count, breakdown by severity)  
  - SLA Breaches (count, percentage of total)  
  - Mean Time to Resolve (hours, trend arrow)  
  - Incidents This Month (vs. previous month)

- **Incidents by Status (donut chart):**  
  - Slices: Open, In Progress, Escalated, Resolved, Closed  
  - Colour-coded per status  
  - Click to filter incident list

- **Severity Distribution (bar chart):**  
  - X-axis: Severity levels  
  - Y-axis: Count  
  - Colour-coded bars

- **Incidents Over Time (line chart):**  
  - X-axis: Months (last 12)  
  - Y-axis: Count  
  - Multiple lines: Total, By Category (toggle)

- **Most Problematic Tools (table):**  
  - Top 5 AI tools by incident count  
  - Columns: Tool Name, Incident Count, Last Incident Date  
  - Links to filtered view

- **Recent Incidents (table):**  
  - Last 10 incidents  
  - Columns: ID, Title, Severity, Status, Reported, Assigned  
  - Quick actions: View, Assign

- **SLA Performance (gauge or KPI):**  
  - % incidents resolved within SLA  
  - Target line (e.g., 95%)  
  - Trend indicator

### 2. Incident List

**Purpose:** Full CRUD management of incidents

**Features:**  
- **Search bar:** Filter by ID, title, description  
- **Filter dropdowns:**  
  - Status (multi-select)  
  - Severity (multi-select)  
  - Category (multi-select)  
  - Assigned To  
  - Affected Tool  
  - Date Range  
- **Sort:** By date, severity, status, SLA status  
- **Bulk actions:** Assign selected, Close selected, Export selected

**Table columns:**  
| ID | Title | Severity | Category | Status | Assigned | Reported | SLA | Actions |

- Severity column shows coloured badge  
- Status column shows coloured pill  
- SLA column shows "On Track" (green) or "Breached" (red)  
- Actions: View, Edit, Assign

**"Report Incident" button** → Opens form

### 3. Report Incident Form

**Purpose:** Structured incident intake

**Layout:** Single-page form with clear sections

**Section 1: Incident Details**  
- Title (required, text, max 100 chars)  
- Description (required, textarea, markdown supported)  
- Category (required, dropdown)  
- Severity (required, dropdown with descriptions)

**Section 2: Context**  
- Affected AI Tool (dropdown from Inventory + "Other" with text field)  
- Affected Departments (multi-select checkboxes)  
- Data Types Involved (multi-select checkboxes)

**Section 3: Reporter**  
- Reported By (auto-filled from logged-in user)  
- Reporter Email (auto-filled)  
- Additional Contacts (optional, comma-separated emails)

**Section 4: Attachments (optional)**  
- Drag-and-drop file upload  
- Accept: images, PDFs, docs, logs  
- Max 10MB per file, 5 files total

**Submit Actions:**  
- "Report Incident" → Creates with status "Open"  
- "Report & Assign to Me" → Creates and auto-assigns

**Post-Submit:**  
- Success message with incident number  
- Email notification to reporter  
- If Critical: immediate Slack/email alert to on-call

### 4. Incident Detail View

**Purpose:** Full view of single incident with all context and actions

**Layout:** Two-column: Main content (left), Sidebar (right)

**Main Content:**  
- **Header:**  
  - Incident number + Title  
  - Severity badge + Status badge  
  - Reported date + Assigned to

- **Description Card:**  
  - Full description (markdown rendered)  
  - Category  
  - Affected tool  
  - Departments  
  - Data types

- **SLA Status Card:**  
  - Response SLA: Met/Breached with time  
  - Resolution SLA: On Track/At Risk/Breached with remaining time  
  - Visual timeline

- **Response Section (collapsible, expanded when in progress):**  
  - Immediate Actions Taken (textarea)  
  - Root Cause (textarea)  
  - Resolution (textarea)  
  - Preventive Measures (textarea)

- **Impact Assessment Card:**  
  - Business Impact (dropdown)  
  - Data Subjects Affected (number)  
  - Financial Impact (currency)  
  - Regulatory Notification Required (checkbox)

- **Activity Log (timeline):**  
  - Chronological list of all actions  
  - Each entry: timestamp, actor, action, details  
  - Add Comment (textarea + submit)

- **Attachments:**  
  - List of files with download links  
  - Add more attachments

**Sidebar:**  
- **Quick Actions:**  
  - Change Status (dropdown)  
  - Assign/Reassign (dropdown)  
  - Escalate (button, opens modal)  
  - Link Related Incident (button)

- **Post-Incident Review:**  
  - "Create PIR" button (if Resolved/Closed)  
  - Link to PIR if exists

- **Related Incidents:**  
  - List of linked incidents  
  - Add link button

- **Tags:**  
  - Current tags  
  - Add/remove tags

### 5. Escalation Modal

**Purpose:** Formal escalation with context

**Fields:**  
- Escalate To (dropdown: predefined escalation contacts)  
- Escalation Reason (required, textarea)  
- Requested Actions (textarea)

**Actions:**  
- Submit → Changes status to "Escalated", sends notification  
- Cancel

### 6. Post-Incident Review Form

**Purpose:** Structured retrospective after incident resolution

**Trigger:** Available when incident is Resolved or Closed

**Sections:**  
- **What Happened**  
  - Summary of the incident (pre-filled from incident)  
  - Editable timeline of events

- **Root Cause Analysis**  
  - Why did this happen? (textarea)  
  - Contributing factors (checkboxes + text)

- **Response Evaluation**  
  - What went well? (textarea)  
  - What could improve? (textarea)

- **Action Items**  
  - Dynamic list: Add action item  
  - Each: Title, Description, Assignee, Due Date

- **Lessons Learned**  
  - Key takeaways (textarea)  
  - Policy changes needed? (yes/no + details)  
  - Training needed? (yes/no + details)

**Actions:**  
- Save Draft  
- Submit for Review (changes PIR status)  
- Approve (for reviewers)

### 7. Analytics & Reporting

**Purpose:** Deep-dive into incident trends and patterns

**Tabs:**

**Overview:**  
- Incident volume trend (line chart)  
- Category breakdown (pie chart)  
- Severity breakdown (pie chart)  
- MTTR trend (line chart)

**SLA Performance:**  
- SLA compliance rate over time  
- Breakdown by severity  
- Breaches by category/tool

**Tool Analysis:**  
- Incidents per AI tool (bar chart)  
- Tool risk correlation (scatter plot: incidents vs. risk score)  
- Problematic tool trends

**Root Cause Analysis:**  
- Common root causes (word cloud or bar chart)  
- Root causes by category

**Time-Based:**  
- Incidents by day of week  
- Incidents by hour (heat map)  
- Seasonal patterns

**Filters (apply to all views):**  
- Date range  
- Category  
- Severity  
- Tool  
- Department

**Export:**  
- Export current view as PNG  
- Export data as CSV  
- Generate full analytics report (PDF)

### 8. Export/Reports

**Features:**  
- **Export Incidents:** CSV or Excel of all/filtered incidents  
- **Export Single Incident:** PDF with full details  
- **Export PIR:** PDF of post-incident review  
- **Generate Management Report:**  
  - Date range selection  
  - Includes: summary stats, charts, top incidents, SLA performance  
  - Branded TruGovAI™ header/footer

---

## User Flows

### Reporting an Incident  
1. User clicks "Report Incident"  
2. Fills in details: title, description, category, severity  
3. Selects affected tool from dropdown  
4. Checks relevant data types and departments  
5. Optionally attaches evidence (screenshots, logs)  
6. Submits incident  
7. System assigns incident number (INC-2026-0001)  
8. Notification sent to incident owner/queue  
9. User sees confirmation with incident link

### Responding to Critical Incident  
1. Alert received (email + Slack)  
2. Responder opens incident  
3. Acknowledges incident (status → In Progress)  
4. Documents immediate actions  
5. Investigates and documents root cause  
6. Implements resolution  
7. Updates resolution field  
8. Changes status to Resolved  
9. SLA metrics captured automatically

### Conducting Post-Incident Review  
1. Incident is Resolved  
2. Owner clicks "Create PIR"  
3. Pre-filled data from incident  
4. Completes root cause analysis  
5. Adds action items with assignees  
6. Documents lessons learned  
7. Submits for review  
8. Reviewer approves PIR  
9. Action items tracked to completion

### Monthly Incident Review (Management)  
1. Manager opens Analytics tab  
2. Selects previous month date range  
3. Reviews incident volume and trends  
4. Checks SLA performance  
5. Identifies problematic tools  
6. Generates management report PDF  
7. Presents to governance committee

---

## API Endpoints

```  
# Incidents  
GET    /api/incidents                    # List all incidents (with filters)  
GET    /api/incidents/:id                # Get single incident with full details  
POST   /api/incidents                    # Create new incident  
PUT    /api/incidents/:id                # Update incident  
PATCH  /api/incidents/:id/status         # Update status only  
PATCH  /api/incidents/:id/assign         # Assign/reassign  
POST   /api/incidents/:id/escalate       # Escalate incident  
POST   /api/incidents/:id/comment        # Add comment  
POST   /api/incidents/:id/attachment     # Add attachment  
DELETE /api/incidents/:id                # Delete incident (admin only)

# Activity Log  
GET    /api/incidents/:id/activity       # Get activity log for incident

# Post-Incident Reviews  
GET    /api/pir                          # List all PIRs  
GET    /api/pir/:id                      # Get single PIR  
POST   /api/pir                          # Create PIR for incident  
PUT    /api/pir/:id                      # Update PIR  
PATCH  /api/pir/:id/status               # Change PIR status  
GET    /api/pir/:id/action-items         # Get action items  
PATCH  /api/pir/:id/action-items/:itemId # Update action item

# Dashboard  
GET    /api/dashboard/summary            # Summary stats  
GET    /api/dashboard/charts             # Chart data

# Analytics  
GET    /api/analytics/trends             # Incident trends over time  
GET    /api/analytics/sla                # SLA performance data  
GET    /api/analytics/tools              # Incidents by tool  
GET    /api/analytics/root-causes        # Root cause analysis

# Export  
GET    /api/export/incidents             # Export incidents as CSV  
GET    /api/export/incident/:id/pdf      # Export single incident as PDF  
GET    /api/export/pir/:id/pdf           # Export PIR as PDF  
GET    /api/export/management-report     # Generate management report PDF

# Notifications  
POST   /api/notifications/test           # Test notification channel  
```

---

## Notification Triggers

| Event | Recipients | Channels |
|-------|------------|----------|
| Critical incident reported | On-call team, Governance lead | Email + Slack |
| Incident assigned | Assignee | Email |
| Incident escalated | Escalation target | Email + Slack |
| SLA breach imminent (50% time) | Assignee | Email |
| SLA breached | Assignee + Manager | Email + Slack |
| Comment added | All watchers | Email |
| Status changed to Resolved | Reporter | Email |
| PIR action item overdue | Assignee | Email |

---

## Validation Rules

- Title: Required, 5-100 characters  
- Description: Required, 20-5000 characters  
- Category: Required, must be valid enum  
- Severity: Required, must be 1-4  
- Affected Tool: Required (either from inventory or "Other")  
- Data Types: At least one selected  
- Attachments: Max 10MB per file, 5 files total, allowed types: .jpg, .png, .pdf, .doc, .docx, .txt, .log  
- Comments: 1-2000 characters  
- Root Cause (on resolution): Required for Critical/High severity  
- Resolution: Required to change status to Resolved

---

## Sample Data (for testing)

```json  
[  
  {  
    "incidentNumber": "INC-2026-0001",  
    "title": "Customer data entered into ChatGPT",  
    "description": "Sales team member copied customer contract details including personal data into ChatGPT for summarisation. Approximately 50 customer records affected.",  
    "severity": 2,  
    "category": "Data Leakage",  
    "status": "Resolved",  
    "affectedTool": "ChatGPT",  
    "affectedDepartments": ["Sales"],  
    "dataTypesInvolved": ["Customer Data"],  
    "reportedBy": "Jane Smith",  
    "assignedTo": "Mike Chen",  
    "reportedAt": "2026-01-10T09:30:00Z",  
    "acknowledgedAt": "2026-01-10T10:15:00Z",  
    "resolvedAt": "2026-01-10T16:00:00Z",  
    "rootCause": "Lack of awareness about data classification rules when using AI tools",  
    "resolution": "Contacted OpenAI to request data deletion. Implemented additional training for sales team.",  
    "preventiveMeasures": "Adding data classification reminder to AI Acceptable Use Policy. Scheduling department-wide training."  
  },  
  {  
    "incidentNumber": "INC-2026-0002",  
    "title": "Unapproved AI tool discovered in Marketing",  
    "description": "Marketing team has been using Jasper AI without approval for 3 months. Tool has access to customer personas and campaign data.",  
    "severity": 3,  
    "category": "Policy Violation",  
    "status": "In Progress",  
    "affectedTool": "Jasper",  
    "affectedDepartments": ["Marketing"],  
    "dataTypesInvolved": ["Customer Data", "Internal Code"],  
    "reportedBy": "IT Audit",  
    "assignedTo": "Sarah Johnson",  
    "reportedAt": "2026-01-15T14:00:00Z",  
    "acknowledgedAt": "2026-01-15T14:30:00Z"  
  },  
  {  
    "incidentNumber": "INC-2026-0003",  
    "title": "AI-generated content contained factual error in client report",  
    "description": "Consultant used Claude to draft client report. AI hallucinated a regulatory requirement that doesn't exist. Client noticed before external publication.",  
    "severity": 3,  
    "category": "Misinformation",  
    "status": "Open",  
    "affectedTool": "Claude",  
    "affectedDepartments": ["Operations"],  
    "dataTypesInvolved": ["Public Data"],  
    "reportedBy": "Tom Davies",  
    "reportedAt": "2026-01-18T11:00:00Z"  
  },  
  {  
    "incidentNumber": "INC-2026-0004",  
    "title": "GitHub Copilot suggested code with security vulnerability",  
    "description": "Code suggestion included SQL injection vulnerability. Caught in code review before deployment.",  
    "severity": 4,  
    "category": "Security Incident",  
    "status": "Closed",  
    "affectedTool": "GitHub Copilot",  
    "affectedDepartments": ["IT"],  
    "dataTypesInvolved": ["Internal Code"],  
    "reportedBy": "Dev Team Lead",  
    "assignedTo": "Security Team",  
    "reportedAt": "2026-01-05T10:00:00Z",  
    "resolvedAt": "2026-01-05T12:00:00Z",  
    "closedAt": "2026-01-06T09:00:00Z",  
    "rootCause": "AI suggestion not validated against security standards",  
    "resolution": "Implemented mandatory security linting for all AI-suggested code",  
    "preventiveMeasures": "Updated coding standards to require security review of AI suggestions"  
  }  
]  
```

---

## Non-Functional Requirements

- **Performance:** Incident list loads in <2s with 1000+ incidents  
- **Responsiveness:** Works on desktop (primary), tablet (secondary)  
- **Accessibility:** WCAG 2.1 AA compliance  
- **Browser support:** Chrome, Firefox, Safari, Edge (latest 2 versions)  
- **Notifications:** Email delivery within 60 seconds for Critical  
- **Data retention:** Incidents retained for 7 years (regulatory requirement)  
- **Audit trail:** All changes logged with timestamp and actor

---

## Future Considerations (don't build now, but design for)

- Multi-tenancy (multiple organisations)  
- Integration with AI Tool Inventory (bi-directional risk updates)  
- Integration with external ticketing (Jira, ServiceNow)  
- Slack/Teams bot for incident reporting  
- AI-assisted incident categorisation  
- Automated playbook suggestions based on category  
- Regulatory reporting automation (ICO, etc.)  
- Mobile app for on-call responders

---

## Integration with TruGovAI™ Toolkit

The Incident Tracker connects to other toolkit components:

| Integration | Direction | Purpose |
|-------------|-----------|---------|
| AI Tool Inventory | Read | Lookup affected tools, auto-populate details |
| AI Tool Inventory | Write | Update tool risk score based on incident history |
| Risk Scoring Matrix | Read | Compare incident patterns to risk assessments |
| Maturity Model | Influence | Incident metrics affect Monitoring dimension score |
| Quarterly Audit | Feed | Incident data included in quarterly reviews |

### Risk Score Impact

When an incident is logged against a tool, consider:
- Increasing Likelihood score if incidents are recurring  
- Flagging for re-assessment if Critical incident occurs  
- Dashboard alert: "Tool X has had 3 incidents in 30 days"

---

## Success Criteria

1. User can report an incident in under 3 minutes  
2. Incident numbers auto-generate in sequence  
3. Status workflow enforces valid transitions  
4. SLA calculations are accurate to the hour  
5. Notifications deliver within 60 seconds (Critical)  
6. Activity log captures all changes with actor and timestamp  
7. Dashboard shows accurate real-time metrics  
8. PDF export generates clean, branded document  
9. Analytics load within 3 seconds for 12-month range  
10. Severity and status colours match spec exactly

---

## Getting Started

1. Set up Next.js project with TypeScript  
2. Configure Tailwind with brand colours and status colours  
3. Set up PostgreSQL + Prisma schema (Incident, Activity, PIR, ActionItem)  
4. Build incident number generator (INC-YYYY-NNNN)  
5. Build incident form with validation  
6. Build incident list with filters and search  
7. Build incident detail view with all sections  
8. Implement status workflow with transitions  
9. Build SLA calculation engine  
10. Set up email notifications (SendGrid/Resend)  
11. Build dashboard with charts (Recharts)  
12. Build analytics views  
13. Add PDF export  
14. Seed sample data  
15. Test and polish

---

*Part of the TruGovAI™ Toolkit — "Board-ready AI governance in 30 days"*
