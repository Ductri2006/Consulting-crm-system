import { type UserRole } from "@prisma/client";
import type { RequestHandler } from "express";

import { HTTP_STATUS } from "../constants/httpStatus";
import { AppError } from "../utils/AppError";

export const authorizeRoles = (...roles: UserRole[]): RequestHandler => {
  return (request, _response, next): void => {
    if (!request.user) {
      next(
        new AppError(
          "Authentication is required.",
          HTTP_STATUS.UNAUTHORIZED,
        ),
      );
      return;
    }

    if (!roles.includes(request.user.role)) {
      next(
        new AppError(
          "You do not have permission to perform this action.",
          HTTP_STATUS.FORBIDDEN,
        ),
      );
      return;
    }

    next();
  };
};
