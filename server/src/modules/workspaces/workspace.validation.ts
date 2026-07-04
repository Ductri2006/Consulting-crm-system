import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const normalizeExplicitWorkspaceSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const optionalTextToNull = (field: string, maxLength: number) =>
  z
    .union([
      z.literal(""),
      z
        .string()
        .trim()
        .min(1, `${field} cannot be empty.`)
        .max(maxLength, `${field} must not exceed ${maxLength} characters.`),
    ])
    .optional()
    .transform((value) => {
      if (!value) {
        return null;
      }

      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    });

const optionalEmailToNull = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .email("Workspace email must be a valid email address.")
      .max(254, "Workspace email must not exceed 254 characters."),
  ])
  .optional()
  .transform((value) => {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed.toLowerCase() : null;
  });

const optionalUrlToNull = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .url("Website must be a valid URL.")
      .max(1_000, "Website must not exceed 1000 characters."),
  ])
  .optional()
  .transform((value) => {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

const ownerEmailSchema = z
  .string()
  .trim()
  .email("Owner email must be a valid email address.")
  .max(254, "Owner email must not exceed 254 characters.")
  .transform((email) => email.toLowerCase());

const passwordSchema = z
  .string()
  .min(10, "Password must contain at least 10 characters.")
  .max(100, "Password must not exceed 100 characters.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character.");

export const workspaceSignupSchema = z
  .object({
    workspaceName: z
      .string()
      .trim()
      .min(2, "Workspace name must be at least 2 characters long.")
      .max(120, "Workspace name must not exceed 120 characters."),
    workspaceSlug: z
      .union([
        z.literal(""),
        z
          .string()
          .trim()
          .min(1, "Workspace slug cannot be empty.")
          .max(80, "Workspace slug must not exceed 80 characters before normalization."),
      ])
      .optional()
      .transform((value) =>
        value ? normalizeExplicitWorkspaceSlug(value) : undefined,
      ),
    industry: optionalTextToNull("Industry", 120),
    website: optionalUrlToNull,
    phone: optionalTextToNull("Workspace phone", 30),
    email: optionalEmailToNull,
    address: optionalTextToNull("Address", 255),
    ownerFullName: z
      .string()
      .trim()
      .min(2, "Owner full name must be at least 2 characters long.")
      .max(120, "Owner full name must not exceed 120 characters."),
    ownerEmail: ownerEmailSchema,
    ownerPhone: optionalTextToNull("Owner phone", 30),
    password: passwordSchema,
    confirmPassword: z.string().optional(),
  })
  .strict()
  .superRefine((input, context) => {
    if (input.workspaceSlug !== undefined) {
      if (input.workspaceSlug.length < 3 || input.workspaceSlug.length > 50) {
        context.addIssue({
          code: "custom",
          message: "Workspace slug must be between 3 and 50 characters.",
          path: ["workspaceSlug"],
        });
      }

      if (!slugPattern.test(input.workspaceSlug)) {
        context.addIssue({
          code: "custom",
          message:
            "Workspace slug may contain only lowercase letters, numbers, and hyphens.",
          path: ["workspaceSlug"],
        });
      }
    }

    if (
      input.confirmPassword !== undefined &&
      input.confirmPassword !== input.password
    ) {
      context.addIssue({
        code: "custom",
        message: "Passwords must match.",
        path: ["confirmPassword"],
      });
    }
  });
