import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { AppError } from "../../utils/AppError";
import { successResponse } from "../../utils/apiResponse";
import { findUserById, findUsers } from "./user.service";

export const getUsers = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  const users = await findUsers();

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("Users retrieved successfully.", { users }));
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
