import { UserRole } from "@prisma/client";
import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  getCurrentWorkspaceController,
  signupWorkspaceController,
  updateCurrentWorkspaceController,
} from "./workspace.controller";
import {
  limitWorkspaceSignup,
  requireWorkspaceSignupEnabled,
} from "./workspace.middleware";
import {
  updateWorkspaceSchema,
  workspaceSignupSchema,
} from "./workspace.validation";

const workspaceRouter = Router();
const currentWorkspaceRouter = Router();

workspaceRouter.post(
  "/signup",
  requireWorkspaceSignupEnabled,
  limitWorkspaceSignup,
  validate({ body: workspaceSignupSchema }),
  signupWorkspaceController,
);

currentWorkspaceRouter.use(authenticate);
currentWorkspaceRouter.get(
  "/me",
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF),
  getCurrentWorkspaceController,
);
currentWorkspaceRouter.patch(
  "/me",
  authorizeRoles(UserRole.ADMIN),
  validate({ body: updateWorkspaceSchema }),
  updateCurrentWorkspaceController,
);

export { currentWorkspaceRouter, workspaceRouter };
