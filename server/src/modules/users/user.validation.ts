import { UserRole } from "@prisma/client";
import { z } from "zod";

import { paginationQuerySchema } from "../../utils/pagination";

const internalUserRoles = [
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
] as const;

const optionalTrimmedText = (field: string, maxLength: number) =>
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
        return undefined;
      }

      const trimmed = value.trim();
      return trimmed || undefined;
    });

const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Full name must be at least 2 characters long.")
  .max(150, "Full name must not exceed 150 characters.");

const emailSchema = z
  .string()
  .trim()
  .email("Email must be a valid email address.")
  .max(254, "Email must not exceed 254 characters.")
  .transform((email) => email.toLowerCase());

const phoneSchema = optionalTrimmedText("Phone", 30).refine(
  (value) => value === undefined || value.length >= 8,
  "Phone number must be at least 8 characters long.",
);

const avatarUrlSchema = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .url("Avatar URL must be a valid URL.")
      .max(1_000, "Avatar URL must not exceed 1000 characters."),
  ])
  .optional()
  .transform((value) => {
    if (!value) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed || undefined;
  });

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long.")
  .max(100, "Password must not exceed 100 characters.");

export const internalUserRoleSchema = z.enum(internalUserRoles);

const createUserBaseSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  phone: phoneSchema,
  role: internalUserRoleSchema,
  password: passwordSchema.optional(),
  temporaryPassword: passwordSchema.optional(),
  avatarUrl: avatarUrlSchema,
  isActive: z.boolean().optional().default(true),
}).strict();

export const userIdParamsSchema = z.object({
  id: z.string().uuid("User id must be a valid UUID."),
}).strict();

export const userListQuerySchema = paginationQuerySchema.extend({
  role: internalUserRoleSchema.optional(),
  isActive: z
    .enum(["true", "false"])
    .transform((value) => value === "true")
    .optional(),
}).strict();

export const createUserSchema = createUserBaseSchema
  .refine((input) => input.password || input.temporaryPassword, {
    message: "Password or temporary password is required.",
    path: ["password"],
  })
  .transform((input) => ({
    ...input,
    password: input.password ?? input.temporaryPassword,
    temporaryPassword: undefined,
  }));

export const updateUserSchema = z
  .object({
    fullName: fullNameSchema.optional(),
    phone: phoneSchema,
    avatarUrl: avatarUrlSchema,
    role: internalUserRoleSchema.optional(),
    isActive: z.boolean().optional(),
  })
  .strict()
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one user field must be provided.",
  });

export const resetUserPasswordSchema = z.object({
  newPassword: passwordSchema,
}).strict();
