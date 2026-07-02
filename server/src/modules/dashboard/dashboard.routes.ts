import { UserRole } from "@prisma/client";
import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  getCasesByMonthController,
  getCasesByStatusController,
  getDashboardOverviewController,
  getRecentActivitiesController,
  getStaffPerformanceController,
  getUpcomingDeadlinesController,
} from "./dashboard.controller";
import {
  casesByMonthQuerySchema,
  emptyDashboardQuerySchema,
  recentActivitiesQuerySchema,
  staffPerformanceQuerySchema,
  upcomingDeadlinesQuerySchema,
} from "./dashboard.validation";

const dashboardRouter = Router();
const dashboardRoles = [
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
];

dashboardRouter.use(
  authenticate,
  authorizeRoles(...dashboardRoles),
);

dashboardRouter.get(
  "/overview",
  validate({ query: emptyDashboardQuerySchema }),
  asyncHandler(getDashboardOverviewController),
);
dashboardRouter.get(
  "/cases-by-status",
  validate({ query: emptyDashboardQuerySchema }),
  asyncHandler(getCasesByStatusController),
);
dashboardRouter.get(
  "/cases-by-month",
  validate({ query: casesByMonthQuerySchema }),
  asyncHandler(getCasesByMonthController),
);
dashboardRouter.get(
  "/upcoming-deadlines",
  validate({ query: upcomingDeadlinesQuerySchema }),
  asyncHandler(getUpcomingDeadlinesController),
);
dashboardRouter.get(
  "/staff-performance",
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validate({ query: staffPerformanceQuerySchema }),
  asyncHandler(getStaffPerformanceController),
);
dashboardRouter.get(
  "/recent-activities",
  validate({ query: recentActivitiesQuerySchema }),
  asyncHandler(getRecentActivitiesController),
);

export { dashboardRouter };
