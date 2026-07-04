import { z } from "zod";

import { paginationQuerySchema } from "../../utils/pagination";

const serviceSlugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required.")
  .max(160, "Slug must not exceed 160 characters.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug must contain only lowercase letters, numbers, and single hyphens.",
  );

const serviceFieldsSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "Name must be at least 2 characters long.")
      .max(160, "Name must not exceed 160 characters."),
    slug: serviceSlugSchema.optional(),
    description: z
      .string()
      .trim()
      .max(5_000, "Description must not exceed 5000 characters.")
      .optional(),
    icon: z
      .string()
      .trim()
      .max(500, "Icon must not exceed 500 characters.")
      .optional(),
    isActive: z.boolean().optional(),
  })
  .strict();

export const serviceListQuerySchema = paginationQuerySchema;

export const serviceIdParamsSchema = z.object({
  id: z.uuid("Service id must be a valid UUID."),
}).strict();

export const createServiceSchema = serviceFieldsSchema;

export const updateServiceSchema = serviceFieldsSchema
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one service field must be provided.",
  });
