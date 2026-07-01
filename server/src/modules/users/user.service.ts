import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { sanitizeUser, type SafeUser } from "../../utils/sanitizeUser";
import { HTTP_STATUS } from "../../constants/httpStatus";

export const findUsers = async (): Promise<SafeUser[]> => {
  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });

  return users.map(sanitizeUser);
};

export const findUserById = async (id: string): Promise<SafeUser> => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError("User not found.", HTTP_STATUS.NOT_FOUND);
  }

  return sanitizeUser(user);
};
