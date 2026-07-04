import { z } from 'zod'

const roleSchema = z.enum(['ADMIN', 'MANAGER', 'STAFF'])

const optionalText = (maxLength: number, field: string) =>
  z
    .string()
    .trim()
    .max(maxLength, `${field} must not exceed ${maxLength} characters.`)

const phoneSchema = optionalText(30, 'Phone').refine(
  (value) => value === '' || value.length >= 8,
  'Phone number must contain at least 8 characters.',
)

const passwordSchema = z
  .string()
  .min(8, 'Password must contain at least 8 characters.')
  .max(100, 'Password must not exceed 100 characters.')

export const userRoles = ['ADMIN', 'MANAGER', 'STAFF'] as const

export const createUserFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must contain at least 2 characters.')
    .max(150, 'Full name must not exceed 150 characters.'),
  email: z
    .string()
    .trim()
    .email('Enter a valid email address.')
    .max(254, 'Email must not exceed 254 characters.'),
  phone: phoneSchema,
  role: roleSchema,
  password: passwordSchema,
  isActive: z.boolean(),
})

export const editUserFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must contain at least 2 characters.')
    .max(150, 'Full name must not exceed 150 characters.'),
  phone: phoneSchema,
  avatarUrl: z.union([
    z.literal(''),
    z
      .string()
      .trim()
      .url('Enter a valid avatar URL.')
      .max(1000, 'Avatar URL must not exceed 1000 characters.'),
  ]),
  role: roleSchema,
  isActive: z.boolean(),
})

export const resetPasswordFormSchema = z
  .object({
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: 'Passwords must match.',
    path: ['confirmPassword'],
  })

export type CreateUserFormValues = z.infer<typeof createUserFormSchema>
export type EditUserFormValues = z.infer<typeof editUserFormSchema>
export type ResetPasswordFormValues = z.infer<typeof resetPasswordFormSchema>
