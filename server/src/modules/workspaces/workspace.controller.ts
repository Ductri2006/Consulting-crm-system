import { HTTP_STATUS } from "../../constants/httpStatus";
import { successResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { signupWorkspace } from "./workspace.service";
import type { WorkspaceSignupInput } from "./workspace.types";

export const signupWorkspaceController = asyncHandler(
  async (request, response): Promise<void> => {
    const result = await signupWorkspace(request.body as WorkspaceSignupInput);

    response
      .status(HTTP_STATUS.CREATED)
      .json(successResponse("Workspace created successfully.", result));
  },
);
