import { z } from 'zod'

const optionalText = (maxLength: number, field: string) =>
  z
    .string()
    .trim()
    .max(maxLength, `${field} must not exceed ${maxLength} characters.`)

export const customerFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must contain at least 2 characters.')
    .max(150, 'Full name must not exceed 150 characters.'),
  phone: z
    .string()
    .trim()
    .min(8, 'Phone number must contain at least 8 characters.')
    .max(30, 'Phone number must not exceed 30 characters.'),
  email: z.union([
    z.literal(''),
    z
      .string()
      .trim()
      .email('Enter a valid email address.')
      .max(254, 'Email must not exceed 254 characters.'),
  ]),
  address: optionalText(500, 'Address'),
  identityNumber: optionalText(100, 'Identity number'),
  birthday: z.union([
    z.literal(''),
    z.iso.date('Birthday must use the YYYY-MM-DD format.'),
  ]),
  source: optionalText(100, 'Source'),
  note: optionalText(2_000, 'Note'),
})

export type CustomerFormValues = z.infer<typeof customerFormSchema>
