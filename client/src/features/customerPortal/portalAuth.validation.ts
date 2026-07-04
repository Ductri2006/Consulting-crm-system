import { z } from 'zod'

export const portalLoginFormSchema = z.object({
  workspaceSlug: z
    .string()
    .trim()
    .min(1, 'Workspace slug is required.')
    .max(50, 'Workspace slug must not exceed 50 characters.')
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'Use lowercase letters, numbers, and hyphens.',
    ),
  email: z
    .string()
    .trim()
    .min(1, 'Email is required.')
    .email('Enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

export type PortalLoginFormValues = z.infer<typeof portalLoginFormSchema>
