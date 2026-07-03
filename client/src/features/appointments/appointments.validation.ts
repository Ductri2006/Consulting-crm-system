import { z } from 'zod'
import {
  appointmentMethods,
  appointmentStatuses,
  type AppointmentFormValues,
  type AppointmentStatusUpdateValues,
  type CreateAppointmentInput,
  type UpdateAppointmentInput,
} from './appointments.types'

const requiredSelection = (field: string) =>
  z.string().trim().min(1, `${field} is required.`)

const optionalTextSchema = z
  .string()
  .trim()
  .max(2_000, 'Note must not exceed 2000 characters.')

const dateSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must use YYYY-MM-DD format.')
  .refine((value) => {
    const [year, month, day] = value.split('-').map(Number)
    const date = new Date(Date.UTC(year, month - 1, day))

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    )
  }, 'Date must be a valid calendar date.')

const timeSchema = z
  .string()
  .trim()
  .regex(
    /^(?:[01]\d|2[0-3]):[0-5]\d$/,
    'Time must use HH:mm format.',
  )

const optionalTimeSchema = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value),
    'Time must use HH:mm format.',
  )

const hasValidTimeRange = ({
  startTime,
  endTime,
}: {
  startTime: string
  endTime: string
}): boolean => !endTime || endTime > startTime

export const appointmentFormSchema = z
  .object({
    customerId: requiredSelection('Customer'),
    caseProfileId: z.string().trim(),
    staffId: z.string().trim(),
    appointmentDate: dateSchema,
    startTime: timeSchema,
    endTime: optionalTimeSchema,
    method: z.enum(appointmentMethods),
    note: optionalTextSchema,
  })
  .refine(hasValidTimeRange, {
    path: ['endTime'],
    message: 'End time must be later than start time.',
  })

export const appointmentStatusUpdateSchema = z.object({
  status: z.enum(appointmentStatuses),
})

const optionalTrimmedText = (value: string): string | undefined => {
  const trimmed = value.trim()
  return trimmed || undefined
}

const nullableTrimmedText = (value: string): string | null => {
  const trimmed = value.trim()
  return trimmed || null
}

export const toAppointmentCreateInput = (
  values: AppointmentFormValues,
): CreateAppointmentInput => ({
  customerId: values.customerId,
  appointmentDate: values.appointmentDate,
  startTime: values.startTime,
  method: values.method,
  ...(optionalTrimmedText(values.caseProfileId) && {
    caseProfileId: values.caseProfileId.trim(),
  }),
  ...(optionalTrimmedText(values.staffId) && {
    staffId: values.staffId.trim(),
  }),
  ...(optionalTrimmedText(values.endTime) && {
    endTime: values.endTime.trim(),
  }),
  ...(optionalTrimmedText(values.note) && {
    note: values.note.trim(),
  }),
})

export const toAppointmentUpdateInput = (
  values: AppointmentFormValues,
): UpdateAppointmentInput => ({
  appointmentDate: values.appointmentDate,
  startTime: values.startTime,
  endTime: nullableTrimmedText(values.endTime),
  method: values.method,
  note: nullableTrimmedText(values.note),
  staffId: nullableTrimmedText(values.staffId),
  caseProfileId: nullableTrimmedText(values.caseProfileId),
})

export const toAppointmentStatusUpdateInput = (
  values: AppointmentStatusUpdateValues,
): AppointmentStatusUpdateValues => ({
  status: values.status,
})
