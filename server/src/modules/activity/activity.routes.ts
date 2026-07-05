import { UserRole } from "@prisma/client";
import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  getActivitySummaryController,
  listActivitiesController,
} from "./activity.controller";
import {
  activityListQuerySchema,
  activitySummaryQuerySchema,
} from "./activity.validation";

const activityRouter = Router();

activityRouter.use(
  authenticate,
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
);

activityRouter.get(
  "/summary",
  validate({ query: activitySummaryQuerySchema }),
  asyncHandler(getActivitySummaryController),
);

activityRouter.get(
  "/",
  validate({ query: activityListQuerySchema }),
  asyncHandler(listActivitiesController),
);

export { activityRouter };
