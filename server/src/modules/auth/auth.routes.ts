import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import {
  getCurrentUserController,
  loginController,
  logoutController,
} from "./auth.controller";
import { loginSchema } from "./auth.validation";

const authRouter = Router();

authRouter.post("/login", validate({ body: loginSchema }), loginController);
authRouter.get("/me", authenticate, getCurrentUserController);
authRouter.post("/logout", authenticate, logoutController);

export { authRouter };
