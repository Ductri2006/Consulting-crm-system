import type { Request, Response } from "express";

import { HTTP_STATUS } from "../constants/httpStatus";
import { successResponse } from "../utils/apiResponse";

export const getHealth = (_request: Request, response: Response): void => {
  response.status(HTTP_STATUS.OK).json(
    successResponse("Backend service is healthy.", {
      service: "Consulting CRM API",
      status: "ok",
      timestamp: new Date().toISOString(),
    }),
  );
};
