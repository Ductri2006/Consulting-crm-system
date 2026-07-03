import { UserRole } from "@prisma/client";
import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  getAssignableUsers,
  getUser,
  getUsers,
} from "./user.controller";
import { userIdParamsSchema } from "./user.validation";

const userRouter = Router();

userRouter.use(authenticate);

userRouter.get(
  "/assignable",
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  asyncHandler(getAssignableUsers),
);
userRouter.get("/", authorizeRoles(UserRole.ADMIN), asyncHandler(getUsers));
userRouter.get(
  "/:id",
  authorizeRoles(UserRole.ADMIN),
  validate({ params: userIdParamsSchema }),
  asyncHandler(getUser),
);

export { userRouter };
