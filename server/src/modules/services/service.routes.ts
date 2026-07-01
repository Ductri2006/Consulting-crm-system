import { UserRole } from "@prisma/client";
import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createServiceController,
  deleteServiceController,
  getPublicServices,
  getService,
  getServices,
  updateServiceController,
} from "./service.controller";
import {
  createServiceSchema,
  serviceIdParamsSchema,
  serviceListQuerySchema,
  updateServiceSchema,
} from "./service.validation";

const serviceRouter = Router();
const publicServiceRouter = Router();

const canViewServices = authorizeRoles(
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
);
const canManageServices = authorizeRoles(
  UserRole.ADMIN,
  UserRole.MANAGER,
);

serviceRouter.use(authenticate);

serviceRouter.get(
  "/",
  canViewServices,
  validate({ query: serviceListQuerySchema }),
  asyncHandler(getServices),
);
serviceRouter.get(
  "/:id",
  canViewServices,
  validate({ params: serviceIdParamsSchema }),
  asyncHandler(getService),
);
serviceRouter.post(
  "/",
  canManageServices,
  validate({ body: createServiceSchema }),
  asyncHandler(createServiceController),
);
serviceRouter.patch(
  "/:id",
  canManageServices,
  validate({
    params: serviceIdParamsSchema,
    body: updateServiceSchema,
  }),
  asyncHandler(updateServiceController),
);
serviceRouter.delete(
  "/:id",
  authorizeRoles(UserRole.ADMIN),
  validate({ params: serviceIdParamsSchema }),
  asyncHandler(deleteServiceController),
);

publicServiceRouter.get("/", asyncHandler(getPublicServices));

export { publicServiceRouter, serviceRouter };
