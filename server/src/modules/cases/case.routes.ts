import { UserRole } from "@prisma/client";
import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  assignCaseController,
  createCaseController,
  deleteCaseController,
  getCaseController,
  listCaseHistoryController,
  listCasesController,
  listOverdueCasesController,
  updateCaseController,
  updateCaseStatusController,
} from "./case.controller";
import {
  assignCaseSchema,
  caseHistoryQuerySchema,
  caseIdParamsSchema,
  caseListQuerySchema,
  createCaseSchema,
  overdueCaseQuerySchema,
  updateCaseSchema,
  updateCaseStatusSchema,
} from "./case.validation";

const caseRouter = Router();
const caseRoles = [
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
];

caseRouter.use(authenticate, authorizeRoles(...caseRoles));

caseRouter.get(
  "/",
  validate({ query: caseListQuerySchema }),
  asyncHandler(listCasesController),
);
caseRouter.get(
  "/overdue",
  validate({ query: overdueCaseQuerySchema }),
  asyncHandler(listOverdueCasesController),
);
caseRouter.post(
  "/",
  validate({ body: createCaseSchema }),
  asyncHandler(createCaseController),
);
caseRouter.get(
  "/:id",
  validate({ params: caseIdParamsSchema }),
  asyncHandler(getCaseController),
);
caseRouter.patch(
  "/:id/status",
  validate({
    params: caseIdParamsSchema,
    body: updateCaseStatusSchema,
  }),
  asyncHandler(updateCaseStatusController),
);
caseRouter.patch(
  "/:id/assign",
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validate({
    params: caseIdParamsSchema,
    body: assignCaseSchema,
  }),
  asyncHandler(assignCaseController),
);
caseRouter.get(
  "/:id/history",
  validate({
    params: caseIdParamsSchema,
    query: caseHistoryQuerySchema,
  }),
  asyncHandler(listCaseHistoryController),
);
caseRouter.patch(
  "/:id",
  validate({
    params: caseIdParamsSchema,
    body: updateCaseSchema,
  }),
  asyncHandler(updateCaseController),
);
caseRouter.delete(
  "/:id",
  authorizeRoles(UserRole.ADMIN, UserRole.MANAGER),
  validate({ params: caseIdParamsSchema }),
  asyncHandler(deleteCaseController),
);

export { caseRouter };
