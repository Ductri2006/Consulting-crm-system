import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { AppError } from "../../utils/AppError";
import { successResponse } from "../../utils/apiResponse";
import type {
  ConsultationRequestListQuery,
  CreateConsultationRequestInput,
  UpdateConsultationRequestStatusInput,
} from "./consultationRequest.types";
import {
  createConsultationRequest,
  findConsultationRequestById,
  findConsultationRequests,
  updateConsultationRequestStatus,
} from "./consultationRequest.service";

const getRequestId = (request: Request): string => {
  const id = request.params.id;

  if (typeof id !== "string") {
    throw new AppError(
      "Id must be a valid UUID.",
      HTTP_STATUS.BAD_REQUEST,
    );
  }

  return id;
};

export const submitConsultationRequest = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const consultationRequest = await createConsultationRequest(
    request.body as CreateConsultationRequestInput,
  );

  response.status(HTTP_STATUS.CREATED).json(
    successResponse("Consultation request submitted successfully.", {
      request: consultationRequest,
    }),
  );
};

export const getConsultationRequests = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const result = await findConsultationRequests(
    request.query as unknown as ConsultationRequestListQuery,
  );

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse("Consultation requests retrieved successfully.", result),
    );
};

export const getConsultationRequest = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const consultationRequest = await findConsultationRequestById(
    getRequestId(request),
  );

  response.status(HTTP_STATUS.OK).json(
    successResponse("Consultation request retrieved successfully.", {
      request: consultationRequest,
    }),
  );
};

export const patchConsultationRequestStatus = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const consultationRequest = await updateConsultationRequestStatus(
    getRequestId(request),
    request.body as UpdateConsultationRequestStatusInput,
  );

  response.status(HTTP_STATUS.OK).json(
    successResponse("Consultation request status updated successfully.", {
      request: consultationRequest,
    }),
  );
};
