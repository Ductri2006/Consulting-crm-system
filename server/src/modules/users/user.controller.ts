import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { AppError } from "../../utils/AppError";
import { successResponse } from "../../utils/apiResponse";
import type { SafeUser } from "../../utils/sanitizeUser";
import {
  createUser,
  findAssignableUsers,
  findUserById,
  findUsers,
  resetUserPassword,
  updateUser,
} from "./user.service";
import type {
  CreateUserInput,
  ResetUserPasswordInput,
  UpdateUserInput,
  UserListQuery,
} from "./user.types";

const getActor = (request: Request): SafeUser => {
  if (!request.user) {
    throw new AppError(
      "Authentication is required.",
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  return request.user;
};

export const getUsers = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const actor = getActor(request);
  const result = await findUsers(
    request.query as unknown as UserListQuery,
    actor.organizationId,
  );

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("Users retrieved successfully.", result));
};

export const getAssignableUsers = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const users = await findAssignableUsers(getActor(request).organizationId);

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse("Assignable users retrieved successfully.", { users }),
    );
};

export const getUser = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const id = request.params.id;

  if (typeof id !== "string") {
    throw new AppError(
      "User id must be a valid UUID.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const user = await findUserById(id, getActor(request).organizationId);

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("User retrieved successfully.", { user }));
};

export const createUserController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const actor = getActor(request);
  const user = await createUser(
    request.body as CreateUserInput,
    actor,
  );

  response
    .status(HTTP_STATUS.CREATED)
    .json(successResponse("User created successfully.", { user }));
};

export const updateUserController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const id = request.params.id;

  if (typeof id !== "string") {
    throw new AppError(
      "User id must be a valid UUID.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const user = await updateUser(
    id,
    request.body as UpdateUserInput,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("User updated successfully.", { user }));
};

export const resetUserPasswordController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const id = request.params.id;

  if (typeof id !== "string") {
    throw new AppError(
      "User id must be a valid UUID.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  const user = await resetUserPassword(
    id,
    request.body as ResetUserPasswordInput,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("User password reset successfully.", { user }));
};
