import {
  CaseStatus,
  Prisma,
  UserRole,
} from "@prisma/client";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  formatCaseCode,
  getCaseCodeDayRange,
} from "../../utils/caseCode";
import {
  isTerminalCaseStatus,
  isValidCaseTransition,
} from "../../utils/caseWorkflow";
import {
  createPaginationMeta,
  getPagination,
} from "../../utils/pagination";
import { isPrismaError } from "../../utils/prismaError";
import type { SafeUser } from "../../utils/sanitizeUser";
import type {
  AssignCaseInput,
  CaseHistoryQuery,
  CaseListQuery,
  CreateCaseInput,
  OverdueCaseQuery,
  UpdateCaseInput,
  UpdateCaseStatusInput,
} from "./case.types";

const CASE_CODE_RETRY_LIMIT = 5;

const assignableRoles = [
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
];

const safeUserSelect = {
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

const customerSummarySelect = {
  id: true,
  fullName: true,
  phone: true,
  email: true,
} satisfies Prisma.CustomerSelect;

const serviceSummarySelect = {
  id: true,
  name: true,
  slug: true,
  isActive: true,
} satisfies Prisma.ServiceSelect;

const relatedCountsSelect = {
  histories: true,
  documents: true,
  tasks: true,
  appointments: true,
} satisfies Prisma.CaseProfileCountOutputTypeSelect;

const caseSummaryInclude = {
  customer: {
    select: customerSummarySelect,
  },
  service: {
    select: serviceSummarySelect,
  },
  assignedTo: {
    select: safeUserSelect,
  },
  _count: {
    select: relatedCountsSelect,
  },
} satisfies Prisma.CaseProfileInclude;

const caseDetailInclude = {
  ...caseSummaryInclude,
  histories: {
    take: 10,
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    include: {
      user: {
        select: safeUserSelect,
      },
    },
  },
} satisfies Prisma.CaseProfileInclude;

const historyWithUserInclude = {
  user: {
    select: safeUserSelect,
  },
} satisfies Prisma.CaseHistoryInclude;

type CaseAccessRecord = {
  assignedToId: string | null;
};

const assertCrmActor = (actor: SafeUser): void => {
  if (
    actor.role !== UserRole.ADMIN &&
    actor.role !== UserRole.MANAGER &&
    actor.role !== UserRole.STAFF
  ) {
    throw new AppError(
      "You do not have permission to access case profiles.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
};

const assertCaseAccess = (
  caseProfile: CaseAccessRecord,
  actor: SafeUser,
): void => {
  assertCrmActor(actor);

  if (
    actor.role === UserRole.STAFF &&
    caseProfile.assignedToId !== actor.id
  ) {
    throw new AppError(
      "You do not have permission to access this case profile.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
};

const assertCaseManager = (actor: SafeUser): void => {
  if (
    actor.role !== UserRole.ADMIN &&
    actor.role !== UserRole.MANAGER
  ) {
    throw new AppError(
      "Only administrators and managers can perform this case operation.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
};

const getAssignedToFilter = (
  actor: SafeUser,
  requestedAssignedToId?: string,
): string | undefined => {
  assertCrmActor(actor);

  if (actor.role === UserRole.STAFF) {
    return actor.id;
  }

  return requestedAssignedToId;
};

const findCaseAccessRecord = async (
  transaction: Prisma.TransactionClient,
  id: string,
  organizationId: string,
): Promise<CaseAccessRecord> => {
  const caseProfile = await transaction.caseProfile.findFirst({
    where: {
      id,
      organizationId,
    },
    select: {
      assignedToId: true,
    },
  });

  if (!caseProfile) {
    throw new AppError("Case profile not found.", HTTP_STATUS.NOT_FOUND);
  }

  return caseProfile;
};

const findAssignableUser = async (
  transaction: Prisma.TransactionClient,
  id: string,
  organizationId: string,
) => {
  const user = await transaction.user.findFirst({
    where: {
      id,
      organizationId,
      isActive: true,
      role: {
        in: assignableRoles,
      },
    },
    select: {
      id: true,
      fullName: true,
    },
  });

  if (!user) {
    throw new AppError(
      "The assigned user must be an active administrator, manager, or staff member.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return user;
};

const throwCasePersistenceError = (error: unknown): never => {
  if (error instanceof AppError) {
    throw error;
  }

  if (isPrismaError(error, "P2025")) {
    throw new AppError("Case profile not found.", HTTP_STATUS.NOT_FOUND);
  }

  if (isPrismaError(error, "P2003")) {
    throw new AppError(
      "The case operation conflicts with a related record.",
      HTTP_STATUS.CONFLICT,
    );
  }

  throw error;
};

export const listCases = async (
  query: CaseListQuery,
  actor: SafeUser,
) => {
  const {
    page,
    limit,
    search,
    status,
    priority,
    serviceId,
    customerId,
    assignedToId: requestedAssignedToId,
  } = query;
  const assignedToId = getAssignedToFilter(
    actor,
    requestedAssignedToId,
  );
  const where: Prisma.CaseProfileWhereInput = {
    organizationId: actor.organizationId,
    ...(status && { status }),
    ...(priority && { priority }),
    ...(serviceId && { serviceId }),
    ...(customerId && { customerId }),
    ...(assignedToId && { assignedToId }),
    ...(search && {
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
        {
          customer: {
            fullName: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        },
        {
          customer: {
            phone: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        },
        {
          service: {
            name: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        },
      ],
    }),
  };
  const pagination = getPagination(page, limit);
  const [items, total] = await prisma.$transaction([
    prisma.caseProfile.findMany({
      where,
      ...pagination,
      include: caseSummaryInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
    prisma.caseProfile.count({ where }),
  ]);

  return {
    items,
    meta: createPaginationMeta(page, limit, total),
  };
};

export const listOverdueCases = async (
  query: OverdueCaseQuery,
  actor: SafeUser,
) => {
  const { page, limit, assignedToId: requestedAssignedToId } = query;
  const assignedToId = getAssignedToFilter(
    actor,
    requestedAssignedToId,
  );
  const where: Prisma.CaseProfileWhereInput = {
    organizationId: actor.organizationId,
    deadline: {
      lt: new Date(),
    },
    status: {
      notIn: [CaseStatus.COMPLETED, CaseStatus.CANCELLED],
    },
    ...(assignedToId && { assignedToId }),
  };
  const pagination = getPagination(page, limit);
  const [items, total] = await prisma.$transaction([
    prisma.caseProfile.findMany({
      where,
      ...pagination,
      include: caseSummaryInclude,
      orderBy: [{ deadline: "asc" }, { id: "asc" }],
    }),
    prisma.caseProfile.count({ where }),
  ]);

  return {
    items,
    meta: createPaginationMeta(page, limit, total),
  };
};

export const findCaseById = async (
  id: string,
  actor: SafeUser,
) => {
  const caseProfile = await prisma.caseProfile.findFirst({
    where: {
      id,
      organizationId: actor.organizationId,
    },
    include: caseDetailInclude,
  });

  if (!caseProfile) {
    throw new AppError("Case profile not found.", HTTP_STATUS.NOT_FOUND);
  }

  assertCaseAccess(caseProfile, actor);

  return caseProfile;
};

export const createCase = async (
  input: CreateCaseInput,
  actor: SafeUser,
) => {
  assertCrmActor(actor);

  if (
    actor.role === UserRole.STAFF &&
    input.assignedToId !== undefined &&
    input.assignedToId !== actor.id
  ) {
    throw new AppError(
      "Staff members can only assign a new case profile to themselves.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  const effectiveAssignedToId =
    actor.role === UserRole.STAFF ? actor.id : input.assignedToId;

  for (let attempt = 0; attempt < CASE_CODE_RETRY_LIMIT; attempt += 1) {
    try {
      return await prisma.$transaction(async (transaction) => {
        const [customer, service] = await Promise.all([
          transaction.customer.findUnique({
            where: { id: input.customerId },
            select: { id: true, organizationId: true },
          }),
          transaction.service.findFirst({
            where: {
              id: input.serviceId,
              isActive: true,
            },
            select: { id: true },
          }),
        ]);

        if (!customer) {
          throw new AppError(
            "Customer not found.",
            HTTP_STATUS.NOT_FOUND,
          );
        }

        if (customer.organizationId !== actor.organizationId) {
          throw new AppError(
            "Customer not found.",
            HTTP_STATUS.NOT_FOUND,
          );
        }

        if (!service) {
          throw new AppError(
            "Selected service is not available.",
            HTTP_STATUS.BAD_REQUEST,
          );
        }

        const assignedUser = effectiveAssignedToId
          ? await findAssignableUser(
              transaction,
              effectiveAssignedToId,
              actor.organizationId,
            )
          : null;
        const now = new Date();
        const { start, end } = getCaseCodeDayRange(now);
        const dailyCount = await transaction.caseProfile.count({
          where: {
            createdAt: {
              gte: start,
              lt: end,
            },
          },
        });
        const caseCode = formatCaseCode(
          dailyCount + attempt + 1,
          now,
        );
        const caseProfile = await transaction.caseProfile.create({
          data: {
            organizationId: actor.organizationId,
            customerId: input.customerId,
            serviceId: input.serviceId,
            assignedToId: effectiveAssignedToId,
            title: input.title,
            description: input.description,
            note: input.note,
            priority: input.priority,
            deadline: input.deadline,
            caseCode,
          },
          select: {
            id: true,
          },
        });

        await transaction.caseHistory.create({
          data: {
            organizationId: actor.organizationId,
            caseProfileId: caseProfile.id,
            userId: actor.id,
            action: "CASE_CREATED",
            newStatus: CaseStatus.RECEIVED,
            note: "Case profile created.",
          },
        });

        if (assignedUser) {
          await transaction.caseHistory.create({
            data: {
              organizationId: actor.organizationId,
              caseProfileId: caseProfile.id,
              userId: actor.id,
              action: "CASE_ASSIGNED",
              note: `Assigned to ${assignedUser.fullName}.`,
            },
          });
        }

        return transaction.caseProfile.findUniqueOrThrow({
          where: { id: caseProfile.id },
          include: caseSummaryInclude,
        });
      });
    } catch (error) {
      if (isPrismaError(error, "P2002")) {
        if (attempt < CASE_CODE_RETRY_LIMIT - 1) {
          continue;
        }

        throw new AppError(
          "A unique case code could not be generated. Please try again.",
          HTTP_STATUS.CONFLICT,
        );
      }

      return throwCasePersistenceError(error);
    }
  }

  throw new AppError(
    "A unique case code could not be generated. Please try again.",
    HTTP_STATUS.CONFLICT,
  );
};

export const updateCase = async (
  id: string,
  input: UpdateCaseInput,
  actor: SafeUser,
) => {
  if (Object.keys(input).length === 0) {
    throw new AppError(
      "At least one case field must be provided.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  try {
    return await prisma.$transaction(async (transaction) => {
      const currentCase = await findCaseAccessRecord(
        transaction,
        id,
        actor.organizationId,
      );
      assertCaseAccess(currentCase, actor);

      const updatedCase = await transaction.caseProfile.update({
        where: { id },
        data: input,
        include: caseSummaryInclude,
      });

      await transaction.caseHistory.create({
        data: {
          organizationId: actor.organizationId,
          caseProfileId: id,
          userId: actor.id,
          action: "CASE_UPDATED",
          note: "Case profile details updated.",
        },
      });

      return updatedCase;
    });
  } catch (error) {
    return throwCasePersistenceError(error);
  }
};

export const updateCaseStatus = async (
  id: string,
  input: UpdateCaseStatusInput,
  actor: SafeUser,
) => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const currentCase = await transaction.caseProfile.findFirst({
        where: {
          id,
          organizationId: actor.organizationId,
        },
        select: {
          assignedToId: true,
          status: true,
        },
      });

      if (!currentCase) {
        throw new AppError(
          "Case profile not found.",
          HTTP_STATUS.NOT_FOUND,
        );
      }

      assertCaseAccess(currentCase, actor);

      if (currentCase.status === input.status) {
        throw new AppError(
          "The case profile already has this status.",
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      if (isTerminalCaseStatus(currentCase.status)) {
        throw new AppError(
          "A completed or cancelled case profile cannot change status.",
          HTTP_STATUS.CONFLICT,
        );
      }

      if (!isValidCaseTransition(currentCase.status, input.status)) {
        throw new AppError(
          `Invalid case status transition from ${currentCase.status} to ${input.status}.`,
          HTTP_STATUS.CONFLICT,
        );
      }

      const updatedCase = await transaction.caseProfile.update({
        where: { id },
        data: {
          status: input.status,
          completedAt:
            input.status === CaseStatus.COMPLETED ? new Date() : null,
        },
        include: caseSummaryInclude,
      });

      await transaction.caseHistory.create({
        data: {
          organizationId: actor.organizationId,
          caseProfileId: id,
          userId: actor.id,
          action: "CASE_STATUS_CHANGED",
          oldStatus: currentCase.status,
          newStatus: input.status,
          note: input.note,
        },
      });

      return updatedCase;
    });
  } catch (error) {
    return throwCasePersistenceError(error);
  }
};

export const assignCase = async (
  id: string,
  input: AssignCaseInput,
  actor: SafeUser,
) => {
  assertCaseManager(actor);

  try {
    return await prisma.$transaction(async (transaction) => {
      const currentCase = await transaction.caseProfile.findFirst({
        where: {
          id,
          organizationId: actor.organizationId,
        },
        select: {
          assignedToId: true,
        },
      });

      if (!currentCase) {
        throw new AppError(
          "Case profile not found.",
          HTTP_STATUS.NOT_FOUND,
        );
      }

      const assignedUser = await findAssignableUser(
        transaction,
        input.assignedToId,
        actor.organizationId,
      );

      if (currentCase.assignedToId === assignedUser.id) {
        throw new AppError(
          "The case profile is already assigned to this user.",
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      const updatedCase = await transaction.caseProfile.update({
        where: { id },
        data: {
          assignedToId: assignedUser.id,
        },
        include: caseSummaryInclude,
      });

      await transaction.caseHistory.create({
        data: {
          organizationId: actor.organizationId,
          caseProfileId: id,
          userId: actor.id,
          action: "CASE_ASSIGNED",
          note: `Assigned to ${assignedUser.fullName}.`,
        },
      });

      return updatedCase;
    });
  } catch (error) {
    return throwCasePersistenceError(error);
  }
};

export const listCaseHistory = async (
  id: string,
  query: CaseHistoryQuery,
  actor: SafeUser,
) => {
  const caseProfile = await prisma.caseProfile.findFirst({
    where: {
      id,
      organizationId: actor.organizationId,
    },
    select: {
      assignedToId: true,
    },
  });

  if (!caseProfile) {
    throw new AppError("Case profile not found.", HTTP_STATUS.NOT_FOUND);
  }

  assertCaseAccess(caseProfile, actor);

  const { page, limit } = query;
  const pagination = getPagination(page, limit);
  const where: Prisma.CaseHistoryWhereInput = {
    organizationId: actor.organizationId,
    caseProfileId: id,
  };
  const [items, total] = await prisma.$transaction([
    prisma.caseHistory.findMany({
      where,
      ...pagination,
      include: historyWithUserInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
    prisma.caseHistory.count({ where }),
  ]);

  return {
    items,
    meta: createPaginationMeta(page, limit, total),
  };
};

export const deleteCase = async (
  id: string,
  actor: SafeUser,
) => {
  assertCaseManager(actor);

  try {
    return await prisma.$transaction(async (transaction) => {
      const caseProfile = await transaction.caseProfile.findFirst({
        where: {
          id,
          organizationId: actor.organizationId,
        },
        include: {
          _count: {
            select: {
              documents: true,
              tasks: true,
              appointments: true,
            },
          },
        },
      });

      if (!caseProfile) {
        throw new AppError(
          "Case profile not found.",
          HTTP_STATUS.NOT_FOUND,
        );
      }

      if (
        caseProfile._count.documents > 0 ||
        caseProfile._count.tasks > 0 ||
        caseProfile._count.appointments > 0
      ) {
        throw new AppError(
          "Case profile cannot be deleted because related documents, tasks, or appointments exist.",
          HTTP_STATUS.CONFLICT,
        );
      }

      await transaction.caseHistory.deleteMany({
        where: {
          organizationId: actor.organizationId,
          caseProfileId: id,
        },
      });

      const deletedCase = await transaction.caseProfile.delete({
        where: { id },
      });

      return deletedCase;
    });
  } catch (error) {
    return throwCasePersistenceError(error);
  }
};
