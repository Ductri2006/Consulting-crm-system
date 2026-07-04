import { Router } from "express";

import { validate } from "../../middlewares/validate.middleware";
import { signupWorkspaceController } from "./workspace.controller";
import {
  limitWorkspaceSignup,
  requireWorkspaceSignupEnabled,
} from "./workspace.middleware";
import { workspaceSignupSchema } from "./workspace.validation";

const workspaceRouter = Router();

workspaceRouter.post(
  "/signup",
  requireWorkspaceSignupEnabled,
  limitWorkspaceSignup,
  validate({ body: workspaceSignupSchema }),
  signupWorkspaceController,
);

export { workspaceRouter };
