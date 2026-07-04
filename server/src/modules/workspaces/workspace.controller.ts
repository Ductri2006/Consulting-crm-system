import { HTTP_STATUS } from "../../constants/httpStatus";
import { AppError } from "../../utils/AppError";
import { successResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import type { SafeUser } from "../../utils/sanitizeUser";
import {
  getCurrentWorkspace,
  signupWorkspace,
  updateCurrentWorkspace,
} from "./workspace.service";
import type {
  UpdateWorkspaceInput,
  WorkspaceSignupInput,
} from "./workspace.types";

const getActor = (request: { user?: SafeUser }): SafeUser => {
  if (!request.user) {
    throw new AppError(
      "Authentication is required.",
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  return request.user;
};

export const signupWorkspaceController = asyncHandler(
  async (request, response): Promise<void> => {
    const result = await signupWorkspace(request.body as WorkspaceSignupInput);

    response
      .status(HTTP_STATUS.CREATED)
      .json(successResponse("Workspace created successfully.", result));
  },
);

export const getCurrentWorkspaceController = asyncHandler(
  async (request, response): Promise<void> => {
    const actor = getActor(request);
    const workspace = await getCurrentWorkspace(actor.organizationId);

    response.status(HTTP_STATUS.OK).json(
      successResponse("Workspace retrieved successfully.", {
        workspace,
      }),
    );
  },
);

export const updateCurrentWorkspaceController = asyncHandler(
  async (request, response): Promise<void> => {
    const actor = getActor(request);
    const workspace = await updateCurrentWorkspace(
      request.body as UpdateWorkspaceInput,
      actor.id,
      actor.organizationId,
    );

    response.status(HTTP_STATUS.OK).json(
      successResponse("Workspace updated successfully.", {
        workspace,
      }),
    );
  },
);
