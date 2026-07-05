import { z } from "zod";

const dateQuerySchema = z
  .string()
  .trim()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "Date must be a valid ISO date.",
  })
  .transform((value) => new Date(value));

const uuidSchema = z.uuid("Actor user id must be a valid UUID.");

const baseActivityQuerySchema = {
  action: z.string().trim().min(1).max(100).optional(),
  actorUserId: uuidSchema.optional(),
  entityType: z.string().trim().min(1).max(100).optional(),
  fromDate: dateQuerySchema.optional(),
  search: z.string().trim().min(1).max(100).optional(),
  toDate: dateQuerySchema.optional(),
};

const validateDateOrder = (
  query: {
    fromDate?: Date;
    toDate?: Date;
  },
  context: z.RefinementCtx,
): void => {
  if (
    query.fromDate &&
    query.toDate &&
    query.fromDate > query.toDate
  ) {
    context.addIssue({
      code: "custom",
      path: ["toDate"],
      message: "To date must be on or after from date.",
    });
  }
};

export const activityListQuerySchema = z
  .object({
    ...baseActivityQuerySchema,
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z.enum(["newest", "oldest"]).default("newest"),
  })
  .strict()
  .superRefine(validateDateOrder);

export const activitySummaryQuerySchema = z
  .object(baseActivityQuerySchema)
  .strict()
  .superRefine(validateDateOrder);
