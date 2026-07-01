import { z } from "zod";

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

export type CaseIdParams = z.infer<typeof caseIdParamsSchema>;
export type CaseListQuery = z.infer<typeof caseListQuerySchema>;
export type OverdueCaseQuery = z.infer<typeof overdueCaseQuerySchema>;
export type CaseHistoryQuery = z.infer<typeof caseHistoryQuerySchema>;
export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
export type UpdateCaseStatusInput = z.infer<
  typeof updateCaseStatusSchema
>;
export type AssignCaseInput = z.infer<typeof assignCaseSchema>;
