import { z } from "zod";

const calendarDateSchema = z
  .string()
  .trim()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must use the YYYY-MM-DD format.",
  )
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Date must be a valid calendar date.")
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

const limitSchema = z.coerce
  .number()
  .int()
  .min(1)
  .max(50)
  .default(10);

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

export const emptyDashboardQuerySchema = z.object({}).strict();

export const casesByMonthQuerySchema = z
  .object({
    fromDate: calendarDateSchema.optional(),
    toDate: calendarDateSchema.optional(),
  })
  .strict()
  .superRefine(validateDateOrder);

export const upcomingDeadlinesQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(30).default(7),
  limit: limitSchema,
}).strict();

export const staffPerformanceQuerySchema = z
  .object({
    fromDate: calendarDateSchema.optional(),
    toDate: calendarDateSchema.optional(),
    limit: limitSchema,
  })
  .strict()
  .superRefine(validateDateOrder);

export const recentActivitiesQuerySchema = z.object({
  limit: limitSchema,
}).strict();
