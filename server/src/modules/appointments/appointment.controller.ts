import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { AppError } from "../../utils/AppError";
import { successResponse } from "../../utils/apiResponse";
import type { SafeUser } from "../../utils/sanitizeUser";
import {
  createAppointment,
  deleteAppointment,
  findAppointmentById,
  listAppointments,
  listTodayAppointments,
  updateAppointment,
  updateAppointmentStatus,
} from "./appointment.service";
import type {
  AppointmentListQuery,
  CreateAppointmentInput,
  TodayAppointmentQuery,
  UpdateAppointmentInput,
  UpdateAppointmentStatusInput,
} from "./appointment.types";

const getAppointmentId = (request: Request): string => {
  const id = request.params.id;

  if (typeof id !== "string") {
    throw new AppError(
      "Invalid appointment id.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return id;
};

const getActor = (request: Request): SafeUser => {
  if (!request.user) {
    throw new AppError(
      "Authentication is required.",
      HTTP_STATUS.UNAUTHORIZED,
    );
  }

  return request.user;
};

export const listAppointmentsController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const result = await listAppointments(
    request.query as unknown as AppointmentListQuery,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse("Appointments retrieved successfully.", result),
    );
};

export const listTodayAppointmentsController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const result = await listTodayAppointments(
    request.query as unknown as TodayAppointmentQuery,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse(
        "Today's appointments retrieved successfully.",
        result,
      ),
    );
};

export const getAppointmentController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const appointment = await findAppointmentById(
    getAppointmentId(request),
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse("Appointment retrieved successfully.", {
        appointment,
      }),
    );
};

export const createAppointmentController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const appointment = await createAppointment(
    request.body as CreateAppointmentInput,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.CREATED)
    .json(
      successResponse("Appointment created successfully.", {
        appointment,
      }),
    );
};

export const updateAppointmentController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const appointment = await updateAppointment(
    getAppointmentId(request),
    request.body as UpdateAppointmentInput,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse("Appointment updated successfully.", {
        appointment,
      }),
    );
};

export const updateAppointmentStatusController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const appointment = await updateAppointmentStatus(
    getAppointmentId(request),
    request.body as UpdateAppointmentStatusInput,
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse(
        "Appointment status updated successfully.",
        { appointment },
      ),
    );
};

export const deleteAppointmentController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const appointment = await deleteAppointment(
    getAppointmentId(request),
    getActor(request),
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse("Appointment deleted successfully.", {
        appointment,
      }),
    );
};
