# AUDIT.md — TruGovAI™ AI Incident Tracker

**Audit date:** 2026-02-16
**Auditor:** Automated (Claude)
**Repository:** `trugovai_incident_tracker`
**Branch audited:** `claude/create-audit-docs-5SFfd`

---

> **Important note:** This repository currently contains **no implementation code**. It holds only a `README.md` and a comprehensive specification document (`spec.md`, 928 lines). All sections below document (a) what physically exists in the repo and (b) what is specified in `spec.md` as planned.

---

## 1. Branch Info

### All branches found

| Branch | Location | Files |
|--------|----------|-------|
| `master` | local | `README.md`, `spec.md` |
| `origin/main` | remote | `README.md`, `spec.md` |
| `claude/create-audit-docs-5SFfd` | local + remote | `README.md`, `spec.md`, `AUDIT.md` |

### Which branch contains the code?

**None.** No branch contains application code. All branches hold only documentation files (`README.md` and `spec.md`). There is no `src/` directory, no `package.json`, no `prisma/` folder, and no implementation code anywhere in the repository.

Total commits across all branches: **3** (Initial commit, spec upload, this audit).

---

## 2. Tech Stack

### Current state

No `package.json` exists. No dependencies are installed. No framework has been initialised.

### Specified in `spec.md`

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend | React + TypeScript + Tailwind CSS | — |
| Backend | Node.js + Express **or** Next.js API routes | Next.js preferred per Getting Started |
| Database | PostgreSQL | — |
| ORM | Prisma | — |
| Auth | NextAuth.js or Clerk | Email/password + Google SSO |
| Charts | Recharts | Bar, line, pie, donut, scatter, heat map |
| Notifications | SendGrid or Resend (email) + Slack webhook | — |
| PDF Export | jsPDF + html2canvas | — |

**No `package.json` — no dependency versions to list.**

---

## 3. Database Schema

### Current state

No `prisma/schema.prisma`, no SQL migration files, no database configuration exists.

### Specified in `spec.md`

The spec defines TypeScript interfaces (not a Prisma schema). The intended models are:

#### Model: `Incident` (core entity)

| Field | Type | Notes |
|-------|------|-------|
| id | string (UUID) | Primary key |
| incidentNumber | string | Human-readable: `INC-2026-0001` |
| organisationId | string | Organisation FK |
| severity | enum Severity (1–4) | Critical, High, Medium, Low |
| category | enum IncidentCategory | 8 values (see below) |
| status | enum IncidentStatus | Open, In Progress, Escalated, Resolved, Reopened, Closed |
| title | string | Brief summary |
| description | string | Full details |
| affectedTool | string | AI tool name |
| affectedToolId | string? | Optional FK to AI Tool Inventory |
| affectedDepartments | Department[] | Multi-select |
| dataTypesInvolved | DataType[] | Multi-select |
| reportedBy | string | Reporter name |
| reportedByEmail | string | Reporter email |
| assignedTo | string? | Assignee name |
| assignedToEmail | string? | Assignee email |
| escalatedTo | string? | Escalation target |
| reportedAt | Date | — |
| acknowledgedAt | Date? | — |
| resolvedAt | Date? | — |
| closedAt | Date? | — |
| rootCause | string? | — |
| immediateActions | string? | — |
| resolution | string? | — |
| preventiveMeasures | string? | — |
| businessImpact | enum BusinessImpact? | None, Minor, Moderate, Major, Severe |
| dataSubjectsAffected | number? | — |
| financialImpact | number? | Currency amount |
| regulatoryNotificationRequired | boolean? | — |
| regulatoryNotificationDate | Date? | — |
| tags | string[] | — |
| attachments | Attachment[] | Relation |
| activityLog | ActivityLogEntry[] | Relation |
| relatedIncidents | string[] | IDs of related incidents |
| createdAt | Date | — |
| updatedAt | Date | — |

#### Model: `ActivityLogEntry`

| Field | Type | Notes |
|-------|------|-------|
| id | string | PK |
| incidentId | string | FK → Incident |
| timestamp | Date | — |
| action | enum ActivityAction | 10 values |
| performedBy | string | — |
| details | string | — |
| previousValue | string? | — |
| newValue | string? | — |

#### Model: `Attachment`

| Field | Type | Notes |
|-------|------|-------|
| id | string | PK |
| filename | string | — |
| url | string | — |
| uploadedBy | string | — |
| uploadedAt | Date | — |
| size | number | Bytes |

#### Model: `PostIncidentReview`

| Field | Type | Notes |
|-------|------|-------|
| id | string | PK |
| incidentId | string | FK → Incident |
| conductedBy | string | — |
| conductedAt | Date | — |
| whatHappened | string | — |
| whyItHappened | string | Root cause analysis |
| whatWentWell | string | — |
| whatCouldImprove | string | — |
| actionItems | PIRActionItem[] | Relation |
| lessonsLearned | string | — |
| policyChangesNeeded | boolean | — |
| trainingNeeded | boolean | — |
| status | enum PIRStatus | Draft, In Review, Approved |
| createdAt | Date | — |
| updatedAt | Date | — |

#### Model: `PIRActionItem`

| Field | Type | Notes |
|-------|------|-------|
| id | string | PK |
| pirId | string | FK → PostIncidentReview |
| title | string | — |
| description | string | — |
| assignedTo | string | — |
| dueDate | Date | — |
| status | enum ActionItemStatus | Pending, In Progress, Completed, Overdue |
| completedAt | Date? | — |

#### Enums

| Enum | Values |
|------|--------|
| Severity | Critical (1), High (2), Medium (3), Low (4) |
| IncidentCategory | Data Leakage, Compliance Violation, Security Incident, Bias/Discrimination, Misinformation, Operational Failure, Policy Violation, Vendor Issue |
| IncidentStatus | Open, In Progress, Escalated, Resolved, Reopened, Closed |
| BusinessImpact | None, Minor, Moderate, Major, Severe |
| ActivityAction | Created, Updated, Status Changed, Assigned, Escalated, Comment Added, Attachment Added, Resolved, Closed, Reopened |
| DataType | Customer Data, Financial Data, Employee Data, Internal Code, Public Data, Other |
| Department | Marketing, HR, IT, Finance, Operations, Legal, Other |
| PIRStatus | Draft, In Review, Approved |
| ActionItemStatus | Pending, In Progress, Completed, Overdue |

### DATABASE_URL format (specified)

Not configured. Expected format for PostgreSQL + Prisma:

```
DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST>:<PORT>/<DATABASE>?schema=public"
```

---

## 4. All Pages & Screens

### Current state

No `src/app/`, `src/pages/`, or any source directory exists.

### Specified in `spec.md`

#### Frontend pages (8 screens defined)

| # | Screen | Description |
|---|--------|-------------|
| 1 | Dashboard (Home) | Executive overview: summary cards, donut chart (status), bar chart (severity), line chart (trends), problematic tools table, recent incidents, SLA gauge |
| 2 | Incident List | Full CRUD table with search, multi-select filters, sort, bulk actions, and "Report Incident" button |
| 3 | Report Incident Form | Structured intake form: 4 sections (details, context, reporter, attachments), validation, post-submit notifications |
| 4 | Incident Detail View | Two-column layout: main content (description, SLA, response, impact, activity log, attachments) + sidebar (quick actions, PIR link, related, tags) |
| 5 | Escalation Modal | Modal dialog: escalate-to dropdown, reason, requested actions |
| 6 | Post-Incident Review Form | Retrospective form: what happened, root cause, response evaluation, action items, lessons learned |
| 7 | Analytics & Reporting | Tabbed view: Overview, SLA Performance, Tool Analysis, Root Cause Analysis, Time-Based; filters apply to all tabs |
| 8 | Export/Reports | CSV/Excel incident export, single incident PDF, PIR PDF, management report PDF |

#### API routes (30+ endpoints defined)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/incidents` | List all incidents (with filters) |
| GET | `/api/incidents/:id` | Get single incident with full details |
| POST | `/api/incidents` | Create new incident |
| PUT | `/api/incidents/:id` | Update incident |
| PATCH | `/api/incidents/:id/status` | Update status only |
| PATCH | `/api/incidents/:id/assign` | Assign/reassign |
| POST | `/api/incidents/:id/escalate` | Escalate incident |
| POST | `/api/incidents/:id/comment` | Add comment |
| POST | `/api/incidents/:id/attachment` | Add attachment |
| DELETE | `/api/incidents/:id` | Delete incident (admin only) |
| GET | `/api/incidents/:id/activity` | Get activity log for incident |
| GET | `/api/pir` | List all PIRs |
| GET | `/api/pir/:id` | Get single PIR |
| POST | `/api/pir` | Create PIR for incident |
| PUT | `/api/pir/:id` | Update PIR |
| PATCH | `/api/pir/:id/status` | Change PIR status |
| GET | `/api/pir/:id/action-items` | Get action items |
| PATCH | `/api/pir/:id/action-items/:itemId` | Update action item |
| GET | `/api/dashboard/summary` | Summary stats |
| GET | `/api/dashboard/charts` | Chart data |
| GET | `/api/analytics/trends` | Incident trends over time |
| GET | `/api/analytics/sla` | SLA performance data |
| GET | `/api/analytics/tools` | Incidents by tool |
| GET | `/api/analytics/root-causes` | Root cause analysis |
| GET | `/api/export/incidents` | Export incidents as CSV |
| GET | `/api/export/incident/:id/pdf` | Export single incident as PDF |
| GET | `/api/export/pir/:id/pdf` | Export PIR as PDF |
| GET | `/api/export/management-report` | Generate management report PDF |
| POST | `/api/notifications/test` | Test notification channel |

---

## 5. All Components

### Current state

No `src/components/` directory exists. **Zero component files.**

### Specified in `spec.md`

The spec does not list individual component filenames. Based on the screen definitions, the following components would need to be built:

- Summary cards (open incidents, SLA breaches, MTTR, monthly count)
- Donut chart (incidents by status)
- Bar chart (severity distribution)
- Line chart (incidents over time)
- Problematic tools table
- Recent incidents table
- SLA performance gauge/KPI
- Incident list table with filters, search, sort, bulk actions
- Report incident form (4-section structured form)
- Incident detail view (two-column layout)
- SLA status card with visual timeline
- Activity log timeline
- Escalation modal
- Post-Incident Review form
- Analytics tabs (overview, SLA, tool analysis, root cause, time-based)
- Export/report generation components
- Severity badge (colour-coded)
- Status badge (pill, colour-coded)
- File upload (drag-and-drop)

---

## 6. Business Logic

### Current state

No source code files exist. All logic below is **specified but not implemented**.

### SLA Calculation (from `spec.md`)

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

### Risk Score Impact (specified)

- Increase Likelihood score if incidents are recurring against a tool
- Flag for re-assessment if Critical incident occurs
- Dashboard alert: "Tool X has had 3 incidents in 30 days"

### Export features (specified)

| Feature | Format | Library |
|---------|--------|---------|
| Export incidents list | CSV / Excel | Not specified (likely `papaparse` or similar) |
| Export single incident | PDF | jsPDF + html2canvas |
| Export PIR | PDF | jsPDF + html2canvas |
| Management report | PDF | jsPDF + html2canvas (branded TruGovAI™ header/footer) |
| Export analytics view | PNG | Not specified |

### Integrations (specified)

| Integration | Direction | Purpose |
|-------------|-----------|---------|
| AI Tool Inventory | Read | Lookup affected tools, auto-populate details |
| AI Tool Inventory | Write | Update tool risk score based on incident history |
| Risk Scoring Matrix | Read | Compare incident patterns to risk assessments |
| Maturity Model | Influence | Incident metrics affect Monitoring dimension score |
| Quarterly Audit | Feed | Incident data included in quarterly reviews |

### Email / Notification features (specified)

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

Libraries: SendGrid or Resend for email, Slack incoming webhook for Slack.

---

## 7. Auth & Multi-tenancy

### Current state

No authentication code exists.

### Specified in `spec.md`

- **Authentication:** NextAuth.js or Clerk — email/password + Google SSO
- **Multi-tenancy:** Explicitly scoped out for v1. "Assume a single-organisation context (no multi-tenancy UI or logic in v1)."
- **User roles:** Not explicitly defined in the spec, though `DELETE /api/incidents/:id` is noted as "admin only"
- **Organisation ID:** Present on the Incident model (`organisationId: string`), suggesting future multi-tenancy readiness

---

## 8. Config

### Current state

No configuration files exist. No `.env`, `.env.example`, `next.config.js`, `Dockerfile`, `docker-compose.yml`, `tailwind.config.js`, or `tsconfig.json`.

### Port

Not specified. Default Next.js port would be `3000`.

### Environment variables needed (inferred from spec)

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` or Clerk keys | Auth provider config |
| `NEXTAUTH_URL` | Auth callback URL |
| `GOOGLE_CLIENT_ID` | Google SSO |
| `GOOGLE_CLIENT_SECRET` | Google SSO |
| `SENDGRID_API_KEY` or `RESEND_API_KEY` | Email notifications |
| `SLACK_WEBHOOK_URL` | Slack notifications |

### Docker config

None exists.

---

## 9. Lines of Code

```
$ find src -name "*.tsx" -o -name "*.ts" | xargs wc -l | tail -1
```

**Result:** No `src/` directory exists. **0 lines of TypeScript/TSX code.**

The repository contains only:

| File | Lines | Size |
|------|-------|------|
| `README.md` | 1 | 27 bytes |
| `spec.md` | 928 | 29,100 bytes |
| **Total** | **929** | **29,127 bytes** |

---

## 10. UI Patterns

### Current state

No UI code exists. All patterns below are **specified in `spec.md` but not implemented**.

### Navigation style (specified)

Not explicitly defined. The spec references 8 distinct screens including a Dashboard (Home), suggesting a sidebar or top-nav layout. The spec does not prescribe a specific navigation pattern.

### Chart library (specified)

**Recharts** — bar charts, line charts, pie charts, donut charts, scatter plots, heat maps, gauges.

### Brand colours (exact hex values from `spec.md`)

#### Primary

| Name | Hex | Usage |
|------|-----|-------|
| Navy | `#0F2A3A` | Primary background, headers |
| Teal | `#1AA7A1` | Primary accent, buttons, links |
| Ice | `#F4F7F9` | Light background |

#### Secondary

| Name | Hex | Usage |
|------|-----|-------|
| Slate 700 | `#4C5D6B` | Body text on light backgrounds |
| Mint 300 | `#71D1C8` | Charts, secondary accent |

#### Severity colours

| Level | Hex | Name |
|-------|-----|------|
| Critical | `#DC2626` | Red 600 |
| High | `#FF6B6B` | Coral |
| Medium | `#F59E0B` | Amber |
| Low | `#7BC96F` | Lime |

#### Status colours

| Status | Hex | Name |
|--------|-----|------|
| Open | `#FF6B6B` | Coral |
| In Progress | `#F59E0B` | Amber |
| Resolved | `#7BC96F` | Lime |
| Closed | `#6B7280` | Grey |

#### UI tokens

| Token | Value |
|-------|-------|
| Border radius | `14px` |
| Shadow | `0 8px 24px rgba(0,0,0,0.08)` |

### Font (specified)

| Usage | Font | Fallback |
|-------|------|----------|
| Primary | **Inter** | system-ui, sans-serif |
| Mono (IDs, timestamps) | **JetBrains Mono** | — |

### Typography scale (specified)

| Element | Size |
|---------|------|
| H1 | 44px |
| H2 | 32px |
| H3 | 24px |
| Body | 16px |
| Small | 14px |

### Component style (specified)

- **Buttons:** 12px/16px padding, 8px radius, bold 16px text
- **Cards:** 14px radius, subtle shadow, white background on ice
- **Status badges:** Pill shape, colour-coded per status
- **Severity badges:** Bold background colour with white text

---

## Summary

| Aspect | Status |
|--------|--------|
| Implementation code | **None** — spec only |
| package.json | **Does not exist** |
| Database schema | **Specified in TypeScript interfaces, not Prisma** |
| Pages / Routes | **0 built** / 8 screens + 30 API endpoints specified |
| Components | **0 built** |
| Business logic | **Specified** (SLA calc, export, notifications) / **not implemented** |
| Auth | **Specified** (NextAuth.js or Clerk) / **not implemented** |
| Config files | **None** |
| Lines of code | **0** |
| UI patterns | **Specified** (colours, fonts, charts) / **not implemented** |

This repository is in the **specification phase**. The `spec.md` file is comprehensive and ready for implementation.
