import { InvitationStatus, UserRole } from "@prisma/client";
import { z } from "zod";

import { paginationQuerySchema } from "../../utils/pagination";

const invitationRoles = [
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
] as const;

const invitationRoleSchema = z.enum(invitationRoles);

const emailSchema = z
  .string()
  .trim()
  .email("Email must be a valid email address.")
  .max(254, "Email must not exceed 254 characters.")
  .transform((email) => email.toLowerCase());

const fullNameSchema = z
  .string()
  .trim()
  .min(2, "Full name must be at least 2 characters long.")
  .max(150, "Full name must not exceed 150 characters.");

const phoneSchema = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .min(8, "Phone number must be at least 8 characters long.")
      .max(30, "Phone must not exceed 30 characters."),
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
  .min(10, "Password must contain at least 10 characters.")
  .max(100, "Password must not exceed 100 characters.")
  .regex(/[a-z]/, "Password must include a lowercase letter.")
  .regex(/[A-Z]/, "Password must include an uppercase letter.")
  .regex(/[0-9]/, "Password must include a number.")
  .regex(/[^A-Za-z0-9]/, "Password must include a special character.");

export const invitationListQuerySchema = paginationQuerySchema.extend({
  role: invitationRoleSchema.optional(),
  status: z.enum(InvitationStatus).optional(),
}).strict();

export const createInvitationSchema = z.object({
  email: emailSchema,
  role: invitationRoleSchema,
  expiresInDays: z.coerce.number().int().min(1).max(30).default(7),
}).strict();

export const invitationIdParamsSchema = z.object({
  id: z.string().uuid("Invitation id must be a valid UUID."),
}).strict();

export const invitationTokenParamsSchema = z.object({
  token: z
    .string()
    .trim()
    .min(20, "Invitation token is invalid.")
    .max(512, "Invitation token is invalid."),
}).strict();

export const acceptInvitationSchema = z
  .object({
    fullName: fullNameSchema,
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string().optional(),
  })
  .strict()
  .superRefine((input, context) => {
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

export { invitationRoles };
