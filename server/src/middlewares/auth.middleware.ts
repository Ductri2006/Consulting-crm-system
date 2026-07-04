import type { RequestHandler } from "express";

import { HTTP_STATUS } from "../constants/httpStatus";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { asyncHandler } from "../utils/asyncHandler";
import { verifyAccessToken } from "../utils/jwt";
import {
  safeOrganizationSelect,
  sanitizeUser,
} from "../utils/sanitizeUser";

const bearerTokenPattern = /^Bearer\s+(\S+)$/i;

export const authenticate: RequestHandler = asyncHandler(
  async (request, _response, next) => {
    const authorization = request.header("authorization");

    if (!authorization) {
      throw new AppError(
        "Authentication is required.",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    const match = bearerTokenPattern.exec(authorization);

    if (!match?.[1]) {
      throw new AppError(
        "Authorization header must use the Bearer token format.",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    let tokenPayload: ReturnType<typeof verifyAccessToken>;

    try {
      tokenPayload = verifyAccessToken(match[1]);
    } catch {
      throw new AppError(
        "Invalid or expired access token.",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: tokenPayload.sub },
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
        "Invalid or expired access token.",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    if (!user.isActive) {
      throw new AppError("This account is inactive.", HTTP_STATUS.FORBIDDEN);
    }

    if (
      tokenPayload.organizationId &&
      tokenPayload.organizationId !== user.organizationId
    ) {
      throw new AppError(
        "Invalid or expired access token.",
        HTTP_STATUS.UNAUTHORIZED,
      );
    }

    if (!user.organization?.id || !user.organization.isActive) {
      throw new AppError(
        "This workspace is inactive or unavailable.",
        HTTP_STATUS.FORBIDDEN,
      );
    }

    request.user = sanitizeUser(user);
    next();
  },
);
