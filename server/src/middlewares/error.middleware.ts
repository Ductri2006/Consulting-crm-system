import type { ErrorRequestHandler } from "express";

import { env } from "../config/env";
import { HTTP_STATUS, type HttpStatusCode } from "../constants/httpStatus";
import { errorResponse } from "../utils/apiResponse";

type ErrorRecord = Record<string, unknown>;

const isErrorRecord = (error: unknown): error is ErrorRecord =>
  typeof error === "object" && error !== null;

const getStatusCode = (error: unknown): HttpStatusCode => {
  if (!isErrorRecord(error)) {
    return HTTP_STATUS.INTERNAL_SERVER_ERROR;
  }

  const statusCode = error.statusCode ?? error.status;

  if (
    typeof statusCode === "number" &&
    Number.isInteger(statusCode) &&
    statusCode >= 400 &&
    statusCode <= 599
  ) {
    return statusCode as HttpStatusCode;
  }

  return HTTP_STATUS.INTERNAL_SERVER_ERROR;
};

const getMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  if (
    isErrorRecord(error) &&
    typeof error.message === "string" &&
    error.message.trim()
  ) {
    return error.message;
  }

  return "Internal server error.";
};

const getErrors = (error: unknown): unknown[] => {
  if (isErrorRecord(error) && Array.isArray(error.errors)) {
    return error.errors;
  }

  return [];
};

export const errorMiddleware: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
): void => {
  const statusCode = getStatusCode(error);
  const isProductionServerError =
    env.NODE_ENV === "production" &&
    statusCode >= HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const message = isProductionServerError
    ? "Internal server error."
    : getMessage(error);
  const errors = isProductionServerError ? [] : getErrors(error);
  const body = {
    ...errorResponse(message, errors),
    ...(env.NODE_ENV === "development" &&
      error instanceof Error && { stack: error.stack }),
  };

  response.status(statusCode).json(body);
};
