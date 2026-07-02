import {
  AppointmentMethod,
  AppointmentStatus,
} from "@prisma/client";
import { z } from "zod";

import { paginationQuerySchema } from "../../utils/pagination";

const uuidSchema = (field: string) =>
  z.uuid(`${field} must be a valid UUID.`);

const timeSchema = z
  .string()
  .trim()
  .regex(
    /^(?:[01]\d|2[0-3]):[0-5]\d$/,
    "Time must use the HH:mm 24-hour format.",
  );

const noteSchema = z
  .string()
  .trim()
  .max(2_000, "Note must not exceed 2000 characters.");

const calendarDateSchema = z
  .string()
  .trim()
  .regex(
    /^\d{4}-\d{2}-\d{2}$/,
    "Date must use the YYYY-MM-DD format.",
  )
  .refine((value) => {
    const [year, month, day] = value.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    );
  }, "Date must be a valid calendar date.")
  .transform((value) => new Date(`${value}T00:00:00.000Z`));

const hasValidTimeRange = ({
  startTime,
  endTime,
}: {
  startTime?: string;
  endTime?: string | null;
}): boolean =>
  startTime === undefined ||
  endTime === undefined ||
  endTime === null ||
  endTime > startTime;

export const appointmentIdParamsSchema = z.object({
  id: uuidSchema("Appointment id"),
});

export const appointmentListQuerySchema = paginationQuerySchema
  .extend({
    status: z.enum(AppointmentStatus).optional(),
    method: z.enum(AppointmentMethod).optional(),
    customerId: uuidSchema("Customer id").optional(),
    caseProfileId: uuidSchema("Case profile id").optional(),
    staffId: uuidSchema("Staff id").optional(),
    date: calendarDateSchema.optional(),
    fromDate: calendarDateSchema.optional(),
    toDate: calendarDateSchema.optional(),
  })
  .superRefine((query, context) => {
    if (query.fromDate && query.toDate && query.fromDate > query.toDate) {
      context.addIssue({
        code: "custom",
        path: ["toDate"],
        message: "To date must be on or after from date.",
      });
    }
  });

export const todayAppointmentQuerySchema = z.object({
  staffId: uuidSchema("Staff id").optional(),
});

export const createAppointmentSchema = z
  .object({
    customerId: uuidSchema("Customer id"),
    caseProfileId: uuidSchema("Case profile id").optional(),
    staffId: uuidSchema("Staff id").optional(),
    appointmentDate: calendarDateSchema,
    startTime: timeSchema,
    endTime: timeSchema.optional(),
    method: z.enum(AppointmentMethod).optional(),
    note: noteSchema.optional(),
  })
  .refine(hasValidTimeRange, {
    path: ["endTime"],
    message: "End time must be later than start time.",
  });

export const updateAppointmentSchema = z
  .object({
    appointmentDate: calendarDateSchema.optional(),
    startTime: timeSchema.optional(),
    endTime: timeSchema.nullable().optional(),
    method: z.enum(AppointmentMethod).optional(),
    note: noteSchema.nullable().optional(),
    staffId: uuidSchema("Staff id").nullable().optional(),
    caseProfileId: uuidSchema("Case profile id").nullable().optional(),
  })
  .refine((input) => Object.keys(input).length > 0, {
    message: "At least one appointment field must be provided.",
  })
  .refine(hasValidTimeRange, {
    path: ["endTime"],
    message: "End time must be later than start time.",
  });

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(AppointmentStatus),
});
