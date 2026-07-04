import { z } from 'zod'

const optionalText = (maxLength: number, field: string) =>
  z.string().trim().max(maxLength, `${field} must not exceed ${maxLength} characters.`)

const optionalUrl = z.union([
  z.literal(''),
  z.string().trim().url('Enter a valid website URL.').max(1000),
])

const optionalEmail = z.union([
  z.literal(''),
  z.string().trim().email('Enter a valid email address.').max(254),
])

const passwordSchema = z
  .string()
  .min(10, 'Password must contain at least 10 characters.')
  .max(100, 'Password must not exceed 100 characters.')
  .regex(/[a-z]/, 'Password must include a lowercase letter.')
  .regex(/[A-Z]/, 'Password must include an uppercase letter.')
  .regex(/[0-9]/, 'Password must include a number.')
  .regex(/[^A-Za-z0-9]/, 'Password must include a special character.')

export const workspaceSignupFormSchema = z
  .object({
    workspaceName: z
      .string()
      .trim()
      .min(2, 'Workspace name must contain at least 2 characters.')
      .max(120, 'Workspace name must not exceed 120 characters.'),
    workspaceSlug: z.union([
      z.literal(''),
      z
        .string()
        .trim()
        .min(3, 'Workspace slug must contain at least 3 characters.')
        .max(50, 'Workspace slug must not exceed 50 characters.')
        .regex(
          /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
          'Use lowercase letters, numbers, and hyphens only.',
        ),
    ]),
    industry: optionalText(120, 'Industry'),
    website: optionalUrl,
    email: optionalEmail,
    phone: optionalText(30, 'Workspace phone'),
    address: optionalText(255, 'Address'),
    ownerFullName: z
      .string()
      .trim()
      .min(2, 'Owner name must contain at least 2 characters.')
      .max(120, 'Owner name must not exceed 120 characters.'),
    ownerEmail: z
      .string()
      .trim()
      .email('Enter a valid owner email address.')
      .max(254, 'Owner email must not exceed 254 characters.'),
    ownerPhone: optionalText(30, 'Owner phone'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords must match.',
    path: ['confirmPassword'],
  })

export type WorkspaceSignupFormValues = z.infer<typeof workspaceSignupFormSchema>
