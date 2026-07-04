import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const emailSchema = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Email must be a valid email address.")
  .max(254, "Email must not exceed 254 characters.")
  .transform((email) => email.toLowerCase());

export const portalPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .max(128, "Password must not exceed 128 characters.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character.");

export const createPortalAccountSchema = z
  .object({
    email: emailSchema.optional(),
    password: portalPasswordSchema.optional(),
  })
  .strict();

export const resetPortalPasswordSchema = z
  .object({
    password: portalPasswordSchema.optional(),
  })
  .strict();

export const portalLoginSchema = z
  .object({
    workspaceSlug: z
      .string()
      .trim()
      .min(1, "Workspace slug is required.")
      .max(50, "Workspace slug must not exceed 50 characters.")
      .regex(
        slugPattern,
        "Workspace slug must be lowercase letters, numbers, and hyphens.",
      )
      .transform((slug) => slug.toLowerCase()),
    email: emailSchema,
    password: z.string().min(1, "Password is required."),
  })
  .strict();
