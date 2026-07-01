import { z } from "zod";

import { paginationQuerySchema } from "../../utils/pagination";

const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Full name must be at least 2 characters long.")
  .max(150, "Full name must not exceed 150 characters.");

const phoneSchema = z
  .string()
  .trim()
  .min(8, "Phone number must be at least 8 characters long.")
  .max(30, "Phone number must not exceed 30 characters.");

const emailSchema = z
  .string()
  .trim()
  .email("Email must be a valid email address.")
  .max(254, "Email must not exceed 254 characters.")
  .transform((email) => email.toLowerCase());

const optionalText = (field: string, maxLength: number) =>
  z
    .string()
    .trim()
    .min(1, `${field} cannot be empty.`)
    .max(maxLength, `${field} must not exceed ${maxLength} characters.`)
    .optional();

const birthdaySchema = z
  .iso.date("Birthday must be a valid ISO date in YYYY-MM-DD format.")
  .transform((birthday) => new Date(`${birthday}T00:00:00.000Z`));

const customerFields = {
  fullName: fullNameSchema,
  phone: phoneSchema,
  email: emailSchema.optional(),
  address: optionalText("Address", 500),
  identityNumber: optionalText("Identity number", 100),
  birthday: birthdaySchema.optional(),
  source: optionalText("Source", 100),
  note: optionalText("Note", 2_000),
};

export const customerIdParamsSchema = z.object({
  id: z.uuid("Customer id must be a valid UUID."),
});

export const customerListQuerySchema = paginationQuerySchema;

export const createCustomerSchema = z.object(customerFields);

export const updateCustomerSchema = z
  .object(customerFields)
  .partial()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one customer field must be provided.",
  });
