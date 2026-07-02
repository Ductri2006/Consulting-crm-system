import { UserRole } from "@prisma/client";
import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware";
import { authorizeRoles } from "../../middlewares/authorize.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  createAppointmentController,
  deleteAppointmentController,
  getAppointmentController,
  listAppointmentsController,
  listTodayAppointmentsController,
  updateAppointmentController,
  updateAppointmentStatusController,
} from "./appointment.controller";
import {
  appointmentIdParamsSchema,
  appointmentListQuerySchema,
  createAppointmentSchema,
  todayAppointmentQuerySchema,
  updateAppointmentSchema,
  updateAppointmentStatusSchema,
} from "./appointment.validation";

const appointmentRouter = Router();
const appointmentRoles = [
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.STAFF,
];

appointmentRouter.use(
  authenticate,
  authorizeRoles(...appointmentRoles),
);

appointmentRouter.get(
  "/",
  validate({ query: appointmentListQuerySchema }),
  asyncHandler(listAppointmentsController),
);
appointmentRouter.get(
  "/today",
  validate({ query: todayAppointmentQuerySchema }),
  asyncHandler(listTodayAppointmentsController),
);
appointmentRouter.post(
  "/",
  validate({ body: createAppointmentSchema }),
  asyncHandler(createAppointmentController),
);
appointmentRouter.get(
  "/:id",
  validate({ params: appointmentIdParamsSchema }),
  asyncHandler(getAppointmentController),
);
appointmentRouter.patch(
  "/:id/status",
  validate({
    params: appointmentIdParamsSchema,
    body: updateAppointmentStatusSchema,
  }),
  asyncHandler(updateAppointmentStatusController),
);
appointmentRouter.patch(
  "/:id",
  validate({
    params: appointmentIdParamsSchema,
    body: updateAppointmentSchema,
  }),
  asyncHandler(updateAppointmentController),
);
appointmentRouter.delete(
  "/:id",
  validate({ params: appointmentIdParamsSchema }),
  asyncHandler(deleteAppointmentController),
);

export { appointmentRouter };
