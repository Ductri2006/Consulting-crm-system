import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { AppError } from "../../utils/AppError";
import { successResponse } from "../../utils/apiResponse";
import type { SafeUser } from "../../utils/sanitizeUser";
import {
  getActivitySummary,
  listActivities,
} from "./activity.service";
import type { ActivityListQuery } from "./activity.types";

const getActor = (request: Request): SafeUser => {
  if (!request.user) {
    throw new AppError(
      "Authentication is required.",
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  return request.user;
};

export const listActivitiesController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const result = await listActivities(
    request.query as unknown as ActivityListQuery,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("Activity retrieved successfully.", result));
};

export const getActivitySummaryController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const result = await getActivitySummary(getActor(request));

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("Activity summary retrieved successfully.", result));
};
