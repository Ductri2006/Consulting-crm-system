import { Router } from "express";

import { validate } from "../../middlewares/validate.middleware";
import {
  getCurrentPortalSessionController,
  getPortalProfileController,
  portalLoginController,
  portalLogoutController,
} from "./customerPortal.controller";
import { authenticateCustomerPortal } from "./customerPortal.middleware";
import { portalLoginSchema } from "./customerPortal.validation";

const customerPortalRouter = Router();

customerPortalRouter.post(
  "/auth/login",
  validate({ body: portalLoginSchema }),
  portalLoginController,
);
customerPortalRouter.use(authenticateCustomerPortal);
customerPortalRouter.get("/auth/me", getCurrentPortalSessionController);
customerPortalRouter.post("/auth/logout", portalLogoutController);
customerPortalRouter.get("/me", getPortalProfileController);

export { customerPortalRouter };
