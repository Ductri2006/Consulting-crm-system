import { UserRole } from "@prisma/client";
import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { invitationRateLimit } from "../../middlewares/rateLimit.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  acceptInvitationController,
  createInvitationController,
  getInvitations,
  previewInvitationController,
  resendInvitationController,
  revokeInvitationController,
} from "./invitation.controller";
import {
  acceptInvitationSchema,
  createInvitationSchema,
  invitationIdParamsSchema,
  invitationListQuerySchema,
  invitationTokenParamsSchema,
  resendInvitationSchema,
} from "./invitation.validation";

const invitationRouter = Router();

invitationRouter.get(
  "/public/:token",
  invitationRateLimit,
  validate({ params: invitationTokenParamsSchema }),
  asyncHandler(previewInvitationController),
);
invitationRouter.post(
  "/public/:token/accept",
  invitationRateLimit,
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
  invitationRateLimit,
  validate({ body: createInvitationSchema }),
  asyncHandler(createInvitationController),
);
invitationRouter.post(
  "/:id/resend",
  invitationRateLimit,
  validate({
    params: invitationIdParamsSchema,
    body: resendInvitationSchema,
  }),
  asyncHandler(resendInvitationController),
);
invitationRouter.patch(
  "/:id/revoke",
  validate({ params: invitationIdParamsSchema }),
  asyncHandler(revokeInvitationController),
);

export { invitationRouter };
