import {
  AppointmentMethod,
  AppointmentStatus,
  CaseStatus,
  PrismaClient,
  Priority,
  RequestStatus,
  TaskStatus,
  UserRole,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config({ quiet: true });

const prisma = new PrismaClient();

const DAY_MS = 24 * 60 * 60 * 1000;
const SECOND_WORKSPACE_SEED_CONFIRMATION_VALUE = "true";

const secondOrganization = {
  id: "00000000-0000-4000-8000-000000001001",
  name: "Northstar Legal Workspace",
  slug: "northstar-legal",
  industry: "Legal Consulting",
  email: "workspace@northstar.test",
} as const;

const demoPasswords = {
  admin: "Northstar-Demo-Admin-2026!",
  manager: "Northstar-Demo-Manager-2026!",
  staff: "Northstar-Demo-Staff-2026!",
} as const;

const demoIds = {
  users: {
    admin: "00000000-0000-4000-8000-000000001101",
    manager: "00000000-0000-4000-8000-000000001102",
    staff: "00000000-0000-4000-8000-000000001103",
  },
  customers: [
    "00000000-0000-4000-8000-000000001201",
    "00000000-0000-4000-8000-000000001202",
    "00000000-0000-4000-8000-000000001203",
  ],
  requests: [
    "00000000-0000-4000-8000-000000001301",
    "00000000-0000-4000-8000-000000001302",
    "00000000-0000-4000-8000-000000001303",
  ],
  cases: [
    "00000000-0000-4000-8000-000000001401",
    "00000000-0000-4000-8000-000000001402",
    "00000000-0000-4000-8000-000000001403",
  ],
  appointments: [
    "00000000-0000-4000-8000-000000001501",
    "00000000-0000-4000-8000-000000001502",
  ],
  tasks: [
    "00000000-0000-4000-8000-000000001601",
    "00000000-0000-4000-8000-000000001602",
    "00000000-0000-4000-8000-000000001603",
  ],
  caseHistories: [
    "00000000-0000-4000-8000-000000001701",
    "00000000-0000-4000-8000-000000001702",
    "00000000-0000-4000-8000-000000001703",
  ],
  activityLogs: [
    "00000000-0000-4000-8000-000000001801",
    "00000000-0000-4000-8000-000000001802",
    "00000000-0000-4000-8000-000000001803",
  ],
} as const;

const services = [
  {
    name: "Legal Consulting",
    slug: "legal-consulting",
    description:
      "Practical legal guidance for individuals, organizations, and business operations.",
  },
  {
    name: "Real Estate Consulting",
    slug: "real-estate-consulting",
    description:
      "Guidance for real estate transactions, due diligence, and property-related decisions.",
  },
] as const;

const addDays = (days: number): Date => new Date(Date.now() + days * DAY_MS);

const calendarDate = (days: number): Date => {
  const date = addDays(days);

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
};

const monthOffset = (months: number): Date => {
  const date = new Date();
  date.setUTCMonth(date.getUTCMonth() + months);

  return date;
};

const assertSecondWorkspaceSeedAllowed = (): void => {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.SECOND_WORKSPACE_SEED_ENABLED !==
      SECOND_WORKSPACE_SEED_CONFIRMATION_VALUE
  ) {
    throw new Error(
      "Refusing to run second workspace seed in production mode without SECOND_WORKSPACE_SEED_ENABLED=true.",
    );
  }
};

const upsertSecondOrganization = async () =>
  prisma.organization.upsert({
    where: { slug: secondOrganization.slug },
    update: {
      name: secondOrganization.name,
      industry: secondOrganization.industry,
      email: secondOrganization.email,
      isActive: true,
    },
    create: secondOrganization,
  });

const upsertDemoUsers = async () => {
  const [adminPasswordHash, managerPasswordHash, staffPasswordHash] =
    await Promise.all([
      bcrypt.hash(demoPasswords.admin, 12),
      bcrypt.hash(demoPasswords.manager, 12),
      bcrypt.hash(demoPasswords.staff, 12),
    ]);

  const [admin, manager, staff] = await Promise.all([
    prisma.user.upsert({
      where: { email: "admin.demo@northstar.test" },
      update: {
        organizationId: secondOrganization.id,
        fullName: "Northstar Demo Admin",
        passwordHash: adminPasswordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },
      create: {
        id: demoIds.users.admin,
        organizationId: secondOrganization.id,
        fullName: "Northstar Demo Admin",
        email: "admin.demo@northstar.test",
        passwordHash: adminPasswordHash,
        role: UserRole.ADMIN,
      },
    }),
    prisma.user.upsert({
      where: { email: "manager.demo@northstar.test" },
      update: {
        organizationId: secondOrganization.id,
        fullName: "Nina Legal Operations Manager",
        passwordHash: managerPasswordHash,
        role: UserRole.MANAGER,
        isActive: true,
      },
      create: {
        id: demoIds.users.manager,
        organizationId: secondOrganization.id,
        fullName: "Nina Legal Operations Manager",
        email: "manager.demo@northstar.test",
        passwordHash: managerPasswordHash,
        role: UserRole.MANAGER,
      },
    }),
    prisma.user.upsert({
      where: { email: "staff.demo@northstar.test" },
      update: {
        organizationId: secondOrganization.id,
        fullName: "Leo Legal Case Specialist",
        passwordHash: staffPasswordHash,
        role: UserRole.STAFF,
        isActive: true,
      },
      create: {
        id: demoIds.users.staff,
        organizationId: secondOrganization.id,
        fullName: "Leo Legal Case Specialist",
        email: "staff.demo@northstar.test",
        passwordHash: staffPasswordHash,
        role: UserRole.STAFF,
      },
    }),
  ]);

  return { admin, manager, staff };
};

const upsertServices = async () => {
  const serviceRecords = await Promise.all(
    services.map((service) =>
      prisma.service.upsert({
        where: { slug: service.slug },
        update: {
          name: service.name,
          description: service.description,
          isActive: true,
        },
        create: service,
      }),
    ),
  );

  return Object.fromEntries(
    serviceRecords.map((service) => [service.slug, service]),
  );
};

const upsertCustomers = async () => {
  const customerData = [
    {
      id: demoIds.customers[0],
      fullName: "Aurora Legal Group",
      phone: "+12025551001",
      email: "operations@auroralegal.example",
      address: "Fictional Tower, Seattle, WA",
      source: "Tenant isolation QA",
      note: "Fictional Northstar customer for contract review testing.",
    },
    {
      id: demoIds.customers[1],
      fullName: "Pacific Compliance Studio",
      phone: "+12025551002",
      email: "hello@pacificcompliance.example",
      address: "Fictional Harbor District, Portland, OR",
      source: "Referral",
      note: "Fictional compliance studio used to verify workspace isolation.",
    },
    {
      id: demoIds.customers[2],
      fullName: "Meridian Contract Partners",
      phone: "+12025551003",
      email: "contact@meridiancontracts.example",
      address: "Fictional Midtown Office, Denver, CO",
      source: "Website consultation",
      note: "Fictional customer for legal opinion and contract QA flows.",
    },
  ];

  return Promise.all(
    customerData.map((customer) =>
      prisma.customer.upsert({
        where: { id: customer.id },
        update: {
          organizationId: secondOrganization.id,
          fullName: customer.fullName,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          source: customer.source,
          note: customer.note,
        },
        create: {
          ...customer,
          organizationId: secondOrganization.id,
        },
      }),
    ),
  );
};

const upsertCases = async (
  customerIds: readonly string[],
  serviceIds: Record<string, string>,
  users: {
    managerId: string;
    staffId: string;
  },
) => {
  const caseData = [
    {
      id: demoIds.cases[0],
      caseCode: "NORTH-LEG-001",
      customerId: customerIds[0],
      serviceId: serviceIds["legal-consulting"],
      assignedToId: users.managerId,
      title: "Corporate contract review",
      description:
        "Review fictional enterprise service agreement terms and risk notes.",
      note: "Northstar tenant isolation demo case in active review.",
      status: CaseStatus.PROCESSING,
      priority: Priority.HIGH,
      deadline: addDays(6),
      completedAt: null,
      createdAt: monthOffset(-1),
    },
    {
      id: demoIds.cases[1],
      caseCode: "NORTH-LEG-002",
      customerId: customerIds[1],
      serviceId: serviceIds["legal-consulting"],
      assignedToId: users.staffId,
      title: "Compliance risk mapping",
      description:
        "Map fictional compliance obligations and policy gaps for a studio client.",
      note: "Northstar demo case currently in verification.",
      status: CaseStatus.VERIFYING,
      priority: Priority.URGENT,
      deadline: addDays(3),
      completedAt: null,
      createdAt: addDays(-10),
    },
    {
      id: demoIds.cases[2],
      caseCode: "NORTH-RE-001",
      customerId: customerIds[2],
      serviceId: serviceIds["real-estate-consulting"],
      assignedToId: users.managerId,
      title: "Real estate legal opinion",
      description:
        "Prepare a fictional real estate legal opinion for lease and title risk.",
      note: "Northstar demo case used for dashboard and reports isolation.",
      status: CaseStatus.RECEIVED,
      priority: Priority.MEDIUM,
      deadline: addDays(14),
      completedAt: null,
      createdAt: addDays(-3),
    },
  ];

  return Promise.all(
    caseData.map((caseProfile) =>
      prisma.caseProfile.upsert({
        where: { id: caseProfile.id },
        update: {
          organizationId: secondOrganization.id,
          caseCode: caseProfile.caseCode,
          customerId: caseProfile.customerId,
          serviceId: caseProfile.serviceId,
          assignedToId: caseProfile.assignedToId,
          title: caseProfile.title,
          description: caseProfile.description,
          note: caseProfile.note,
          status: caseProfile.status,
          priority: caseProfile.priority,
          deadline: caseProfile.deadline,
          completedAt: caseProfile.completedAt,
          createdAt: caseProfile.createdAt,
        },
        create: {
          ...caseProfile,
          organizationId: secondOrganization.id,
        },
      }),
    ),
  );
};

const upsertConsultationRequests = async (
  customerIds: readonly string[],
  serviceIds: Record<string, string>,
  caseIds: readonly string[],
) => {
  const requestData = [
    {
      id: demoIds.requests[0],
      fullName: "Aurora Legal Group",
      phone: "+12025551001",
      email: "operations@auroralegal.example",
      serviceId: serviceIds["legal-consulting"],
      message:
        "We need a fictional corporate contract review for a tenant isolation smoke test.",
      status: RequestStatus.CONVERTED,
      convertedCustomerId: customerIds[0],
      convertedCaseProfileId: caseIds[0],
      convertedAt: addDays(-8),
      createdAt: addDays(-12),
    },
    {
      id: demoIds.requests[1],
      fullName: "Pacific Compliance Studio",
      phone: "+12025551002",
      email: "hello@pacificcompliance.example",
      serviceId: serviceIds["legal-consulting"],
      message: "Please map fictional compliance risks for a legal QA flow.",
      status: RequestStatus.CONVERTED,
      convertedCustomerId: customerIds[1],
      convertedCaseProfileId: caseIds[1],
      convertedAt: addDays(-5),
      createdAt: addDays(-9),
    },
    {
      id: demoIds.requests[2],
      fullName: "Meridian Contract Partners",
      phone: "+12025551003",
      email: "contact@meridiancontracts.example",
      serviceId: serviceIds["real-estate-consulting"],
      message: "Requesting a fictional real estate legal opinion.",
      status: RequestStatus.CONTACTED,
      convertedCustomerId: null,
      convertedCaseProfileId: null,
      convertedAt: null,
      createdAt: addDays(-2),
    },
  ];

  return Promise.all(
    requestData.map((request) =>
      prisma.consultationRequest.upsert({
        where: { id: request.id },
        update: {
          organizationId: secondOrganization.id,
          fullName: request.fullName,
          phone: request.phone,
          email: request.email,
          serviceId: request.serviceId,
          message: request.message,
          status: request.status,
          convertedCustomerId: request.convertedCustomerId,
          convertedCaseProfileId: request.convertedCaseProfileId,
          convertedAt: request.convertedAt,
          createdAt: request.createdAt,
        },
        create: {
          ...request,
          organizationId: secondOrganization.id,
        },
      }),
    ),
  );
};

const upsertAppointments = async (
  customerIds: readonly string[],
  caseIds: readonly string[],
  users: {
    managerId: string;
    staffId: string;
  },
) => {
  const appointmentData = [
    {
      id: demoIds.appointments[0],
      customerId: customerIds[0],
      caseProfileId: caseIds[0],
      staffId: users.managerId,
      appointmentDate: calendarDate(1),
      startTime: "10:00",
      endTime: "10:45",
      method: AppointmentMethod.ONLINE,
      status: AppointmentStatus.CONFIRMED,
      note: "Northstar fictional contract review call.",
    },
    {
      id: demoIds.appointments[1],
      customerId: customerIds[1],
      caseProfileId: caseIds[1],
      staffId: users.staffId,
      appointmentDate: calendarDate(4),
      startTime: "15:00",
      endTime: "15:30",
      method: AppointmentMethod.PHONE,
      status: AppointmentStatus.PENDING,
      note: "Northstar fictional compliance mapping follow-up.",
    },
  ];

  return Promise.all(
    appointmentData.map((appointment) =>
      prisma.appointment.upsert({
        where: { id: appointment.id },
        update: {
          organizationId: secondOrganization.id,
          customerId: appointment.customerId,
          caseProfileId: appointment.caseProfileId,
          staffId: appointment.staffId,
          appointmentDate: appointment.appointmentDate,
          startTime: appointment.startTime,
          endTime: appointment.endTime,
          method: appointment.method,
          status: appointment.status,
          note: appointment.note,
        },
        create: {
          ...appointment,
          organizationId: secondOrganization.id,
        },
      }),
    ),
  );
};

const upsertTasks = async (
  caseIds: readonly string[],
  users: {
    adminId: string;
    managerId: string;
    staffId: string;
  },
) => {
  const taskData = [
    {
      id: demoIds.tasks[0],
      caseProfileId: caseIds[0],
      title: "Review fictional contract red flags",
      description: "Prepare issue list for the Northstar contract review case.",
      assignedToId: users.managerId,
      createdById: users.adminId,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      deadline: addDays(2),
    },
    {
      id: demoIds.tasks[1],
      caseProfileId: caseIds[1],
      title: "Map fictional compliance controls",
      description: "Create a tenant-isolated compliance control checklist.",
      assignedToId: users.staffId,
      createdById: users.managerId,
      status: TaskStatus.TODO,
      priority: Priority.URGENT,
      deadline: addDays(1),
    },
    {
      id: demoIds.tasks[2],
      caseProfileId: caseIds[2],
      title: "Draft real estate legal opinion outline",
      description: "Prepare fictional opinion sections for QA review.",
      assignedToId: users.staffId,
      createdById: users.managerId,
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      deadline: addDays(8),
    },
  ];

  return Promise.all(
    taskData.map((task) =>
      prisma.task.upsert({
        where: { id: task.id },
        update: {
          organizationId: secondOrganization.id,
          caseProfileId: task.caseProfileId,
          title: task.title,
          description: task.description,
          assignedToId: task.assignedToId,
          createdById: task.createdById,
          status: task.status,
          priority: task.priority,
          deadline: task.deadline,
        },
        create: {
          ...task,
          organizationId: secondOrganization.id,
        },
      }),
    ),
  );
};

const upsertCaseHistories = async (
  caseIds: readonly string[],
  users: {
    managerId: string;
    staffId: string;
  },
) => {
  const historyData = [
    {
      id: demoIds.caseHistories[0],
      caseProfileId: caseIds[0],
      userId: users.managerId,
      action: "CASE_STATUS_CHANGED",
      oldStatus: CaseStatus.RECEIVED,
      newStatus: CaseStatus.PROCESSING,
      note: "Northstar demo contract review moved into processing.",
      createdAt: addDays(-4),
    },
    {
      id: demoIds.caseHistories[1],
      caseProfileId: caseIds[1],
      userId: users.staffId,
      action: "CASE_STATUS_CHANGED",
      oldStatus: CaseStatus.RECEIVED,
      newStatus: CaseStatus.VERIFYING,
      note: "Northstar demo compliance mapping moved into verification.",
      createdAt: addDays(-3),
    },
    {
      id: demoIds.caseHistories[2],
      caseProfileId: caseIds[2],
      userId: users.managerId,
      action: "CASE_CREATED",
      oldStatus: null,
      newStatus: CaseStatus.RECEIVED,
      note: "Northstar demo real estate legal opinion created.",
      createdAt: addDays(-2),
    },
  ];

  return Promise.all(
    historyData.map((history) =>
      prisma.caseHistory.upsert({
        where: { id: history.id },
        update: {
          organizationId: secondOrganization.id,
          caseProfileId: history.caseProfileId,
          userId: history.userId,
          action: history.action,
          oldStatus: history.oldStatus,
          newStatus: history.newStatus,
          note: history.note,
          createdAt: history.createdAt,
        },
        create: {
          ...history,
          organizationId: secondOrganization.id,
        },
      }),
    ),
  );
};

const upsertActivityLogs = async (
  users: {
    adminId: string;
    managerId: string;
    staffId: string;
  },
  caseIds: readonly string[],
) => {
  const activityData = [
    {
      id: demoIds.activityLogs[0],
      userId: users.adminId,
      action: "SECOND_WORKSPACE_SEED_CREATED",
      entityType: "Organization",
      entityId: secondOrganization.id,
      description: "Second workspace demo seed created Northstar workspace.",
      ipAddress: null,
      createdAt: addDays(-5),
    },
    {
      id: demoIds.activityLogs[1],
      userId: users.managerId,
      action: "SECOND_WORKSPACE_CASE_ASSIGNED",
      entityType: "CaseProfile",
      entityId: caseIds[0],
      description: "Northstar demo contract review assigned to manager.",
      ipAddress: null,
      createdAt: addDays(-4),
    },
    {
      id: demoIds.activityLogs[2],
      userId: users.staffId,
      action: "SECOND_WORKSPACE_TASK_CREATED",
      entityType: "Task",
      entityId: demoIds.tasks[1],
      description: "Northstar demo compliance task created for staff user.",
      ipAddress: null,
      createdAt: addDays(-3),
    },
  ];

  return Promise.all(
    activityData.map((activity) =>
      prisma.activityLog.upsert({
        where: { id: activity.id },
        update: {
          organizationId: secondOrganization.id,
          userId: activity.userId,
          action: activity.action,
          entityType: activity.entityType,
          entityId: activity.entityId,
          description: activity.description,
          ipAddress: activity.ipAddress,
          createdAt: activity.createdAt,
        },
        create: {
          ...activity,
          organizationId: secondOrganization.id,
        },
      }),
    ),
  );
};

async function main(): Promise<void> {
  assertSecondWorkspaceSeedAllowed();

  await upsertSecondOrganization();
  const users = await upsertDemoUsers();
  const serviceRecords = await upsertServices();
  const serviceIds = Object.fromEntries(
    Object.entries(serviceRecords).map(([slug, service]) => [slug, service.id]),
  );
  const customers = await upsertCustomers();
  const customerIds = customers.map((customer) => customer.id);
  const cases = await upsertCases(customerIds, serviceIds, {
    managerId: users.manager.id,
    staffId: users.staff.id,
  });
  const caseIds = cases.map((caseProfile) => caseProfile.id);

  await upsertConsultationRequests(customerIds, serviceIds, caseIds);
  await upsertAppointments(customerIds, caseIds, {
    managerId: users.manager.id,
    staffId: users.staff.id,
  });
  await upsertTasks(caseIds, {
    adminId: users.admin.id,
    managerId: users.manager.id,
    staffId: users.staff.id,
  });
  await upsertCaseHistories(caseIds, {
    managerId: users.manager.id,
    staffId: users.staff.id,
  });
  await upsertActivityLogs(
    {
      adminId: users.admin.id,
      managerId: users.manager.id,
      staffId: users.staff.id,
    },
    caseIds,
  );

  console.log(
    "Second workspace seed completed: Northstar Legal Workspace demo users, customers, requests, cases, appointments, tasks, and activity records are ready.",
  );
  console.log(
    "No physical document files were seeded. Public consultation requests still use DEFAULT_ORGANIZATION_SLUG.",
  );
}

main()
  .catch((error: unknown) => {
    console.error("Second workspace seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
