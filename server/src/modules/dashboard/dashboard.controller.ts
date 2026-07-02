import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { AppError } from "../../utils/AppError";
import { successResponse } from "../../utils/apiResponse";
import type { SafeUser } from "../../utils/sanitizeUser";
import {
  getCasesByMonth,
  getCasesByStatus,
  getDashboardOverview,
  getRecentActivities,
  getStaffPerformance,
  getUpcomingDeadlines,
} from "./dashboard.service";
import type {
  CasesByMonthQuery,
  RecentActivitiesQuery,
  StaffPerformanceQuery,
  UpcomingDeadlinesQuery,
} from "./dashboard.types";

const getActor = (request: Request): SafeUser => {
  if (!request.user) {
    throw new AppError(
      "Authentication is required.",
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  return request.user;
};

export const getDashboardOverviewController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const overview = await getDashboardOverview(getActor(request));

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse(
        "Dashboard overview retrieved successfully.",
        overview,
      ),
    );
};

export const getCasesByStatusController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const result = await getCasesByStatus(getActor(request));

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse(
        "Cases by status retrieved successfully.",
        result,
      ),
    );
};

export const getCasesByMonthController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const result = await getCasesByMonth(
    request.query as unknown as CasesByMonthQuery,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse(
        "Cases by month retrieved successfully.",
        result,
      ),
    );
};

export const getUpcomingDeadlinesController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const result = await getUpcomingDeadlines(
    request.query as unknown as UpcomingDeadlinesQuery,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse(
        "Upcoming deadlines retrieved successfully.",
        result,
      ),
    );
};

export const getStaffPerformanceController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const result = await getStaffPerformance(
    request.query as unknown as StaffPerformanceQuery,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse(
        "Staff performance retrieved successfully.",
        result,
      ),
    );
};

export const getRecentActivitiesController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const result = await getRecentActivities(
    request.query as unknown as RecentActivitiesQuery,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse(
        "Recent activities retrieved successfully.",
        result,
      ),
    );
};
