import {
  DocumentDownloadActorType,
  DocumentSource,
  Prisma,
  UserRole,
} from "@prisma/client";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  addUtcDays,
  getServerCalendarDate,
  startOfUtcDay,
} from "../../utils/dateRange";
import {
  createPaginationMeta,
  getPagination,
} from "../../utils/pagination";
import type { SafeUser } from "../../utils/sanitizeUser";
import type {
  ActivityItem,
  ActivityListQuery,
  ActivityListResult,
  ActivitySummaryResult,
} from "./activity.types";

const actorSelect = {
  id: true,
  fullName: true,
  role: true,
} satisfies Prisma.UserSelect;

const caseSummarySelect = {
  id: true,
  caseCode: true,
  title: true,
} satisfies Prisma.CaseProfileSelect;

const documentSummarySelect = {
  id: true,
  fileName: true,
  visibility: true,
} satisfies Prisma.DocumentSelect;

const assertActivityActor = (actor: SafeUser): void => {
  if (
    actor.role !== UserRole.ADMIN &&
    actor.role !== UserRole.MANAGER
  ) {
    throw new AppError(
      "Only administrators and managers can view workspace activity.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
};

const sanitizeDescription = (description: string | null): string | null => {
  if (!description) {
    return null;
  }

  return description
    .replace(/s3:\/\/\S+/gi, "[private storage]")
    .replace(/\/uploads\/\S+/gi, "[private file]")
    .replace(/[A-Za-z]:\\\S+/g, "[private file]")
    .replace(/(token|password|secret|storageKey|signedUrl)[^.,;]*/gi, "[redacted]")
    .trim();
};

const describeCaseHistory = (
  action: string,
  note: string | null,
  oldStatus: string | null,
  newStatus: string | null,
): string => {
  if (note) {
    return note;
  }

  if (oldStatus && newStatus) {
    return `Case status changed from ${oldStatus} to ${newStatus}.`;
  }

  return action
    .toLowerCase()
    .split("_")
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
};

const getDateWhere = (
  query: Pick<ActivityListQuery, "fromDate" | "toDate">,
): Prisma.DateTimeFilter | undefined => {
  const dateWhere: Prisma.DateTimeFilter = {};

  if (query.fromDate) {
    dateWhere.gte = startOfUtcDay(query.fromDate);
  }

  if (query.toDate) {
    dateWhere.lt = addUtcDays(startOfUtcDay(query.toDate), 1);
  }

  return Object.keys(dateWhere).length > 0 ? dateWhere : undefined;
};

const matchesEntityType = (
  requested: string | undefined,
  allowed: string,
): boolean => !requested || requested === allowed;

const getSourceFetchLimit = (query: ActivityListQuery): number => {
  const pagination = getPagination(query.page, query.limit);

  return Math.min(pagination.skip + pagination.take, 1_000);
};

const sortActivities = (
  items: ActivityItem[],
  sort: ActivityListQuery["sort"],
): ActivityItem[] =>
  items.sort((first, second) => {
    const dateDelta =
      first.createdAt.getTime() - second.createdAt.getTime();

    if (dateDelta !== 0) {
      return sort === "oldest" ? dateDelta : -dateDelta;
    }

    return sort === "oldest"
      ? first.id.localeCompare(second.id)
      : second.id.localeCompare(first.id);
  });

const sliceActivities = (
  items: ActivityItem[],
  query: ActivityListQuery,
): ActivityItem[] => {
  const pagination = getPagination(query.page, query.limit);

  return items.slice(pagination.skip, pagination.skip + pagination.take);
};

const getActivityLogWhere = (
  actor: SafeUser,
  query: Partial<ActivityListQuery>,
): Prisma.ActivityLogWhereInput => ({
  organizationId: actor.organizationId,
  ...(query.action && { action: query.action }),
  ...(query.actorUserId && { userId: query.actorUserId }),
  ...(query.entityType && { entityType: query.entityType }),
  ...(getDateWhere(query) && { createdAt: getDateWhere(query) }),
  ...(query.search && {
    OR: [
      { action: { contains: query.search, mode: "insensitive" } },
      { entityType: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ],
  }),
});

const getCaseHistoryWhere = (
  actor: SafeUser,
  query: Partial<ActivityListQuery>,
): Prisma.CaseHistoryWhereInput | null => {
  if (!matchesEntityType(query.entityType, "CaseProfile")) {
    return null;
  }

  return {
    organizationId: actor.organizationId,
    ...(query.action && { action: query.action }),
    ...(query.actorUserId && { userId: query.actorUserId }),
    ...(getDateWhere(query) && { createdAt: getDateWhere(query) }),
    ...(query.search && {
      OR: [
        { action: { contains: query.search, mode: "insensitive" } },
        { note: { contains: query.search, mode: "insensitive" } },
        {
          caseProfile: {
            title: { contains: query.search, mode: "insensitive" },
          },
        },
        {
          caseProfile: {
            caseCode: { contains: query.search, mode: "insensitive" },
          },
        },
      ],
    }),
  };
};

const getAppointmentWhere = (
  actor: SafeUser,
  query: Partial<ActivityListQuery>,
): Prisma.AppointmentWhereInput | null => {
  if (
    query.action &&
    query.action !== "APPOINTMENT_CREATED"
  ) {
    return null;
  }

  if (!matchesEntityType(query.entityType, "Appointment")) {
    return null;
  }

  return {
    organizationId: actor.organizationId,
    ...(query.actorUserId && { staffId: query.actorUserId }),
    ...(getDateWhere(query) && { createdAt: getDateWhere(query) }),
    ...(query.search && {
      OR: [
        { startTime: { contains: query.search, mode: "insensitive" } },
        {
          customer: {
            fullName: { contains: query.search, mode: "insensitive" },
          },
        },
        {
          caseProfile: {
            title: { contains: query.search, mode: "insensitive" },
          },
        },
        {
          caseProfile: {
            caseCode: { contains: query.search, mode: "insensitive" },
          },
        },
      ],
    }),
  };
};

const getTaskWhere = (
  actor: SafeUser,
  query: Partial<ActivityListQuery>,
): Prisma.TaskWhereInput | null => {
  if (query.action && query.action !== "TASK_CREATED") {
    return null;
  }

  if (!matchesEntityType(query.entityType, "Task")) {
    return null;
  }

  return {
    organizationId: actor.organizationId,
    ...(query.actorUserId && { createdById: query.actorUserId }),
    ...(getDateWhere(query) && { createdAt: getDateWhere(query) }),
    ...(query.search && {
      OR: [
        { title: { contains: query.search, mode: "insensitive" } },
        {
          caseProfile: {
            title: { contains: query.search, mode: "insensitive" },
          },
        },
        {
          caseProfile: {
            caseCode: { contains: query.search, mode: "insensitive" },
          },
        },
      ],
    }),
  };
};

const getDocumentWhere = (
  actor: SafeUser,
  query: Partial<ActivityListQuery>,
): Prisma.DocumentWhereInput | null => {
  if (
    query.action &&
    query.action !== "DOCUMENT_UPLOADED" &&
    query.action !== "CUSTOMER_PORTAL_DOCUMENT_UPLOADED"
  ) {
    return null;
  }

  if (!matchesEntityType(query.entityType, "Document")) {
    return null;
  }

  return {
    organizationId: actor.organizationId,
    ...(query.action === "DOCUMENT_UPLOADED" && {
      source: DocumentSource.INTERNAL,
    }),
    ...(query.action === "CUSTOMER_PORTAL_DOCUMENT_UPLOADED" && {
      source: DocumentSource.CUSTOMER_PORTAL,
    }),
    ...(query.actorUserId && { uploadedById: query.actorUserId }),
    ...(getDateWhere(query) && { createdAt: getDateWhere(query) }),
    ...(query.search && {
      OR: [
        { fileName: { contains: query.search, mode: "insensitive" } },
        {
          caseProfile: {
            title: { contains: query.search, mode: "insensitive" },
          },
        },
        {
          caseProfile: {
            caseCode: { contains: query.search, mode: "insensitive" },
          },
        },
      ],
    }),
  };
};

const getDocumentDownloadWhere = (
  actor: SafeUser,
  query: Partial<ActivityListQuery>,
): Prisma.DocumentDownloadAuditWhereInput | null => {
  if (query.action && query.action !== "DOCUMENT_DOWNLOADED") {
    return null;
  }

  if (!matchesEntityType(query.entityType, "Document")) {
    return null;
  }

  return {
    organizationId: actor.organizationId,
    ...(query.actorUserId && { actorUserId: query.actorUserId }),
    ...(getDateWhere(query) && { createdAt: getDateWhere(query) }),
    ...(query.search && {
      OR: [
        {
          document: {
            fileName: { contains: query.search, mode: "insensitive" },
          },
        },
      ],
    }),
  };
};

const getOrderBy = (
  sort: ActivityListQuery["sort"],
): Prisma.SortOrder => (sort === "oldest" ? "asc" : "desc");

const listActivityLogItems = async (
  actor: SafeUser,
  query: ActivityListQuery,
): Promise<{ items: ActivityItem[]; total: number }> => {
  const where = getActivityLogWhere(actor, query);
  const [items, total] = await prisma.$transaction([
    prisma.activityLog.findMany({
      where,
      include: {
        user: {
          select: actorSelect,
        },
      },
      orderBy: [{ createdAt: getOrderBy(query.sort) }, { id: getOrderBy(query.sort) }],
      take: getSourceFetchLimit(query),
    }),
    prisma.activityLog.count({ where }),
  ]);

  return {
    total,
    items: items.map((item) => ({
      id: `activity:${item.id}`,
      action: item.action,
      entityType: item.entityType ?? "ActivityLog",
      entityId: item.entityId,
      description: sanitizeDescription(item.description),
      createdAt: item.createdAt,
      actor: item.user,
    })),
  };
};

const listCaseHistoryItems = async (
  actor: SafeUser,
  query: ActivityListQuery,
): Promise<{ items: ActivityItem[]; total: number }> => {
  const where = getCaseHistoryWhere(actor, query);

  if (!where) {
    return { items: [], total: 0 };
  }

  const [items, total] = await prisma.$transaction([
    prisma.caseHistory.findMany({
      where,
      include: {
        user: { select: actorSelect },
        caseProfile: { select: caseSummarySelect },
      },
      orderBy: [{ createdAt: getOrderBy(query.sort) }, { id: getOrderBy(query.sort) }],
      take: getSourceFetchLimit(query),
    }),
    prisma.caseHistory.count({ where }),
  ]);

  return {
    total,
    items: items.map((item) => ({
      id: `case-history:${item.id}`,
      action: item.action,
      entityType: "CaseProfile",
      entityId: item.caseProfileId,
      description: sanitizeDescription(
        describeCaseHistory(
          item.action,
          item.note,
          item.oldStatus,
          item.newStatus,
        ),
      ),
      createdAt: item.createdAt,
      actor: item.user,
    })),
  };
};

const listAppointmentItems = async (
  actor: SafeUser,
  query: ActivityListQuery,
): Promise<{ items: ActivityItem[]; total: number }> => {
  const where = getAppointmentWhere(actor, query);

  if (!where) {
    return { items: [], total: 0 };
  }

  const [items, total] = await prisma.$transaction([
    prisma.appointment.findMany({
      where,
      include: {
        staff: { select: actorSelect },
        caseProfile: { select: caseSummarySelect },
      },
      orderBy: [{ createdAt: getOrderBy(query.sort) }, { id: getOrderBy(query.sort) }],
      take: getSourceFetchLimit(query),
    }),
    prisma.appointment.count({ where }),
  ]);

  return {
    total,
    items: items.map((item) => ({
      id: `appointment:${item.id}`,
      action: "APPOINTMENT_CREATED",
      entityType: "Appointment",
      entityId: item.id,
      description: item.caseProfile
        ? `Appointment scheduled for ${item.caseProfile.caseCode}.`
        : "Appointment scheduled.",
      createdAt: item.createdAt,
      actor: item.staff,
    })),
  };
};

const listTaskItems = async (
  actor: SafeUser,
  query: ActivityListQuery,
): Promise<{ items: ActivityItem[]; total: number }> => {
  const where = getTaskWhere(actor, query);

  if (!where) {
    return { items: [], total: 0 };
  }

  const [items, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      include: {
        createdBy: { select: actorSelect },
        caseProfile: { select: caseSummarySelect },
      },
      orderBy: [{ createdAt: getOrderBy(query.sort) }, { id: getOrderBy(query.sort) }],
      take: getSourceFetchLimit(query),
    }),
    prisma.task.count({ where }),
  ]);

  return {
    total,
    items: items.map((item) => ({
      id: `task:${item.id}`,
      action: "TASK_CREATED",
      entityType: "Task",
      entityId: item.id,
      description: item.caseProfile
        ? `Task created for ${item.caseProfile.caseCode}.`
        : "Task created.",
      createdAt: item.createdAt,
      actor: item.createdBy,
    })),
  };
};

const listDocumentItems = async (
  actor: SafeUser,
  query: ActivityListQuery,
): Promise<{ items: ActivityItem[]; total: number }> => {
  const where = getDocumentWhere(actor, query);

  if (!where) {
    return { items: [], total: 0 };
  }

  const [items, total] = await prisma.$transaction([
    prisma.document.findMany({
      where,
      include: {
        uploadedBy: { select: actorSelect },
      },
      orderBy: [{ createdAt: getOrderBy(query.sort) }, { id: getOrderBy(query.sort) }],
      take: getSourceFetchLimit(query),
    }),
    prisma.document.count({ where }),
  ]);

  return {
    total,
    items: items.map((item) => ({
      id: `document:${item.id}`,
      action:
        item.source === DocumentSource.CUSTOMER_PORTAL
          ? "CUSTOMER_PORTAL_DOCUMENT_UPLOADED"
          : "DOCUMENT_UPLOADED",
      entityType: "Document",
      entityId: item.id,
      description:
        item.source === DocumentSource.CUSTOMER_PORTAL
          ? "Customer uploaded a document."
          : "Document uploaded.",
      createdAt: item.createdAt,
      actor: item.uploadedBy,
    })),
  };
};

const listDocumentDownloadItems = async (
  actor: SafeUser,
  query: ActivityListQuery,
): Promise<{ items: ActivityItem[]; total: number }> => {
  const where = getDocumentDownloadWhere(actor, query);

  if (!where) {
    return { items: [], total: 0 };
  }

  const [items, total] = await prisma.$transaction([
    prisma.documentDownloadAudit.findMany({
      where,
      include: {
        actorUser: { select: actorSelect },
        document: { select: documentSummarySelect },
      },
      orderBy: [{ createdAt: getOrderBy(query.sort) }, { id: getOrderBy(query.sort) }],
      take: getSourceFetchLimit(query),
    }),
    prisma.documentDownloadAudit.count({ where }),
  ]);

  return {
    total,
    items: items.map((item) => ({
      id: `document-download:${item.id}`,
      action: "DOCUMENT_DOWNLOADED",
      entityType: "Document",
      entityId: item.documentId,
      description:
        item.actorType === DocumentDownloadActorType.CUSTOMER_PORTAL
          ? "Customer downloaded a document."
          : "Document downloaded.",
      createdAt: item.createdAt,
      actor: item.actorUser,
    })),
  };
};

const listAllActivitySources = async (
  actor: SafeUser,
  query: ActivityListQuery,
) => {
  const sources = await Promise.all([
    listActivityLogItems(actor, query),
    listCaseHistoryItems(actor, query),
    listAppointmentItems(actor, query),
    listTaskItems(actor, query),
    listDocumentItems(actor, query),
    listDocumentDownloadItems(actor, query),
  ]);

  return {
    items: sources.flatMap((source) => source.items),
    total: sources.reduce((sum, source) => sum + source.total, 0),
  };
};

export const listActivities = async (
  query: ActivityListQuery,
  actor: SafeUser,
): Promise<ActivityListResult> => {
  assertActivityActor(actor);

  const { items, total } = await listAllActivitySources(actor, query);

  return {
    items: sliceActivities(sortActivities(items, query.sort), query),
    meta: createPaginationMeta(query.page, query.limit, total),
  };
};

export const getActivitySummary = async (
  actor: SafeUser,
): Promise<ActivitySummaryResult> => {
  assertActivityActor(actor);

  const start = getServerCalendarDate();
  const end = addUtcDays(start, 1);
  const today = { gte: start, lt: end };
  const organizationId = actor.organizationId;
  const [
    activityLogs,
    caseEventsToday,
    appointments,
    tasks,
    documents,
    documentDownloads,
    portalEventsToday,
    recentActivities,
  ] = await Promise.all([
    prisma.activityLog.count({
      where: { organizationId, createdAt: today },
    }),
    prisma.caseHistory.count({
      where: { organizationId, createdAt: today },
    }),
    prisma.appointment.count({
      where: { organizationId, createdAt: today },
    }),
    prisma.task.count({
      where: { organizationId, createdAt: today },
    }),
    prisma.document.count({
      where: { organizationId, createdAt: today },
    }),
    prisma.documentDownloadAudit.count({
      where: { organizationId, createdAt: today },
    }),
    prisma.activityLog.count({
      where: {
        organizationId,
        createdAt: today,
        action: { contains: "CUSTOMER_PORTAL" },
      },
    }),
    listActivities(
      {
        page: 1,
        limit: 5,
        sort: "newest",
      },
      actor,
    ),
  ]);

  return {
    totalToday:
      activityLogs +
      caseEventsToday +
      appointments +
      tasks +
      documents +
      documentDownloads,
    documentEventsToday: documents + documentDownloads,
    portalEventsToday,
    caseEventsToday,
    recentActivities: recentActivities.items,
  };
};
