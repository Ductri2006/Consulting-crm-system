import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { AppError } from "../../utils/AppError";
import { successResponse } from "../../utils/apiResponse";
import type { SafeUser } from "../../utils/sanitizeUser";
import {
  acceptInvitation,
  createInvitation,
  findInvitations,
  previewInvitation,
  revokeInvitation,
} from "./invitation.service";
import type {
  AcceptInvitationInput,
  CreateInvitationInput,
  InvitationListQuery,
} from "./invitation.types";

const getActor = (request: Request): SafeUser => {
  if (!request.user) {
    throw new AppError(
      "Authentication is required.",
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  return request.user;
};

const getStringParam = (
  request: Request,
  name: string,
  message: string,
): string => {
  const value = request.params[name];

  if (typeof value !== "string") {
    throw new AppError(message, HTTP_STATUS.BAD_REQUEST);
  }

  return value;
};

export const getInvitations = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const actor = getActor(request);
  const result = await findInvitations(
    request.query as unknown as InvitationListQuery,
    actor.organizationId,
  );

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("Invitations retrieved successfully.", result));
};

export const createInvitationController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const actor = getActor(request);
  const result = await createInvitation(
    request.body as CreateInvitationInput,
    actor.id,
    actor.organizationId,
  );

  response
    .status(HTTP_STATUS.CREATED)
    .json(successResponse("Invitation created successfully.", result));
};

export const revokeInvitationController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const actor = getActor(request);
  const id = getStringParam(
    request,
    "id",
    "Invitation id must be a valid UUID.",
  );
  const invitation = await revokeInvitation(id, actor.id, actor.organizationId);

  response.status(HTTP_STATUS.OK).json(
    successResponse("Invitation revoked successfully.", {
      invitation,
    }),
  );
};

export const previewInvitationController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const token = getStringParam(
    request,
    "token",
    "Invitation token is invalid.",
  );
  const invitation = await previewInvitation(token);

  response.status(HTTP_STATUS.OK).json(
    successResponse("Invitation preview retrieved successfully.", {
      invitation,
    }),
  );
};

export const acceptInvitationController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const token = getStringParam(
    request,
    "token",
    "Invitation token is invalid.",
  );
  const result = await acceptInvitation(
    token,
    request.body as AcceptInvitationInput,
  );

  response
    .status(HTTP_STATUS.CREATED)
    .json(successResponse("Invitation accepted successfully.", result));
};
