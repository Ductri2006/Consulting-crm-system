import { UserRole } from "@prisma/client";
import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  acceptInvitationController,
  createInvitationController,
  getInvitations,
  previewInvitationController,
  revokeInvitationController,
} from "./invitation.controller";
import { limitInvitationAccept } from "./invitation.middleware";
import {
  acceptInvitationSchema,
  createInvitationSchema,
  invitationIdParamsSchema,
  invitationListQuerySchema,
  invitationTokenParamsSchema,
} from "./invitation.validation";

const invitationRouter = Router();

invitationRouter.get(
  "/public/:token",
  validate({ params: invitationTokenParamsSchema }),
  asyncHandler(previewInvitationController),
);
invitationRouter.post(
  "/public/:token/accept",
  limitInvitationAccept,
  validate({
    params: invitationTokenParamsSchema,
    body: acceptInvitationSchema,
  }),
  asyncHandler(acceptInvitationController),
);

invitationRouter.use(authenticate, authorizeRoles(UserRole.ADMIN));

invitationRouter.get(
  "/",
  validate({ query: invitationListQuerySchema }),
  asyncHandler(getInvitations),
);
invitationRouter.post(
  "/",
  validate({ body: createInvitationSchema }),
  asyncHandler(createInvitationController),
);
invitationRouter.patch(
  "/:id/revoke",
  validate({ params: invitationIdParamsSchema }),
  asyncHandler(revokeInvitationController),
);

export { invitationRouter };
