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

const prisma = new PrismaClient();

const DAY_MS = 24 * 60 * 60 * 1000;
const LEGACY_LOCAL_ADMIN_EMAIL = "admin@advisora.demo";
const DEMO_SEED_CONFIRMATION_VALUE = "true";

const defaultOrganization = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Advisora Demo Workspace",
  slug: "advisora-demo",
  industry: "Consulting",
  email: "workspace@advisora.test",
} as const;

const demoPasswords = {
  admin: "Advisora-Demo-Admin-2026!",
  manager: "Advisora-Demo-Manager-2026!",
  staff: "Advisora-Demo-Staff-2026!",
} as const;

const demoIds = {
  users: {
    admin: "00000000-0000-4000-8000-000000000101",
    manager: "00000000-0000-4000-8000-000000000102",
    staff: "00000000-0000-4000-8000-000000000103",
  },
  customers: [
    "00000000-0000-4000-8000-000000000201",
    "00000000-0000-4000-8000-000000000202",
    "00000000-0000-4000-8000-000000000203",
    "00000000-0000-4000-8000-000000000204",
    "00000000-0000-4000-8000-000000000205",
    "00000000-0000-4000-8000-000000000206",
  ],
  requests: [
    "00000000-0000-4000-8000-000000000301",
    "00000000-0000-4000-8000-000000000302",
    "00000000-0000-4000-8000-000000000303",
    "00000000-0000-4000-8000-000000000304",
    "00000000-0000-4000-8000-000000000305",
    "00000000-0000-4000-8000-000000000306",
  ],
  cases: [
    "00000000-0000-4000-8000-000000000401",
    "00000000-0000-4000-8000-000000000402",
    "00000000-0000-4000-8000-000000000403",
    "00000000-0000-4000-8000-000000000404",
    "00000000-0000-4000-8000-000000000405",
    "00000000-0000-4000-8000-000000000406",
  ],
  appointments: [
    "00000000-0000-4000-8000-000000000501",
    "00000000-0000-4000-8000-000000000502",
    "00000000-0000-4000-8000-000000000503",
    "00000000-0000-4000-8000-000000000504",
    "00000000-0000-4000-8000-000000000505",
  ],
  tasks: [
    "00000000-0000-4000-8000-000000000601",
    "00000000-0000-4000-8000-000000000602",
    "00000000-0000-4000-8000-000000000603",
    "00000000-0000-4000-8000-000000000604",
    "00000000-0000-4000-8000-000000000605",
    "00000000-0000-4000-8000-000000000606",
    "00000000-0000-4000-8000-000000000607",
  ],
} as const;

const services = [
  {
    name: "Real Estate Consulting",
    slug: "real-estate-consulting",
    description:
      "Guidance for real estate transactions, due diligence, and property-related decisions.",
  },
  {
    name: "Legal Consulting",
    slug: "legal-consulting",
    description:
      "Practical legal guidance for individuals, organizations, and business operations.",
  },
  {
    name: "Investment Consulting",
    slug: "investment-consulting",
    description:
      "Support for evaluating opportunities, risks, and sustainable investment strategies.",
  },
  {
    name: "Construction Consulting",
    slug: "construction-consulting",
    description:
      "Professional advice for construction planning, compliance, and project delivery.",
  },
] as const;

const addDays = (days: number): Date => new Date(Date.now() + days * DAY_MS);

const assertDemoSeedAllowed = (): void => {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.DEMO_SEED_ENABLED !== DEMO_SEED_CONFIRMATION_VALUE
  ) {
    throw new Error(
      "Refusing to run demo seed in production mode without DEMO_SEED_ENABLED=true.",
    );
  }
};

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

const upsertDefaultOrganization = async () =>
  prisma.organization.upsert({
    where: { slug: defaultOrganization.slug },
    update: {
      name: defaultOrganization.name,
      industry: defaultOrganization.industry,
      email: defaultOrganization.email,
      isActive: true,
    },
    create: defaultOrganization,
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
      where: { email: "admin.demo@advisora.test" },
      update: {
        organizationId: defaultOrganization.id,
        fullName: "Advisora Demo Admin",
        passwordHash: adminPasswordHash,
        role: UserRole.ADMIN,
        isActive: true,
      },
      create: {
        id: demoIds.users.admin,
        organizationId: defaultOrganization.id,
        fullName: "Advisora Demo Admin",
        email: "admin.demo@advisora.test",
        passwordHash: adminPasswordHash,
        role: UserRole.ADMIN,
      },
    }),
    prisma.user.upsert({
      where: { email: "manager.demo@advisora.test" },
      update: {
        organizationId: defaultOrganization.id,
        fullName: "Maya Operations Manager",
        passwordHash: managerPasswordHash,
        role: UserRole.MANAGER,
        isActive: true,
      },
      create: {
        id: demoIds.users.manager,
        organizationId: defaultOrganization.id,
        fullName: "Maya Operations Manager",
        email: "manager.demo@advisora.test",
        passwordHash: managerPasswordHash,
        role: UserRole.MANAGER,
      },
    }),
    prisma.user.upsert({
      where: { email: "staff.demo@advisora.test" },
      update: {
        organizationId: defaultOrganization.id,
        fullName: "Sam Case Specialist",
        passwordHash: staffPasswordHash,
        role: UserRole.STAFF,
        isActive: true,
      },
      create: {
        id: demoIds.users.staff,
        organizationId: defaultOrganization.id,
        fullName: "Sam Case Specialist",
        email: "staff.demo@advisora.test",
        passwordHash: staffPasswordHash,
        role: UserRole.STAFF,
      },
    }),
  ]);

  const legacyAdmin = await prisma.user.findUnique({
    where: { email: LEGACY_LOCAL_ADMIN_EMAIL },
    select: { id: true },
  });

  if (legacyAdmin) {
    await prisma.user.update({
      where: { id: legacyAdmin.id },
      data: {
        organizationId: defaultOrganization.id,
        fullName: "Advisora Legacy Local Admin",
        isActive: false,
      },
    });
  }

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
      fullName: "Minh An Holdings",
      phone: "+84901001001",
      email: "operations@minhan.example",
      address: "District 1, Ho Chi Minh City",
      source: "Website consultation",
      note: "Portfolio demo customer for real estate due diligence.",
    },
    {
      id: demoIds.customers[1],
      fullName: "Blue River Properties",
      phone: "+84901001002",
      email: "hello@blueriver.example",
      address: "Thu Duc City, Ho Chi Minh City",
      source: "Referral",
      note: "Fictional property group reviewing a mixed-use acquisition.",
    },
    {
      id: demoIds.customers[2],
      fullName: "Lotus Legal Partners",
      phone: "+84901001003",
      email: "contact@lotuslegal.example",
      address: "Ba Dinh, Ha Noi",
      source: "LinkedIn",
      note: "Fictional legal practice requesting compliance support.",
    },
    {
      id: demoIds.customers[3],
      fullName: "GreenBuild Studio",
      phone: "+84901001004",
      email: "studio@greenbuild.example",
      address: "Da Nang City",
      source: "Conference",
      note: "Fictional construction studio planning permit review.",
    },
    {
      id: demoIds.customers[4],
      fullName: "Northstar Ventures",
      phone: "+84901001005",
      email: "team@northstar.example",
      address: "District 3, Ho Chi Minh City",
      source: "Investor network",
      note: "Fictional investment firm reviewing portfolio risk.",
    },
    {
      id: demoIds.customers[5],
      fullName: "Saigon Urban Group",
      phone: "+84901001006",
      email: "info@saigonurban.example",
      address: "Binh Thanh, Ho Chi Minh City",
      source: "Website consultation",
      note: "Fictional urban development group requesting legal review.",
    },
  ];

  return Promise.all(
    customerData.map((customer) =>
      prisma.customer.upsert({
        where: { id: customer.id },
        update: {
          organizationId: defaultOrganization.id,
          fullName: customer.fullName,
          phone: customer.phone,
          email: customer.email,
          address: customer.address,
          source: customer.source,
          note: customer.note,
        },
        create: {
          ...customer,
          organizationId: defaultOrganization.id,
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
      caseCode: "DEMO-RE-001",
      customerId: customerIds[0],
      serviceId: serviceIds["real-estate-consulting"],
      assignedToId: users.managerId,
      title: "Land acquisition due diligence",
      description:
        "Review fictional land title, zoning constraints, and acquisition risk.",
      note: "Demo case in initial intake.",
      status: CaseStatus.RECEIVED,
      priority: Priority.HIGH,
      deadline: addDays(5),
      completedAt: null,
      createdAt: monthOffset(-1),
    },
    {
      id: demoIds.cases[1],
      caseCode: "DEMO-RE-002",
      customerId: customerIds[1],
      serviceId: serviceIds["real-estate-consulting"],
      assignedToId: users.staffId,
      title: "Mixed-use project verification",
      description:
        "Validate fictional ownership documents and early feasibility notes.",
      note: "Demo case currently under verification.",
      status: CaseStatus.VERIFYING,
      priority: Priority.URGENT,
      deadline: addDays(-2),
      completedAt: null,
      createdAt: monthOffset(-1),
    },
    {
      id: demoIds.cases[2],
      caseCode: "DEMO-LEG-001",
      customerId: customerIds[2],
      serviceId: serviceIds["legal-consulting"],
      assignedToId: users.staffId,
      title: "Commercial compliance review",
      description:
        "Prepare a fictional compliance gap review for a consulting client.",
      note: "Demo case actively being processed.",
      status: CaseStatus.PROCESSING,
      priority: Priority.HIGH,
      deadline: addDays(8),
      completedAt: null,
      createdAt: new Date(),
    },
    {
      id: demoIds.cases[3],
      caseCode: "DEMO-CON-001",
      customerId: customerIds[3],
      serviceId: serviceIds["construction-consulting"],
      assignedToId: users.managerId,
      title: "Permit strategy package",
      description:
        "Coordinate fictional construction permit readiness and risk notes.",
      note: "Demo case completed for reporting charts.",
      status: CaseStatus.COMPLETED,
      priority: Priority.MEDIUM,
      deadline: addDays(-10),
      completedAt: addDays(-4),
      createdAt: monthOffset(-2),
    },
    {
      id: demoIds.cases[4],
      caseCode: "DEMO-INV-001",
      customerId: customerIds[4],
      serviceId: serviceIds["investment-consulting"],
      assignedToId: users.staffId,
      title: "Portfolio risk snapshot",
      description:
        "Prepare fictional risk flags for a venture portfolio review.",
      note: "Demo case cancelled after scope changed.",
      status: CaseStatus.CANCELLED,
      priority: Priority.LOW,
      deadline: addDays(-5),
      completedAt: null,
      createdAt: monthOffset(-3),
    },
    {
      id: demoIds.cases[5],
      caseCode: "DEMO-LEG-002",
      customerId: customerIds[5],
      serviceId: serviceIds["legal-consulting"],
      assignedToId: users.managerId,
      title: "Urban development contract review",
      description:
        "Draft fictional contract review notes for an urban development group.",
      note: "Demo case in proposal preparation.",
      status: CaseStatus.PROPOSING_SOLUTION,
      priority: Priority.MEDIUM,
      deadline: addDays(14),
      completedAt: null,
      createdAt: new Date(),
    },
  ];

  return Promise.all(
    caseData.map((caseProfile) =>
      prisma.caseProfile.upsert({
        where: { id: caseProfile.id },
        update: {
          organizationId: defaultOrganization.id,
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
          organizationId: defaultOrganization.id,
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
      fullName: "Minh An Holdings",
      phone: "+84901001001",
      email: "operations@minhan.example",
      serviceId: serviceIds["real-estate-consulting"],
      message:
        "We need a fictional due diligence review for a land acquisition.",
      status: RequestStatus.CONVERTED,
      convertedCustomerId: customerIds[0],
      convertedCaseProfileId: caseIds[0],
      convertedAt: addDays(-12),
      createdAt: addDays(-18),
    },
    {
      id: demoIds.requests[1],
      fullName: "Blue River Properties",
      phone: "+84901001002",
      email: "hello@blueriver.example",
      serviceId: serviceIds["real-estate-consulting"],
      message: "Please review fictional ownership documents.",
      status: RequestStatus.CONTACTED,
      convertedCustomerId: null,
      convertedCaseProfileId: null,
      convertedAt: null,
      createdAt: addDays(-9),
    },
    {
      id: demoIds.requests[2],
      fullName: "Lotus Legal Partners",
      phone: "+84901001003",
      email: "contact@lotuslegal.example",
      serviceId: serviceIds["legal-consulting"],
      message: "We need support mapping fictional compliance obligations.",
      status: RequestStatus.NEW,
      convertedCustomerId: null,
      convertedCaseProfileId: null,
      convertedAt: null,
      createdAt: addDays(-2),
    },
    {
      id: demoIds.requests[3],
      fullName: "GreenBuild Studio",
      phone: "+84901001004",
      email: "studio@greenbuild.example",
      serviceId: serviceIds["construction-consulting"],
      message: "Can Advisora review a fictional construction permit plan?",
      status: RequestStatus.CLOSED,
      convertedCustomerId: null,
      convertedCaseProfileId: null,
      convertedAt: null,
      createdAt: addDays(-20),
    },
    {
      id: demoIds.requests[4],
      fullName: "Northstar Ventures",
      phone: "+84901001005",
      email: "team@northstar.example",
      serviceId: serviceIds["investment-consulting"],
      message: "We need a fictional investment risk workshop.",
      status: RequestStatus.CONTACTED,
      convertedCustomerId: null,
      convertedCaseProfileId: null,
      convertedAt: null,
      createdAt: addDays(-5),
    },
    {
      id: demoIds.requests[5],
      fullName: "Saigon Urban Group",
      phone: "+84901001006",
      email: "info@saigonurban.example",
      serviceId: serviceIds["legal-consulting"],
      message: "Requesting fictional contract review support.",
      status: RequestStatus.NEW,
      convertedCustomerId: null,
      convertedCaseProfileId: null,
      convertedAt: null,
      createdAt: addDays(-1),
    },
  ];

  return Promise.all(
    requestData.map((request) =>
      prisma.consultationRequest.upsert({
        where: { id: request.id },
        update: {
          organizationId: defaultOrganization.id,
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
          organizationId: defaultOrganization.id,
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
      appointmentDate: calendarDate(0),
      startTime: "09:30",
      endTime: "10:15",
      method: AppointmentMethod.ONLINE,
      status: AppointmentStatus.CONFIRMED,
      note: "Today fictional due diligence review call.",
    },
    {
      id: demoIds.appointments[1],
      customerId: customerIds[1],
      caseProfileId: caseIds[1],
      staffId: users.staffId,
      appointmentDate: calendarDate(3),
      startTime: "14:00",
      endTime: "14:45",
      method: AppointmentMethod.PHONE,
      status: AppointmentStatus.PENDING,
      note: "Follow-up call for document verification.",
    },
    {
      id: demoIds.appointments[2],
      customerId: customerIds[2],
      caseProfileId: caseIds[2],
      staffId: users.staffId,
      appointmentDate: calendarDate(-3),
      startTime: "11:00",
      endTime: "11:45",
      method: AppointmentMethod.ONLINE,
      status: AppointmentStatus.COMPLETED,
      note: "Completed fictional compliance workshop.",
    },
    {
      id: demoIds.appointments[3],
      customerId: customerIds[3],
      caseProfileId: caseIds[3],
      staffId: users.managerId,
      appointmentDate: calendarDate(-8),
      startTime: "16:00",
      endTime: "16:30",
      method: AppointmentMethod.OFFLINE,
      status: AppointmentStatus.COMPLETED,
      note: "Completed fictional permit review meeting.",
    },
    {
      id: demoIds.appointments[4],
      customerId: customerIds[4],
      caseProfileId: caseIds[4],
      staffId: users.staffId,
      appointmentDate: calendarDate(6),
      startTime: "10:00",
      endTime: "10:30",
      method: AppointmentMethod.ONLINE,
      status: AppointmentStatus.CANCELLED,
      note: "Cancelled after the fictional investment scope changed.",
    },
  ];

  return Promise.all(
    appointmentData.map((appointment) =>
      prisma.appointment.upsert({
        where: { id: appointment.id },
        update: {
          organizationId: defaultOrganization.id,
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
          organizationId: defaultOrganization.id,
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
      title: "Collect fictional title documents",
      description: "Prepare a checklist for the land acquisition demo case.",
      assignedToId: users.managerId,
      createdById: users.adminId,
      status: TaskStatus.TODO,
      priority: Priority.HIGH,
      deadline: addDays(2),
    },
    {
      id: demoIds.tasks[1],
      caseProfileId: caseIds[1],
      title: "Verify mixed-use planning notes",
      description: "Review fictional zoning and planning assumptions.",
      assignedToId: users.staffId,
      createdById: users.managerId,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.URGENT,
      deadline: addDays(-1),
    },
    {
      id: demoIds.tasks[2],
      caseProfileId: caseIds[2],
      title: "Draft compliance findings",
      description: "Prepare fictional legal compliance findings.",
      assignedToId: users.staffId,
      createdById: users.managerId,
      status: TaskStatus.IN_PROGRESS,
      priority: Priority.HIGH,
      deadline: addDays(4),
    },
    {
      id: demoIds.tasks[3],
      caseProfileId: caseIds[3],
      title: "Archive permit strategy notes",
      description: "Close out fictional construction consulting notes.",
      assignedToId: users.managerId,
      createdById: users.adminId,
      status: TaskStatus.DONE,
      priority: Priority.MEDIUM,
      deadline: addDays(-5),
    },
    {
      id: demoIds.tasks[4],
      caseProfileId: caseIds[4],
      title: "Cancel investment workshop agenda",
      description: "Mark fictional investment workshop as cancelled.",
      assignedToId: users.staffId,
      createdById: users.managerId,
      status: TaskStatus.CANCELLED,
      priority: Priority.LOW,
      deadline: addDays(-2),
    },
    {
      id: demoIds.tasks[5],
      caseProfileId: caseIds[5],
      title: "Review draft contract clauses",
      description: "Prepare fictional contract red-flag notes.",
      assignedToId: users.managerId,
      createdById: users.adminId,
      status: TaskStatus.TODO,
      priority: Priority.MEDIUM,
      deadline: addDays(7),
    },
    {
      id: demoIds.tasks[6],
      caseProfileId: caseIds[2],
      title: "Send fictional compliance summary",
      description: "Share the completed demo summary with the review team.",
      assignedToId: users.staffId,
      createdById: users.managerId,
      status: TaskStatus.DONE,
      priority: Priority.MEDIUM,
      deadline: addDays(-1),
    },
  ];

  return Promise.all(
    taskData.map((task) =>
      prisma.task.upsert({
        where: { id: task.id },
        update: {
          organizationId: defaultOrganization.id,
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
          organizationId: defaultOrganization.id,
        },
      }),
    ),
  );
};

const upsertCaseHistories = async (
  caseIds: readonly string[],
  users: {
    adminId: string;
    managerId: string;
    staffId: string;
  },
) => {
  const historyData = [
    {
      id: "00000000-0000-4000-8000-000000000701",
      caseProfileId: caseIds[0],
      userId: users.adminId,
      action: "CASE_CREATED",
      oldStatus: null,
      newStatus: CaseStatus.RECEIVED,
      note: "Demo case created from a fictional website consultation.",
      createdAt: addDays(-18),
    },
    {
      id: "00000000-0000-4000-8000-000000000702",
      caseProfileId: caseIds[1],
      userId: users.managerId,
      action: "CASE_STATUS_CHANGED",
      oldStatus: CaseStatus.RECEIVED,
      newStatus: CaseStatus.VERIFYING,
      note: "Demo case moved into verification.",
      createdAt: addDays(-6),
    },
    {
      id: "00000000-0000-4000-8000-000000000703",
      caseProfileId: caseIds[2],
      userId: users.staffId,
      action: "CASE_STATUS_CHANGED",
      oldStatus: CaseStatus.PROPOSING_SOLUTION,
      newStatus: CaseStatus.PROCESSING,
      note: "Demo compliance review is now in processing.",
      createdAt: addDays(-3),
    },
    {
      id: "00000000-0000-4000-8000-000000000704",
      caseProfileId: caseIds[3],
      userId: users.managerId,
      action: "CASE_STATUS_CHANGED",
      oldStatus: CaseStatus.PROCESSING,
      newStatus: CaseStatus.COMPLETED,
      note: "Demo permit strategy package completed.",
      createdAt: addDays(-4),
    },
    {
      id: "00000000-0000-4000-8000-000000000705",
      caseProfileId: caseIds[4],
      userId: users.staffId,
      action: "CASE_STATUS_CHANGED",
      oldStatus: CaseStatus.RECEIVED,
      newStatus: CaseStatus.CANCELLED,
      note: "Demo investment workshop cancelled after scope change.",
      createdAt: addDays(-2),
    },
    {
      id: "00000000-0000-4000-8000-000000000706",
      caseProfileId: caseIds[5],
      userId: users.managerId,
      action: "CASE_ASSIGNED",
      oldStatus: null,
      newStatus: CaseStatus.PROPOSING_SOLUTION,
      note: "Demo contract review assigned to operations manager.",
      createdAt: addDays(-1),
    },
  ];

  return Promise.all(
    historyData.map((history) =>
      prisma.caseHistory.upsert({
        where: { id: history.id },
        update: {
          organizationId: defaultOrganization.id,
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
          organizationId: defaultOrganization.id,
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
      id: "00000000-0000-4000-8000-000000000801",
      userId: users.adminId,
      action: "DEMO_SEED_CREATED",
      entityType: "CaseProfile",
      entityId: caseIds[0],
      description: "Demo seed created real estate intake case.",
      ipAddress: null,
      createdAt: addDays(-18),
    },
    {
      id: "00000000-0000-4000-8000-000000000802",
      userId: users.managerId,
      action: "DEMO_CASE_ASSIGNED",
      entityType: "CaseProfile",
      entityId: caseIds[5],
      description: "Demo seed assigned urban development contract review.",
      ipAddress: null,
      createdAt: addDays(-1),
    },
    {
      id: "00000000-0000-4000-8000-000000000803",
      userId: users.staffId,
      action: "DEMO_TASK_COMPLETED",
      entityType: "Task",
      entityId: demoIds.tasks[6],
      description: "Demo seed completed fictional compliance summary task.",
      ipAddress: null,
      createdAt: addDays(-1),
    },
  ];

  return Promise.all(
    activityData.map((activity) =>
      prisma.activityLog.upsert({
        where: { id: activity.id },
        update: {
          organizationId: defaultOrganization.id,
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
          organizationId: defaultOrganization.id,
        },
      }),
    ),
  );
};

async function main(): Promise<void> {
  assertDemoSeedAllowed();

  await upsertDefaultOrganization();
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
    adminId: users.admin.id,
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
    "Demo seed completed: demo users, customers, requests, cases, appointments, tasks, and activity records are ready.",
  );
  console.log(
    "No physical document files were seeded. Upload a tiny fictional file during staging smoke tests if document flows need evidence.",
  );
}

main()
  .catch((error: unknown) => {
    console.error("Demo seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
