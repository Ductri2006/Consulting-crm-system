import bcrypt from "bcryptjs";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { signAccessToken } from "../../utils/jwt";
import {
  safeOrganizationSelect,
  sanitizeUser,
} from "../../utils/sanitizeUser";
import type { LoginInput, LoginResult } from "./auth.types";

const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";

export const login = async (input: LoginInput): Promise<LoginResult> => {
  const user = await prisma.user.findUnique({
    where: {
      email: input.email.toLowerCase(),
    },
    include: {
      organization: {
        select: {
          ...safeOrganizationSelect,
          isActive: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError(
      INVALID_CREDENTIALS_MESSAGE,
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  if (!user.isActive) {
    throw new AppError(
      "Your account is inactive.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  if (!user.organization?.id || !user.organization.isActive) {
    throw new AppError(
      "Your workspace is inactive or unavailable.",
      HTTP_STATUS.FORBIDDEN,
    );
  }

  const isPasswordValid = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    throw new AppError(
      INVALID_CREDENTIALS_MESSAGE,
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  const accessToken = signAccessToken({
    sub: user.id,
    userId: user.id,
    role: user.role,
    email: user.email,
    organizationId: user.organizationId,
  });

  return {
    accessToken,
    user: sanitizeUser(user),
  };
};
