import type { Request } from "express";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { AppError } from "../../utils/AppError";
import { successResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import type { SafeUser } from "../../utils/sanitizeUser";
import {
  createCustomer,
  deleteCustomer,
  getCustomerById,
  getCustomers,
  updateCustomer,
} from "./customer.service";
import type {
  CreateCustomerInput,
  CustomerListQuery,
  UpdateCustomerInput,
} from "./customer.types";

const getCustomerId = (params: Request["params"]): string => {
  const { id } = params;

  if (typeof id !== "string") {
    throw new TypeError("Validated customer id is missing.");
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

export const listCustomersController = asyncHandler(
  async (request, response): Promise<void> => {
    const result = await getCustomers(
      request.query as unknown as CustomerListQuery,
      getActor(request).organizationId,
    );

    response
      .status(HTTP_STATUS.OK)
      .json(successResponse("Customers retrieved successfully.", result));
  },
);

export const getCustomerController = asyncHandler(
  async (request, response): Promise<void> => {
    const customer = await getCustomerById(
      getCustomerId(request.params),
      getActor(request).organizationId,
    );

    response
      .status(HTTP_STATUS.OK)
      .json(
        successResponse("Customer retrieved successfully.", { customer }),
      );
  },
);

export const createCustomerController = asyncHandler(
  async (request, response): Promise<void> => {
    const customer = await createCustomer(
      request.body as CreateCustomerInput,
      getActor(request).organizationId,
    );

    response
      .status(HTTP_STATUS.CREATED)
      .json(successResponse("Customer created successfully.", { customer }));
  },
);

export const updateCustomerController = asyncHandler(
  async (request, response): Promise<void> => {
    const customer = await updateCustomer(
      getCustomerId(request.params),
      request.body as UpdateCustomerInput,
      getActor(request).organizationId,
    );

    response
      .status(HTTP_STATUS.OK)
      .json(successResponse("Customer updated successfully.", { customer }));
  },
);

export const deleteCustomerController = asyncHandler(
  async (request, response): Promise<void> => {
    const customer = await deleteCustomer(
      getCustomerId(request.params),
      getActor(request).organizationId,
    );

    response
      .status(HTTP_STATUS.OK)
      .json(successResponse("Customer deleted successfully.", { customer }));
  },
);
