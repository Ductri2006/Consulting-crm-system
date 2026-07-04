import { UserRole } from "@prisma/client";
import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  createCustomerController,
  deleteCustomerController,
  getCustomerController,
  listCustomersController,
  updateCustomerController,
} from "./customer.controller";
import {
  activateCustomerPortalAccountController,
  createCustomerPortalAccountController,
  deactivateCustomerPortalAccountController,
  getCustomerPortalAccountController,
  resetCustomerPortalPasswordController,
} from "../customerPortal/customerPortal.controller";
import {
  createPortalAccountSchema,
  resetPortalPasswordSchema,
} from "../customerPortal/customerPortal.validation";
import {
  createCustomerSchema,
  customerIdParamsSchema,
  customerListQuerySchema,
  updateCustomerSchema,
} from "./customer.validation";

const customerRouter = Router();
const customerRoles = [
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
];

customerRouter.use(authenticate, authorizeRoles(...customerRoles));

customerRouter.get(
  "/",
  validate({ query: customerListQuerySchema }),
  listCustomersController,
);
customerRouter.post(
  "/",
  validate({ body: createCustomerSchema }),
  createCustomerController,
);
customerRouter.get(
  "/:id",
  validate({ params: customerIdParamsSchema }),
  getCustomerController,
);
customerRouter.get(
  "/:id/portal-account",
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validate({ params: customerIdParamsSchema }),
  getCustomerPortalAccountController,
);
customerRouter.post(
  "/:id/portal-account",
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validate({
    params: customerIdParamsSchema,
    body: createPortalAccountSchema,
  }),
  createCustomerPortalAccountController,
);
customerRouter.patch(
  "/:id/portal-account/password",
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validate({
    params: customerIdParamsSchema,
    body: resetPortalPasswordSchema,
  }),
  resetCustomerPortalPasswordController,
);
customerRouter.patch(
  "/:id/portal-account/deactivate",
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validate({ params: customerIdParamsSchema }),
  deactivateCustomerPortalAccountController,
);
customerRouter.patch(
  "/:id/portal-account/activate",
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validate({ params: customerIdParamsSchema }),
  activateCustomerPortalAccountController,
);
customerRouter.patch(
  "/:id",
  validate({
    params: customerIdParamsSchema,
    body: updateCustomerSchema,
  }),
  updateCustomerController,
);
customerRouter.delete(
  "/:id",
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validate({ params: customerIdParamsSchema }),
  deleteCustomerController,
);

export { customerRouter };
