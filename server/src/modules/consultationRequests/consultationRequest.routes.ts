import { UserRole } from "@prisma/client";
import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { publicRateLimit } from "../../middlewares/rateLimit.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  getConsultationRequest,
  getConsultationRequests,
  patchConsultationRequestStatus,
  submitConsultationRequest,
} from "./consultationRequest.controller";
import {
  consultationRequestIdParamsSchema,
  consultationRequestListQuerySchema,
  createConsultationRequestSchema,
  updateConsultationRequestStatusSchema,
} from "./consultationRequest.validation";

const crmRoles = [UserRole.ADMIN, UserRole.MANAGER, UserRole.STAFF];

const publicConsultationRequestRouter = Router();

publicConsultationRequestRouter.post(
  "/",
  publicRateLimit,
  validate({ body: createConsultationRequestSchema }),
  asyncHandler(submitConsultationRequest),
);

const consultationRequestRouter = Router();

consultationRequestRouter.use(authenticate, authorizeRoles(...crmRoles));

consultationRequestRouter.get(
  "/",
  validate({ query: consultationRequestListQuerySchema }),
  asyncHandler(getConsultationRequests),
);
consultationRequestRouter.get(
  "/:id",
  validate({ params: consultationRequestIdParamsSchema }),
  asyncHandler(getConsultationRequest),
);
consultationRequestRouter.patch(
  "/:id/status",
  validate({
    params: consultationRequestIdParamsSchema,
    body: updateConsultationRequestStatusSchema,
  }),
  asyncHandler(patchConsultationRequestStatus),
);

export { consultationRequestRouter, publicConsultationRequestRouter };
