import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Starting seed...')

  // Create default organisation
  const organisation = await prisma.organisation.upsert({
    where: { id: 'default-org' },
    update: {},
    create: {
      id: 'default-org',
      name: 'Default Organisation',
    },
  })

  console.log('Created organisation:', organisation.name)

  // Create incident counter for current year
  const year = new Date().getFullYear()
  await prisma.incidentCounter.upsert({
    where: { year },
    update: { count: 4 },
    create: { year, count: 4 },
  })

  // Sample incidents from spec
  const incidents = [
    {
      incidentNumber: `INC-${year}-0001`,
      organisationId: organisation.id,
      title: 'Customer data entered into ChatGPT',
      description: 'Sales team member copied customer contract details including personal data into ChatGPT for summarisation. Approximately 50 customer records affected.',
      severity: 'High' as const,
      category: 'DataLeakage' as const,
      status: 'Resolved' as const,
      affectedTool: 'ChatGPT',
      affectedDepartments: ['Marketing'] as ('Marketing' | 'HR' | 'IT' | 'Finance' | 'Operations' | 'Legal' | 'Other')[],
      dataTypesInvolved: ['CustomerData'] as ('CustomerData' | 'FinancialData' | 'EmployeeData' | 'InternalCode' | 'PublicData' | 'Other')[],
      reportedBy: 'Jane Smith',
      reportedByEmail: 'jane.smith@company.com',
      assignedTo: 'Mike Chen',
      assignedToEmail: 'mike.chen@company.com',
      reportedAt: new Date(`${year}-01-10T09:30:00Z`),
      acknowledgedAt: new Date(`${year}-01-10T10:15:00Z`),
      resolvedAt: new Date(`${year}-01-10T16:00:00Z`),
      rootCause: 'Lack of awareness about data classification rules when using AI tools',
      resolution: 'Contacted OpenAI to request data deletion. Implemented additional training for sales team.',
      preventiveMeasures: 'Adding data classification reminder to AI Acceptable Use Policy. Scheduling department-wide training.',
      tags: ['data-breach', 'training-required'],
    },
    {
      incidentNumber: `INC-${year}-0002`,
      organisationId: organisation.id,
      title: 'Unapproved AI tool discovered in Marketing',
      description: 'Marketing team has been using Jasper AI without approval for 3 months. Tool has access to customer personas and campaign data.',
      severity: 'Medium' as const,
      category: 'PolicyViolation' as const,
      status: 'InProgress' as const,
      affectedTool: 'Jasper',
      affectedDepartments: ['Marketing'] as ('Marketing' | 'HR' | 'IT' | 'Finance' | 'Operations' | 'Legal' | 'Other')[],
      dataTypesInvolved: ['CustomerData', 'InternalCode'] as ('CustomerData' | 'FinancialData' | 'EmployeeData' | 'InternalCode' | 'PublicData' | 'Other')[],
      reportedBy: 'IT Audit',
      reportedByEmail: 'it.audit@company.com',
      assignedTo: 'Sarah Johnson',
      assignedToEmail: 'sarah.johnson@company.com',
      reportedAt: new Date(`${year}-01-15T14:00:00Z`),
      acknowledgedAt: new Date(`${year}-01-15T14:30:00Z`),
      tags: ['shadow-it', 'policy-breach'],
    },
    {
      incidentNumber: `INC-${year}-0003`,
      organisationId: organisation.id,
      title: 'AI-generated content contained factual error in client report',
      description: 'Consultant used Claude to draft client report. AI hallucinated a regulatory requirement that doesn\'t exist. Client noticed before external publication.',
      severity: 'Medium' as const,
      category: 'Misinformation' as const,
      status: 'Open' as const,
      affectedTool: 'Claude',
      affectedDepartments: ['Operations'] as ('Marketing' | 'HR' | 'IT' | 'Finance' | 'Operations' | 'Legal' | 'Other')[],
      dataTypesInvolved: ['PublicData'] as ('CustomerData' | 'FinancialData' | 'EmployeeData' | 'InternalCode' | 'PublicData' | 'Other')[],
      reportedBy: 'Tom Davies',
      reportedByEmail: 'tom.davies@company.com',
      reportedAt: new Date(`${year}-01-18T11:00:00Z`),
      tags: ['hallucination', 'near-miss'],
    },
    {
      incidentNumber: `INC-${year}-0004`,
      organisationId: organisation.id,
      title: 'GitHub Copilot suggested code with security vulnerability',
      description: 'Code suggestion included SQL injection vulnerability. Caught in code review before deployment.',
      severity: 'Low' as const,
      category: 'SecurityIncident' as const,
      status: 'Closed' as const,
      affectedTool: 'GitHub Copilot',
      affectedDepartments: ['IT'] as ('Marketing' | 'HR' | 'IT' | 'Finance' | 'Operations' | 'Legal' | 'Other')[],
      dataTypesInvolved: ['InternalCode'] as ('CustomerData' | 'FinancialData' | 'EmployeeData' | 'InternalCode' | 'PublicData' | 'Other')[],
      reportedBy: 'Dev Team Lead',
      reportedByEmail: 'dev.lead@company.com',
      assignedTo: 'Security Team',
      assignedToEmail: 'security@company.com',
      reportedAt: new Date(`${year}-01-05T10:00:00Z`),
      acknowledgedAt: new Date(`${year}-01-05T10:30:00Z`),
      resolvedAt: new Date(`${year}-01-05T12:00:00Z`),
      closedAt: new Date(`${year}-01-06T09:00:00Z`),
      rootCause: 'AI suggestion not validated against security standards',
      resolution: 'Implemented mandatory security linting for all AI-suggested code',
      preventiveMeasures: 'Updated coding standards to require security review of AI suggestions',
      tags: ['security', 'caught-in-review'],
    },
  ]

  for (const incidentData of incidents) {
    const incident = await prisma.incident.upsert({
      where: { incidentNumber: incidentData.incidentNumber },
      update: {},
      create: incidentData,
    })

    // Create activity log entry for creation
    await prisma.activityLogEntry.create({
      data: {
        incidentId: incident.id,
        action: 'Created',
        performedBy: incidentData.reportedBy,
        details: `Incident ${incident.incidentNumber} created`,
      },
    })

    if (incidentData.assignedTo) {
      await prisma.activityLogEntry.create({
        data: {
          incidentId: incident.id,
          action: 'Assigned',
          performedBy: incidentData.reportedBy,
          details: `Assigned to ${incidentData.assignedTo}`,
          newValue: incidentData.assignedTo,
        },
      })
    }

    if (incidentData.status === 'Resolved' || incidentData.status === 'Closed') {
      await prisma.activityLogEntry.create({
        data: {
          incidentId: incident.id,
          action: 'Resolved',
          performedBy: incidentData.assignedTo || 'System',
          details: `Incident resolved`,
        },
      })
    }

    if (incidentData.status === 'Closed') {
      await prisma.activityLogEntry.create({
        data: {
          incidentId: incident.id,
          action: 'Closed',
          performedBy: incidentData.assignedTo || 'System',
          details: `Incident closed`,
        },
      })
    }

    console.log(`Created incident: ${incident.incidentNumber}`)
  }

  // Create a sample PIR for the first resolved incident
  const resolvedIncident = await prisma.incident.findFirst({
    where: { status: { in: ['Resolved', 'Closed'] } },
  })

  if (resolvedIncident) {
    const pir = await prisma.postIncidentReview.upsert({
      where: { incidentId: resolvedIncident.id },
      update: {},
      create: {
        incidentId: resolvedIncident.id,
        conductedBy: 'Mike Chen',
        whatHappened: resolvedIncident.description,
        whyItHappened: resolvedIncident.rootCause || 'Root cause analysis pending',
        whatWentWell: 'Quick identification and response. Customer was not directly affected due to timely intervention.',
        whatCouldImprove: 'Better pre-emptive training on AI tool usage policies. Clearer guidelines on what data can be shared.',
        lessonsLearned: 'Need regular refresher training on data classification. AI tools require same data handling rules as other systems.',
        policyChangesNeeded: true,
        trainingNeeded: true,
        status: 'Approved',
      },
    })

    // Add action items
    await prisma.pIRActionItem.createMany({
      data: [
        {
          pirId: pir.id,
          title: 'Update AI Acceptable Use Policy',
          description: 'Add explicit data classification requirements for AI tool usage',
          assignedTo: 'Policy Team',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
          status: 'InProgress',
        },
        {
          pirId: pir.id,
          title: 'Develop AI Data Handling Training',
          description: 'Create training module for all staff on proper data handling when using AI tools',
          assignedTo: 'L&D Team',
          dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
          status: 'Pending',
        },
      ],
    })

    console.log('Created PIR for incident:', resolvedIncident.incidentNumber)
  }

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
