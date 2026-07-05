import type { RequestHandler } from "express";

import { env } from "../../config/env";
import { HTTP_STATUS } from "../../constants/httpStatus";
import { AppError } from "../../utils/AppError";

export const requireWorkspaceSignupEnabled: RequestHandler = (
  _request,
  _response,
  next,
) => {
  if (env.WORKSPACE_SIGNUP_ENABLED !== "true") {
    next(
      new AppError(
        "Workspace signup is currently disabled.",
        HTTP_STATUS.FORBIDDEN,
      ),
    );
    return;
  }

  next();
};
