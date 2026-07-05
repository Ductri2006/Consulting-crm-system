import { UserRole } from "@prisma/client";
import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { uploadDocumentFile } from "../../middlewares/upload.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  deleteDocumentController,
  downloadDocumentController,
  getDocumentController,
  listDocumentsController,
  setDocumentPortalVisibilityController,
  uploadDocumentController,
} from "./document.controller";
import {
  documentPortalVisibilitySchema,
  documentIdParamsSchema,
  documentListQuerySchema,
  uploadDocumentMetadataSchema,
} from "./document.validation";

const documentRouter = Router();
const documentRoles = [
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
];

documentRouter.use(
  authenticate,
  authorizeRoles(...documentRoles),
);

documentRouter.get(
  "/",
  validate({ query: documentListQuerySchema }),
  asyncHandler(listDocumentsController),
);
documentRouter.post(
  "/upload",
  uploadDocumentFile,
  validate({ body: uploadDocumentMetadataSchema }),
  asyncHandler(uploadDocumentController),
);
documentRouter.get(
  "/:id/download",
  validate({ params: documentIdParamsSchema }),
  asyncHandler(downloadDocumentController),
);
documentRouter.patch(
  "/:id/portal-visibility",
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validate({
    params: documentIdParamsSchema,
    body: documentPortalVisibilitySchema,
  }),
  asyncHandler(setDocumentPortalVisibilityController),
);
documentRouter.get(
  "/:id",
  validate({ params: documentIdParamsSchema }),
  asyncHandler(getDocumentController),
);
documentRouter.delete(
  "/:id",
  validate({ params: documentIdParamsSchema }),
  asyncHandler(deleteDocumentController),
);

export { documentRouter };
