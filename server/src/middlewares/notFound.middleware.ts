import type { RequestHandler } from "express";

import { HTTP_STATUS } from "../constants/httpStatus";
import { errorResponse } from "../utils/apiResponse";

export const notFoundMiddleware: RequestHandler = (
  request,
  response,
): void => {
  response.status(HTTP_STATUS.NOT_FOUND).json(
    errorResponse(
      `Route ${request.method} ${request.originalUrl} was not found.`,
    ),
  );
};
