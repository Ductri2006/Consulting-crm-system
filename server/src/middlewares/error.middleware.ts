import type {
  ErrorRequestHandler,
  NextFunction,
  Request,
  Response,
} from "express";

import { env } from "../config/env";
import { HTTP_STATUS } from "../constants/httpStatus";
import { AppError } from "../utils/AppError";
import { errorResponse } from "../utils/apiResponse";

type ErrorRecord = Record<string, unknown>;

const isErrorRecord = (error: unknown): error is ErrorRecord =>
  typeof error === "object" && error !== null;

const getStatusCode = (error: unknown): number => {
  if (error instanceof AppError) {
    return error.statusCode;
  }

  if (!isErrorRecord(error)) {
    return HTTP_STATUS.INTERNAL_SERVER_ERROR;
  }

  const statusCode = error.statusCode ?? error.status;

  return typeof statusCode === "number" &&
    Number.isInteger(statusCode) &&
    statusCode >= 400 &&
    statusCode <= 599
    ? statusCode
    : HTTP_STATUS.INTERNAL_SERVER_ERROR;
};

const handleError = (
  error: unknown,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void => {
  const isAppError = error instanceof AppError;
  const statusCode = getStatusCode(error);
  const isProductionServerError =
    env.NODE_ENV === "production" &&
    statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = isProductionServerError
    ? "Internal server error."
    : error instanceof Error
      ? error.message
      : "Internal server error.";
  const errors = isProductionServerError || !isAppError ? [] : error.errors;
  const body = {
    ...errorResponse(message, errors),
    ...(env.NODE_ENV === "development" &&
      error instanceof Error && { stack: error.stack }),
  };

  response.status(statusCode).json(body);
};

export const errorMiddleware: ErrorRequestHandler = handleError;
