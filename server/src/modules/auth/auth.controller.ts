import type { RequestHandler } from "express";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { AppError } from "../../utils/AppError";
import { successResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import type { LoginInput } from "./auth.types";
import { login as loginUser } from "./auth.service";

export const loginController = asyncHandler(
  async (request, response): Promise<void> => {
    const result = await loginUser(request.body as LoginInput);

    response
      .status(HTTP_STATUS.OK)
      .json(successResponse("Login successful.", result));
  },
);

export const getCurrentUserController: RequestHandler = (
  request,
  response,
): void => {
  if (!request.user) {
    throw new AppError(
      "Authentication is required.",
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  response.status(HTTP_STATUS.OK).json(
    successResponse("Current user retrieved successfully.", {
      user: request.user,
    }),
  );
};

export const logoutController: RequestHandler = (_request, response): void => {
  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("Logout successful.", {}));
};
