import { z } from 'zod'
import {
  caseStatuses,
  priorities,
  type CaseEditFormValues,
  type CaseFormValues,
  type CaseStatusUpdateValues,
  type CreateCaseInput,
  type UpdateCaseInput,
} from './cases.types'

const titleSchema = z
  .string()
  .trim()
  .min(3, 'Title must contain at least 3 characters.')
  .max(250, 'Title must not exceed 250 characters.')

const descriptionSchema = z
  .string()
  .trim()
  .max(5_000, 'Description must not exceed 5000 characters.')

const noteSchema = z
  .string()
  .trim()
  .max(2_000, 'Note must not exceed 2000 characters.')

const requiredSelection = (field: string) =>
  z.string().trim().min(1, `${field} is required.`)

const optionalDateTimeLocalSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || !Number.isNaN(new Date(value).getTime()),
    'Deadline must be a valid date and time.',
  )

export const caseCreateFormSchema = z.object({
  customerId: requiredSelection('Customer'),
  serviceId: requiredSelection('Service'),
  assignedToId: z.string().trim(),
  title: titleSchema,
  description: descriptionSchema,
  note: noteSchema,
  priority: z.enum(priorities),
  deadline: optionalDateTimeLocalSchema,
})

export const caseEditFormSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  note: noteSchema,
  priority: z.enum(priorities),
  deadline: optionalDateTimeLocalSchema,
})

export const caseStatusUpdateSchema = z.object({
  status: z.enum(caseStatuses),
  note: noteSchema,
})

export const caseAssignSchema = z.object({
  assignedToId: requiredSelection('Assigned staff'),
})

const optionalTrimmedText = (value: string): string | undefined => {
  const trimmed = value.trim()
  return trimmed || undefined
}

/**
 * `datetime-local` represents wall-clock time in the browser's timezone.
 * Creating a Date from it and calling toISOString converts that local value to
 * the UTC ISO datetime expected by the API.
 */
export const dateTimeLocalToIso = (value: string): string | undefined => {
  const trimmed = value.trim()
  return trimmed ? new Date(trimmed).toISOString() : undefined
}

export const toDateTimeLocalValue = (isoValue: string | null): string => {
  if (!isoValue) {
    return ''
  }

  const date = new Date(isoValue)
  const timezoneOffset = date.getTimezoneOffset() * 60_000
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16)
}

export const toCaseCreateInput = (
  values: CaseFormValues,
): CreateCaseInput => ({
  customerId: values.customerId,
  serviceId: values.serviceId,
  title: values.title.trim(),
  priority: values.priority,
  ...(optionalTrimmedText(values.assignedToId) && {
    assignedToId: values.assignedToId.trim(),
  }),
  ...(optionalTrimmedText(values.description) && {
    description: values.description.trim(),
  }),
  ...(optionalTrimmedText(values.note) && {
    note: values.note.trim(),
  }),
  ...(dateTimeLocalToIso(values.deadline) && {
    deadline: dateTimeLocalToIso(values.deadline),
  }),
})

export const toCaseUpdateInput = (
  values: CaseEditFormValues,
): UpdateCaseInput => ({
  title: values.title.trim(),
  description: values.description.trim(),
  note: values.note.trim(),
  priority: values.priority,
  deadline: dateTimeLocalToIso(values.deadline) ?? null,
})

export const toCaseStatusUpdateInput = (
  values: CaseStatusUpdateValues,
): CaseStatusUpdateValues => ({
  status: values.status,
  note: values.note.trim(),
})
