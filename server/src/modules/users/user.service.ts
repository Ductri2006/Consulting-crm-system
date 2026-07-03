import { UserRole, type User } from "@prisma/client";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { sanitizeUser, type SafeUser } from "../../utils/sanitizeUser";

export type AssignableUser = Pick<
  User,
  | "id"
  | "fullName"
  | "email"
  | "phone"
  | "role"
  | "avatarUrl"
  | "isActive"
>;

export const findUsers = async (): Promise<SafeUser[]> => {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return users.map(sanitizeUser);
};

export const findAssignableUsers = async (): Promise<AssignableUser[]> =>
  prisma.user.findMany({
    where: {
      isActive: true,
      role: {
        in: [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF],
      },
    },
    select: {
      id: true,
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

export const findUserById = async (id: string): Promise<SafeUser> => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError("User not found.", HTTP_STATUS.NOT_FOUND);
  }

  return sanitizeUser(user);
};
