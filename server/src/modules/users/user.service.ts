import { Prisma, UserRole, type User } from "@prisma/client";
import bcrypt from "bcryptjs";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import {
  createPaginationMeta,
  getPagination,
} from "../../utils/pagination";
import { isPrismaError } from "../../utils/prismaError";
import { sanitizeUser, type SafeUser } from "../../utils/sanitizeUser";
import type {
  CreateUserInput,
  ResetUserPasswordInput,
  UpdateUserInput,
  UserListQuery,
  UserListResult,
} from "./user.types";

export type AssignableUser = Pick<
  User,
  | "id"
  | "organizationId"
  | "fullName"
  | "email"
  | "phone"
  | "role"
  | "avatarUrl"
  | "isActive"
>;

const internalUserRoles = [
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
];

const internalUserRoleWhere = {
  role: {
    in: internalUserRoles,
  },
} satisfies Prisma.UserWhereInput;

const throwUserWriteError = (error: unknown): never => {
  if (isPrismaError(error, "P2002")) {
    throw new AppError(
      "A user with this email already exists.",
      HTTP_STATUS.CONFLICT,
    );
  }

  if (isPrismaError(error, "P2025")) {
    throw new AppError("User not found.", HTTP_STATUS.NOT_FOUND);
  }

  throw error;
};

const getInternalUserWhere = (
  query: UserListQuery,
  organizationId: string,
): Prisma.UserWhereInput => {
  const where: Prisma.UserWhereInput = {
    organizationId,
    role: query.role
      ? query.role
      : {
          in: internalUserRoles,
        },
  };

  if (query.isActive !== undefined) {
    where.isActive = query.isActive;
  }

  if (query.search) {
    where.OR = [
      { fullName: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { phone: { contains: query.search, mode: "insensitive" } },
    ];
  }

  return where;
};

const assertAdminWouldRemain = async (
  userId: string,
  input: UpdateUserInput,
  organizationId: string,
): Promise<void> => {
  const target = await prisma.user.findFirst({
    where: {
      id: userId,
      organizationId,
      ...internalUserRoleWhere,
    },
    select: {
      id: true,
      isActive: true,
      role: true,
    },
  });

  if (!target) {
    throw new AppError("User not found.", HTTP_STATUS.NOT_FOUND);
  }

  const canRemoveAdminAccess =
    input.isActive === false ||
    (input.role !== undefined && input.role !== UserRole.ADMIN);

  if (!canRemoveAdminAccess) {
    return;
  }

  if (target.role !== UserRole.ADMIN || !target.isActive) {
    return;
  }

  const remainingActiveAdminCount = await prisma.user.count({
    where: {
      id: {
        not: userId,
      },
      organizationId,
      isActive: true,
      role: UserRole.ADMIN,
    },
  });

  if (remainingActiveAdminCount === 0) {
    throw new AppError(
      "At least one active administrator must remain.",
      HTTP_STATUS.CONFLICT,
    );
  }
};

export const findUsers = async (
  query: UserListQuery,
  organizationId: string,
): Promise<UserListResult> => {
  const { page, limit } = query;
  const { skip, take } = getPagination(page, limit);
  const where = getInternalUserWhere(query, organizationId);

  const [users, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      skip,
      take,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    }),
    prisma.user.count({ where }),
  ]);

  return {
    items: users.map(sanitizeUser),
    meta: createPaginationMeta(page, limit, total),
  };
};

export const findAssignableUsers = async (
  organizationId: string,
): Promise<AssignableUser[]> =>
  prisma.user.findMany({
    where: {
      organizationId,
      isActive: true,
      ...internalUserRoleWhere,
    },
    select: {
      id: true,
      organizationId: true,
      fullName: true,
      email: true,
      phone: true,
      role: true,
      avatarUrl: true,
      isActive: true,
    },
    orderBy: {
      fullName: "asc",
    },
  });

export const findUserById = async (
  id: string,
  organizationId: string,
): Promise<SafeUser> => {
  const user = await prisma.user.findFirst({
    where: {
      id,
      organizationId,
      ...internalUserRoleWhere,
    },
  });

  if (!user) {
    throw new AppError("User not found.", HTTP_STATUS.NOT_FOUND);
  }

  return sanitizeUser(user);
};

export const createUser = async (
  input: CreateUserInput,
  actor: SafeUser,
): Promise<SafeUser> => {
  if (!input.password) {
    throw new AppError(
      "Password or temporary password is required.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  try {
    const user = await prisma.$transaction(async (transaction) => {
      const createdUser = await transaction.user.create({
        data: {
          fullName: input.fullName,
          organizationId: actor.organizationId,
          email: input.email,
          phone: input.phone,
          avatarUrl: input.avatarUrl,
          role: input.role,
          isActive: input.isActive,
          passwordHash,
        },
      });

      await transaction.activityLog.create({
        data: {
          organizationId: actor.organizationId,
          userId: actor.id,
          action: "USER_CREATED",
          entityType: "User",
          entityId: createdUser.id,
          description: "Internal user created.",
        },
      });

      return createdUser;
    });

    return sanitizeUser(user);
  } catch (error) {
    return throwUserWriteError(error);
  }
};

export const updateUser = async (
  id: string,
  input: UpdateUserInput,
  actor: SafeUser,
): Promise<SafeUser> => {
  await assertAdminWouldRemain(id, input, actor.organizationId);

  try {
    const user = await prisma.$transaction(async (transaction) => {
      const updatedUser = await transaction.user.update({
        where: { id },
        data: input,
      });

      await transaction.activityLog.create({
        data: {
          organizationId: actor.organizationId,
          userId: actor.id,
          action:
            input.isActive === false
              ? "USER_DEACTIVATED"
              : input.isActive === true
                ? "USER_ACTIVATED"
                : "USER_UPDATED",
          entityType: "User",
          entityId: updatedUser.id,
          description: "Internal user updated.",
        },
      });

      return updatedUser;
    });

    return sanitizeUser(user);
  } catch (error) {
    return throwUserWriteError(error);
  }
};

export const resetUserPassword = async (
  id: string,
  input: ResetUserPasswordInput,
  actor: SafeUser,
): Promise<SafeUser> => {
  const target = await prisma.user.findFirst({
    where: {
      id,
      organizationId: actor.organizationId,
      ...internalUserRoleWhere,
    },
    select: {
      id: true,
    },
  });

  if (!target) {
    throw new AppError("User not found.", HTTP_STATUS.NOT_FOUND);
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 12);

  try {
    const user = await prisma.$transaction(async (transaction) => {
      const updatedUser = await transaction.user.update({
        where: { id },
        data: {
          passwordHash,
        },
      });

      await transaction.activityLog.create({
        data: {
          organizationId: actor.organizationId,
          userId: actor.id,
          action: "USER_PASSWORD_RESET",
          entityType: "User",
          entityId: updatedUser.id,
          description: "Internal user password reset.",
        },
      });

      return updatedUser;
    });

    return sanitizeUser(user);
  } catch (error) {
    return throwUserWriteError(error);
  }
};
