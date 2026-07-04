import { UserRole } from "@prisma/client";
import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createUserController,
  getAssignableUsers,
  getUser,
  getUsers,
  resetUserPasswordController,
  updateUserController,
} from "./user.controller";
import {
  createUserSchema,
  resetUserPasswordSchema,
  updateUserSchema,
  userIdParamsSchema,
  userListQuerySchema,
} from "./user.validation";

const userRouter = Router();

userRouter.use(authenticate);

userRouter.get(
  "/assignable",
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  asyncHandler(getAssignableUsers),
);
userRouter.get(
  "/",
  authorizeRoles(UserRole.ADMIN),
  validate({ query: userListQuerySchema }),
  asyncHandler(getUsers),
);
userRouter.post(
  "/",
  authorizeRoles(UserRole.ADMIN),
  validate({ body: createUserSchema }),
  asyncHandler(createUserController),
);
userRouter.get(
  "/:id",
  authorizeRoles(UserRole.ADMIN),
  validate({ params: userIdParamsSchema }),
  asyncHandler(getUser),
);
userRouter.patch(
  "/:id/password",
  authorizeRoles(UserRole.ADMIN),
  validate({
    params: userIdParamsSchema,
    body: resetUserPasswordSchema,
  }),
  asyncHandler(resetUserPasswordController),
);
userRouter.patch(
  "/:id",
  authorizeRoles(UserRole.ADMIN),
  validate({ params: userIdParamsSchema, body: updateUserSchema }),
  asyncHandler(updateUserController),
);

export { userRouter };
