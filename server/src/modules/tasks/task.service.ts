import {
  Prisma,
  TaskStatus,
  UserRole,
} from "@prisma/client";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  createPaginationMeta,
  getPagination,
} from "../../utils/pagination";
import { isPrismaError } from "../../utils/prismaError";
import type { SafeUser } from "../../utils/sanitizeUser";
import {
  isTerminalTaskStatus,
  isValidTaskTransition,
} from "../../utils/taskWorkflow";
import type {
  CreateTaskInput,
  OverdueTaskQuery,
  TaskListQuery,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from "./task.types";

const assignableRoles = [
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
];

const safeUserSelect = {
  id: true,
  fullName: true,
  email: true,
  phone: true,
  role: true,
  avatarUrl: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

const caseSummarySelect = {
  id: true,
  caseCode: true,
  title: true,
  status: true,
} satisfies Prisma.CaseProfileSelect;

const taskInclude = {
  caseProfile: {
    select: caseSummarySelect,
  },
  assignedTo: {
    select: safeUserSelect,
  },
  createdBy: {
    select: safeUserSelect,
  },
} satisfies Prisma.TaskInclude;

type TaskAccessRecord = {
  assignedToId: string | null;
  createdById: string | null;
  status: TaskStatus;
};

const assertCrmActor = (actor: SafeUser): void => {
  if (
    actor.role !== UserRole.ADMIN &&
    actor.role !== UserRole.MANAGER &&
    actor.role !== UserRole.STAFF
  ) {
    throw new AppError(
      "You do not have permission to access tasks.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
};

const assertTaskReadAccess = (
  task: TaskAccessRecord,
  actor: SafeUser,
): void => {
  assertCrmActor(actor);

  if (
    actor.role === UserRole.STAFF &&
    task.assignedToId !== actor.id &&
    task.createdById !== actor.id
  ) {
    throw new AppError(
      "You do not have permission to access this task.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
};

const assertTaskUpdateAccess = (
  task: TaskAccessRecord,
  actor: SafeUser,
): void => {
  assertCrmActor(actor);

  if (
    actor.role === UserRole.STAFF &&
    task.assignedToId !== actor.id
  ) {
    throw new AppError(
      "Staff members can only update tasks assigned to themselves.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
};

const assertTaskDeleteAccess = (
  task: TaskAccessRecord,
  actor: SafeUser,
): void => {
  assertCrmActor(actor);

  if (
    actor.role === UserRole.STAFF &&
    task.assignedToId !== actor.id &&
    task.createdById !== actor.id
  ) {
    throw new AppError(
      "You do not have permission to delete this task.",
      HTTP_STATUS.FORBIDDEN,
    );
  }
};

const findTaskAccessRecord = async (
  transaction: Prisma.TransactionClient,
  id: string,
): Promise<TaskAccessRecord> => {
  const task = await transaction.task.findUnique({
    where: { id },
    select: {
      assignedToId: true,
      createdById: true,
      status: true,
    },
  });

  if (!task) {
    throw new AppError("Task not found.", HTTP_STATUS.NOT_FOUND);
  }

  return task;
};

const findAssignableUser = async (
  transaction: Prisma.TransactionClient,
  id: string,
) => {
  const user = await transaction.user.findFirst({
    where: {
      id,
      isActive: true,
      role: {
        in: assignableRoles,
      },
    },
    select: {
      id: true,
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

const throwTaskPersistenceError = (error: unknown): never => {
  if (error instanceof AppError) {
    throw error;
  }

  if (isPrismaError(error, "P2025")) {
    throw new AppError("Task not found.", HTTP_STATUS.NOT_FOUND);
  }

  if (isPrismaError(error, "P2003")) {
    throw new AppError(
      "The related case profile or assigned user is no longer available.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  throw error;
};

export const listTasks = async (
  query: TaskListQuery,
  actor: SafeUser,
) => {
  assertCrmActor(actor);

  const {
    page,
    limit,
    search,
    status,
    priority,
    assignedToId,
    createdById,
    caseProfileId,
  } = query;
  const accessAndSearchFilters: Prisma.TaskWhereInput[] = [];

  if (actor.role === UserRole.STAFF) {
    accessAndSearchFilters.push({
      OR: [
        { assignedToId: actor.id },
        { createdById: actor.id },
      ],
    });
  }

  if (search) {
    accessAndSearchFilters.push({
      OR: [
        {
          title: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          description: {
            contains: search,
            mode: Prisma.QueryMode.insensitive,
          },
        },
        {
          caseProfile: {
            is: {
              caseCode: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        },
        {
          caseProfile: {
            is: {
              title: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
          },
        },
      ],
    });
  }

  const where: Prisma.TaskWhereInput = {
    ...(status && { status }),
    ...(priority && { priority }),
    ...(assignedToId && { assignedToId }),
    ...(createdById && { createdById }),
    ...(caseProfileId && { caseProfileId }),
    ...(accessAndSearchFilters.length > 0 && {
      AND: accessAndSearchFilters,
    }),
  };
  const pagination = getPagination(page, limit);
  const [items, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      ...pagination,
      include: taskInclude,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
    prisma.task.count({ where }),
  ]);

  return {
    items,
    meta: createPaginationMeta(page, limit, total),
  };
};

export const listOverdueTasks = async (
  query: OverdueTaskQuery,
  actor: SafeUser,
) => {
  assertCrmActor(actor);

  const { page, limit, assignedToId: requestedAssignedToId } = query;
  const assignedToId =
    actor.role === UserRole.STAFF
      ? actor.id
      : requestedAssignedToId;
  const where: Prisma.TaskWhereInput = {
    deadline: {
      lt: new Date(),
    },
    status: {
      notIn: [TaskStatus.DONE, TaskStatus.CANCELLED],
    },
    ...(assignedToId && { assignedToId }),
  };
  const pagination = getPagination(page, limit);
  const [items, total] = await prisma.$transaction([
    prisma.task.findMany({
      where,
      ...pagination,
      include: taskInclude,
      orderBy: [{ deadline: "asc" }, { id: "asc" }],
    }),
    prisma.task.count({ where }),
  ]);

  return {
    items,
    meta: createPaginationMeta(page, limit, total),
  };
};

export const findTaskById = async (
  id: string,
  actor: SafeUser,
) => {
  const task = await prisma.task.findUnique({
    where: { id },
    include: taskInclude,
  });

  if (!task) {
    throw new AppError("Task not found.", HTTP_STATUS.NOT_FOUND);
  }

  assertTaskReadAccess(task, actor);

  return task;
};

export const createTask = async (
  input: CreateTaskInput,
  actor: SafeUser,
) => {
  assertCrmActor(actor);

  if (
    actor.role === UserRole.STAFF &&
    input.assignedToId !== undefined &&
    input.assignedToId !== actor.id
  ) {
    throw new AppError(
      "Staff members can only assign a new task to themselves.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  const effectiveAssignedToId =
    actor.role === UserRole.STAFF ? actor.id : input.assignedToId;

  try {
    return await prisma.$transaction(async (transaction) => {
      if (input.caseProfileId) {
        const caseProfile = await transaction.caseProfile.findUnique({
          where: { id: input.caseProfileId },
          select: {
            id: true,
            assignedToId: true,
          },
        });

        if (!caseProfile) {
          throw new AppError(
            "Case profile not found.",
            HTTP_STATUS.NOT_FOUND,
          );
        }

        if (
          actor.role === UserRole.STAFF &&
          caseProfile.assignedToId !== actor.id
        ) {
          throw new AppError(
            "Staff members can only create tasks for case profiles assigned to themselves.",
            HTTP_STATUS.FORBIDDEN,
          );
        }
      }

      if (effectiveAssignedToId) {
        await findAssignableUser(transaction, effectiveAssignedToId);
      }

      return transaction.task.create({
        data: {
          caseProfileId: input.caseProfileId,
          title: input.title,
          description: input.description,
          assignedToId: effectiveAssignedToId,
          createdById: actor.id,
          priority: input.priority,
          deadline: input.deadline,
        },
        include: taskInclude,
      });
    });
  } catch (error) {
    return throwTaskPersistenceError(error);
  }
};

export const updateTask = async (
  id: string,
  input: UpdateTaskInput,
  actor: SafeUser,
) => {
  if (Object.keys(input).length === 0) {
    throw new AppError(
      "At least one task field must be provided.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  try {
    return await prisma.$transaction(async (transaction) => {
      const currentTask = await findTaskAccessRecord(transaction, id);
      assertTaskUpdateAccess(currentTask, actor);

      if (
        actor.role === UserRole.STAFF &&
        input.assignedToId !== undefined
      ) {
        throw new AppError(
          "Staff members cannot reassign tasks.",
          HTTP_STATUS.FORBIDDEN,
        );
      }

      if (typeof input.assignedToId === "string") {
        await findAssignableUser(transaction, input.assignedToId);
      }

      return transaction.task.update({
        where: { id },
        data: {
          title: input.title,
          description: input.description,
          priority: input.priority,
          deadline: input.deadline,
          ...(input.assignedToId !== undefined && {
            assignedToId: input.assignedToId,
          }),
        },
        include: taskInclude,
      });
    });
  } catch (error) {
    return throwTaskPersistenceError(error);
  }
};

export const updateTaskStatus = async (
  id: string,
  input: UpdateTaskStatusInput,
  actor: SafeUser,
) => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const currentTask = await findTaskAccessRecord(transaction, id);
      assertTaskUpdateAccess(currentTask, actor);

      if (currentTask.status === input.status) {
        throw new AppError(
          "The task already has this status.",
          HTTP_STATUS.BAD_REQUEST,
        );
      }

      if (isTerminalTaskStatus(currentTask.status)) {
        throw new AppError(
          "A done or cancelled task cannot change status.",
          HTTP_STATUS.CONFLICT,
        );
      }

      if (!isValidTaskTransition(currentTask.status, input.status)) {
        throw new AppError(
          `Invalid task status transition from ${currentTask.status} to ${input.status}.`,
          HTTP_STATUS.CONFLICT,
        );
      }

      return transaction.task.update({
        where: { id },
        data: {
          status: input.status,
        },
        include: taskInclude,
      });
    });
  } catch (error) {
    return throwTaskPersistenceError(error);
  }
};

export const deleteTask = async (
  id: string,
  actor: SafeUser,
) => {
  try {
    return await prisma.$transaction(async (transaction) => {
      const currentTask = await findTaskAccessRecord(transaction, id);
      assertTaskDeleteAccess(currentTask, actor);

      if (currentTask.status === TaskStatus.DONE) {
        throw new AppError(
          "A done task cannot be deleted.",
          HTTP_STATUS.CONFLICT,
        );
      }

      return transaction.task.delete({
        where: { id },
      });
    });
  } catch (error) {
    return throwTaskPersistenceError(error);
  }
};
