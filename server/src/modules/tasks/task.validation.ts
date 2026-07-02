import { Priority, TaskStatus } from "@prisma/client";
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

export const taskIdParamsSchema = z.object({
  id: uuidSchema("Task id"),
});

export const taskListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(TaskStatus).optional(),
  priority: z.enum(Priority).optional(),
  assignedToId: uuidSchema("Assigned user id").optional(),
  createdById: uuidSchema("Creator id").optional(),
  caseProfileId: uuidSchema("Case profile id").optional(),
});

export const overdueTaskQuerySchema =
  paginatedQueryWithoutSearch.extend({
    assignedToId: uuidSchema("Assigned user id").optional(),
  });

export const createTaskSchema = z.object({
  caseProfileId: uuidSchema("Case profile id").optional(),
  title: titleSchema,
  description: descriptionSchema.optional(),
  assignedToId: uuidSchema("Assigned user id").optional(),
  priority: z.enum(Priority).optional(),
  deadline: deadlineSchema.optional(),
});

export const updateTaskSchema = z
  .object({
    title: titleSchema.optional(),
    description: descriptionSchema.nullable().optional(),
    assignedToId: uuidSchema("Assigned user id").optional(),
    priority: z.enum(Priority).optional(),
    deadline: deadlineSchema.nullable().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one task field must be provided.",
  });

export const updateTaskStatusSchema = z.object({
  status: z.enum(TaskStatus),
});
