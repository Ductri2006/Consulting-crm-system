import { Router } from "express";

import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  downloadPortalDocumentController,
  getCurrentPortalSessionController,
  getPortalCaseController,
  getPortalCaseSummaryController,
  getPortalProfileController,
  getPortalUpdatesSummaryController,
  listPortalUpdatesController,
  listPortalDocumentsController,
  listPortalCasesController,
  portalLoginController,
  portalLogoutController,
  uploadPortalDocumentController,
} from "./customerPortal.controller";
import { uploadDocumentFile } from "../../middlewares/upload.middleware";
import { authenticateCustomerPortal } from "./customerPortal.middleware";
import {
  portalCaseIdParamsSchema,
  portalCaseListQuerySchema,
  portalCaseSummaryQuerySchema,
  portalDocumentIdParamsSchema,
  portalDocumentListQuerySchema,
  portalDocumentUploadSchema,
  portalUpdatesQuerySchema,
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
  "/documents",
  validate({ query: portalDocumentListQuerySchema }),
  listPortalDocumentsController,
);
customerPortalRouter.post(
  "/documents",
  uploadDocumentFile,
  validate({ body: portalDocumentUploadSchema }),
  uploadPortalDocumentController,
);
customerPortalRouter.get(
  "/documents/:id/download",
  validate({ params: portalDocumentIdParamsSchema }),
  asyncHandler(downloadPortalDocumentController),
);
customerPortalRouter.get(
  "/updates/summary",
  validate({ query: portalCaseSummaryQuerySchema }),
  getPortalUpdatesSummaryController,
);
customerPortalRouter.get(
  "/updates",
  validate({ query: portalUpdatesQuerySchema }),
  listPortalUpdatesController,
);
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
