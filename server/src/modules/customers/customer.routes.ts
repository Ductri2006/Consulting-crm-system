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
