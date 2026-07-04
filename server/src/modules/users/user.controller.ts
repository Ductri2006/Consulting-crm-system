import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { AppError } from "../../utils/AppError";
import { successResponse } from "../../utils/apiResponse";
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

export const getUsers = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const result = await findUsers(request.query as unknown as UserListQuery);

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("Users retrieved successfully.", result));
};

export const getAssignableUsers = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  const users = await findAssignableUsers();

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

  const user = await findUserById(id);

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("User retrieved successfully.", { user }));
};

export const createUserController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const user = await createUser(request.body as CreateUserInput);

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

  const user = await updateUser(id, request.body as UpdateUserInput);

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
  );

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("User password reset successfully.", { user }));
};
