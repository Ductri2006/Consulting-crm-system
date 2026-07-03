import { z } from 'zod'
import {
  priorities,
  taskStatuses,
  type CreateTaskInput,
  type TaskFormValues,
  type TaskStatusUpdateValues,
  type UpdateTaskInput,
} from './tasks.types'

const titleSchema = z
  .string()
  .trim()
  .min(3, 'Title must contain at least 3 characters.')
  .max(250, 'Title must not exceed 250 characters.')

const descriptionSchema = z
  .string()
  .trim()
  .max(5_000, 'Description must not exceed 5000 characters.')

const optionalDateTimeLocalSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || !Number.isNaN(new Date(value).getTime()),
    'Deadline must be a valid date and time.',
  )

export const taskFormSchema = z.object({
  title: titleSchema,
  description: descriptionSchema,
  caseProfileId: z.string().trim(),
  assignedToId: z.string().trim(),
  priority: z.enum(priorities),
  deadline: optionalDateTimeLocalSchema,
})

export const taskStatusUpdateSchema = z.object({
  status: z.enum(taskStatuses),
})

const optionalTrimmedText = (value: string): string | undefined => {
  const trimmed = value.trim()
  return trimmed || undefined
}

const nullableTrimmedText = (value: string): string | null => {
  const trimmed = value.trim()
  return trimmed || null
}

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

export const toTaskCreateInput = (
  values: TaskFormValues,
): CreateTaskInput => ({
  title: values.title.trim(),
  priority: values.priority,
  ...(optionalTrimmedText(values.description) && {
    description: values.description.trim(),
  }),
  ...(optionalTrimmedText(values.caseProfileId) && {
    caseProfileId: values.caseProfileId.trim(),
  }),
  ...(optionalTrimmedText(values.assignedToId) && {
    assignedToId: values.assignedToId.trim(),
  }),
  ...(dateTimeLocalToIso(values.deadline) && {
    deadline: dateTimeLocalToIso(values.deadline),
  }),
})

export const toTaskUpdateInput = (
  values: TaskFormValues,
  includeAssignee = true,
): UpdateTaskInput => ({
  title: values.title.trim(),
  description: nullableTrimmedText(values.description),
  priority: values.priority,
  ...(includeAssignee && optionalTrimmedText(values.assignedToId)
    ? { assignedToId: values.assignedToId.trim() }
    : {}),
  deadline: dateTimeLocalToIso(values.deadline) ?? null,
})

export const toTaskStatusUpdateInput = (
  values: TaskStatusUpdateValues,
): TaskStatusUpdateValues => ({
  status: values.status,
})
