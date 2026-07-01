import { UserRole } from "@prisma/client";
import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import { getUser, getUsers } from "./user.controller";
import { userIdParamsSchema } from "./user.validation";

const userRouter = Router();

userRouter.use(authenticate, authorizeRoles(UserRole.ADMIN));

userRouter.get("/", asyncHandler(getUsers));
userRouter.get(
  "/:id",
  validate({ params: userIdParamsSchema }),
  asyncHandler(getUser),
);

export { userRouter };
