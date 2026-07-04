import { randomBytes } from "node:crypto";

import {
  AppointmentStatus,
  CaseStatus,
  Prisma,
} from "@prisma/client";
import bcrypt from "bcryptjs";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { getServerCalendarDate } from "../../utils/dateRange";
import { signCustomerPortalAccessToken } from "../../utils/jwt";
import {
  createPaginationMeta,
  getPagination,
} from "../../utils/pagination";
import { isPrismaError } from "../../utils/prismaError";
import {
  type CreatePortalAccountInput,
  type PortalCaseDetail,
  type PortalCaseListQuery,
  type PortalCaseListResult,
  type PortalCaseSummary,
  type PortalCaseSummaryResult,
  type PortalCaseTimelineItem,
  type PortalAccountMutationResult,
  type PortalLoginInput,
  type PortalLoginResult,
  type PortalProfileResult,
  type PortalSession,
  type ResetPortalPasswordInput,
  type SafeCustomerPortalAccount,
  type SafePortalCustomer,
  type SafePortalOrganization,
} from "./customerPortal.types";

const INVALID_PORTAL_LOGIN_MESSAGE = "Invalid workspace, email, or password.";
const CASE_TRACKING_MESSAGE =
  "Case tracking is ready. You can review your case status, appointments, and document metadata from My Cases.";

export const safePortalAccountSelect = {
  id: true,
  organizationId: true,
  customerId: true,
  email: true,
  isActive: true,
  lastLoginAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CustomerPortalAccountSelect;

export const safePortalCustomerSelect = {
  id: true,
  fullName: true,
  phone: true,
  email: true,
  address: true,
} satisfies Prisma.CustomerSelect;

export const safePortalOrganizationSelect = {
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.OrganizationSelect;

const safePortalStaffSelect = {
  id: true,
  fullName: true,
  role: true,
} satisfies Prisma.UserSelect;

const safePortalServiceSelect = {
  id: true,
  name: true,
  slug: true,
} satisfies Prisma.ServiceSelect;

const portalCaseRelatedCountsSelect = {
  histories: true,
  documents: true,
  tasks: true,
  appointments: true,
} satisfies Prisma.CaseProfileCountOutputTypeSelect;

const safePortalHistorySelect = {
  id: true,
  action: true,
  oldStatus: true,
  newStatus: true,
  createdAt: true,
  user: {
    select: safePortalStaffSelect,
  },
} satisfies Prisma.CaseHistorySelect;

const safePortalAppointmentSelect = {
  id: true,
  appointmentDate: true,
  startTime: true,
  endTime: true,
  method: true,
  status: true,
  staff: {
    select: safePortalStaffSelect,
  },
} satisfies Prisma.AppointmentSelect;

const safePortalDocumentMetadataSelect = {
  id: true,
  fileName: true,
  fileType: true,
  mimeType: true,
  size: true,
  createdAt: true,
} satisfies Prisma.DocumentSelect;

const safePortalTaskSelect = {
  id: true,
  title: true,
  status: true,
  priority: true,
  deadline: true,
  updatedAt: true,
} satisfies Prisma.TaskSelect;

const safePortalCaseBaseSelect = {
  id: true,
  caseCode: true,
  title: true,
  status: true,
  priority: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
  service: {
    select: safePortalServiceSelect,
  },
  assignedTo: {
    select: safePortalStaffSelect,
  },
  histories: {
    take: 1,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: safePortalHistorySelect,
  },
  _count: {
    select: portalCaseRelatedCountsSelect,
  },
} satisfies Prisma.CaseProfileSelect;

const safePortalCaseDetailSelect = {
  ...safePortalCaseBaseSelect,
  description: true,
  deadline: true,
  customer: {
    select: safePortalCustomerSelect,
  },
  histories: {
    take: 50,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: safePortalHistorySelect,
  },
  appointments: {
    orderBy: [
      { appointmentDate: "asc" },
      { startTime: "asc" },
      { id: "asc" },
    ],
    select: safePortalAppointmentSelect,
  },
  documents: {
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: safePortalDocumentMetadataSelect,
  },
  tasks: {
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    select: safePortalTaskSelect,
  },
} satisfies Prisma.CaseProfileSelect;

const portalSessionAccountSelect = {
  ...safePortalAccountSelect,
  passwordHash: true,
  customer: {
    select: {
      ...safePortalCustomerSelect,
      organizationId: true,
    },
  },
  organization: {
    select: {
      ...safePortalOrganizationSelect,
      isActive: true,
    },
  },
} satisfies Prisma.CustomerPortalAccountSelect;

type PortalSessionAccount = Prisma.CustomerPortalAccountGetPayload<{
  select: typeof portalSessionAccountSelect;
}>;

type PortalCaseSummaryRecord = Prisma.CaseProfileGetPayload<{
  select: typeof safePortalCaseBaseSelect;
}>;

type PortalCaseDetailRecord = Prisma.CaseProfileGetPayload<{
  select: typeof safePortalCaseDetailSelect;
}>;

type PortalNextAppointmentRecord = Prisma.AppointmentGetPayload<{
  select: typeof safePortalAppointmentSelect;
}>;

const generateTemporaryPassword = (): string =>
  `Portal-${randomBytes(12).toString("base64url")}-9aA!`;

const toSafePortalAccount = (
  account: SafeCustomerPortalAccount,
): SafeCustomerPortalAccount => ({
  id: account.id,
  organizationId: account.organizationId,
  customerId: account.customerId,
  email: account.email,
  isActive: account.isActive,
  lastLoginAt: account.lastLoginAt,
  createdAt: account.createdAt,
  updatedAt: account.updatedAt,
});

const toSafePortalCustomer = (
  customer: SafePortalCustomer,
): SafePortalCustomer => ({
  id: customer.id,
  fullName: customer.fullName,
  phone: customer.phone,
  email: customer.email,
  address: customer.address,
});

const toSafePortalOrganization = (
  organization: SafePortalOrganization,
): SafePortalOrganization => ({
  id: organization.id,
  name: organization.name,
  slug: organization.slug,
});

export const toPortalSession = (
  account: PortalSessionAccount,
): PortalSession => ({
  portalAccount: toSafePortalAccount(account),
  customer: toSafePortalCustomer(account.customer),
  organization: toSafePortalOrganization(account.organization),
});

export const toPortalProfile = (
  session: PortalSession,
): PortalProfileResult => ({
  ...session,
  overview: {
    message: CASE_TRACKING_MESSAGE,
    caseTrackingAvailable: true,
    documentUploadAvailable: false,
    messagingAvailable: false,
  },
});

const getPortalCaseScope = (
  session: PortalSession,
): Pick<SafeCustomerPortalAccount, "organizationId" | "customerId"> => ({
  organizationId: session.portalAccount.organizationId,
  customerId: session.portalAccount.customerId,
});

const formatPortalTimelineDescription = (
  action: string,
  oldStatus: CaseStatus | null,
  newStatus: CaseStatus | null,
): string => {
  if (oldStatus && newStatus) {
    return `Status changed from ${oldStatus} to ${newStatus}.`;
  }

  return action
    .toLowerCase()
    .split("_")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
};

const toPortalTimelineItem = (
  history: PortalCaseDetailRecord["histories"][number],
): PortalCaseTimelineItem => ({
  id: history.id,
  action: history.action,
  description: formatPortalTimelineDescription(
    history.action,
    history.oldStatus,
    history.newStatus,
  ),
  oldStatus: history.oldStatus,
  newStatus: history.newStatus,
  createdAt: history.createdAt,
  user: history.user,
});

const toPortalCaseSummary = (
  caseProfile: PortalCaseSummaryRecord,
  upcomingAppointmentCount = 0,
): PortalCaseSummary => ({
  id: caseProfile.id,
  caseCode: caseProfile.caseCode,
  title: caseProfile.title,
  status: caseProfile.status,
  priority: caseProfile.priority,
  service: caseProfile.service,
  assignedStaff: caseProfile.assignedTo,
  createdAt: caseProfile.createdAt,
  updatedAt: caseProfile.updatedAt,
  completedAt: caseProfile.completedAt,
  latestActivity: caseProfile.histories[0]
    ? toPortalTimelineItem(caseProfile.histories[0])
    : null,
  upcomingAppointmentCount,
  documentCount: caseProfile._count.documents,
  taskCount: caseProfile._count.tasks,
});

const toSafePortalAppointment = (
  appointment: PortalNextAppointmentRecord,
) => ({
  id: appointment.id,
  appointmentDate: appointment.appointmentDate,
  startTime: appointment.startTime,
  endTime: appointment.endTime,
  method: appointment.method,
  status: appointment.status,
  staff: appointment.staff,
});

const getUpcomingPortalAppointmentWhere = (
  session: PortalSession,
  caseProfileId?: string,
): Prisma.AppointmentWhereInput => ({
  organizationId: session.portalAccount.organizationId,
  customerId: session.portalAccount.customerId,
  appointmentDate: {
    gte: getServerCalendarDate(),
  },
  status: {
    not: AppointmentStatus.CANCELLED,
  },
  ...(caseProfileId && { caseProfileId }),
});

const getPortalCaseSearchFilter = (
  search: string | undefined,
): Prisma.CaseProfileWhereInput | undefined =>
  search
    ? {
        OR: [
          {
            caseCode: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            title: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ],
      }
    : undefined;

const getUpcomingAppointmentCountByCase = async (
  session: PortalSession,
  caseIds: string[],
): Promise<Map<string, number>> => {
  if (caseIds.length === 0) {
    return new Map();
  }

  const groups = await prisma.appointment.groupBy({
    by: ["caseProfileId"],
    where: {
      ...getUpcomingPortalAppointmentWhere(session),
      caseProfileId: {
        in: caseIds,
      },
    },
    _count: {
      _all: true,
    },
  });
  const counts = new Map<string, number>();

  for (const group of groups) {
    if (group.caseProfileId) {
      counts.set(group.caseProfileId, group._count._all);
    }
  }

  return counts;
};

export const listPortalCases = async (
  query: PortalCaseListQuery,
  session: PortalSession,
): Promise<PortalCaseListResult> => {
  const { page, limit, search, status } = query;
  const searchFilter = getPortalCaseSearchFilter(search);
  const where: Prisma.CaseProfileWhereInput = {
    ...getPortalCaseScope(session),
    ...(status && { status }),
    ...searchFilter,
  };
  const pagination = getPagination(page, limit);
  const [caseProfiles, total] = await prisma.$transaction([
    prisma.caseProfile.findMany({
      where,
      ...pagination,
      select: safePortalCaseBaseSelect,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    }),
    prisma.caseProfile.count({ where }),
  ]);
  const upcomingCounts = await getUpcomingAppointmentCountByCase(
    session,
    caseProfiles.map((caseProfile) => caseProfile.id),
  );

  return {
    items: caseProfiles.map((caseProfile) =>
      toPortalCaseSummary(
        caseProfile,
        upcomingCounts.get(caseProfile.id) ?? 0,
      ),
    ),
    meta: createPaginationMeta(page, limit, total),
  };
};

export const getPortalCaseSummary = async (
  session: PortalSession,
): Promise<PortalCaseSummaryResult> => {
  const scope = getPortalCaseScope(session);
  const [
    groupedCases,
    upcomingAppointments,
    nextAppointment,
    recentCases,
  ] = await prisma.$transaction([
    prisma.caseProfile.groupBy({
      by: ["status"],
      where: scope,
      _count: {
        _all: true,
      },
    }),
    prisma.appointment.count({
      where: getUpcomingPortalAppointmentWhere(session),
    }),
    prisma.appointment.findFirst({
      where: getUpcomingPortalAppointmentWhere(session),
      select: safePortalAppointmentSelect,
      orderBy: [
        { appointmentDate: "asc" },
        { startTime: "asc" },
        { id: "asc" },
      ],
    }),
    prisma.caseProfile.findMany({
      where: scope,
      select: safePortalCaseBaseSelect,
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: 3,
    }),
  ]);
  const countsByStatus = new Map(
    groupedCases.map((group) => [group.status, group._count._all]),
  );
  const recentUpcomingCounts = await getUpcomingAppointmentCountByCase(
    session,
    recentCases.map((caseProfile) => caseProfile.id),
  );
  const completedCases = countsByStatus.get(CaseStatus.COMPLETED) ?? 0;
  const cancelledCases = countsByStatus.get(CaseStatus.CANCELLED) ?? 0;
  const totalCases = Object.values(CaseStatus).reduce(
    (total, statusValue) => total + (countsByStatus.get(statusValue) ?? 0),
    0,
  );

  return {
    totalCases,
    activeCases: totalCases - completedCases - cancelledCases,
    completedCases,
    cancelledCases,
    upcomingAppointments,
    nextAppointment: nextAppointment
      ? toSafePortalAppointment(nextAppointment)
      : null,
    casesByStatus: Object.values(CaseStatus).map((statusValue) => ({
      status: statusValue,
      count: countsByStatus.get(statusValue) ?? 0,
    })),
    recentCases: recentCases.map((caseProfile) =>
      toPortalCaseSummary(
        caseProfile,
        recentUpcomingCounts.get(caseProfile.id) ?? 0,
      ),
    ),
  };
};

export const getPortalCaseById = async (
  id: string,
  session: PortalSession,
): Promise<PortalCaseDetail> => {
  const caseProfile = await prisma.caseProfile.findFirst({
    where: {
      id,
      ...getPortalCaseScope(session),
    },
    select: safePortalCaseDetailSelect,
  });

  if (!caseProfile) {
    throw new AppError("Case profile not found.", HTTP_STATUS.NOT_FOUND);
  }

  const upcomingCounts = await getUpcomingAppointmentCountByCase(session, [
    caseProfile.id,
  ]);
  const summary = toPortalCaseSummary(
    caseProfile,
    upcomingCounts.get(caseProfile.id) ?? 0,
  );

  return {
    ...summary,
    description: caseProfile.description,
    customer: toSafePortalCustomer(caseProfile.customer),
    deadline: caseProfile.deadline,
    counts: {
      histories: caseProfile._count.histories,
      appointments: caseProfile._count.appointments,
      documents: caseProfile._count.documents,
      tasks: caseProfile._count.tasks,
    },
    timeline: caseProfile.histories.map(toPortalTimelineItem),
    appointments: caseProfile.appointments.map(toSafePortalAppointment),
    documents: caseProfile.documents.map((document) => ({
      id: document.id,
      fileName: document.fileName,
      fileType: document.fileType,
      mimeType: document.mimeType,
      size: document.size,
      createdAt: document.createdAt,
    })),
    tasks: caseProfile.tasks.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      deadline: task.deadline,
      updatedAt: task.updatedAt,
    })),
  };
};

const throwPortalAccountWriteError = (error: unknown): never => {
  if (isPrismaError(error, "P2002")) {
    throw new AppError(
      "Customer portal account already exists for this customer or email.",
      HTTP_STATUS.CONFLICT,
    );
  }

  if (isPrismaError(error, "P2025")) {
    throw new AppError(
      "Customer portal account not found.",
      HTTP_STATUS.NOT_FOUND,
    );
  }

  throw error;
};

const assertCustomerExists = async (
  customerId: string,
  organizationId: string,
  tx: Prisma.TransactionClient = prisma,
) => {
  const customer = await tx.customer.findFirst({
    where: {
      id: customerId,
      organizationId,
    },
    select: {
      ...safePortalCustomerSelect,
      organizationId: true,
      portalAccount: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!customer) {
    throw new AppError("Customer not found.", HTTP_STATUS.NOT_FOUND);
  }

  return customer;
};

const getPortalAccountForCustomer = async (
  customerId: string,
  organizationId: string,
  tx: Prisma.TransactionClient = prisma,
): Promise<SafeCustomerPortalAccount | null> =>
  tx.customerPortalAccount.findFirst({
    where: {
      customerId,
      organizationId,
    },
    select: safePortalAccountSelect,
  });

const assertPortalAccountForCustomer = async (
  customerId: string,
  organizationId: string,
  tx: Prisma.TransactionClient = prisma,
): Promise<SafeCustomerPortalAccount> => {
  const account = await getPortalAccountForCustomer(
    customerId,
    organizationId,
    tx,
  );

  if (!account) {
    throw new AppError(
      "Customer portal account not found.",
      HTTP_STATUS.NOT_FOUND,
    );
  }

  return account;
};

export const getCustomerPortalAccount = async (
  customerId: string,
  organizationId: string,
): Promise<SafeCustomerPortalAccount | null> => {
  await assertCustomerExists(customerId, organizationId);

  return getPortalAccountForCustomer(customerId, organizationId);
};

export const createCustomerPortalAccount = async (
  customerId: string,
  input: CreatePortalAccountInput,
  actorId: string,
  organizationId: string,
): Promise<PortalAccountMutationResult> => {
  const rawPassword = input.password ?? generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(rawPassword, 12);
  const isGeneratedPassword = input.password === undefined;

  try {
    const account = await prisma.$transaction(async (tx) => {
      const customer = await assertCustomerExists(customerId, organizationId, tx);

      if (customer.portalAccount) {
        throw new AppError(
          "Customer portal account already exists.",
          HTTP_STATUS.CONFLICT,
        );
      }

      const email = (input.email ?? customer.email)?.trim().toLowerCase();

      if (!email) {
        throw new AppError(
          "Customer portal account requires an email address.",
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const existingEmail = await tx.customerPortalAccount.findFirst({
        where: {
          organizationId,
          email,
        },
        select: {
          id: true,
        },
      });

      if (existingEmail) {
        throw new AppError(
          "A customer portal account with this email already exists in this workspace.",
          HTTP_STATUS.CONFLICT,
        );
      }

      const created = await tx.customerPortalAccount.create({
        data: {
          organizationId,
          customerId: customer.id,
          email,
          passwordHash,
          isActive: true,
        },
        select: safePortalAccountSelect,
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          userId: actorId,
          action: "CUSTOMER_PORTAL_ACCOUNT_CREATED",
          entityType: "CustomerPortalAccount",
          entityId: created.id,
          description: "Customer portal account created.",
        },
      });

      return created;
    });

    return {
      account: toSafePortalAccount(account),
      temporaryPassword: isGeneratedPassword ? rawPassword : undefined,
    };
  } catch (error) {
    return throwPortalAccountWriteError(error);
  }
};

export const resetCustomerPortalPassword = async (
  customerId: string,
  input: ResetPortalPasswordInput,
  actorId: string,
  organizationId: string,
): Promise<PortalAccountMutationResult> => {
  const rawPassword = input.password ?? generateTemporaryPassword();
  const passwordHash = await bcrypt.hash(rawPassword, 12);
  const isGeneratedPassword = input.password === undefined;

  try {
    const account = await prisma.$transaction(async (tx) => {
      const existing = await assertPortalAccountForCustomer(
        customerId,
        organizationId,
        tx,
      );
      const updated = await tx.customerPortalAccount.update({
        where: {
          id: existing.id,
        },
        data: {
          passwordHash,
        },
        select: safePortalAccountSelect,
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          userId: actorId,
          action: "CUSTOMER_PORTAL_PASSWORD_RESET",
          entityType: "CustomerPortalAccount",
          entityId: updated.id,
          description: "Customer portal account password reset.",
        },
      });

      return updated;
    });

    return {
      account: toSafePortalAccount(account),
      temporaryPassword: isGeneratedPassword ? rawPassword : undefined,
    };
  } catch (error) {
    return throwPortalAccountWriteError(error);
  }
};

const setCustomerPortalAccountActive = async (
  customerId: string,
  organizationId: string,
  actorId: string,
  isActive: boolean,
): Promise<SafeCustomerPortalAccount> => {
  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await assertPortalAccountForCustomer(
        customerId,
        organizationId,
        tx,
      );
      const updated = await tx.customerPortalAccount.update({
        where: {
          id: existing.id,
        },
        data: {
          isActive,
        },
        select: safePortalAccountSelect,
      });

      await tx.activityLog.create({
        data: {
          organizationId,
          userId: actorId,
          action: isActive
            ? "CUSTOMER_PORTAL_ACCOUNT_ACTIVATED"
            : "CUSTOMER_PORTAL_ACCOUNT_DEACTIVATED",
          entityType: "CustomerPortalAccount",
          entityId: updated.id,
          description: isActive
            ? "Customer portal account activated."
            : "Customer portal account deactivated.",
        },
      });

      return toSafePortalAccount(updated);
    });
  } catch (error) {
    return throwPortalAccountWriteError(error);
  }
};

export const deactivateCustomerPortalAccount = async (
  customerId: string,
  actorId: string,
  organizationId: string,
): Promise<SafeCustomerPortalAccount> =>
  setCustomerPortalAccountActive(customerId, organizationId, actorId, false);

export const activateCustomerPortalAccount = async (
  customerId: string,
  actorId: string,
  organizationId: string,
): Promise<SafeCustomerPortalAccount> =>
  setCustomerPortalAccountActive(customerId, organizationId, actorId, true);

const getActivePortalSessionAccount = async (
  portalAccountId: string,
): Promise<PortalSessionAccount | null> =>
  prisma.customerPortalAccount.findUnique({
    where: {
      id: portalAccountId,
    },
    select: portalSessionAccountSelect,
  });

export const getPortalSessionByAccountId = async (
  portalAccountId: string,
): Promise<PortalSession> => {
  const account = await getActivePortalSessionAccount(portalAccountId);

  if (
    !account ||
    !account.isActive ||
    !account.organization.isActive ||
    account.customer.organizationId !== account.organizationId
  ) {
    throw new AppError(
      "Invalid or expired access token.",
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  return toPortalSession(account);
};

const throwInvalidPortalLogin = (): never => {
  throw new AppError(
    INVALID_PORTAL_LOGIN_MESSAGE,
    HTTP_STATUS.UNAUTHORIZED,
  );
};

export const loginCustomerPortal = async (
  input: PortalLoginInput,
): Promise<PortalLoginResult> => {
  const organization = await prisma.organization.findUnique({
    where: {
      slug: input.workspaceSlug,
    },
    select: {
      id: true,
      isActive: true,
    },
  });

  if (!organization?.isActive) {
    return throwInvalidPortalLogin();
  }

  const account = await prisma.customerPortalAccount.findFirst({
    where: {
      organizationId: organization.id,
      email: input.email,
    },
    select: portalSessionAccountSelect,
  });

  if (
    !account?.isActive ||
    !account.organization.isActive ||
    account.customer.organizationId !== account.organizationId
  ) {
    return throwInvalidPortalLogin();
  }

  const isPasswordValid = await bcrypt.compare(
    input.password,
    account.passwordHash,
  );

  if (!isPasswordValid) {
    return throwInvalidPortalLogin();
  }

  const updated = await prisma.customerPortalAccount.update({
    where: {
      id: account.id,
    },
    data: {
      lastLoginAt: new Date(),
    },
    select: portalSessionAccountSelect,
  });
  const session = toPortalSession(updated);
  const accessToken = signCustomerPortalAccessToken({
    sub: updated.id,
    portalAccountId: updated.id,
    organizationId: updated.organizationId,
    customerId: updated.customerId,
    email: updated.email,
    purpose: "customer_portal",
  });

  return {
    accessToken,
    ...session,
  };
};
