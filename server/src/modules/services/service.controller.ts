import type { Request, Response } from "express";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { AppError } from "../../utils/AppError";
import { successResponse } from "../../utils/apiResponse";
import type {
  CreateServiceInput,
  ServiceListQuery,
  UpdateServiceInput,
} from "./service.types";
import {
  createService,
  deleteService,
  findPublicServices,
  findServiceById,
  findServices,
  updateService,
} from "./service.service";

const getServiceId = (request: Request): string => {
  const id = request.params.id;

  if (typeof id !== "string") {
    throw new AppError("Invalid service id.", HTTP_STATUS.BAD_REQUEST);
  }

  return id;
};

export const getServices = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const result = await findServices(
    request.query as unknown as ServiceListQuery,
  );

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("Services retrieved successfully.", result));
};

export const getService = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const service = await findServiceById(getServiceId(request));

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("Service retrieved successfully.", { service }));
};

export const getPublicServices = async (
  _request: Request,
  response: Response,
): Promise<void> => {
  const items = await findPublicServices();

  response
    .status(HTTP_STATUS.OK)
    .json(
      successResponse("Public services retrieved successfully.", { items }),
    );
};

export const createServiceController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const service = await createService(request.body as CreateServiceInput);

  response
    .status(HTTP_STATUS.CREATED)
    .json(successResponse("Service created successfully.", { service }));
};

export const updateServiceController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const service = await updateService(
    getServiceId(request),
    request.body as UpdateServiceInput,
  );

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("Service updated successfully.", { service }));
};

export const deleteServiceController = async (
  request: Request,
  response: Response,
): Promise<void> => {
  const service = await deleteService(getServiceId(request));

  response
    .status(HTTP_STATUS.OK)
    .json(successResponse("Service deleted successfully.", { service }));
};
