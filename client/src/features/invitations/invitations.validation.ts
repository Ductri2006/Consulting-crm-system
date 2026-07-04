import { z } from 'zod'

export const invitationRoles = ['ADMIN', 'MANAGER', 'STAFF'] as const
export const invitationStatuses = [
  'PENDING',
  'ACCEPTED',
  'REVOKED',
  'EXPIRED',
] as const

const roleSchema = z.enum(invitationRoles)

const phoneSchema = z
  .string()
  .trim()
  .max(30, 'Phone must not exceed 30 characters.')
  .refine(
    (value) => value === '' || value.length >= 8,
    'Phone number must contain at least 8 characters.',
  )

const passwordSchema = z
  .string()
  .min(10, 'Password must contain at least 10 characters.')
  .max(100, 'Password must not exceed 100 characters.')
  .regex(/[a-z]/, 'Password must include a lowercase letter.')
  .regex(/[A-Z]/, 'Password must include an uppercase letter.')
  .regex(/[0-9]/, 'Password must include a number.')
  .regex(/[^A-Za-z0-9]/, 'Password must include a special character.')

export const createInvitationFormSchema = z.object({
  email: z
    .string()
    .trim()
    .email('Enter a valid email address.')
    .max(254, 'Email must not exceed 254 characters.'),
  role: roleSchema,
  expiresInDays: z
    .number()
    .int('Expiry must be a whole number.')
    .min(1, 'Expiry must be at least 1 day.')
    .max(30, 'Expiry must not exceed 30 days.'),
  sendEmail: z.boolean(),
})

export const acceptInvitationFormSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Full name must contain at least 2 characters.')
      .max(150, 'Full name must not exceed 150 characters.'),
    phone: phoneSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords must match.',
    path: ['confirmPassword'],
  })

export type CreateInvitationFormValues = z.infer<
  typeof createInvitationFormSchema
>
export type AcceptInvitationFormValues = z.infer<
  typeof acceptInvitationFormSchema
>
