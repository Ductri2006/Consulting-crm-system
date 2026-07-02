import { z } from "zod";

import {
  appointmentIdParamsSchema,
  appointmentListQuerySchema,
  createAppointmentSchema,
  todayAppointmentQuerySchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
} from "./appointment.validation";

export type AppointmentIdParams = z.infer<
  typeof appointmentIdParamsSchema
>;
export type AppointmentListQuery = z.infer<
  typeof appointmentListQuerySchema
>;
export type TodayAppointmentQuery = z.infer<
  typeof todayAppointmentQuerySchema
>;
export type CreateAppointmentInput = z.infer<
  typeof createAppointmentSchema
>;
export type UpdateAppointmentInput = z.infer<
  typeof updateAppointmentSchema
>;
export type UpdateAppointmentStatusInput = z.infer<
  typeof updateAppointmentStatusSchema
>;
