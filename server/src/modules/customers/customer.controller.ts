import type { Request } from "express";

import { HTTP_STATUS } from "../../constants/httpStatus";
import { successResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
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

export const listCustomersController = asyncHandler(
  async (request, response): Promise<void> => {
    const result = await getCustomers(
      request.query as unknown as CustomerListQuery,
    );

    response
      .status(HTTP_STATUS.OK)
      .json(successResponse("Customers retrieved successfully.", result));
  },
);

export const getCustomerController = asyncHandler(
  async (request, response): Promise<void> => {
    const customer = await getCustomerById(getCustomerId(request.params));

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
    );

    response
      .status(HTTP_STATUS.OK)
      .json(successResponse("Customer updated successfully.", { customer }));
  },
);

export const deleteCustomerController = asyncHandler(
  async (request, response): Promise<void> => {
    const customer = await deleteCustomer(getCustomerId(request.params));

    response
      .status(HTTP_STATUS.OK)
      .json(successResponse("Customer deleted successfully.", { customer }));
  },
);
