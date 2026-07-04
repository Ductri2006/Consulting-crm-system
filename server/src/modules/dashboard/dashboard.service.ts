import {
  AppointmentStatus,
  CaseStatus,
  Prisma,
  RequestStatus,
  TaskStatus,
  UserRole,
} from "@prisma/client";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  addUtcDays,
  enumerateUtcMonthKeys,
  getCalendarMonthRange,
  getRollingDateRange,
  getServerCalendarDate,
  toUtcMonthKey,
} from "../../utils/dateRange";
import type { SafeUser } from "../../utils/sanitizeUser";
import type {
  CasesByMonthQuery,
  RecentActivitiesQuery,
  StaffPerformanceQuery,
  UpcomingDeadlinesQuery,
} from "./dashboard.types";

const crmRoles: UserRole[] = [
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
];

const performanceUserSelect = {
  id: true,
  organizationId: true,
  fullName: true,
  email: true,
  role: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect;

const activityUserSelect = {
  id: true,
  organizationId: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const activityCaseSelect = {
  id: true,
  caseCode: true,
  title: true,
} satisfies Prisma.CaseProfileSelect;

const assertDashboardActor = (actor: SafeUser): void => {
  if (!crmRoles.includes(actor.role)) {
    throw new AppError(
      "You do not have permission to access dashboard reports.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
};

const assertPerformanceAccess = (actor: SafeUser): void => {
  if (
    actor.role !== UserRole.ADMIN &&
    actor.role !== UserRole.MANAGER
  ) {
    throw new AppError(
      "Only administrators and managers can view staff performance.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
};

const getCaseScope = (
  actor: SafeUser,
): Prisma.CaseProfileWhereInput =>
  actor.role === UserRole.STAFF
    ? {
        organizationId: actor.organizationId,
        assignedToId: actor.id,
      }
    : { organizationId: actor.organizationId };

const getTaskScope = (actor: SafeUser): Prisma.TaskWhereInput =>
  actor.role === UserRole.STAFF
    ? {
        organizationId: actor.organizationId,
        OR: [
          { assignedToId: actor.id },
          { createdById: actor.id },
        ],
      }
    : { organizationId: actor.organizationId };

const getDocumentScope = (
  actor: SafeUser,
): Prisma.DocumentWhereInput =>
  actor.role === UserRole.STAFF
    ? {
        organizationId: actor.organizationId,
        OR: [
          { uploadedById: actor.id },
          {
            caseProfile: {
              is: {
                assignedToId: actor.id,
              },
            },
          },
        ],
      }
    : { organizationId: actor.organizationId };

export const getDashboardOverview = async (actor: SafeUser) => {
  assertDashboardActor(actor);

  const now = new Date();
  const today = getServerCalendarDate(now);
  const caseScope = getCaseScope(actor);
  const taskScope = getTaskScope(actor);
  const documentScope = getDocumentScope(actor);
  const customerScope: Prisma.CustomerWhereInput =
    actor.role === UserRole.STAFF
      ? {
          organizationId: actor.organizationId,
          OR: [
            {
              cases: {
                some: {
                  organizationId: actor.organizationId,
                  assignedToId: actor.id,
                },
              },
            },
            {
              appointments: {
                some: {
                  organizationId: actor.organizationId,
                  staffId: actor.id,
                },
              },
            },
          ],
        }
      : { organizationId: actor.organizationId };
  const appointmentScope: Prisma.AppointmentWhereInput =
    actor.role === UserRole.STAFF
      ? {
          organizationId: actor.organizationId,
          staffId: actor.id,
        }
      : { organizationId: actor.organizationId };
  const consultationScope: Prisma.ConsultationRequestWhereInput =
    actor.role === UserRole.STAFF
      ? {
          organizationId: actor.organizationId,
          id: {
            in: [],
          },
        }
      : { organizationId: actor.organizationId };

  const [
    totalCustomers,
    totalCases,
    casesInProgress,
    completedCases,
    overdueCases,
    todayAppointments,
    pendingTasks,
    overdueTasks,
    totalDocuments,
    newConsultationRequests,
  ] = await prisma.$transaction([
    prisma.customer.count({ where: customerScope }),
    prisma.caseProfile.count({ where: caseScope }),
    prisma.caseProfile.count({
      where: {
        ...caseScope,
        status: CaseStatus.PROCESSING,
      },
    }),
    prisma.caseProfile.count({
      where: {
        ...caseScope,
        status: CaseStatus.COMPLETED,
      },
    }),
    prisma.caseProfile.count({
      where: {
        ...caseScope,
        deadline: {
          lt: now,
        },
        status: {
          notIn: [CaseStatus.COMPLETED, CaseStatus.CANCELLED],
        },
      },
    }),
    prisma.appointment.count({
      where: {
        ...appointmentScope,
        appointmentDate: today,
        status: {
          not: AppointmentStatus.CANCELLED,
        },
      },
    }),
    prisma.task.count({
      where: {
        AND: [
          taskScope,
          {
            status: {
              in: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
            },
          },
        ],
      },
    }),
    prisma.task.count({
      where: {
        AND: [
          taskScope,
          {
            deadline: {
              lt: now,
            },
            status: {
              notIn: [TaskStatus.DONE, TaskStatus.CANCELLED],
            },
          },
        ],
      },
    }),
    prisma.document.count({ where: documentScope }),
    prisma.consultationRequest.count({
      where: {
        ...consultationScope,
        status: RequestStatus.NEW,
      },
    }),
  ]);

  return {
    totalCustomers,
    totalCases,
    casesInProgress,
    completedCases,
    overdueCases,
    todayAppointments,
    pendingTasks,
    overdueTasks,
    totalDocuments,
    newConsultationRequests,
  };
};

export const getCasesByStatus = async (actor: SafeUser) => {
  assertDashboardActor(actor);

  const groupedCases = await prisma.caseProfile.groupBy({
    by: ["status"],
    where: getCaseScope(actor),
    _count: {
      _all: true,
    },
  });
  const counts = new Map(
    groupedCases.map((item) => [item.status, item._count._all]),
  );

  return {
    items: Object.values(CaseStatus).map((status) => ({
      status,
      count: counts.get(status) ?? 0,
    })),
  };
};

export const getCasesByMonth = async (
  query: CasesByMonthQuery,
  actor: SafeUser,
) => {
  assertDashboardActor(actor);

  const range = getCalendarMonthRange(query);
  const caseScope = getCaseScope(actor);
  const [createdCases, completedCases] = await prisma.$transaction([
    prisma.caseProfile.findMany({
      where: {
        ...caseScope,
        createdAt: {
          gte: range.startDate,
          lt: range.endDateExclusive,
        },
      },
      select: {
        createdAt: true,
      },
    }),
    prisma.caseProfile.findMany({
      where: {
        ...caseScope,
        status: CaseStatus.COMPLETED,
        completedAt: {
          gte: range.startDate,
          lt: range.endDateExclusive,
        },
      },
      select: {
        completedAt: true,
      },
    }),
  ]);
  const monthCounts = new Map(
    enumerateUtcMonthKeys(range).map((month) => [
      month,
      {
        created: 0,
        completed: 0,
      },
    ]),
  );

  for (const item of createdCases) {
    const counts = monthCounts.get(toUtcMonthKey(item.createdAt));

    if (counts) {
      counts.created += 1;
    }
  }

  for (const item of completedCases) {
    if (!item.completedAt) {
      continue;
    }

    const counts = monthCounts.get(toUtcMonthKey(item.completedAt));

    if (counts) {
      counts.completed += 1;
    }
  }

  return {
    items: [...monthCounts.entries()].map(([month, counts]) => ({
      month,
      ...counts,
    })),
  };
};

export const getUpcomingDeadlines = async (
  query: UpcomingDeadlinesQuery,
  actor: SafeUser,
) => {
  assertDashboardActor(actor);

  const now = new Date();
  const deadlineEnd = addUtcDays(now, query.days);
  const today = getServerCalendarDate(now);
  const appointmentEnd = addUtcDays(today, query.days);
  const caseScope = getCaseScope(actor);
  const taskScope = getTaskScope(actor);
  const appointmentScope: Prisma.AppointmentWhereInput =
    actor.role === UserRole.STAFF
      ? {
          organizationId: actor.organizationId,
          staffId: actor.id,
        }
      : { organizationId: actor.organizationId };
  const [cases, tasks, appointments] = await prisma.$transaction([
    prisma.caseProfile.findMany({
      where: {
        ...caseScope,
        deadline: {
          gte: now,
          lt: deadlineEnd,
        },
        status: {
          notIn: [CaseStatus.COMPLETED, CaseStatus.CANCELLED],
        },
      },
      select: {
        id: true,
        title: true,
        deadline: true,
        priority: true,
        status: true,
      },
      orderBy: [{ deadline: "asc" }, { id: "asc" }],
      take: query.limit,
    }),
    prisma.task.findMany({
      where: {
        AND: [
          taskScope,
          {
            deadline: {
              gte: now,
              lt: deadlineEnd,
            },
            status: {
              notIn: [TaskStatus.DONE, TaskStatus.CANCELLED],
            },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        deadline: true,
        priority: true,
        status: true,
      },
      orderBy: [{ deadline: "asc" }, { id: "asc" }],
      take: query.limit,
    }),
    prisma.appointment.findMany({
      where: {
        ...appointmentScope,
        appointmentDate: {
          gte: today,
          lt: appointmentEnd,
        },
        status: {
          not: AppointmentStatus.CANCELLED,
        },
      },
      select: {
        id: true,
        appointmentDate: true,
        startTime: true,
        status: true,
        customer: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: [
        { appointmentDate: "asc" },
        { startTime: "asc" },
        { id: "asc" },
      ],
      take: query.limit,
    }),
  ]);
  const items = [
    ...cases
      .filter(
        (
          item,
        ): item is typeof item & {
          deadline: Date;
        } => item.deadline !== null,
      )
      .map((item) => ({
        type: "CASE" as const,
        id: item.id,
        title: item.title,
        date: item.deadline,
        priority: item.priority,
        status: item.status,
      })),
    ...tasks
      .filter(
        (
          item,
        ): item is typeof item & {
          deadline: Date;
        } => item.deadline !== null,
      )
      .map((item) => ({
        type: "TASK" as const,
        id: item.id,
        title: item.title,
        date: item.deadline,
        priority: item.priority,
        status: item.status,
      })),
    ...appointments.map((item) => ({
      type: "APPOINTMENT" as const,
      id: item.id,
      title: `Appointment with ${item.customer.fullName}`,
      date: item.appointmentDate,
      startTime: item.startTime,
      status: item.status,
    })),
  ]
    .sort(
      (left, right) =>
        left.date.getTime() - right.date.getTime() ||
        left.type.localeCompare(right.type) ||
        left.id.localeCompare(right.id),
    )
    .slice(0, query.limit);

  return { items };
};

export const getStaffPerformance = async (
  query: StaffPerformanceQuery,
  actor: SafeUser,
) => {
  assertPerformanceAccess(actor);

  const range = getRollingDateRange(query, 30);
  const dateFilter = {
    gte: range.startDate,
    lt: range.endDateExclusive,
  };
  const [
    users,
    assignedCaseGroups,
    completedCaseGroups,
    completedTaskGroups,
    completedAppointmentGroups,
  ] = await prisma.$transaction([
    prisma.user.findMany({
      where: {
        organizationId: actor.organizationId,
        isActive: true,
        role: {
          in: crmRoles,
        },
      },
      select: performanceUserSelect,
    }),
    prisma.caseProfile.groupBy({
      by: ["assignedToId"],
      where: {
        organizationId: actor.organizationId,
        assignedToId: {
          not: null,
        },
        createdAt: dateFilter,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.caseProfile.groupBy({
      by: ["assignedToId"],
      where: {
        organizationId: actor.organizationId,
        assignedToId: {
          not: null,
        },
        status: CaseStatus.COMPLETED,
        completedAt: dateFilter,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.task.groupBy({
      by: ["assignedToId"],
      where: {
        organizationId: actor.organizationId,
        assignedToId: {
          not: null,
        },
        status: TaskStatus.DONE,
        updatedAt: dateFilter,
      },
      _count: {
        _all: true,
      },
    }),
    prisma.appointment.groupBy({
      by: ["staffId"],
      where: {
        organizationId: actor.organizationId,
        staffId: {
          not: null,
        },
        status: AppointmentStatus.COMPLETED,
        updatedAt: dateFilter,
      },
      _count: {
        _all: true,
      },
    }),
  ]);
  const assignedCases = new Map(
    assignedCaseGroups.map((item) => [
      item.assignedToId,
      item._count._all,
    ]),
  );
  const completedCases = new Map(
    completedCaseGroups.map((item) => [
      item.assignedToId,
      item._count._all,
    ]),
  );
  const completedTasks = new Map(
    completedTaskGroups.map((item) => [
      item.assignedToId,
      item._count._all,
    ]),
  );
  const appointmentsCompleted = new Map(
    completedAppointmentGroups.map((item) => [
      item.staffId,
      item._count._all,
    ]),
  );
  const items = users
    .map((user) => ({
      user,
      assignedCases: assignedCases.get(user.id) ?? 0,
      completedCases: completedCases.get(user.id) ?? 0,
      completedTasks: completedTasks.get(user.id) ?? 0,
      appointmentsCompleted:
        appointmentsCompleted.get(user.id) ?? 0,
    }))
    .sort(
      (left, right) =>
        right.completedCases - left.completedCases ||
        right.completedTasks - left.completedTasks ||
        right.appointmentsCompleted -
          left.appointmentsCompleted ||
        right.assignedCases - left.assignedCases ||
        left.user.id.localeCompare(right.user.id),
    )
    .slice(0, query.limit);

  return { items };
};

const describeCaseActivity = (
  action: string,
  note: string | null,
): string => {
  if (note) {
    return note;
  }

  return action
    .toLowerCase()
    .split("_")
    .map(
      (word, index) =>
        index === 0
          ? `${word.charAt(0).toUpperCase()}${word.slice(1)}`
          : word,
    )
    .join(" ");
};

export const getRecentActivities = async (
  query: RecentActivitiesQuery,
  actor: SafeUser,
) => {
  assertDashboardActor(actor);

  const histories = await prisma.caseHistory.findMany({
    where:
      actor.role === UserRole.STAFF
        ? {
            organizationId: actor.organizationId,
            caseProfile: {
              assignedToId: actor.id,
            },
          }
        : { organizationId: actor.organizationId },
    include: {
      user: {
        select: activityUserSelect,
      },
      caseProfile: {
        select: activityCaseSelect,
      },
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: query.limit,
  });

  return {
    items: histories.map((history) => ({
      type: "CASE_HISTORY" as const,
      id: history.id,
      action: history.action,
      description: describeCaseActivity(
        history.action,
        history.note,
      ),
      oldStatus: history.oldStatus,
      newStatus: history.newStatus,
      createdAt: history.createdAt,
      user: history.user,
      caseProfile: history.caseProfile,
    })),
  };
};
