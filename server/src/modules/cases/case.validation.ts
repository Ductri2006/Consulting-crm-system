import { CaseStatus, Priority } from "@prisma/client";
import { z } from "zod";

import { paginationQuerySchema } from "../../utils/pagination";

const uuidSchema = (field: string) =>
  z.uuid(`${field} must be a valid UUID.`);

const titleSchema = z
  .string()
  .trim()
  .min(3, "Title must be at least 3 characters long.")
  .max(250, "Title must not exceed 250 characters.");

const descriptionSchema = z
  .string()
  .trim()
  .max(5_000, "Description must not exceed 5000 characters.");

const noteSchema = z
  .string()
  .trim()
  .max(2_000, "Note must not exceed 2000 characters.");

const deadlineSchema = z
  .iso.datetime({
    offset: true,
    error: "Deadline must be a valid ISO datetime.",
  })
  .transform((deadline) => new Date(deadline));

const paginatedQueryWithoutSearch = paginationQuerySchema.pick({
  page: true,
  limit: true,
});

export const caseIdParamsSchema = z.object({
  id: uuidSchema("Case id"),
}).strict();

export const caseListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(CaseStatus).optional(),
  priority: z.enum(Priority).optional(),
  serviceId: uuidSchema("Service id").optional(),
  customerId: uuidSchema("Customer id").optional(),
  assignedToId: uuidSchema("Assigned user id").optional(),
}).strict();

export const overdueCaseQuerySchema =
  paginatedQueryWithoutSearch.extend({
    assignedToId: uuidSchema("Assigned user id").optional(),
  }).strict();

export const caseHistoryQuerySchema = paginatedQueryWithoutSearch.strict();

export const createCaseSchema = z.object({
  customerId: uuidSchema("Customer id"),
  serviceId: uuidSchema("Service id"),
  assignedToId: uuidSchema("Assigned user id").optional(),
  title: titleSchema,
  description: descriptionSchema.optional(),
  note: noteSchema.optional(),
  priority: z.enum(Priority).optional(),
  deadline: deadlineSchema.optional(),
}).strict();

export const updateCaseSchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
    note: noteSchema.optional(),
    priority: z.enum(Priority).optional(),
    deadline: deadlineSchema.nullable().optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one case field must be provided.",
  });

export const updateCaseStatusSchema = z.object({
  status: z.enum(CaseStatus),
  note: noteSchema.optional(),
}).strict();

export const assignCaseSchema = z.object({
  assignedToId: uuidSchema("Assigned user id"),
}).strict();
