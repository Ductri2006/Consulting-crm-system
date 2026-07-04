import { Router } from "express";

import { validate } from "../../middlewares/validate.middleware";
import {
  getCurrentPortalSessionController,
  getPortalCaseController,
  getPortalCaseSummaryController,
  getPortalProfileController,
  listPortalCasesController,
  portalLoginController,
  portalLogoutController,
} from "./customerPortal.controller";
import { authenticateCustomerPortal } from "./customerPortal.middleware";
import {
  portalCaseIdParamsSchema,
  portalCaseListQuerySchema,
  portalCaseSummaryQuerySchema,
  portalLoginSchema,
} from "./customerPortal.validation";

const customerPortalRouter = Router();

customerPortalRouter.post(
  "/auth/login",
  validate({ body: portalLoginSchema }),
  portalLoginController,
);
customerPortalRouter.use(authenticateCustomerPortal);
customerPortalRouter.get(
  "/cases/summary",
  validate({ query: portalCaseSummaryQuerySchema }),
  getPortalCaseSummaryController,
);
customerPortalRouter.get(
  "/cases",
  validate({ query: portalCaseListQuerySchema }),
  listPortalCasesController,
);
customerPortalRouter.get(
  "/cases/:id",
  validate({ params: portalCaseIdParamsSchema }),
  getPortalCaseController,
);
customerPortalRouter.get("/auth/me", getCurrentPortalSessionController);
customerPortalRouter.post("/auth/logout", portalLogoutController);
customerPortalRouter.get("/me", getPortalProfileController);

export { customerPortalRouter };
